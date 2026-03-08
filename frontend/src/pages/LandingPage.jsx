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
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto border-b border-white/5">
        <div className="flex items-center">
          <img src="/text_logo.png" alt="VoiceMint" className="h-14 object-contain" />
        </div>
        <div className="flex items-center gap-8">
          <span
            onClick={() => document.getElementById("prodotto").scrollIntoView({ behavior: "smooth" })}
            className="text-white/40 text-sm cursor-pointer hover:text-white transition-all"
          >
            {t("nav_prodotto")}
          </span>
          <span
            onClick={() => document.getElementById("prezzi").scrollIntoView({ behavior: "smooth" })}
            className="text-white/40 text-sm cursor-pointer hover:text-white transition-all"
          >
            {t("nav_prezzi")}
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
      <section className="max-w-6xl mx-auto px-8 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-white/30 text-sm uppercase tracking-widest mb-6">{t("hero_tag")}</p>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6 max-w-3xl">
            <span className="text-white/40">{t("hero_title_1")}</span> {t("hero_title_2")}{" "}
            <br />
            <span className="slot-wrapper">
              <span className={`slot-word text-white ${isAnimating ? "slot-exit" : "slot-enter"}`}>
                {words[wordIndex]}
              </span>
            </span>{" "}
            {t("hero_title_3")}
          </h1>
          <p className="text-white/40 text-lg max-w-xl leading-relaxed mb-10">
            {t("hero_desc")}
          </p>

          {!joined ? (
            <div className="flex items-center gap-3 max-w-md">
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
                    await axios.post("https://voicemint-production.up.railway.app/waitlist", { email, lang: i18n.language })
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
              <p className="text-white/60 text-sm">{i18n.language === "it" ? "Sei nella lista — ti avviseremo al lancio!" : "You're on the list — we'll notify you at launch!"}</p>
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
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-3 gap-8">
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

      {/* Come funziona */}
      <section id="prodotto" className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-8">
          <div className="grid grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-white/30 text-sm uppercase tracking-widest mb-6">{t("how_tag")}</p>
              <h2 className="text-4xl font-bold leading-tight mb-6">{t("how_title")}</h2>
              <p className="text-white/40 leading-relaxed">{t("how_desc")}</p>
            </div>
            <div className="space-y-8">
              {[
                { n: "01", title: t("step_1_title"), desc: t("step_1_desc") },
                { n: "02", title: t("step_2_title"), desc: t("step_2_desc") },
                { n: "03", title: t("step_3_title"), desc: t("step_3_desc") },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex gap-6 border-t border-white/5 pt-6"
                >
                  <span className="text-white/20 text-sm mt-1">{s.n}</span>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{s.title}</h3>
                    <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="prezzi" className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="text-white/30 text-sm uppercase tracking-widest mb-16">{t("pricing_tag")}</p>
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-white/40 text-sm mb-4">Free</p>
              <p className="text-5xl font-bold tracking-tighter mb-2">€0</p>
              <p className="text-white/30 text-sm mb-8">{t("free_forever")}</p>
              <ul className="space-y-3 text-white/50 text-sm mb-8">
                <li>{t("free_f1")}</li>
                <li>{t("free_f2")}</li>
                <li>{t("free_f3")}</li>
              </ul>
            </div>
            <div className="border border-white/20 bg-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/40 text-sm">Pro</p>
                <span className="text-xs text-white/40 border border-white/10 px-2 py-1 rounded-full">{i18n.language === "it" ? "Popolare" : "Popular"}</span>
              </div>
              <p className="text-5xl font-bold tracking-tighter mb-2">€9</p>
              <p className="text-white/30 text-sm mb-8">{t("pro_month")}</p>
              <ul className="space-y-3 text-white/60 text-sm mb-8">
                <li>{t("pro_f1")}</li>
                <li>{t("pro_f2")}</li>
                <li>{t("pro_f3")}</li>
                <li>{t("pro_f4")}</li>
              </ul>
              <button
                onClick={onLogin}
                className="w-full bg-white text-black font-semibold py-3 rounded-full transition-all text-sm hover:bg-white/90"
              >
                {t("pro_cta")}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-8">
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
        <div className="max-w-6xl mx-auto px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/text_logo.png" alt="VoiceMint" className="h-10 object-contain" />
          </div>
          <p className="text-white/20 text-sm">{t("footer")}</p>
        </div>
      </footer>
    </div>
  )
}