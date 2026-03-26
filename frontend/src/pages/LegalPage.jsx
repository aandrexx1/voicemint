import { useTranslation } from "react-i18next"

export default function LegalPage({ variant, onBack }) {
  const { t } = useTranslation()
  const title = variant === "terms" ? t("legal_terms_title") : t("legal_privacy_title")
  const updated = variant === "terms" ? t("legal_terms_updated") : t("legal_privacy_updated")
  const sectionsKey = variant === "terms" ? "legal_terms_sections" : "legal_privacy_sections"
  const sections = t(sectionsKey, { returnObjects: true })
  const list = Array.isArray(sections) ? sections : []

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
            <section key={i}>
              <h2 className="mb-3 text-base font-semibold text-white">{s.title}</h2>
              <p className="whitespace-pre-wrap">{s.body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
