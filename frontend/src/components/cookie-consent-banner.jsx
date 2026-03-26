import { useTranslation } from "react-i18next"

export function CookieConsentBanner({ onAccept, onReject, onOpenTerms, onOpenPrivacy }) {
  const { t } = useTranslation()

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      aria-describedby="cookie-banner-desc"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-white/10 bg-[#0c0c0f]/95 px-4 py-4 shadow-[0_-8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md md:px-8"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <p id="cookie-banner-title" className="text-sm font-semibold text-white">
            {t("cookie_banner_title")}
          </p>
          <p id="cookie-banner-desc" className="text-xs leading-relaxed text-white/55">
            {t("cookie_banner_text")}
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            <button
              type="button"
              onClick={onOpenTerms}
              className="text-white/80 underline underline-offset-4 transition-colors hover:text-white"
            >
              {t("cookie_link_terms")}
            </button>
            <span className="text-white/25" aria-hidden>
              ·
            </span>
            <button
              type="button"
              onClick={onOpenPrivacy}
              className="text-white/80 underline underline-offset-4 transition-colors hover:text-white"
            >
              {t("cookie_link_privacy")}
            </button>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 md:justify-end">
          <button
            type="button"
            onClick={onReject}
            className="rounded-full border border-white/20 px-4 py-2 text-xs font-medium text-white/90 transition-colors hover:border-white/40 hover:bg-white/5"
          >
            {t("cookie_reject")}
          </button>
          <button
            type="button"
            onClick={onAccept}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition-colors hover:bg-white/90"
          >
            {t("cookie_accept")}
          </button>
        </div>
      </div>
    </div>
  )
}
