import { motion } from "framer-motion"
import axios from "axios"
import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"

export default function LandingPage({ onGetStarted, onLogin }) {
  const [email, setEmail] = useState("")
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState("")
  const { t, i18n } = useTranslation()
  const words = t("words", { returnObjects: true })
  const [wordIndex, setWordIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [cookieAccepted, setCookieAccepted] = useState(
    localStorage.getItem("cookie_accepted") === "true"
  )
  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true)
      setTimeout(() => {
        setWordIndex((i) => (i + 1) % words.length)
        setIsAnimating(false)
      }, 400)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const changeLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-6 max-w-6xl mx-auto border-b border-white/5">
        <div className="flex items-center">
          <img src="/text_logo.png" alt="VoiceMint" className="h-8 md:h-14 object-contain" />
        </div>
        <div className="flex items-center gap-4 md:gap-8">
          <span
            onClick={() => document.getElementById("faq").scrollIntoView({ behavior: "smooth" })}
            className="hidden md:block text-white/40 text-sm cursor-pointer hover:text-white transition-all"
          >
            {t("nav_prodotto")}
          </span>
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
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-white/30 text-sm uppercase tracking-widest mb-6">{t("hero_tag")}</p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6 max-w-3xl">
            <span className="text-white/40">{t("hero_title_1")}</span> {t("hero_title_2")}
            <span className="slot-wrapper">
              <span className={`slot-word text-white ${isAnimating ? "slot-exit" : "slot-enter"}`}>
                {words[wordIndex]}
              </span>
            </span>
            {t("hero_title_3")}
          </h1>
          <p className="text-white/40 text-base md:text-lg max-w-xl leading-relaxed mb-10">
            {t("hero_desc")}
          </p>

          {!joined ? (
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 max-w-md">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
              />
              <button
                onClick={async () => {
                  try {
                    await axios.post("https://voicemint-backend.onrender.com/waitlist", { email, lang: i18n.language })
                    setJoined(true)
                  } catch (err) {
                    setError(err.response?.data?.detail || "Errore, riprova")
                  }
                }}
                className="shrink-0 bg-white text-black font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/90 transition-all"
              >
                {t("hero_cta")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full" />
              <p className="text-white/60 text-sm">{i18n.language === "it" ? "Sei nella lista, ti avviseremo al lancio!" : "You're on the list, we'll notify you at launch!"}</p>
            </div>
          )}
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          <div className="max-w-md">
            <p className="text-white/20 text-xs mt-4">{t("hero_sub")}</p>
          </div>
        </motion.div>
      </section>

      {/* Numeri */}
      <section className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { n: "30s", label: t("stats_1") },
            { n: "3", label: t("stats_2") },
            { n: "€9", label: t("stats_3") },
          ].map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="border-l border-white/10 pl-8"
            >
              <p className="text-5xl font-bold tracking-tighter">{s.n}</p>
              <p className="text-white/30 mt-2 text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

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
          <p className="text-white/20 text-sm">{t("footer")}</p>
        </div>
      </footer>

      {/*   ------COME FUNZIONA-----
      <section id="prodotto" className="border-t border-white/5 py-24">
        ...
      </section>
      */}

      {/*   ----PRICING-----
      <section id="prezzi" className="border-t border-white/5 py-24">
        ...
      </section>
      */}
      
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
  )
}