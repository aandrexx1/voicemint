import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Mic, Sparkles, Download } from "lucide-react"

export default function ProductPage({ onGetStarted, onLogin }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language

  const tr = (it, en) => lang === "it" ? it : en

  const steps = [
    {
      icon: <Mic className="w-6 h-6" />,
      title: tr("Parla o scrivi", "Speak or type"),
      desc: tr(
        "Registra la tua voce oppure scrivi un prompt. Puoi parlare per 10 secondi o 10 minuti — VoiceMint si adatta.",
        "Record your voice or type a prompt. Speak for 10 seconds or 10 minutes — VoiceMint adapts."
      )
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: tr("L'AI struttura tutto", "AI structures everything"),
      desc: tr(
        "La nostra AI analizza il contenuto, sceglie il tema visivo più adatto e crea slide, sezioni e testi automaticamente.",
        "Our AI analyzes the content, picks the best visual theme, and automatically creates slides, sections and text."
      )
    },
    {
      icon: <Download className="w-6 h-6" />,
      title: tr("Scarica e usa", "Download and use"),
      desc: tr(
        "In pochi secondi hai un file pronto. PowerPoint modificabile, PDF professionale o sito web completo.",
        "In seconds you have a ready file. Editable PowerPoint, professional PDF or complete website."
      )
    },
  ]

  const outputs = [
    {
      type: "PowerPoint",
      emoji: "📊",
      desc: tr(
        "Slide moderne con tema colori generato dall'AI, titoli, punti chiave e riepilogo. Pronte per essere presentate.",
        "Modern slides with AI-generated color theme, titles, key points and summary. Ready to present."
      )
    },
    {
      type: "PDF",
      emoji: "📄",
      desc: tr(
        "Documento professionale con layout pulito e grafica coerente. Perfetto per report, proposte e documentazione.",
        "Professional document with clean layout and consistent graphics. Perfect for reports, proposals and documentation."
      )
    },
    {
      type: tr("Sito Web", "Website"),
      emoji: "🌐",
      desc: tr(
        "Una pagina web completa con navigazione, sezioni e stile personalizzato. Pronta da pubblicare.",
        "A complete web page with navigation, sections and custom style. Ready to publish."
      )
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 md:px-8 py-6 max-w-6xl mx-auto border-b border-white/5">
        <img src="/text_logo.png" alt="VoiceMint" className="h-8 md:h-14 object-contain cursor-pointer" onClick={() => window.history.back()} />
        <div className="flex items-center gap-4">
          <button onClick={onLogin} className="text-white/40 text-sm hover:text-white transition-all">
            {tr("Accedi", "Log in")}
          </button>
          <button onClick={onGetStarted} className="bg-white text-black font-semibold px-5 py-2.5 rounded-full text-sm hover:bg-white/90 transition-all">
            {tr("Inizia gratis →", "Get started free →")}
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 md:px-8 pt-20 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="text-white/30 text-xs uppercase tracking-widest mb-6">
            {tr("Come funziona", "How it works")}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6 max-w-3xl">
            {tr(
              "Dalla voce a un documento professionale in 30 secondi.",
              "From voice to a professional document in 30 seconds."
            )}
          </h1>
          <p className="text-white/40 text-base md:text-lg max-w-xl leading-relaxed">
            {tr(
              "Niente template, niente ore di lavoro. Parli, l'AI pensa, tu scarichi.",
              "No templates, no hours of work. You speak, AI thinks, you download."
            )}
          </p>
        </motion.div>
      </section>

      {/* Steps */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-16">
            {tr("3 passi", "3 steps")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="w-12 h-12 border border-white/10 rounded-2xl flex items-center justify-center text-white/60 mb-6">
                  {s.icon}
                </div>
                <p className="text-white/20 text-xs uppercase tracking-widest mb-3">0{i + 1}</p>
                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Output types */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-16">
            {tr("Cosa puoi generare", "What you can generate")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {outputs.map((o, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="border border-white/5 rounded-2xl p-8 bg-white/[0.02] hover:bg-white/[0.04] transition-all"
              >
                <p className="text-4xl mb-6">{o.emoji}</p>
                <h3 className="text-lg font-bold mb-3">{o.type}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{o.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <p className="text-white/30 text-xs uppercase tracking-widest mb-16">
            {tr("Chi lo usa", "Who uses it")}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                role: tr("Professionisti", "Professionals"),
                desc: tr("Crea proposte commerciali, report e presentazioni per clienti in secondi, senza aprire PowerPoint.", "Create business proposals, reports and client presentations in seconds, without opening PowerPoint.")
              },
              {
                role: tr("Studenti", "Students"),
                desc: tr("Trasforma i tuoi appunti vocali in presentazioni per esami e tesine. Studia parlando.", "Turn your voice notes into presentations for exams and papers. Study by speaking.")
              },
              {
                role: tr("Creator e Influencer", "Creators & Influencers"),
                desc: tr("Genera siti web e PDF per i tuoi contenuti, corsi e prodotti digitali senza saper programmare.", "Generate websites and PDFs for your content, courses and digital products without coding.")
              },
              {
                role: tr("Team e Startup", "Teams & Startups"),
                desc: tr("Documenta idee, brief e strategie al volo. Dal brainstorming vocale alla presentazione in 30 secondi.", "Document ideas, briefs and strategies on the fly. From voice brainstorm to presentation in 30 seconds.")
              },
            ].map((u, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                className="border-l border-white/10 pl-8 py-4"
              >
                <h3 className="text-lg font-bold mb-2">{u.role}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{u.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-white/5 py-24">
        <div className="max-w-6xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            {tr("Provalo adesso.", "Try it now.")}
          </h2>
          <p className="text-white/40 mb-10">
            {tr("I primi 50 utenti ottengono Pro gratis a vita.", "First 50 users get Pro free forever.")}
          </p>
          <button
            onClick={onGetStarted}
            className="bg-white text-black font-semibold px-8 py-4 rounded-full text-sm hover:bg-white/90 transition-all"
          >
            {tr("Inizia gratis →", "Get started free →")}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 md:px-8 flex items-center justify-between">
          <img src="/text_logo.png" alt="VoiceMint" className="h-8 object-contain" />
          <p className="text-white/20 text-sm">© 2026 VoiceMint</p>
        </div>
      </footer>
    </div>
  )
}