import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { HeroWave } from "../components/ui/ai-input-hero"
import { Navbar } from "../components/ui/mini-navbar"
import { FAQSection } from "@/components/ui/faqsection"
import { Footer } from "@/components/ui/footer-section"
import axios from "axios"
import { safeSetItem } from "../lib/safe-storage"
import { PricingSection } from "@/components/ui/pricing"

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

export default function LandingPage({
  token,
  user,
  onGetStarted,
  onLogin,
  onOpenTerms,
  onOpenPrivacy,
  onOpenProfile,
  onContactSales,
}) {
  const { t, i18n } = useTranslation()
  const isAuthed = !!user || !!token

  const changeLang = (lang) => {
    i18n.changeLanguage(lang)
    safeSetItem("lang", lang)
  }

  const words = t("words", { returnObjects: true })
  const heroWord = Array.isArray(words) ? words[0] : "PowerPoint"
  const heroTitle = `${t("hero_title_1")} ${t("hero_title_2")} ${heroWord}.`

  const faqsLeft = [
    { question: t("faq_1_q"), answer: t("faq_1_a") },
    { question: t("faq_2_q"), answer: t("faq_2_a") },
  ]
  const faqsRight = [
    { question: t("faq_3_q"), answer: t("faq_3_a") },
    { question: t("faq_4_q"), answer: t("faq_4_a") },
  ]

  const howItWorksBullets = t("how_it_works_bullets", { returnObjects: true })
  const howBullets = Array.isArray(howItWorksBullets) ? howItWorksBullets : []

  const pricingPlans = useMemo(() => {
    const sf = t("pricing_starter_features", { returnObjects: true })
    const pf = t("pricing_pro_features", { returnObjects: true })
    const ef = t("pricing_enterprise_features", { returnObjects: true })
    return [
      {
        name: t("pricing_plan_starter_name"),
        checkoutPlan: "starter",
        price: "2.99",
        yearlyPrice: "28",
        period: "month",
        features: Array.isArray(sf) ? sf : [],
        description: t("pricing_plan_starter_desc"),
        buttonText: t("pricing_plan_starter_cta"),
        href: "#",
      },
      {
        name: t("pricing_plan_pro_name"),
        checkoutPlan: "professional",
        price: "4.99",
        yearlyPrice: "47.99",
        period: "month",
        features: Array.isArray(pf) ? pf : [],
        description: t("pricing_plan_pro_desc"),
        buttonText: t("pricing_plan_pro_cta"),
        href: "#",
        isPopular: true,
      },
      {
        name: t("pricing_plan_enterprise_name"),
        price: "Custom",
        yearlyPrice: "Custom",
        period: "month",
        features: Array.isArray(ef) ? ef : [],
        description: t("pricing_plan_enterprise_desc"),
        buttonText: t("pricing_plan_enterprise_cta"),
        contactPath: "/contact-sales",
      },
    ]
  }, [t, i18n.language])

  const pricingUiLabels = useMemo(
    () => ({
      monthly: t("pricing_toggle_monthly"),
      annual: t("pricing_toggle_annual"),
      saveAnnual: t("pricing_save_annual"),
      billedMonthly: t("pricing_billed_monthly"),
      billedAnnually: t("pricing_billed_annually"),
      mostPopular: t("pricing_most_popular"),
      priceCustom: t("pricing_price_custom"),
      periodMonth: t("pricing_period_month"),
    }),
    [t, i18n.language]
  )

  const handlePricingPlan = async (plan, { interval }) => {
    if (plan.contactPath) {
      window.history.pushState({}, "", plan.contactPath)
      onContactSales?.()
      return
    }
    if (!plan.checkoutPlan) return
    if (!isAuthed) {
      onGetStarted()
      return
    }
    try {
      const config =
        token && token !== "cookie"
          ? { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
          : { withCredentials: true }
      const res = await axios.post(`${API}/create-checkout-session`, { plan: plan.checkoutPlan, interval }, config)
      if (res.data?.url) window.location.href = res.data.url
    } catch (e) {
      alert(t("alert_checkout_error"))
    }
  }

  return (
    <div className="relative min-h-screen w-full text-white">
      <Navbar
        onLogin={onLogin}
        onSignup={onGetStarted}
        onProfile={onOpenProfile}
        isLoggedIn={isAuthed}
        navLabels={{
          howItWorks: t("nav_how_it_works"),
          faq: t("nav_faq"),
          profile: t("nav_profile"),
          login: t("footer_link_login"),
          signup: t("free_cta"),
        }}
      />
      <div className="relative z-10">
        <HeroWave
          title={heroTitle}
          subtitle={t("hero_desc")}
          placeholder={i18n.language === "it" ? "Descrivi l'argomento..." : "Describe your topic..."}
          buttonText={t("hero_generate")}
          onPromptSubmit={async (prompt, deckMode = "presentation") => {
            const text = (prompt || "").trim()
            if (!text) return
            if (!isAuthed) {
              onGetStarted()
              return
            }
            try {
              const config =
                token && token !== "cookie"
                  ? { headers: { Authorization: `Bearer ${token}` }, responseType: "blob", withCredentials: true }
                  : { responseType: "blob", withCredentials: true }
              const res = await axios.post(
                `${API}/generate`,
                { transcription: text, output_type: "ppt", deck_mode: deckMode },
                config
              )
              const url = URL.createObjectURL(res.data)
              const a = document.createElement("a")
              a.href = url
              a.download = filenameFromContentDisposition(res.headers?.["content-disposition"]) || "voicemint.pptx"
              a.click()
              URL.revokeObjectURL(url)
            } catch (e) {
              throw e
            }
          }}
        />

        <section
          id="how-it-works"
          className="scroll-mt-28 border-t border-white/10 bg-transparent py-16 md:py-24"
        >
          <div className="mx-auto max-w-5xl px-4 md:px-6">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-white/45">
              {t("how_it_works_eyebrow")}
            </p>
            <h2 className="mt-3 text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("how_it_works_title")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-white/60 md:text-lg">
              {t("how_it_works_intro")}
            </p>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 sm:gap-6">
              {howBullets.map((text, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-6 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)] transition duration-300 hover:border-white/15 hover:from-white/[0.08] md:p-7"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sm font-bold tabular-nums text-white/90">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-white/25 to-transparent" aria-hidden />
                  </div>
                  <p className="text-[15px] leading-relaxed text-white/[0.88] md:text-base">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28">
          <PricingSection
            plans={pricingPlans}
            title={t("pricing_landing_title")}
            description={t("pricing_landing_desc")}
            uiLabels={pricingUiLabels}
            onPlanButtonClick={handlePricingPlan}
          />
        </section>

        <section id="faq" className="scroll-mt-28 border-t border-white/10 py-8 md:py-12">
          <FAQSection
            className="py-12 md:py-16"
            title={t("faq_section_title")}
            subtitle={t("faq_tag")}
            description={t("faq_section_desc")}
            buttonLabel={t("faq_cta")}
            onButtonClick={onGetStarted}
            faqsLeft={faqsLeft}
            faqsRight={faqsRight}
          />
        </section>

        <Footer
          onLogin={onLogin}
          onOpenTerms={onOpenTerms}
          onOpenPrivacy={onOpenPrivacy}
          lang={i18n.language}
          onChangeLang={changeLang}
        />
      </div>
    </div>
  )
}
