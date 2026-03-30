export const TOC_SECTION_TITLE = "TABLE OF CONTENTS"

function sectionAnchorId(title) {
  const num = title.match(/^(\d+)\.\s/)
  if (num) return `tos-${num[1]}`
  if (title === TOC_SECTION_TITLE) return "tos-toc"
  if (title === "AGREEMENT TO OUR LEGAL TERMS") return "tos-agreement"
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64)
  return slug ? `tos-${slug}` : "tos-section"
}

/**
 * Parses the plain-text Terms of Service export (sections delimited by lines of "=").
 * @param {string} raw
 * @returns {{ title: string, body: string, anchorId: string }[]}
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
    sections.push({ title, body, anchorId: sectionAnchorId(title) })
  }
  return sections
}
