import { useState, useEffect } from "react"
import axios from "axios"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { MinimalAuthPage } from "@/components/ui/minimal-auth-page"

const API = "https://voicemint-backend.onrender.com"

const inputClass =
  "flex h-11 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"

export default function AuthPage({ setToken, setUser, onBack, defaultLogin, onOpenTerms, onOpenPrivacy }) {
  const { t, i18n } = useTranslation()
  const [isLogin, setIsLogin] = useState(defaultLogin ?? false)
  const [form, setForm] = useState({ email: "", username: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState("")

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  useEffect(() => {
    const code = sessionStorage.getItem("oauth_error")
    if (!code) return
    sessionStorage.removeItem("oauth_error")
    setError(t(`auth_oauth_${code}`, { defaultValue: t("auth_oauth_generic") }))
  }, [t])

  const submit = async () => {
    setLoading(true)
    setError("")
    try {
      const endpoint = isLogin ? "/login" : "/register"
      const payload = isLogin
        ? { email: form.email, password: form.password }
        : { email: form.email, username: form.username, password: form.password }

      const res = await axios.post(`${API}${endpoint}`, payload)
      setToken(res.data.token)
      setUser({
        username: res.data.username,
        tier: res.data.tier,
        lifetime_pro: res.data.lifetime_pro,
        registration_number: res.data.registration_number,
      })
    } catch (err) {
      setError(err.response?.data?.detail || t("auth_error_connection"))
    } finally {
      setLoading(false)
    }
  }

  const footer = (
    <p>
      {t("auth_terms_prefix")}{" "}
      <button
        type="button"
        onClick={onOpenTerms}
        className="text-foreground underline underline-offset-4 hover:text-primary"
      >
        {t("auth_terms_link")}
      </button>{" "}
      {t("auth_terms_and")}{" "}
      <button
        type="button"
        onClick={onOpenPrivacy}
        className="text-foreground underline underline-offset-4 hover:text-primary"
      >
        {t("auth_privacy_link")}
      </button>
      .
    </p>
  )

  const requestReset = async () => {
    const email = form.email?.trim()
    if (!email) {
      setError(i18n.language === "it" ? "Inserisci una email" : "Enter your email")
      return
    }

    setForgotLoading(true)
    setForgotMessage("")
    try {
      await axios.post(`${API}/forgot-password`, { email })
      setForgotMessage(
        i18n.language === "it"
          ? "Email inviata. Controlla la tua inbox."
          : "Email sent. Check your inbox."
      )
    } catch (err) {
      setForgotMessage(
        i18n.language === "it"
          ? "Errore invio email. Riprova più tardi."
          : "Error sending email. Try again later."
      )
    } finally {
      setForgotLoading(false)
    }
  }

  return (
    <MinimalAuthPage
      onBack={onBack}
      homeLabel={t("auth_home")}
      title={isLogin ? t("auth_title_login") : t("auth_title_register")}
      subtitle={isLogin ? t("auth_subtitle_login") : t("auth_subtitle_register")}
      googleLabel={t("auth_google")}
      githubLabel={t("auth_github")}
      orEmailLabel={t("auth_or_email")}
      onGoogleClick={() => {
        window.location.href = `${API}/auth/google/login`
      }}
      onGithubClick={() => {
        window.location.href = `${API}/auth/github/login`
      }}
      footer={footer}
    >
      <div className="space-y-3">
        <div className="space-y-1.5">
          <label htmlFor="auth-email" className="text-xs font-medium text-muted-foreground">
            {t("auth_email")}
          </label>
          <input
            id="auth-email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={t("auth_email_ph")}
            value={form.email}
            onChange={handle}
            className={inputClass}
          />
        </div>

        {!isLogin && (
          <div className="space-y-1.5">
            <label htmlFor="auth-username" className="text-xs font-medium text-muted-foreground">
              {t("auth_username")}
            </label>
            <input
              id="auth-username"
              name="username"
              autoComplete="username"
              placeholder={t("auth_username_ph")}
              value={form.username}
              onChange={handle}
              className={inputClass}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <label htmlFor="auth-password" className="text-xs font-medium text-muted-foreground">
            {t("auth_password")}
          </label>
          <input
            id="auth-password"
            name="password"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            placeholder={t("auth_password_ph")}
            value={form.password}
            onChange={handle}
            className={inputClass}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit()
            }}
          />
        </div>

        {isLogin && (
          <div className="space-y-2">
            <button
              type="button"
              onClick={requestReset}
              disabled={forgotLoading}
              className="text-left text-xs text-white/60 hover:text-white transition-colors underline underline-offset-4"
            >
              {i18n.language === "it" ? "Password dimenticata?" : "Forgot password?"}
            </button>
            {forgotMessage ? (
              <p className="text-xs text-white/50">{forgotMessage}</p>
            ) : null}
          </div>
        )}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button type="button" size="lg" className="mt-2 w-full" disabled={loading} onClick={submit}>
        {loading ? t("auth_loading") : isLogin ? t("auth_submit_login") : t("auth_submit_register")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? t("auth_toggle_no_account") : t("auth_toggle_has_account")}{" "}
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin)
            setError("")
          }}
          className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {isLogin ? t("auth_toggle_to_register") : t("auth_toggle_to_login")}
        </button>
      </p>
    </MinimalAuthPage>
  )
}
