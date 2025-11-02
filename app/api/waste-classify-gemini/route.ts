// Gemini handler removed — Perplexity is now the supported classifier.
// This file remains for compatibility but will return a 410 Gone response to discourage use.
export async function POST() {
  return new Response(JSON.stringify({ error: 'Gemini classifier removed. Use the Perplexity-based classifier at /api/waste-classify (server uses Perplexity).' }), { status: 410, headers: { 'Content-Type': 'application/json' } })
}
