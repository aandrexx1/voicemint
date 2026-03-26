import { useState } from "react"
import { useTranslation } from "react-i18next"
import { HeroWave } from "../components/ui/ai-input-hero"
import { GrainBackdrop } from "../components/ui/grain-backdrop"
import { FAQSection } from "@/components/ui/faqsection"

export default function LandingPage({ onGetStarted, onLogin }) {
  const { t, i18n } = useTranslation()
  const [cookieAccepted, setCookieAccepted] = useState(
    localStorage.getItem("cookie_accepted") === "true"
  )

  const changeLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
  }

  const words = t("words", { returnObjects: true })
  const heroWord = Array.isArray(words) ? words[0] : "PowerPoint"
  const heroTitle = `${t("hero_title_1")} ${t("hero_title_2")} ${heroWord}.`

  const faqsLeft = [
    { question: t("faq_1_q"), answer: t("faq_1_a") },
    { question: t("faq_2_q"), answer: t("faq_2_a") },
  ]
  const faqsRight = [
    { question: t("faq_3_q"), answer: t("faq_3_a") },
    { question: t("faq_4_q"), answer: t("faq_4_a") },
  ]

  return (
    <div className="min-h-screen text-white relative w-full">
      <GrainBackdrop />

      <div className="relative z-10">
        <HeroWave
          title={heroTitle}
          subtitle={t("hero_desc")}
          placeholder={i18n.language === "it" ? "Descrivi l'argomento..." : "Describe your topic..."}
          buttonText={i18n.language === "it" ? "Genera" : "Generate"}
          onLogin={onLogin}
          onGetStarted={onGetStarted}
          onPromptSubmit={() => {
            onGetStarted()
          }}
        />

        <section id="faq" className="scroll-mt-28 border-t border-white/10 py-8 md:py-12">
          <FAQSection
            className="py-12 md:py-16"
            title={t("faq_section_title")}
            subtitle={t("faq_tag")}
            description={t("faq_section_desc")}
            buttonLabel={t("faq_cta")}
            onButtonClick={onGetStarted}
            faqsLeft={faqsLeft}
            faqsRight={faqsRight}
          />
        </section>

        <footer className="relative border-t border-white/10 bg-gradient-to-b from-transparent via-black/20 to-black/50 pt-16 pb-12">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
              <div className="md:col-span-5">
                <img src="/text_logo.png" alt="VoiceMint" className="h-9 md:h-10 object-contain opacity-95" />
                <p className="mt-5 text-sm text-white/45 leading-relaxed max-w-sm">{t("footer_tagline")}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35 mb-4">
                  {t("footer_column_links")}
                </p>
                <ul className="space-y-3">
                  <li>
                    <a
                      href="#faq"
                      className="text-sm text-white/70 hover:text-white transition-colors"
                    >
                      {t("faq_tag")}
                    </a>
                  </li>
                  <li>
                    <button
                      type="button"
                      onClick={onLogin}
                      className="text-sm text-white/70 hover:text-white transition-colors text-left"
                    >
                      {t("footer_link_login")}
                    </button>
                  </li>
                </ul>
              </div>
              <div className="md:col-span-4 md:text-right">
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/35 mb-4">
                  {i18n.language === "it" ? "Lingua" : "Language"}
                </p>
                <div className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] px-1 py-1">
                  <button
                    type="button"
                    onClick={() => changeLang("it")}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      i18n.language === "it"
                        ? "bg-white text-black shadow-sm"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    IT
                  </button>
                  <button
                    type="button"
                    onClick={() => changeLang("en")}
                    className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                      i18n.language === "en"
                        ? "bg-white text-black shadow-sm"
                        : "text-white/50 hover:text-white"
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-white/10 pt-8">
              <p className="text-sm text-white/35">{t("footer")}</p>
              <p className="text-xs text-white/25">{t("hero_tag")}</p>
            </div>
          </div>
        </footer>

        {!cookieAccepted && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-50">
            <p className="text-white/50 text-xs max-w-xl">
              {i18n.language === "it"
                ? "Utilizziamo cookie tecnici per migliorare la tua esperienza. Continuando accetti la nostra cookie policy."
                : "We use technical cookies to improve your experience. By continuing you accept our cookie policy."}
            </p>
            <div className="flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem("cookie_accepted", "true")
                  setCookieAccepted(true)
                }}
                className="bg-white text-black text-xs font-semibold px-4 py-2 rounded-full hover:bg-white/90 transition-all"
              >
                {i18n.language === "it" ? "Accetta" : "Accept"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
