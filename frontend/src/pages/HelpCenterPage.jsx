import { useMemo, useState } from "react"
import { Search } from "lucide-react"

const SECTIONS_IT = [
  {
    id: "billing",
    title: "Fatturazione",
    body: `Abbonamenti, ricevute e rinnovi sono gestiti tramite Stripe. Dopo l'acquisto ricevi la conferma via email. Per modificare il piano usa l'area account nell'app o contatta il supporto se il pagamento non risulta corretto.`,
  },
  {
    id: "account",
    title: "Account",
    body: `Nel menu profilo puoi vedere il piano attivo, aggiornare nome e cognome, cambiare password e gestire l'abbonamento. I dati di accesso sono legati all'email con cui ti sei registrato.`,
  },
  {
    id: "access",
    title: "Accesso e registrazione",
    body: `Puoi creare un account con email e password oppure tramite Google/GitHub se abilitati. Se dimentichi la password, usa il link "Password dimenticata" nella pagina di login.`,
  },
  {
    id: "privacy",
    title: "Privacy e politiche",
    body: `Trattiamo i tuoi dati secondo la Privacy Policy e i Termini di servizio del sito. Le registrazioni vocali e i testi inviati servono solo a generare i documenti richiesti; non venderemo i tuoi contenuti a terzi.`,
  },
  {
    id: "features",
    title: "Funzionalità",
    body: `VoiceMint trascrive la tua voce (o usa un testo) e genera presentazioni PowerPoint. Dalla workspace puoi consultare la cronologia e scaricare di nuovo i file creati in precedenza, quando ancora disponibili sul server.`,
  },
]

function normalize(s) {
  return (s || "").toLowerCase().normalize("NFD").replace(/\p{M}/gu, "")
}

export default function HelpCenterPage({ onBack }) {
  const [q, setQ] = useState("")

  const filtered = useMemo(() => {
    const n = normalize(q.trim())
    if (!n) return SECTIONS_IT
    return SECTIONS_IT.filter(
      (s) => normalize(s.title).includes(n) || normalize(s.body).includes(n)
    )
  }, [q])

  return (
    <div className="min-h-screen text-white">
      <header className="border-b border-white/10 px-6 py-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mb-2 text-sm text-white/50 hover:text-white"
              >
                ← Indietro
              </button>
            )}
            <h1 className="text-2xl font-bold tracking-tight">Centro assistenza</h1>
            <p className="mt-1 text-sm text-white/50">Cerca tra gli argomenti o scorri le sezioni.</p>
          </div>
        </div>
        <div className="mx-auto mt-6 max-w-3xl">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cerca (es. fatturazione, password, privacy…)"
              className="w-full rounded-2xl border border-white/15 bg-white/[0.06] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-6 py-10">
        {filtered.length === 0 ? (
          <p className="text-center text-white/45">Nessun risultato per la tua ricerca.</p>
        ) : (
          filtered.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 border-b border-white/5 pb-10 last:border-0">
              <h2 className="text-lg font-semibold text-white">{s.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/65 whitespace-pre-wrap">{s.body}</p>
            </section>
          ))
        )}
      </main>
    </div>
  )
}
