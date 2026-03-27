import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import { safeGetItem, safeSetItem } from "../lib/safe-storage"
import { LogOut, Eye, EyeOff } from "lucide-react"

const API = "https://voicemint-backend.onrender.com"

function formatDate(value) {
  if (!value) return ""
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString("it-IT", { year: "numeric", month: "short", day: "2-digit" })
}

export default function ProfilePage({ token, user, setUser, onLogout, onGoHome }) {
  const [lang, setLang] = useState(() => safeGetItem("lang", "it") || "it")
  const t = useMemo(() => (it, en) => (lang === "it" ? it : en), [lang])

  const [profileForm, setProfileForm] = useState({ first_name: "", last_name: "" })
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "" })
  const [msg, setMsg] = useState("")
  const [pwMsg, setPwMsg] = useState("")

  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)

  useEffect(() => {
    if (!user) return
    setProfileForm({
      first_name: user.first_name || "",
      last_name: user.last_name || "",
    })
    setPwForm({ old_password: "", new_password: "" })
  }, [user])

  const isFree = user?.tier === "free"
  const isStarter = user?.tier === "starter"
  const isPro = user?.tier === "pro"
  const isEnterprise = user?.tier === "enterprise"
  const isLifetimePro = !!user?.lifetime_pro
  const userInitial = (user?.username || user?.email || "U")[0].toUpperCase()

  const planLabel = isLifetimePro
    ? t("Lifetime Pro", "Lifetime Pro")
    : isEnterprise
      ? t("Enterprise", "Enterprise")
      : isStarter
        ? t("Starter", "Starter")
        : isPro
          ? t("Professional", "Professional")
          : t("Free", "Free")

  const canCancelSubscription =
    (isStarter || (isPro && !isLifetimePro)) && !isEnterprise

  const saveProfile = async () => {
    try {
      setMsg("")
      await axios.put(
        `${API}/me/profile`,
        profileForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setUser({ ...user, first_name: profileForm.first_name, last_name: profileForm.last_name })
      setMsg(t("Profilo aggiornato", "Profile updated"))
    } catch (err) {
      setMsg(err.response?.data?.detail || t("Errore nel salvataggio", "Save error"))
    }
  }

  const changePassword = async () => {
    try {
      setPwMsg("")
      await axios.put(
        `${API}/me/password`,
        pwForm,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setPwMsg(t("Password aggiornata", "Password updated"))
      setPwForm({ old_password: "", new_password: "" })
    } catch (err) {
      setPwMsg(err.response?.data?.detail || t("Errore nel cambio password", "Password change error"))
    }
  }

  const upgradeToPro = async () => {
    const res = await axios.post(
      `${API}/create-checkout-session`,
      { plan: "professional", interval: "month" },
      { headers: { Authorization: `Bearer ${token}` } }
    )
    if (res.data?.url) window.location.href = res.data.url
  }

  const cancelSubscription = async () => {
    if (!window.confirm(t("Sei sicuro di voler annullare l'abbonamento?", "Are you sure you want to cancel?"))) return
    try {
      await axios.delete(`${API}/me/subscription`, { headers: { Authorization: `Bearer ${token}` } })
      setUser({ ...user, tier: "free", lifetime_pro: false, pro_until: null })
    } catch (err) {
      alert(err.response?.data?.detail || t("Errore annullando l'abbonamento", "Error cancelling subscription"))
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-16 text-white">
        <div className="max-w-md text-center space-y-3">
          <h1 className="text-2xl font-bold">{t("Accesso richiesto", "Access required")}</h1>
          <p className="text-white/50 text-sm">{t("Devi accedere per vedere il profilo.", "You must log in to view your profile.")}</p>
          <button
            type="button"
            onClick={onLogout}
            className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 transition-all"
          >
            {t("Torna indietro", "Go back")}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#0a0a0a] text-white">
      {/* Navbar (stile Dashboard) */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-white/5 bg-[#0a0a0a]">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onGoHome}
            className="flex min-w-0 cursor-pointer items-center rounded-md py-1 -ml-1 pl-1 pr-2 hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label={t("Torna alla home", "Back to home")}
          >
            <img
              src="/text_logo.png"
              alt="VoiceMint"
              className="h-7 w-auto max-w-[200px] cursor-pointer object-contain object-left"
            />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Lang switcher */}
          <div className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => {
                setLang("it")
                safeSetItem("lang", "it")
              }}
              className={lang === "it" ? "text-white" : "text-white/30 hover:text-white transition-all"}
            >
              IT
            </button>
            <span className="text-white/20">|</span>
            <button
              type="button"
              onClick={() => {
                setLang("en")
                safeSetItem("lang", "en")
              }}
              className={lang === "en" ? "text-white" : "text-white/30 hover:text-white transition-all"}
            >
              EN
            </button>
          </div>

          <span className="hidden md:inline-flex items-center px-3 py-2 text-xs font-semibold rounded-full border border-white/10 bg-white/[0.02]">
            {t("Profilo", "Profile")}
          </span>

          <button
            type="button"
            onClick={onLogout}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/60 hover:text-white transition-colors rounded-full border border-white/10 bg-white/[0.02]"
          >
            <LogOut className="w-4 h-4" />
            {t("Esci", "Log out")}
          </button>
        </div>
      </nav>

      {/* Layout con sidebar */}
      <div className="flex-1 flex">
        <aside className="w-64 border-r border-white/5 flex flex-col p-6 fixed h-full pt-10">
          <div className="border-t border-white/5 pt-8">
            <p className="text-white/20 text-xs uppercase tracking-widest mb-4">{t("Profilo", "Profile")}</p>
            <div className="flex w-full items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white text-center">
              {t("Account", "Account")}
            </div>
          </div>
        </aside>

        <main className="ml-64 flex-1 p-10">
          <div className="max-w-3xl space-y-10 pb-20">
            {/* Account info */}
            <section className="border border-white/10 rounded-3xl bg-white/[0.02] p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 mb-6">
                {t("Account", "Account")}
              </h2>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xl font-semibold">
                  {userInitial}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-semibold">{user?.username}</p>
                    <span className="inline-flex items-center px-4 py-1 rounded-full border border-green-400/20 bg-green-400/10 text-green-400 text-xs font-semibold">
                      {planLabel}
                    </span>
                  </div>
                  <p className="text-white/60 text-sm">{user?.email}</p>
                  {isPro && !isLifetimePro ? (
                    <p className="text-white/50 text-sm">
                      {t("Scade", "Expires")}: {formatDate(user?.pro_until)}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>

            {/* Personal info */}
            <section className="border border-white/10 rounded-3xl bg-white/[0.02] p-6">
              <div className="flex items-center justify-between gap-4 mb-6">
                <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40">
                  {t("Dati personali", "Personal info")}
                </h2>
              </div>

              <div className="space-y-3">
                <input
                  className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
                  placeholder={t("Nome", "First name")}
                  value={profileForm.first_name}
                  onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                />
                <input
                  className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all"
                  placeholder={t("Cognome", "Last name")}
                  value={profileForm.last_name}
                  onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
                />
                <button
                  type="button"
                  onClick={saveProfile}
                  className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 transition-all"
                >
                  {t("Salva profilo", "Save profile")}
                </button>
                {msg ? <p className="text-green-400 text-xs text-center">{msg}</p> : null}
              </div>
            </section>

            {/* Security */}
            <section className="border border-white/10 rounded-3xl bg-white/[0.02] p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 mb-6">
                {t("Sicurezza", "Security")}
              </h2>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">{t("Password attuale", "Current password")}</label>
                  <div className="relative">
                    <input
                      type={showCurrentPw ? "text" : "password"}
                      value={pwForm.old_password}
                      onChange={(e) => setPwForm({ ...pwForm, old_password: e.target.value })}
                      className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPw((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      aria-label={showCurrentPw ? t("Nascondi", "Hide") : t("Mostra", "Show")}
                    >
                      {showCurrentPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-white/60">{t("Nuova password", "New password")}</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={pwForm.new_password}
                      onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
                      className="w-full bg-transparent border border-white/10 text-white rounded-full px-5 py-3 text-sm outline-none placeholder-white/20 focus:border-white/30 transition-all pr-12"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw((s) => !s)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                      aria-label={showNewPw ? t("Nascondi", "Hide") : t("Mostra", "Show")}
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={changePassword}
                  className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 transition-all"
                >
                  {t("Cambia password", "Change password")}
                </button>
                {pwMsg ? <p className="text-green-400 text-xs text-center">{pwMsg}</p> : null}
              </div>
            </section>

            {/* Subscription */}
            <section className="border border-white/10 rounded-3xl bg-white/[0.02] p-6">
              <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-white/40 mb-6">
                {t("Abbonamento", "Subscription")}
              </h2>

              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center px-4 py-1 rounded-full border border-white/10 bg-white/[0.03] text-white/70 text-xs font-semibold">
                    {t("Piano attuale", "Current plan")}: {planLabel}
                  </span>
                </div>

                {isFree ? (
                  <button
                    type="button"
                    onClick={upgradeToPro}
                    className="w-full bg-white text-black font-semibold py-3 rounded-full text-sm hover:bg-white/90 transition-all"
                  >
                    {t("Upgrade a Pro →", "Upgrade to Pro →")}
                  </button>
                ) : null}

                {canCancelSubscription ? (
                  <button
                    type="button"
                    onClick={cancelSubscription}
                    className="w-full border border-red-400/30 text-red-300 font-semibold py-3 rounded-full text-sm hover:border-red-400/50 hover:text-red-200 transition-all"
                  >
                    {t("Annulla abbonamento", "Cancel subscription")}
                  </button>
                ) : null}

                {isPro && isLifetimePro ? (
                  <p className="text-white/50 text-sm">
                    {t("Hai Pro a vita.", "You have Lifetime Pro.")}
                  </p>
                ) : null}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

