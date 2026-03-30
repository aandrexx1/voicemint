export const TOC_SECTION_TITLE = "TABLE OF CONTENTS"
export const PRIVACY_SUMMARY_TITLE = "SUMMARY OF KEY POINTS"

function sectionAnchorId(title, anchorPrefix, tocTitle) {
  const num = title.match(/^(\d+)\.\s/)
  if (num) return `${anchorPrefix}-${num[1]}`
  if (title === tocTitle) return `${anchorPrefix}-toc`
  const special = {
    "AGREEMENT TO OUR LEGAL TERMS": `${anchorPrefix}-agreement`,
    "SUMMARY OF KEY POINTS": `${anchorPrefix}-summary`,
    INTRODUCTION: `${anchorPrefix}-intro`,
  }
  if (special[title]) return special[title]
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64)
  return slug ? `${anchorPrefix}-${slug}` : `${anchorPrefix}-section`
}

/**
 * @param {string} raw
 * @param {{ anchorPrefix?: string, skipFirstHeader?: string }} [opts]
 */
export function parseLegalSections(raw, opts = {}) {
  const anchorPrefix = opts.anchorPrefix ?? "tos"
  const skipFirstHeader = opts.skipFirstHeader ?? "TERMS OF SERVICE"
  const parts = raw.split(/\n={20,}\n/).map((p) => p.trim()).filter(Boolean)
  const sections = []
  for (let i = 0; i < parts.length; i++) {
    const lines = parts[i].split("\n")
    const title = lines[0].trim()
    const body = lines.slice(1).join("\n").trim()
    if (!title) continue
    if (i === 0 && title === skipFirstHeader) continue
    if (title === "END OF DOCUMENT") break
    if (title.startsWith("Notes for completion")) break
    sections.push({
      title,
      body,
      anchorId: sectionAnchorId(title, anchorPrefix, TOC_SECTION_TITLE),
    })
  }
  return sections
}

export function parseTermsSections(raw) {
  return parseLegalSections(raw, {
    anchorPrefix: "tos",
    skipFirstHeader: "TERMS OF SERVICE",
  })
}

export function parsePrivacySections(raw) {
  return parseLegalSections(raw, {
    anchorPrefix: "privacy",
    skipFirstHeader: "PRIVACY NOTICE",
  })
}
