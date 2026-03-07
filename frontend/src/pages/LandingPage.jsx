import { useState } from "react"
import { motion } from "framer-motion"
import { Mic } from "lucide-react"
import axios from "axios"

export default function LandingPage({ onGetStarted, onLogin }) {
  const [email, setEmail] = useState("")
  const [joined, setJoined] = useState(false)
  const [error, setError] = useState("")

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 max-w-6xl mx-auto border-b border-white/5">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-white" />
          <span className="font-semibold text-base tracking-tight">VoiceMint</span>
        </div>
        <div className="flex items-center gap-8">
          <span
            onClick={() => document.getElementById("prodotto").scrollIntoView({ behavior: "smooth" })}
            className="text-white/40 text-sm cursor-pointer hover:text-white transition-all"
          >
            Prodotto
          </span>
          <span
            onClick={() => document.getElementById("prezzi").scrollIntoView({ behavior: "smooth" })}
            className="text-white/40 text-sm cursor-pointer hover:text-white transition-all"
          >
            Prezzi
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-8 pt-12 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-white/30 text-sm uppercase tracking-widest mb-6">Voice to Document</p>
          <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight mb-6 max-w-3xl">
            <span className="text-white/40">Trasforma</span> la tua voce in documenti pronti all'uso.
          </h1>
          <p className="text-white/40 text-lg max-w-xl leading-relaxed mb-10">
            Parla liberamente. VoiceMint genera presentazioni PPT, PDF professionali e siti web completi in pochi secondi, grazie all'AI.
          </p>

          {!joined ? (
            <div className="flex items-center gap-3 max-w-md">
              <input
                type="email"
                placeholder="La tua email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
              />
              <button
                onClick={async () => {
                  try {
                    await axios.post("https://voicemint-production.up.railway.app/waitlist", { email })
                    setJoined(true)
                  } catch (err) {
                    setError(err.response?.data?.detail || "Errore, riprova")
                  }
                }}
                className="shrink-0 bg-white text-black font-semibold px-6 py-3 rounded-full text-sm hover:bg-white/90 transition-all"
              >
                Unisciti alla waitlist
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-white rounded-full" />
              <p className="text-white/60 text-sm">Sei nella lista — ti avviseremo al lancio!</p>
            </div>
          )}
          {error && <p className="text-red-400 text-xs mt-3">{error}</p>}
          <div className="max-w-md">
          <p className="text-white/20 text-xs mt-4 max-w-md">Nessuna carta richiesta. Accesso anticipato gratuito.</p>
          </div>
        </motion.div>
      </section>

      {/* Numeri */}
      <section className="border-t border-white/5 py-16">
        <div className="max-w-6xl mx-auto px-8 grid grid-cols-3 gap-8">
          {[
            { n: "30s", label: "Per generare un documento" },
            { n: "3", label: "Formati di output" },
            { n: "€9", label: "Piano Pro al mese" },
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
              <p className="text-white/30 text-sm uppercase tracking-widest mb-6">Come funziona</p>
              <h2 className="text-4xl font-bold leading-tight mb-6">
                Tre passi.
              </h2>
              <p className="text-white/40 leading-relaxed">
                VoiceMint combina la trascrizione di OpenAI Whisper con la strutturazione automatica di GPT-4o per trasformare qualsiasi parlato in contenuto professionale.
              </p>
            </div>
            <div className="space-y-8">
              {[
                { n: "01", title: "Parla", desc: "Premi Registra e parla liberamente. Anche in italiano." },
                { n: "02", title: "AI elabora", desc: "Whisper trascrive. GPT-4o struttura il contenuto automaticamente." },
                { n: "03", title: "Scarica", desc: "PPT, PDF o sito web pronti in secondi." },
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
          <p className="text-white/30 text-sm uppercase tracking-widest mb-16">Prezzi</p>
          <div className="grid grid-cols-2 gap-6 max-w-3xl">
            <div className="border border-white/10 rounded-2xl p-8">
              <p className="text-white/40 text-sm mb-4">Free</p>
              <p className="text-5xl font-bold tracking-tighter mb-2">€0</p>
              <p className="text-white/30 text-sm mb-8">Per sempre</p>
              <ul className="space-y-3 text-white/50 text-sm mb-8">
                <li>3 minuti audio / mese</li>
                <li>PDF e PPT base</li>
                <li>1 sito web generato</li>
              </ul>
            </div>
            <div className="border border-white/20 bg-white/5 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-4">
                <p className="text-white/40 text-sm">Pro</p>
                <span className="text-xs text-white/40 border border-white/10 px-2 py-1 rounded-full">Popolare</span>
              </div>
              <p className="text-5xl font-bold tracking-tighter mb-2">€9</p>
              <p className="text-white/30 text-sm mb-8">Al mese</p>
              <ul className="space-y-3 text-white/60 text-sm mb-8">
                <li>Audio illimitato</li>
                <li>PPT, PDF e siti web illimitati</li>
                <li>Priorità nella coda</li>
                <li>Supporto dedicato</li>
              </ul>
              <button
                onClick={onLogin}
                className="w-full bg-white text-black font-semibold py-3 rounded-full transition-all text-sm hover:bg-white/90"
              >
                Unisciti alla waitlist
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-8">
          <p className="text-white/30 text-sm uppercase tracking-widest mb-16">FAQ</p>
          <div className="max-w-2xl space-y-0">
            {[
              { q: "Che lingue supporta?", a: "Italiano, inglese e oltre 50 lingue grazie a OpenAI Whisper." },
              { q: "I miei dati sono al sicuro?", a: "Sì. Le trascrizioni vengono elaborate e poi eliminate dai nostri server." },
              { q: "Posso cancellare quando voglio?", a: "Assolutamente. Nessun vincolo, cancelli in un click." },
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
            <Mic className="w-4 h-4 text-white/20" />
            <span className="text-white/20 text-sm">VoiceMint</span>
          </div>
          <p className="text-white/20 text-sm">© 2026 VoiceMint</p>
        </div>
      </footer>
    </div>
  )
}