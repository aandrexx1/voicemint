import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { parseTermsSections, TOC_SECTION_TITLE } from "../legal/parseTermsOfService"
import termsOfServiceEn from "../legal/terms-of-service-en.txt?raw"

function TermsTableOfContentsBody({ body }) {
  return (
    <div className="space-y-1.5">
      {body.split("\n").map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return null
        const m = trimmed.match(/^(\d+)\.\s+(.+)$/)
        if (m) {
          const n = m[1]
          return (
            <p key={i}>
              <a
                href={`#tos-${n}`}
                className="text-sky-400/90 underline decoration-sky-400/30 underline-offset-[3px] transition-colors hover:text-sky-300 hover:decoration-sky-300/50"
              >
                {trimmed}
              </a>
            </p>
          )
        }
        return (
          <p key={i} className="whitespace-pre-wrap">
            {line}
          </p>
        )
      })}
    </div>
  )
}

export default function LegalPage({ variant, onBack }) {
  const { t } = useTranslation()
  const title = variant === "terms" ? t("legal_terms_title") : t("legal_privacy_title")
  const updated = variant === "terms" ? t("legal_terms_updated") : t("legal_privacy_updated")
  const termsList = useMemo(() => parseTermsSections(termsOfServiceEn), [])
  const sectionsKey = variant === "terms" ? null : "legal_privacy_sections"
  const sections = sectionsKey ? t(sectionsKey, { returnObjects: true }) : null
  const list =
    variant === "terms" ? termsList : Array.isArray(sections) ? sections : []

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-3xl px-6 pb-36 pt-8 md:px-8 md:pb-32 md:pt-12">
        <button
          type="button"
          onClick={onBack}
          className="mb-10 text-sm text-white/50 transition-colors hover:text-white"
        >
          ← {t("legal_back")}
        </button>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-white/40">{updated}</p>
        <div className="mt-12 space-y-10 text-sm leading-relaxed text-white/75">
          {list.map((s, i) => (
            <section
              key={i}
              id={variant === "terms" && s.anchorId ? s.anchorId : undefined}
              className={variant === "terms" ? "scroll-mt-24" : undefined}
            >
              <h2 className="mb-3 text-base font-semibold text-white">{s.title}</h2>
              {variant === "terms" && s.title === TOC_SECTION_TITLE ? (
                <TermsTableOfContentsBody body={s.body} />
              ) : (
                <p className="whitespace-pre-wrap">{s.body}</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
