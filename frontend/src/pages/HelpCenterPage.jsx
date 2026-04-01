import { useMemo, useState } from "react"
import { Search, ChevronRight, ArrowLeft } from "lucide-react"

const CATEGORIES = [
  {
    id: "billing",
    title: "Fatturazione",
    articles: [
      {
        id: "billing-upgrade",
        title: "Come aggiornare il piano",
        body:
          "Puoi passare a Pro dalla sezione Piani nell'app. Il pagamento è gestito da Stripe: al termine vedrai il piano aggiornato e riceverai una conferma via email.",
      },
      {
        id: "billing-receipts",
        title: "Ricevute e pagamenti",
        body:
          "Le ricevute vengono inviate via email. Se un pagamento risulta in sospeso o non compare, attendi qualche minuto e riprova: in caso di problemi, contatta il supporto.",
      },
      {
        id: "billing-credits",
        title: "Crediti: come funzionano",
        body:
          "Nel piano Free hai un plafond mensile. Ogni creazione consuma crediti in base alla lunghezza del testo inviato. Pro ha crediti illimitati.",
      },
    ],
  },
  {
    id: "account",
    title: "Account",
    articles: [
      {
        id: "account-profile",
        title: "Aggiornare profilo",
        body:
          "Nel pannello Account puoi modificare nome e cognome e salvare le modifiche. L'email rimane quella usata per l'accesso.",
      },
      {
        id: "account-password",
        title: "Cambiare password",
        body:
          "Nelle impostazioni account puoi cambiare password inserendo quella attuale e quella nuova. Se non ricordi la password usa il reset dalla pagina di login.",
      },
      {
        id: "account-logout",
        title: "Uscire dall’account",
        body:
          "Dal menu profilo in alto a destra puoi fare logout in qualsiasi momento.",
      },
    ],
  },
  {
    id: "access",
    title: "Accesso e registrazione",
    articles: [
      {
        id: "access-signup",
        title: "Creare un account",
        body:
          "Registrati con email e password (o tramite provider OAuth se disponibile). Dopo la registrazione verrai portato alla workspace.",
      },
      {
        id: "access-reset",
        title: "Password dimenticata",
        body:
          "Dalla pagina di login puoi avviare il reset password. Riceverai un link via email per impostare una nuova password.",
      },
      {
        id: "access-oauth",
        title: "Login con Google/GitHub",
        body:
          "Se abilitato, puoi accedere con Google o GitHub. In caso di errori, verifica che l'email sia corretta e riprova.",
      },
    ],
  },
  {
    id: "privacy",
    title: "Privacy e politiche",
    articles: [
      {
        id: "privacy-data",
        title: "Come trattiamo i dati",
        body:
          "Usiamo i tuoi contenuti per generare il documento richiesto. Le politiche complete sono nella Privacy Policy e nei Termini del sito.",
      },
      {
        id: "privacy-cookies",
        title: "Cookie e preferenze",
        body:
          "Puoi gestire i cookie dalle impostazioni nell'app (tasto Gestisci cookie).",
      },
      {
        id: "privacy-security",
        title: "Sicurezza dell’account",
        body:
          "Ti consigliamo una password robusta e di non condividere le tue credenziali. Se sospetti accessi non autorizzati, cambia password.",
      },
    ],
  },
  {
    id: "features",
    title: "Funzionalità",
    articles: [
      {
        id: "features-generate",
        title: "Generare un PowerPoint",
        body:
          "Puoi registrare la voce o incollare un testo. Premi Genera PowerPoint: il file verrà creato e scaricato.",
      },
      {
        id: "features-history",
        title: "Creazioni e download",
        body:
          "Nel pannello Utilizzo trovi le creazioni recenti e puoi riscaricare i file quando sono ancora disponibili sul server.",
      },
      {
        id: "features-templates",
        title: "Template e stile",
        body:
          "Il sistema può usare template `.pptx` (se configurati) per ottenere layout più coerenti e vari.",
      },
    ],
  },
]

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

export default function HelpCenterPage({ onBack }) {
  const [q, setQ] = useState("")
  const [activeCategory, setActiveCategory] = useState("billing")
  const [activeArticleId, setActiveArticleId] = useState(null)

  const filtered = useMemo(() => {
    const n = normalize(q.trim())
    if (!n) return CATEGORIES
    return CATEGORIES.map((c) => ({
      ...c,
      articles: c.articles.filter(
        (a) => normalize(a.title).includes(n) || normalize(a.body).includes(n)
      ),
    })).filter((c) => c.articles.length > 0 || normalize(c.title).includes(n))
  }, [q])

  const categories = q.trim() ? filtered : CATEGORIES
  const active = categories.find((c) => c.id === activeCategory) || categories[0]
  const activeArticle =
    (active?.articles || []).find((a) => a.id === activeArticleId) || null

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Indietro
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight">Ottieni aiuto</h1>
            <p className="mt-1 text-sm text-white/50">Articoli rapidi, guide e risposte.</p>
          </div>

          <div className="w-full max-w-lg">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="search"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setActiveArticleId(null)
                }}
                placeholder="Cerca (es. crediti, password, privacy…) "
                className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-10 md:grid-cols-[260px_1fr]">
        {/* Sidebar categorie */}
        <aside className="rounded-3xl border border-white/10 bg-black/20 p-3">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-widest text-white/35">Categorie</p>
          <div className="space-y-1">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setActiveCategory(c.id)
                  setActiveArticleId(null)
                }}
                className={`w-full rounded-2xl px-3 py-2 text-left text-sm ${
                  activeCategory === c.id ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
                }`}
              >
                {c.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Area articoli */}
        <section className="min-w-0">
          {!active ? (
            <p className="text-center text-white/45">Nessun risultato per la tua ricerca.</p>
          ) : activeArticle ? (
            <article className="rounded-3xl border border-white/10 bg-white/[0.03] p-7">
              <button
                type="button"
                onClick={() => setActiveArticleId(null)}
                className="mb-4 text-sm text-white/50 hover:text-white"
              >
                ← Torna agli articoli
              </button>
              <h2 className="text-xl font-bold">{activeArticle.title}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-white/65">{activeArticle.body}</p>
            </article>
          ) : (
            <>
              <div className="mb-5">
                <h2 className="text-lg font-semibold">{active.title}</h2>
                <p className="mt-1 text-sm text-white/45">Seleziona un articolo.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {(active.articles || []).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setActiveArticleId(a.id)}
                    className="group rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-left hover:bg-white/[0.06]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white/90">{a.title}</p>
                        <p className="mt-2 line-clamp-3 text-sm text-white/55">{a.body}</p>
                      </div>
                      <ChevronRight className="mt-0.5 h-5 w-5 shrink-0 text-white/35 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}
