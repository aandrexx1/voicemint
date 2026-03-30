import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  parsePrivacySections,
  parseTermsSections,
  TOC_SECTION_TITLE,
} from "../legal/parseTermsOfService"
import privacyNoticeEn from "../legal/privacy-notice-en.txt?raw"
import termsOfServiceEn from "../legal/terms-of-service-en.txt?raw"

const linkClass =
  "text-sky-400/90 underline decoration-sky-400/30 underline-offset-[3px] transition-colors hover:text-sky-300 hover:decoration-sky-300/50"

function LegalTocBody({ body, anchorPrefix }) {
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
              <a href={`#${anchorPrefix}-${n}`} className={linkClass}>
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

/** Renders [label](href) markdown links; preserves newlines with whitespace-pre-wrap. */
function LegalMarkdownBody({ text }) {
  const re = /\[([^\]]+)\]\(([^)]+)\)/g
  const nodes = []
  let last = 0
  let m
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) {
      nodes.push(text.slice(last, m.index))
    }
    nodes.push(
      <a key={`${m.index}-${m[1]}`} href={m[2]} className={linkClass}>
        {m[1]}
      </a>,
    )
    last = m.index + m[0].length
  }
  if (last < text.length) {
    nodes.push(text.slice(last))
  }
  return (
    <p className="whitespace-pre-wrap">
      {nodes.length ? nodes : text}
    </p>
  )
}

export default function LegalPage({ variant, onBack }) {
  const { t } = useTranslation()
  const title = variant === "terms" ? t("legal_terms_title") : t("legal_privacy_title")
  const updated = variant === "terms" ? t("legal_terms_updated") : t("legal_privacy_updated")
  const termsList = useMemo(() => parseTermsSections(termsOfServiceEn), [])
  const privacyList = useMemo(() => parsePrivacySections(privacyNoticeEn), [])
  const list = variant === "terms" ? termsList : privacyList
  const anchorPrefix = variant === "terms" ? "tos" : "privacy"

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
          {list.map((s, i) => {
            const isToc = s.title === TOC_SECTION_TITLE
            const bodyContent =
              isToc ? (
                <LegalTocBody body={s.body} anchorPrefix={anchorPrefix} />
              ) : variant === "privacy" ? (
                <LegalMarkdownBody text={s.body} />
              ) : (
                <p className="whitespace-pre-wrap">{s.body}</p>
              )
            return (
              <section
                key={i}
                id={s.anchorId}
                className="scroll-mt-24"
              >
                <h2 className="mb-3 text-base font-semibold text-white">{s.title}</h2>
                {bodyContent}
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
