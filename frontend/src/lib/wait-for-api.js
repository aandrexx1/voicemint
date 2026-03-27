/**
 * Su host come Render (free tier) il primo GET può rispondere con HTML "service waking up"
 * invece dell'API. Si fa polling finché la root risponde con JSON VoiceMint, poi si può
 * aprire /auth/... senza finire sulla pagina di cold start.
 */
function isVoiceMintApiPayload(data) {
  return (
    data &&
    typeof data === "object" &&
    typeof data.message === "string" &&
    data.message.includes("VoiceMint")
  )
}

export async function waitForApiReady(apiBase, { timeoutMs = 120000, intervalMs = 2000 } = {}) {
  const base = String(apiBase || "").replace(/\/$/, "")
  if (!base) return false
  const url = `${base}/`
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    try {
      const r = await fetch(url, { method: "GET", mode: "cors", cache: "no-store" })
      const ct = (r.headers.get("content-type") || "").toLowerCase()
      if (!r.ok || !ct.includes("application/json")) {
        await new Promise((res) => setTimeout(res, intervalMs))
        continue
      }
      const data = await r.json()
      if (isVoiceMintApiPayload(data)) return true
    } catch {
      /* Render HTML o rete: riprova */
    }
    await new Promise((res) => setTimeout(res, intervalMs))
  }
  return false
}
