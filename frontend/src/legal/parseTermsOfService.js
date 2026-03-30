/**
 * Parses the plain-text Terms of Service export (sections delimited by lines of "=").
 * @param {string} raw
 * @returns {{ title: string, body: string }[]}
 */
export function parseTermsSections(raw) {
  const parts = raw.split(/\n={20,}\n/).map((p) => p.trim()).filter(Boolean)
  const sections = []
  for (let i = 0; i < parts.length; i++) {
    const lines = parts[i].split("\n")
    const title = lines[0].trim()
    const body = lines.slice(1).join("\n").trim()
    if (!title) continue
    if (i === 0 && title === "TERMS OF SERVICE") continue
    if (title === "END OF DOCUMENT") break
    if (title.startsWith("Notes for completion")) break
    sections.push({ title, body })
  }
  return sections
}
