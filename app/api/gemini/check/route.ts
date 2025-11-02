// Gemini diagnostics removed — Gemini is no longer used.
export async function GET() {
  return new Response(JSON.stringify({ ok: false, error: 'Gemini diagnostics removed. Use Perplexity configuration and verify PERPLEXITY_API_KEY.' }), { status: 410, headers: { 'Content-Type': 'application/json' } })
}
