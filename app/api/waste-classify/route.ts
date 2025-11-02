import { POST as perplexityPOST } from '../waste-classify-perplexity/route';

// Top-level classifier endpoint — delegates to the Perplexity-based implementation.
export async function POST(request: Request) {
  try {
    return await perplexityPOST(request)
  } catch (e) {
    console.error('Perplexity classifier failed:', e)
    return new Response(JSON.stringify({ error: 'Classifier error' }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
