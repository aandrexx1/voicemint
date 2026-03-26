import { useState } from "react"
import { useTranslation } from "react-i18next"
import axios from "axios"

const API = "https://voicemint-backend.onrender.com"

export default function ContactSalesPage({ onBack }) {
  const { t } = useTranslation()
  const [workEmail, setWorkEmail] = useState("")
  const [topic, setTopic] = useState("")
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setStatus(null)
    setSubmitting(true)
    try {
      await axios.post(`${API}/contact-sales`, {
        work_email: workEmail.trim(),
        topic,
      })
      setStatus("ok")
      setWorkEmail("")
      setTopic("")
    } catch {
      setStatus("err")
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    "w-full rounded-md border border-white/15 bg-[#1a1915] px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors focus:border-white/35"

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-xl px-6 pb-24 pt-8 md:px-8 md:pt-12">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-white/50 transition-colors hover:text-white"
        >
          ← {t("legal_back")}
        </button>

        <h1 className="mt-10 text-3xl font-semibold tracking-tight md:text-[2rem] md:leading-tight">
          {t("contact_sales_title")}
        </h1>

        <form onSubmit={submit} className="mt-10 space-y-8 text-left">
          <div>
            <label htmlFor="work-email" className="block text-sm font-medium text-white">
              {t("contact_sales_work_email")} <span className="text-red-500">*</span>
            </label>
            <input
              id="work-email"
              name="work_email"
              type="email"
              autoComplete="email"
              required
              value={workEmail}
              onChange={(e) => setWorkEmail(e.target.value)}
              className={`${inputClass} mt-2`}
            />
          </div>

          <div>
            <label htmlFor="topic" className="block text-sm font-medium text-white">
              {t("contact_sales_topic")} <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-2">
              <select
                id="topic"
                name="topic"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className={`${inputClass} appearance-none pr-10`}
              >
                <option value="" disabled>
                  {t("contact_sales_topic_ph")}
                </option>
                <option value="enterprise">{t("contact_sales_topic_enterprise")}</option>
                <option value="support">{t("contact_sales_topic_support")}</option>
                <option value="partnership">{t("contact_sales_topic_partnership")}</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/40">▾</span>
            </div>
          </div>

          {status === "ok" && (
            <p className="text-sm text-emerald-400/90">{t("contact_sales_success")}</p>
          )}
          {status === "err" && (
            <p className="text-sm text-red-400/90">{t("contact_sales_error")}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-white py-3 text-sm font-semibold text-[#12110e] transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "…" : t("contact_sales_submit")}
          </button>
        </form>
      </div>
    </div>
  )
}
