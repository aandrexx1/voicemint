import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HeroWave } from "../components/ui/ai-input-hero"

export default function LandingPage({ onGetStarted, onLogin, onProduct }) {
  const { t, i18n } = useTranslation()
  const [cookieAccepted, setCookieAccepted] = useState(
    localStorage.getItem("cookie_accepted") === "true"
  )

  const changeLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white relative w-full">
      
      {/* 🌊 NUOVA HERO WAVE (Sostituisce Navbar vecchia + Vecchia Hero) */}
      <HeroWave 
        title={t("hero_title_2") || "Transform your voice into PowerPoint."}
        subtitle={t("hero_desc") || "Speak freely. Voicemint generates PPT presentations and professional PDFs in seconds, powered by AI."}
        placeholder={i18n.language === "it" ? "Descrivi l'argomento..." : "Describe your topic..."}
        buttonText={i18n.language === "it" ? "Genera" : "Generate"}
        onPromptSubmit={(prompt) => {
          console.log("Prompt inviato:", prompt)
          onGetStarted() // Rimanda alla registrazione/login per usare il prompt
        }}
      />

      {/* Contenuto sotto l'onda animata (FAQ, Cookie bar, ecc.) */}
      <div className="relative z-10 bg-[#0a0a0a]">

        {/* FAQ */}
        <section id="faq" className="border-t border-white/5 py-24">
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

        {/* Footer */}
        <footer className="border-t border-white/5 py-8">
          <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img src="/text_logo.png" alt="VoiceMint" className="h-8 md:h-10 object-contain" />
            </div>
            <div className="flex items-center gap-4">
              {/* Selettore lingua spostato nel footer o gestibile internamente */}
              <div className="flex items-center gap-2 text-sm">
                <button
                  onClick={() => changeLang("it")}
                  className={`transition-all ${i18n.language === "it" ? "text-white" : "text-white/30 hover:text-white"}`}
                >
                  IT
                </button>
                <span className="text-white/20">|</span>
                <button
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

        {/* Cookie Banner */}
        {!cookieAccepted && (
          <div className="fixed bottom-0 left-0 right-0 bg-[#111] border-t border-white/10 px-6 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-50">
            <p className="text-white/50 text-xs max-w-xl">
              {i18n.language === "it"
                ? "Utilizziamo cookie tecnici per migliorare la tua esperienza. Continuando accetti la nostra cookie policy."
                : "We use technical cookies to improve your experience. By continuing you accept our cookie policy."}
            </p>
            <div className="flex gap-3 shrink-0">
              <button
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