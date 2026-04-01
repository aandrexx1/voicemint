import { useEffect, useMemo, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { ImageIcon, LayoutList, PenLine, Presentation, X, Check, Circle } from "lucide-react"

/**
 * Overlay “agente” (ispirato a flussi tipo Manus): passaggi verticali con spunte,
 * pill per sotto-attività, barra inferiore con tempo e stato.
 * Il backend è ancora un POST unico: le fasi sono indicative finché non c’è streaming.
 */
export function GenerationProgressOverlay({
  open,
  loading,
  lang = "it",
  promptPreview = "",
  error = null,
  onDismiss,
}) {
  const [tick, setTick] = useState(0)
  const [visualStep, setVisualStep] = useState(0)
  const [phase, setPhase] = useState("running")
  const [barHintIdx, setBarHintIdx] = useState(0)

  const copy = useMemo(() => {
    const it = {
      title: "Creazione della presentazione",
      intro:
        "Ecco cosa succede mentre prepariamo il file: organizziamo i contenuti, scegliamo le immagini quando possibile, poi assembliamo la presentazione.",
      steps: [
        {
          name: "Scelta delle immagini",
          doneLine:
            "Cerchiamo foto in linea con l’argomento, partendo dai titoli delle slide, quando la galleria immagini è attiva.",
          pills: ["Foto coerenti con il tema", "Immagini salvate per andare più veloce dopo"],
          Icon: ImageIcon,
        },
        {
          name: "Struttura delle slide",
          doneLine: "Titoli, tipi di slide e quantità di testo definiti dal modello.",
          pills: ["Suddivisione in sezioni", "Contenuti bilanciati"],
          Icon: LayoutList,
        },
        {
          name: "Scrittura contenuti delle slide",
          doneLine: "Testo, elenchi e riepilogo allineati a ciò che hai detto o incollato.",
          pills: ["Contenuto per ogni slide", "Colori e stile uniformi"],
          Icon: PenLine,
        },
        {
          name: "Generazione della presentazione",
          doneLine: "Creiamo il file PowerPoint e lo prepariamo al download.",
          pills: ["Layout o modello grafico", "Immagini posizionate sulle slide"],
          Icon: Presentation,
        },
      ],
      barHints: [
        "Sistemiamo spazi e testo nelle caselle…",
        "Applichiamo colori e caratteri…",
        "Aggiungiamo le miniature a destra quando ci sono immagini…",
        "Completiamo il file PowerPoint…",
      ],
      success: "Presentazione pronta",
      successSub: "Il download è partito o partirà tra un attimo.",
      errorTitle: "Qualcosa è andato storto",
    }
    const en = {
      title: "Building your presentation",
      intro:
        "Here’s what we’re doing: organizing your content, picking images when available, then assembling your presentation.",
      steps: [
        {
          name: "Choosing images",
          doneLine:
            "We look for photos that match your topic using slide titles, when the image library is turned on.",
          pills: ["Photos matched to your topic", "Saved images for faster runs later"],
          Icon: ImageIcon,
        },
        {
          name: "Slide structure",
          doneLine: "Slide types, titles, and how much text goes on each slide.",
          pills: ["Sections and flow", "Balanced content"],
          Icon: LayoutList,
        },
        {
          name: "Slide copywriting",
          doneLine: "Bullets, body text, and summary aligned with what you said or pasted.",
          pills: ["Content for each slide", "Consistent colors and style"],
          Icon: PenLine,
        },
        {
          name: "Deck generation",
          doneLine: "We build your PowerPoint file and get it ready to download.",
          pills: ["Built-in layout or your template", "Images placed on slides"],
          Icon: Presentation,
        },
      ],
      barHints: [
        "Adjusting text boxes and spacing…",
        "Applying colors and fonts…",
        "Adding thumbnails on the right when images are available…",
        "Finishing your PowerPoint file…",
      ],
      success: "Presentation ready",
      successSub: "Download should start or has started.",
      errorTitle: "Something went wrong",
    }
    return lang === "it" ? it : en
  }, [lang])

  useEffect(() => {
    if (!open) {
      setVisualStep(0)
      setTick(0)
      setPhase("running")
      setBarHintIdx(0)
      return
    }
    setVisualStep(0)
    setTick(0)
    setPhase("running")
    setBarHintIdx(0)
  }, [open])

  useEffect(() => {
    if (open && error) setPhase("error")
  }, [open, error])

  useEffect(() => {
    if (!open || !loading) return
    const id = window.setInterval(() => setTick((t) => t + 1), 1000)
    return () => window.clearInterval(id)
  }, [open, loading])

  useEffect(() => {
    if (!open || !loading) return
    const id = window.setInterval(() => {
      setVisualStep((s) => Math.min(3, s + 1))
    }, 5200)
    return () => window.clearInterval(id)
  }, [open, loading])

  useEffect(() => {
    if (!open || !loading) return
    const id = window.setInterval(() => {
      setBarHintIdx((i) => (i + 1) % copy.barHints.length)
    }, 3200)
    return () => window.clearInterval(id)
  }, [open, loading, copy.barHints.length])

  useEffect(() => {
    if (!open || loading) return
    if (error) {
      setPhase("error")
      return
    }
    setPhase("success")
    setVisualStep(3)
    const t = window.setTimeout(() => onDismiss?.(), 2200)
    return () => window.clearTimeout(t)
  }, [open, loading, error, onDismiss])

  const elapsedLabel = useMemo(() => {
    const s = tick
    const m = Math.floor(s / 60)
    const r = s % 60
    return `${m}:${String(r).padStart(2, "0")}`
  }, [tick])

  const stepIndex = Math.min(visualStep, 3)
  const current = copy.steps[stepIndex]
  const preview =
    promptPreview.length > 200 ? `${promptPreview.slice(0, 200)}…` : promptPreview

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gen-progress-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0a0a0c]/96 backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 md:px-8">
            <p id="gen-progress-title" className="text-sm font-semibold text-white">
              VoiceMint
            </p>
            <button
              type="button"
              onClick={() => onDismiss?.()}
              className="rounded-full p-2 text-white/50 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-6 md:px-10">
            <div className="mx-auto max-w-xl">
              {preview && (
                <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left text-sm leading-relaxed text-white/65">
                  {preview}
                </div>
              )}

              {phase === "error" && error && (
                <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-5 text-red-100">
                  <p className="font-semibold">{copy.errorTitle}</p>
                  <p className="mt-2 text-sm opacity-90">{error}</p>
                </div>
              )}

              {phase !== "error" && (
                <>
                  <h2 className="text-lg font-semibold text-white md:text-xl">{copy.title}</h2>
                  <p className="mt-2 text-xs leading-relaxed text-white/45 md:text-sm">{copy.intro}</p>

                  {phase === "success" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-5 py-4 text-emerald-100"
                    >
                      <Check className="h-8 w-8 shrink-0 text-emerald-400" strokeWidth={2.5} />
                      <div>
                        <p className="font-semibold">{copy.success}</p>
                        <p className="text-sm text-emerald-100/80">{copy.successSub}</p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="mt-8">
                      <ul className="relative space-y-0">
                        {copy.steps.map((st, i) => {
                          const done = i < visualStep
                          const active = i === visualStep && loading
                          const Icon = st.Icon
                          return (
                            <li key={st.name} className="relative flex gap-4 pb-8 last:pb-2">
                              {i < copy.steps.length - 1 && (
                                <div
                                  className="absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px bg-white/10"
                                  aria-hidden
                                />
                              )}
                              <div className="relative z-[1] flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/15 bg-[#12121a]">
                                {done ? (
                                  <Check className="h-4 w-4 text-emerald-400" strokeWidth={2.5} />
                                ) : active ? (
                                  <span className="relative flex h-3 w-3">
                                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5b7cff] opacity-40" />
                                    <span className="relative inline-flex h-3 w-3 rounded-full bg-[#5b7cff]" />
                                  </span>
                                ) : (
                                  <Circle className="h-3.5 w-3.5 text-white/25" strokeWidth={2} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1 pt-0.5">
                                <div className="flex items-center gap-2">
                                  <Icon className="h-4 w-4 shrink-0 text-white/35" />
                                  <p className={`font-medium ${active ? "text-white" : done ? "text-white/75" : "text-white/40"}`}>
                                    {st.name}
                                  </p>
                                </div>
                                {active && (
                                  <>
                                    <p className="mt-2 text-xs text-white/50">{st.doneLine}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {st.pills.map((p) => (
                                        <span
                                          key={p}
                                          className="inline-flex rounded-full border border-white/10 bg-black/40 px-2.5 py-1 text-[11px] text-white/70"
                                        >
                                          {p}
                                        </span>
                                      ))}
                                    </div>
                                  </>
                                )}
                                {done && !active && (
                                  <p className="mt-2 text-[11px] text-white/35">{st.doneLine}</p>
                                )}
                              </div>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {phase === "running" && loading && (
            <div className="border-t border-white/10 bg-black/60 px-4 py-3 md:px-8">
              <div className="mx-auto flex max-w-4xl items-center gap-4">
                <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-[#1a1a24] to-[#0d0d12] ring-1 ring-white/10">
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white/25">
                    PPTX
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#1f3dbc]/30 to-transparent" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-[#5b7cff]" />
                    <span className="truncate text-sm font-medium text-white">{current.name}</span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-white/45">
                    {elapsedLabel} · {copy.barHints[barHintIdx % copy.barHints.length]}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm tabular-nums text-white/90">
                    {stepIndex + 1}/4
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
