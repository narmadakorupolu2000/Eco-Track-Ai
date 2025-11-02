import crypto from 'crypto'

// Perplexity-based waste classifier route
// Accepts multipart/form-data (file) or JSON { image: dataUrlOrUrl }
// If a file is provided and CLOUDINARY_URL is set, it uploads to Cloudinary and uses the secure URL.

const CLOUDINARY_URL = process.env.CLOUDINARY_URL || ''
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || ''

async function uploadToCloudinary(buffer: Buffer, mime = 'image/jpeg') {
  const m = CLOUDINARY_URL.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/)
  if (!m) throw new Error('CLOUDINARY_URL not configured correctly')
  const apiKey = m[1]
  const apiSecret = m[2]
  const cloudName = m[3]

  const timestamp = Math.floor(Date.now() / 1000)
  const sig = crypto.createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex')
  const form = new FormData()
  const blob = new Blob([new Uint8Array(buffer)], { type: mime })
  form.append('file', blob, 'upload.jpg')
  form.append('api_key', apiKey)
  form.append('timestamp', String(timestamp))
  form.append('signature', sig)

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: form })
  if (!res.ok) {
    const txt = await res.text()
    throw new Error('Cloudinary upload failed: ' + txt)
  }
  const json = await res.json()
  return json.secure_url
}

// Proxy classification to the local Python backend which uses the Perplexity SDK.
async function callPerplexity(prompt: string, imageUrl: string) {
  // The backend internal classify endpoint expects { image, prompt }
  const url = process.env.PERPLEXITY_BACKEND_URL || 'http://127.0.0.1:8000/internal/classify'

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageUrl, prompt }),
  })

  const txt = await res.text().catch(() => '')
  if (!res.ok) {
    throw new Error(`Perplexity backend ${url} error: ${res.status} ${res.statusText} - ${txt}`)
  }

  let json: any = null
  try { json = txt ? JSON.parse(txt) : null } catch (e) { json = null }
  // Normalize into the expected return shape { text, raw }
  if (json && json.result) {
    return { text: JSON.stringify(json.result), raw: json }
  }
  return { text: txt, raw: json || txt }
}

export async function POST(request: Request) {
  try {
    const contentType = (request.headers.get('content-type') || '').toLowerCase()
    let image: string | null = null
    let uploadBuffer: Buffer | null = null
    let uploadMime = 'image/jpeg'

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData()
      const file = form.get('file') as any
      if (file && typeof file.arrayBuffer === 'function') {
        uploadBuffer = Buffer.from(await file.arrayBuffer())
        uploadMime = file.type || 'image/jpeg'
        if (CLOUDINARY_URL) {
          const url = await uploadToCloudinary(uploadBuffer, uploadMime)
          image = url
        } else {
          image = `data:${uploadMime};base64,${uploadBuffer.toString('base64')}`
        }
      }
    } else {
      const body = await request.json().catch(() => ({}))
      image = body?.image || null
    }

    if (!image) return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } })

    // Build strict JSON-only prompt similar to Gemini prompt to reduce hallucinations
    const prompt = `You are an expert environmental waste classification assistant. Return ONLY a single, valid JSON object exactly matching the schema below.\n\nSchema:\n{\n  "is_waste": true|false,\n  "category": "...",\n  "confidence": 0-100,\n  "disposal": "...",\n  "tips": ["tip1","tip2"],\n  "environmental_impact": "...",\n  "points_earned": 0\n}\n\nAnalyze the image URL or data: ${image}\nRespond with ONLY the JSON object.`

  const pRes = await callPerplexity(prompt, image)
    const text = typeof pRes === 'string' ? pRes : pRes.text

    // Try parse JSON
    let parsed: any = null
    try { parsed = JSON.parse(text) } catch (e) {
      const maybe = (text || '').match(/\{[\s\S]*\}/)
      if (maybe) {
        try { parsed = JSON.parse(maybe[0]) } catch (e) { /* ignore */ }
      }
    }

    if (!parsed) return new Response(JSON.stringify({ error: 'Failed to parse Perplexity output', raw: text }), { status: 500, headers: { 'Content-Type': 'application/json' } })

    const result = {
      category: parsed.category || parsed.type || parsed.waste_type || 'Unknown',
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : (parseFloat(parsed.confidence) || 0),
      disposal: parsed.disposal || parsed.recommended_disposal || 'Not applicable',
      tips: Array.isArray(parsed.tips) ? parsed.tips : (parsed.tips ? [parsed.tips] : []),
      environmental_impact: parsed.environmental_impact || parsed.explanation || '',
      points_earned: parsed.points_earned ? parsed.points_earned : 0,
    }

    return new Response(JSON.stringify({ result, raw: text, model: 'perplexity' }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    console.error('Perplexity classify error:', err)
    return new Response(JSON.stringify({ error: err?.message || 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
