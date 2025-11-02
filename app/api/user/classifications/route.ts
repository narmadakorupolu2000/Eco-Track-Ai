
const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

// In-memory best-effort retry queue for failed clears. This is a best-effort mechanism
// to retry DELETEs when the external backend is temporarily down. For production you
// should persist this in Redis or a durable queue.
const pendingClears: Array<{ url: string; auth: string; attempts: number; nextAttempt: number }> = []

const MAX_ATTEMPTS = 3

async function processPendingClears() {
  const now = Date.now()
  for (let i = pendingClears.length - 1; i >= 0; i--) {
    const item = pendingClears[i]
    if (item.nextAttempt > now) continue
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      const resp = await fetch(item.url, { method: 'DELETE', headers: { Authorization: item.auth }, signal: controller.signal })
      clearTimeout(timeout)
      if (resp.ok) {
        // Remove from queue
        pendingClears.splice(i, 1)
        console.log('Pending clear succeeded for', item.url)
      } else {
        item.attempts++
        item.nextAttempt = Date.now() + (500 * Math.pow(2, item.attempts))
        if (item.attempts >= MAX_ATTEMPTS) {
          console.warn('Pending clear reached max attempts, dropping', item.url)
          pendingClears.splice(i, 1)
        }
      }
    } catch (e) {
      console.warn('Retry attempt failed for pending clear:', e)
      item.attempts++
      item.nextAttempt = Date.now() + (500 * Math.pow(2, item.attempts))
      if (item.attempts >= MAX_ATTEMPTS) {
        console.warn('Pending clear reached max attempts (error), dropping', item.url)
        pendingClears.splice(i, 1)
      }
    }
  }
  // Schedule next run
  setTimeout(processPendingClears, 1000 * 10)
}

// Start processing loop
processPendingClears()

export async function DELETE(request: Request) {
  try {
    const auth = request.headers.get('authorization')

    if (!auth) {
      // No auth provided — nothing to clear on server
      return new Response(null, { status: 204 })
    }

    const url = `${BACKEND.replace(/\/$/, '')}/api/user/classifications`

    // Try with retry/backoff before falling back to queue
    let lastErr: any = null
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      try {
        const resp = await fetch(url, { method: 'DELETE', headers: { Authorization: auth }, signal: controller.signal })
        clearTimeout(timeout)
        const text = await resp.text()
        const headers: Record<string,string> = {}
        const contentType = resp.headers.get('content-type')
        if (contentType) headers['Content-Type'] = contentType
        return new Response(text, { status: resp.status, headers })
      } catch (fetchErr: any) {
        clearTimeout(timeout)
        lastErr = fetchErr
        console.warn(`Attempt ${attempt+1} failed for backend DELETE:`, fetchErr)
        // Exponential backoff before next attempt
        const backoffMs = 300 * Math.pow(2, attempt)
        await new Promise((r) => setTimeout(r, backoffMs))
      }
    }

    // If we get here, all attempts failed — enqueue for background retry and return 202
    pendingClears.push({ url, auth, attempts: MAX_ATTEMPTS, nextAttempt: Date.now() + 1000 })
    console.warn('Enqueued clear request for later retry', url, 'error:', lastErr)
    return new Response(JSON.stringify({ message: 'Backend unavailable; clear enqueued for retry' }), { status: 202, headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('Proxy delete classifications error', err)
    return new Response(JSON.stringify({ error: 'Failed to clear server recents' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
