// Simple mock classifier for local development.
export async function POST(request: Request) {
  try {
    const now = new Date().toISOString()
    const sample = {
      result: {
        category: 'Plastic Bottle (PET #1)',
        confidence: 92,
        disposal: 'Recycle in mixed plastics or PET recycling where available',
        tips: ['Rinse before recycling', 'Remove cap and flatten to save space'],
        environmental_impact: 'Plastic bottles can persist in the environment and contribute to microplastic pollution.',
        points_earned: 2,
      },
      raw: '{"mock":"output"}',
      model: 'mock-v1',
    }
    return new Response(JSON.stringify(sample), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || 'mock error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
