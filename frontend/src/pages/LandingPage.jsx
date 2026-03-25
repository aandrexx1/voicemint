import { motion } from "framer-motion"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Mic, Sparkles, Download } from "lucide-react"
import { HeroWave } from "../components/ui/ai-input-hero"
import { GrainBackdrop } from "../components/ui/grain-backdrop"

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

  const steps = [
    { icon: Mic, title: t("step_1_title"), desc: t("step_1_desc") },
    { icon: Sparkles, title: t("step_2_title"), desc: t("step_2_desc") },
    { icon: Download, title: t("step_3_title"), desc: t("step_3_desc") },
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

        {/* Prodotto — come funziona */}
        <section
          id="prodotto"
          className="scroll-mt-28 border-t border-white/5 py-24"
        >
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-4">
              {t("nav_prodotto")}
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4 max-w-2xl">
              {t("how_title")}
            </h2>
            <p className="text-white/45 text-base md:text-lg leading-relaxed max-w-2xl mb-16">
              {t("how_desc")}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="border border-white/10 rounded-2xl p-8 bg-white/[0.03]"
                >
                  <div className="w-12 h-12 rounded-2xl border border-white/10 flex items-center justify-center text-white/70 mb-5">
                    <s.icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
                  <p className="text-white/45 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="cosa-ottieni"
          className="scroll-mt-28 border-t border-white/5 py-24"
        >
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 max-w-2xl">
              {t("section_deliver_title")}
            </h2>
            <p className="text-white/45 text-base md:text-lg leading-relaxed max-w-2xl">
              {t("section_deliver_desc")}
            </p>
          </div>
        </section>

        <section
          id="per-chi"
          className="scroll-mt-28 border-t border-white/5 py-24"
        >
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-6 max-w-2xl">
              {t("section_audience_title")}
            </h2>
            <p className="text-white/45 text-base md:text-lg leading-relaxed max-w-2xl">
              {t("section_audience_desc")}
            </p>
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 border-t border-white/5 py-24">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <p className="text-white/30 text-sm uppercase tracking-widest mb-16">{t("faq_tag")}</p>
            <div className="max-w-2xl space-y-0">
              {[
                { q: t("faq_1_q"), a: t("faq_1_a") },
                { q: t("faq_2_q"), a: t("faq_2_a") },
                { q: t("faq_3_q"), a: t("faq_3_a") },
              ].map((f, i) => (
                <div key={i} className="border-t border-white/5 py-8">
                  <h4 className="text-white font-semibold mb-3">{f.q}</h4>
                  <p className="text-white/40 text-sm leading-relaxed">{f.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-6 md:px-8 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src="/text_logo.png" alt="VoiceMint" className="h-8 md:h-10 object-contain" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => changeLang("it")}
                  className={`transition-all ${i18n.language === "it" ? "text-white" : "text-white/30 hover:text-white"}`}
                >
                  IT
                </button>
                <span className="text-white/20">|</span>
                <button
                  type="button"
                  onClick={() => changeLang("en")}
                  className={`transition-all ${i18n.language === "en" ? "text-white" : "text-white/30 hover:text-white"}`}
                >
                  EN
                </button>
              </div>
              <p className="text-white/20 text-sm">{t("footer")}</p>
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
