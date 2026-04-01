import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { Mic, Download, LogOut, FileText, X, ChevronRight, ExternalLink, LifeBuoy, Sun, Moon, Settings2 } from "lucide-react"
import { GenerationProgressOverlay } from "../components/generation-progress-overlay.jsx"
import { motion, AnimatePresence } from "framer-motion"
import axios from "axios"
import { safeGetItem, safeSetItem } from "../lib/safe-storage"

const API = import.meta.env.VITE_API_URL || "https://voicemint-backend.onrender.com"

function filenameFromContentDisposition(cd) {
  if (!cd) return null
  const m = /filename\*?=(?:UTF-8''|\"?)([^\";]+)/i.exec(cd)
  if (!m) return null
  try {
    return decodeURIComponent(m[1])
  } catch {
    return m[1]
  }
}

function formatWhen(iso) {
  if (!iso) return ""
  try {
    const d = new Date(iso)
    return d.toLocaleString("it-IT", { dateStyle: "short", timeStyle: "short" })
  } catch {
    return ""
  }
}

export default function WorkspacePage({
  token,
  user,
  setUser,
  onLogout,
  onOpenTerms,
  onOpenPrivacy,
  openHomeInNewTab,
  openHelpInNewTab,
  onOpenCookiePreferences,
}) {
  const authConfig =
    token && token !== "cookie"
      ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      : { withCredentials: true }

  const [recording, setRecording] = useState(false)
  const [transcription, setTranscription] = useState("")
  const [outputType] = useState("ppt")
  const [loading, setLoading] = useState(false)
  const [history, setHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [mediaRecorder, setMediaRecorder] = useState(null)
  const [profileOpen, setProfileOpen] = useState(false)
  const [creazioniOpen, setCreazioniOpen] = useState(false)
  const [modal, setModal] = useState(null)
  const [lang, setLang] = useState(() => safeGetItem("lang", "it") || "it")
  const [uiTheme, setUiTheme] = useState(() => safeGetItem("ui_theme", "dark") || "dark")
  const [progressOpen, setProgressOpen] = useState(false)
  const [genError, setGenError] = useState(null)
  const profileRef = useRef(null)

  const t = (it, en) => (lang === "it" ? it : en)
  const userInitial = (user?.username || user?.email || "U")[0].toUpperCase()
  const isProUser = user?.tier === "pro"
  const isLifetimePro = user?.lifetime_pro
  const isStarter = user?.tier === "starter"

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true)
    try {
      const res = await axios.get(`${API}/me/conversions`, authConfig)
      setHistory(Array.isArray(res.data) ? res.data : [])
    } catch {
      setHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }, [token])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false)
        setCreazioniOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    const chunks = []
    recorder.ondataavailable = (e) => chunks.push(e.data)
    recorder.onstop = async () => {
      const blob = new Blob(chunks, { type: "audio/webm" })
      const formData = new FormData()
      formData.append("file", blob, "recording.webm")
      try {
        const res = await axios.post(`${API}/upload-audio`, formData, authConfig)
        setTranscription(res.data.transcription)
      } catch {
        setTranscription(t("Errore nella trascrizione", "Transcription error"))
      }
    }
    recorder.start()
    setMediaRecorder(recorder)
    setRecording(true)
  }

  const stopRecording = () => {
    mediaRecorder?.stop()
    setRecording(false)
  }

  const downloadConversion = async (id) => {
    try {
      const res = await axios.get(`${API}/me/conversions/${id}/download`, {
        ...authConfig,
        responseType: "blob",
      })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = filenameFromContentDisposition(res.headers?.["content-disposition"]) || `voicemint_${id}.pptx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert(t("Download non disponibile", "Download not available"))
    }
  }

  const generate = async () => {
    if (!transcription?.trim()) return
    const deckMode = "presentation"
    setGenError(null)
    setProgressOpen(true)
    setLoading(true)
    try {
      const res = await axios.post(
        `${API}/generate`,
        { transcription, output_type: outputType, deck_mode: deckMode },
        token && token !== "cookie"
          ? { headers: { Authorization: `Bearer ${token}` }, responseType: "blob", withCredentials: true }
          : { responseType: "blob", withCredentials: true }
      )
      const url = URL.createObjectURL(res.data)
      const a = document.createElement("a")
      a.href = url
      a.download = filenameFromContentDisposition(res.headers?.["content-disposition"]) || "voicemint.pptx"
      a.click()
      URL.revokeObjectURL(url)
      setProgressOpen(false)
      await loadHistory()
    } catch (e) {
      const d = e?.response?.data?.detail
      const msg =
        typeof d === "string"
          ? d
          : Array.isArray(d)
            ? d.map((x) => (typeof x === "object" ? x.msg || JSON.stringify(x) : String(x))).join(" ")
            : d
              ? String(d)
              : e?.message || t("Errore nella generazione", "Generation failed")
      setGenError(msg)
    } finally {
      setLoading(false)
    }
  }

  const planLabel = () => {
    if (isLifetimePro) return t("Pro a vita", "Lifetime Pro")
    if (isProUser) return t("Pro", "Pro")
    if (isStarter) return "Starter"
    return t("Free", "Free")
  }

  const creditsRemaining = useMemo(() => {
    if (!user) return null
    if (user?.tier === "free") {
      if (typeof user?.credits_remaining === "number") return user.credits_remaining
      const used = Number(user?.monthly_usage || 0)
      const limit = 180
      return Math.max(0, Math.floor(limit - used))
    }
    return null
  }, [user])

  const pill = (label, onClick) => (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 hover:bg-white/10"
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-transparent text-white">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-white/80" />
            <span className="font-semibold tracking-tight">VoiceMint</span>
          </div>

          <div className="flex items-center gap-3">
            {typeof creditsRemaining === "number" && (
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/70">
                <span className="font-semibold text-white">{creditsRemaining}</span>
                <span className="text-white/40">{t("crediti", "credits")}</span>
              </div>
            )}

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-sm font-semibold text-white hover:bg-white/15"
                aria-expanded={profileOpen}
                aria-haspopup="true"
              >
                {userInitial}
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-[#111] py-2 shadow-xl"
                  >
                    <div className="border-b border-white/5 px-4 py-3">
                      {user?.tier === "free" ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white/90">{t("Piano gratuito", "Free plan")}</p>
                          {pill(t("Aggiorna", "Upgrade"), () => {
                            setProfileOpen(false)
                            setModal("plans")
                          })}
                        </div>
                      ) : (
                        <>
                          <p className="text-xs uppercase tracking-wider text-white/40">{t("Piano attivo", "Active plan")}</p>
                          <p className="mt-1 text-sm font-semibold text-white">{planLabel()}</p>
                        </>
                      )}
                    </div>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                      onClick={() => {
                        setProfileOpen(false)
                        setModal("account")
                      }}
                    >
                      <FileText className="h-4 w-4 shrink-0 opacity-60" />
                      {t("Account", "Account")}
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                      onClick={() => {
                        setProfileOpen(false)
                        setModal("settings")
                      }}
                    >
                      <Settings2 className="h-4 w-4 shrink-0 opacity-60" />
                      {t("Impostazioni", "Settings")}
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                      onClick={() => {
                        setProfileOpen(false)
                        openHomeInNewTab?.()
                      }}
                    >
                      <ExternalLink className="h-4 w-4 shrink-0 opacity-60" />
                      {t("Pagina principale", "Homepage")}
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5"
                      onClick={() => {
                        setProfileOpen(false)
                        openHelpInNewTab?.()
                      }}
                    >
                      <LifeBuoy className="h-4 w-4 shrink-0 opacity-60" />
                      {t("Ottieni aiuto", "Get help")}
                    </button>

                    <button
                      type="button"
                      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
                      onClick={() => {
                        setProfileOpen(false)
                        setModal("plans")
                      }}
                    >
                      {t("Piani e upgrade", "Plans & upgrade")}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setProfileOpen(false)
                        onLogout?.()
                      }}
                      className="flex w-full items-center gap-2 border-t border-white/5 px-4 py-3 text-left text-sm text-white/50 hover:bg-white/5 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      {t("Esci", "Log out")}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col px-6 py-10">
          <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col">
            <h1 className="text-2xl font-bold">{t("Nuova presentazione", "New presentation")}</h1>
            <p className="mt-1 text-sm text-white/45">
              {t("Registra o incolla il testo, poi genera il PowerPoint.", "Record or paste text, then generate PowerPoint.")}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  recording
                    ? "border border-red-400/40 bg-red-500/15 text-red-100 animate-pulse"
                    : "bg-white text-black hover:bg-white/90"
                }`}
              >
                {recording ? "⏹ " + t("Stop", "Stop") : "🎙 " + t("Registra", "Record")}
              </button>
            </div>

            <textarea
              value={transcription}
              onChange={(e) => setTranscription(e.target.value)}
              placeholder={t(
                "Trascrizione o testo dell'argomento…",
                "Transcription or topic text…"
              )}
              className={[
                "mt-6 h-[320px] w-full resize-none rounded-2xl border p-5 text-sm leading-relaxed outline-none focus:border-white/20",
                uiTheme === "light"
                  ? "border-white/15 bg-white text-black placeholder:text-black/40"
                  : "border-white/10 bg-white/[0.04] text-white placeholder:text-white/25",
              ].join(" ")}
            />

            <button
              type="button"
              onClick={generate}
              disabled={loading || !transcription?.trim()}
              className="mt-6 w-full rounded-full bg-white py-3.5 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-30 sm:w-auto sm:px-10"
            >
              {loading ? t("Generazione…", "Generating…") : t("Genera PowerPoint", "Generate PowerPoint")}
            </button>

            {(onOpenTerms || onOpenPrivacy) && (
              <div className="mt-12 flex flex-wrap gap-4 text-xs text-white/35">
                {onOpenTerms && (
                  <button type="button" onClick={onOpenTerms} className="hover:text-white/70">
                    {lang === "it" ? "Termini di servizio" : "Terms of Service"}
                  </button>
                )}
                {onOpenPrivacy && (
                  <button type="button" onClick={onOpenPrivacy} className="hover:text-white/70">
                    {lang === "it" ? "Privacy Policy" : "Privacy Policy"}
                  </button>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <GenerationProgressOverlay
        open={progressOpen}
        loading={loading}
        lang={lang === "it" ? "it" : "en"}
        promptPreview={(transcription || "").trim()}
        error={genError}
        onDismiss={() => {
          setProgressOpen(false)
          setGenError(null)
        }}
      />

      <AnimatePresence>
        {modal === "account" && (
          <AccountModal
            user={user}
            token={token}
            setUser={setUser}
            lang={lang}
            setLang={(next) => {
              setLang(next)
              safeSetItem("lang", next)
            }}
            uiTheme={uiTheme}
            setUiTheme={(next) => {
              setUiTheme(next)
              safeSetItem("ui_theme", next)
            }}
            history={history}
            historyLoading={historyLoading}
            onReloadHistory={loadHistory}
            onDownload={downloadConversion}
            onOpenCookiePreferences={onOpenCookiePreferences}
            onClose={() => setModal(null)}
            initialTab="account"
          />
        )}
        {modal === "settings" && (
          <AccountModal
            user={user}
            token={token}
            setUser={setUser}
            lang={lang}
            setLang={(next) => {
              setLang(next)
              safeSetItem("lang", next)
            }}
            uiTheme={uiTheme}
            setUiTheme={(next) => {
              setUiTheme(next)
              safeSetItem("ui_theme", next)
            }}
            history={history}
            historyLoading={historyLoading}
            onReloadHistory={loadHistory}
            onDownload={downloadConversion}
            onOpenCookiePreferences={onOpenCookiePreferences}
            onClose={() => setModal(null)}
            initialTab="settings"
          />
        )}
        {modal === "plans" && (
          <PlansModal user={user} token={token} setUser={setUser} onClose={() => setModal(null)} lang={lang} />
        )}
      </AnimatePresence>
    </div>
  )
}

function SettingsModal({ user, token, setUser, onClose, lang }) {
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "" })
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" })
  const [msg, setMsg] = useState("")
  const [pwMsg, setPwMsg] = useState("")
  const t = (it, en) => (lang === "it" ? it : en)
  const authConfig =
    token && token !== "cookie"
      ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      : { withCredentials: true }

  const saveProfile = async () => {
    try {
      await axios.put(`${API}/me/profile`, form, authConfig)
      setUser({ ...user, ...form })
      setMsg(t("Profilo aggiornato!", "Profile updated!"))
    } catch {
      setMsg(t("Errore nel salvataggio", "Save error"))
    }
  }

  const changePassword = async () => {
    try {
      await axios.put(`${API}/me/password`, pwForm, authConfig)
      setPwMsg(t("Password aggiornata!", "Password updated!"))
      setPwForm({ old_password: "", new_password: "" })
    } catch (err) {
      setPwMsg(err.response?.data?.detail || t("Errore", "Error"))
    }
  }

  const cancelSub = async () => {
    if (!window.confirm(t("Sei sicuro di voler annullare l'abbonamento?", "Are you sure you want to cancel?"))) return
    try {
      await axios.delete(`${API}/me/subscription`, authConfig)
      setUser({ ...user, tier: "free", pro_until: null })
      onClose()
    } catch (err) {
      alert(err.response?.data?.detail || t("Errore", "Error"))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-3xl border border-white/10 bg-[#111] p-8"
      >
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("Impostazioni account", "Account settings")}</h2>
          <button type="button" onClick={onClose} aria-label="Close">
            <X className="h-5 w-5 text-white/40 hover:text-white" />
          </button>
        </div>
        <div className="mb-6 rounded-2xl border border-white/5 bg-white/[0.03] p-4">
          <p className="mb-1 text-xs text-white/30">Email</p>
          <p className="text-sm text-white">{user?.email}</p>
        </div>
        <div className="mb-6 space-y-3">
          <input
            placeholder={t("Nome", "First name")}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
          />
          <input
            placeholder={t("Cognome", "Last name")}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-white/30"
          />
          <button
            type="button"
            onClick={saveProfile}
            className="w-full rounded-full bg-white py-3 text-sm font-semibold text-black hover:bg-white/90"
          >
            {t("Salva profilo", "Save profile")}
          </button>
          {msg && <p className="text-center text-xs text-green-400">{msg}</p>}
        </div>
        <div className="mb-6 space-y-3 border-t border-white/5 pt-6">
          <p className="mb-3 text-xs uppercase tracking-widest text-white/30">{t("Cambia password", "Change password")}</p>
          <input
            type="password"
            placeholder={t("Password attuale", "Current password")}
            value={pwForm.old_password}
            onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/20"
          />
          <input
            type="password"
            placeholder={t("Nuova password", "New password")}
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
            className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/20"
          />
          <button
            type="button"
            onClick={changePassword}
            className="w-full rounded-full bg-white/10 py-3 text-sm font-semibold text-white hover:bg-white/20"
          >
            {t("Cambia password", "Change password")}
          </button>
          {pwMsg && <p className="text-center text-xs text-green-400">{pwMsg}</p>}
        </div>
        {(user?.tier === "pro" || user?.tier === "starter") && !user?.lifetime_pro && (
          <div className="border-t border-white/5 pt-6">
            <button type="button" onClick={cancelSub} className="w-full py-2 text-sm text-red-400 hover:text-red-300">
              {t("Annulla abbonamento", "Cancel subscription")}
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

function AccountModal({
  user,
  token,
  setUser,
  lang,
  setLang,
  uiTheme,
  setUiTheme,
  history,
  historyLoading,
  onReloadHistory,
  onDownload,
  onOpenCookiePreferences,
  onClose,
  initialTab = "account",
}) {
  const [tab, setTab] = useState(initialTab)
  const t = (it, en) => (lang === "it" ? it : en)
  const authConfig =
    token && token !== "cookie"
      ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      : { withCredentials: true }

  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "" })
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" })
  const [msg, setMsg] = useState("")
  const [pwMsg, setPwMsg] = useState("")

  const saveProfile = async () => {
    try {
      await axios.put(`${API}/me/profile`, form, authConfig)
      setUser({ ...user, ...form })
      setMsg(t("Profilo aggiornato!", "Profile updated!"))
    } catch {
      setMsg(t("Errore nel salvataggio", "Save error"))
    }
  }

  const changePassword = async () => {
    try {
      await axios.put(`${API}/me/password`, pwForm, authConfig)
      setPwMsg(t("Password aggiornata!", "Password updated!"))
      setPwForm({ old_password: "", new_password: "" })
    } catch (err) {
      setPwMsg(err.response?.data?.detail || t("Errore", "Error"))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 12 }}
        className="flex h-[82vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b0b0d]"
      >
        {/* Sidebar */}
        <div className="w-72 shrink-0 border-r border-white/10 bg-black/25 p-3">
          <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/10 text-sm font-semibold">
              {(user?.username || user?.email || "U")[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{user?.username || user?.email}</p>
              <p className="truncate text-xs text-white/35">{user?.email}</p>
            </div>
          </div>

          <nav className="mt-2 space-y-1">
            <button
              type="button"
              onClick={() => setTab("account")}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${tab === "account" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              {t("Account", "Account")}
            </button>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${tab === "settings" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              {t("Impostazioni", "Settings")}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("usage")
                onReloadHistory?.()
              }}
              className={`w-full rounded-xl px-3 py-2 text-left text-sm ${tab === "usage" ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"}`}
            >
              {t("Utilizzo", "Usage")}
            </button>
          </nav>

          <div className="mt-auto" />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 p-7">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {tab === "account" ? t("Account", "Account") : tab === "settings" ? t("Impostazioni", "Settings") : t("Utilizzo", "Usage")}
            </h2>
            <button type="button" onClick={onClose} aria-label="Close">
              <X className="h-5 w-5 text-white/40 hover:text-white" />
            </button>
          </div>

          {tab === "account" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs text-white/40">Email</p>
                <p className="mt-1 text-sm text-white">{user?.email}</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-4 text-xs uppercase tracking-widest text-white/35">{t("Profilo", "Profile")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    placeholder={t("Nome", "First name")}
                    className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                  <input
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    placeholder={t("Cognome", "Last name")}
                    className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={saveProfile}
                  className="mt-4 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black hover:bg-white/90"
                >
                  {t("Salva", "Save")}
                </button>
                {msg && <p className="mt-2 text-xs text-green-400">{msg}</p>}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-4 text-xs uppercase tracking-widest text-white/35">{t("Password", "Password")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    value={pwForm.old_password}
                    onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                    placeholder={t("Password attuale", "Current password")}
                    className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                  <input
                    type="password"
                    value={pwForm.new_password}
                    onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                    placeholder={t("Nuova password", "New password")}
                    className="w-full rounded-full border border-white/10 bg-transparent px-5 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-white/25"
                  />
                </div>
                <button
                  type="button"
                  onClick={changePassword}
                  className="mt-4 rounded-full bg-white/10 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  {t("Aggiorna password", "Update password")}
                </button>
                {pwMsg && <p className="mt-2 text-xs text-green-400">{pwMsg}</p>}
              </div>
            </div>
          )}

          {tab === "settings" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-4 text-xs uppercase tracking-widest text-white/35">{t("Tema", "Theme")}</p>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setUiTheme("dark")}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${uiTheme === "dark" ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-transparent text-white/70 hover:bg-white/5"}`}
                  >
                    <Moon className="h-4 w-4 opacity-70" />
                    {t("Scuro", "Dark")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUiTheme("light")}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm ${uiTheme === "light" ? "border-white/25 bg-white/10 text-white" : "border-white/10 bg-transparent text-white/70 hover:bg-white/5"}`}
                  >
                    <Sun className="h-4 w-4 opacity-70" />
                    {t("Chiaro", "Light")}
                  </button>
                </div>
                <p className="mt-3 text-xs text-white/45">
                  {t("Lo sfondo resta scuro: cambia solo lo stile delle caselle di input.", "Background stays dark: only input styling changes.")}
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-4 text-xs uppercase tracking-widest text-white/35">{t("Lingua", "Language")}</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setLang("it")}
                    className={`rounded-full px-4 py-2 text-sm ${lang === "it" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    Italiano
                  </button>
                  <button
                    type="button"
                    onClick={() => setLang("en")}
                    className={`rounded-full px-4 py-2 text-sm ${lang === "en" ? "bg-white text-black" : "bg-white/10 text-white hover:bg-white/20"}`}
                  >
                    English
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="mb-4 text-xs uppercase tracking-widest text-white/35">{t("Cookie", "Cookies")}</p>
                <button
                  type="button"
                  onClick={() => onOpenCookiePreferences?.()}
                  className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20"
                >
                  {t("Gestisci cookie", "Manage cookies")}
                </button>
              </div>
            </div>
          )}

          {tab === "usage" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <p className="text-xs uppercase tracking-widest text-white/35">{t("Regole crediti (provvisorio)", "Credit rules (temporary)")}</p>
                <ul className="mt-3 space-y-2 text-sm text-white/65">
                  <li>- {t("Piano Free: 180 crediti/mese.", "Free plan: 180 credits/month.")}</li>
                  <li>- {t("Costo: ~1 credito ogni 3 parole di input (minimo 1).", "Cost: ~1 credit per 3 input words (min 1).")}</li>
                  <li>- {t("Pro: crediti illimitati.", "Pro: unlimited credits.")}</li>
                </ul>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-widest text-white/35">{t("Creazioni", "Creations")}</p>
                  <button type="button" onClick={() => onReloadHistory?.()} className="text-xs text-white/50 hover:text-white">
                    {t("Aggiorna", "Refresh")}
                  </button>
                </div>
                <div className="mt-4">
                  {historyLoading ? (
                    <p className="text-sm text-white/35">{t("Caricamento…", "Loading…")}</p>
                  ) : history.length === 0 ? (
                    <p className="text-sm text-white/35">{t("Nessuna creazione ancora.", "No creations yet.")}</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {history.map((h) => (
                        <div key={h.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                          <p className="line-clamp-2 text-sm font-semibold text-white/85">{h.title || "—"}</p>
                          <p className="mt-1 text-xs text-white/35">{formatWhen(h.created_at)}</p>
                          {h.file_available ? (
                            <button
                              type="button"
                              onClick={() => onDownload?.(h.id)}
                              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#a8b4ff] hover:text-white"
                            >
                              <Download className="h-3.5 w-3.5" />
                              {t("Scarica PPT", "Download PPT")}
                            </button>
                          ) : (
                            <p className="mt-3 text-xs text-white/35">{t("File non più sul server", "File no longer on server")}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-white/35">
                {onOpenTerms && (
                  <button type="button" onClick={onOpenTerms} className="hover:text-white/70">
                    {lang === "it" ? "Termini di servizio" : "Terms of Service"}
                  </button>
                )}
                {onOpenPrivacy && (
                  <button type="button" onClick={onOpenPrivacy} className="ml-4 hover:text-white/70">
                    {lang === "it" ? "Privacy Policy" : "Privacy Policy"}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function PlansModal({ user, token, setUser, onClose, lang }) {
  const t = (it, en) => (lang === "it" ? it : en)
  const isLifetimePro = user?.lifetime_pro
  const isPro = user?.tier === "pro"
  const authConfig =
    token && token !== "cookie"
      ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
      : { withCredentials: true }

  const checkout = async () => {
    try {
      const res = await axios.post(`${API}/create-checkout-session`, { plan: "professional", interval: "month" }, authConfig)
      if (res.data?.url) window.location.href = res.data.url
    } catch {
      alert(t("Errore nel pagamento", "Payment error"))
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-md rounded-3xl border border-white/10 bg-[#111] p-8"
      >
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-xl font-bold">{t("Piani", "Plans")}</h2>
          <button type="button" onClick={onClose}>
            <X className="h-5 w-5 text-white/40 hover:text-white" />
          </button>
        </div>
        <div className="space-y-4">
          <div className={`rounded-2xl border p-6 ${!isPro ? "border-white/30" : "border-white/10"}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">{t("Piano Free", "Free plan")}</p>
              {!isPro && <span className="rounded-full bg-white/10 px-3 py-1 text-xs">{t("Attivo", "Active")}</span>}
            </div>
            <p className="mb-4 text-3xl font-bold">€0</p>
            <ul className="space-y-2 text-sm text-white/40">
              <li>✓ {t("180 crediti al mese", "180 credits/month")}</li>
              <li>✓ {t("PPT", "PPT")}</li>
              <li>✓ {t("Watermark VoiceMint", "VoiceMint watermark")}</li>
            </ul>
          </div>
          <div className={`rounded-2xl border p-6 ${isPro ? "border-white/30" : "border-white/10"}`}>
            <div className="mb-3 flex items-center justify-between">
              <p className="font-semibold">Pro</p>
              {isPro && (
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-black">
                  {isLifetimePro ? t("Pro a vita", "Lifetime Pro") : t("Attivo", "Active")}
                </span>
              )}
            </div>
            <p className="mb-4 text-3xl font-bold">
              €5<span className="text-sm font-normal text-white/30">/mese</span>
            </p>
            <ul className="mb-6 space-y-2 text-sm text-white/40">
              <li>✓ {t("Crediti illimitati", "Unlimited credits")}</li>
              <li>✓ {t("PPT", "PPT")}</li>
              <li>✓ {t("Senza watermark", "No watermark")}</li>
              <li>✓ {t("Supporto prioritario", "Priority support")}</li>
            </ul>
            {!isPro && (
              <button
                type="button"
                onClick={checkout}
                className="w-full rounded-full bg-white py-3 text-sm font-semibold text-black hover:bg-white/90"
              >
                {t("Passa a Pro →", "Upgrade to Pro →")}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
