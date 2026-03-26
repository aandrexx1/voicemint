import { useTranslation } from "react-i18next"
import { HeroWave } from "../components/ui/ai-input-hero"
import { Navbar } from "../components/ui/mini-navbar"
import { FAQSection } from "@/components/ui/faqsection"
import { Footer } from "@/components/ui/footer-section"
import axios from "axios"
import { PricingSection } from "@/components/ui/pricing"
import { Check } from "lucide-react"

const API = "https://voicemint-backend.onrender.com"

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

  const changeLang = (lang) => {
    i18n.changeLanguage(lang)
    localStorage.setItem("lang", lang)
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

  const pricingPlans = [
    {
      name: "Starter",
      checkoutPlan: "starter",
      price: "2.99",
      yearlyPrice: "28",
      period: "month",
      features: [
        "Up to 15 presentations / month",
        "Standard PowerPoint Generation",
        "Standard Templates",
        "Export to PPT",
        "With Voicemint watermark",
      ],
      description: "Perfect for studends and occasional creators.",
      buttonText: "Start Free Trial",
      href: "#",
    },
    {
      name: "Professional",
      checkoutPlan: "professional",
      price: "4.99",
      yearlyPrice: "47.99",
      period: "month",
      features: [
        "Unlimited presentations",
        "Advanced AI Engine (Faster & Smarter)",
        "Premium Templates & Custom Branding",
        "White-label (No watermark)",
        "Priority support",
      ],
      description: "Ideal for consultants, marketers, and professionals.",
      buttonText: "Get Started",
      href: "#",
      isPopular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      yearlyPrice: "Custom",
      period: "month",
      features: [
        "Everything in Professional",
        "Collaborative Team Workspaces",
        "Custom AI style & templates integration",
        "SSO Authentication & Advanced security",
      ],
      description: "Tailored solutions for large teams and organizations.",
      buttonText: "Contact Sales",
      contactPath: "/contact-sales",
    },
  ]

  const handlePricingPlan = async (plan, { interval }) => {
    if (plan.contactPath) {
      window.history.pushState({}, "", plan.contactPath)
      onContactSales?.()
      return
    }
    if (!plan.checkoutPlan) return
    if (!token) {
      onGetStarted()
      return
    }
    try {
      const res = await axios.post(
        `${API}/create-checkout-session`,
        { plan: plan.checkoutPlan, interval },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (res.data?.url) window.location.href = res.data.url
    } catch (e) {
      alert(
        i18n.language === "it"
          ? "Impossibile avviare il pagamento. Riprova o controlla la configurazione Stripe."
          : "Could not start checkout. Try again or verify Stripe configuration."
      )
    }
  }

  return (
    <div className="relative min-h-screen w-full text-white">
      <Navbar
        onLogin={onLogin}
        onSignup={onGetStarted}
        onProfile={onOpenProfile}
        isLoggedIn={!!token}
      />
      <div className="relative z-10">
        <HeroWave
          title={heroTitle}
          subtitle={t("hero_desc")}
          placeholder={i18n.language === "it" ? "Descrivi l'argomento..." : "Describe your topic..."}
          buttonText={i18n.language === "it" ? "Genera" : "Generate"}
          onPromptSubmit={async (prompt) => {
            const text = (prompt || "").trim()
            if (!text) return
            if (!token) {
              onGetStarted()
              return
            }
            try {
              const res = await axios.post(
                `${API}/generate?transcription=${encodeURIComponent(text)}&output_type=ppt`,
                {},
                { headers: { Authorization: `Bearer ${token}` }, responseType: "blob" }
              )
              const url = URL.createObjectURL(res.data)
              const a = document.createElement("a")
              a.href = url
              a.download = "voicemint.pptx"
              a.click()
              URL.revokeObjectURL(url)
            } catch (e) {
              alert(i18n.language === "it" ? "Errore nella generazione" : "Generation error")
            }
          }}
        />

        <section id="how-it-works" className="scroll-mt-28 border-t border-white/10 py-12 md:py-20">
          <div className="mx-auto max-w-3xl px-4 md:px-6">
            <h2 className="text-center text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {t("how_it_works_title")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-center text-base leading-relaxed text-white/65 md:text-lg">
              {t("how_it_works_intro")}
            </p>
            <ul className="mt-10 space-y-5 md:space-y-6">
              {howBullets.map((text, i) => (
                <li key={i} className="flex gap-4 text-left">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-primary">
                    <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden />
                  </span>
                  <span className="text-[15px] leading-relaxed text-white/85 md:text-base">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section id="pricing" className="scroll-mt-28">
          <PricingSection
            plans={pricingPlans}
            title={i18n.language === "it" ? "Trova il piano perfetto" : "Find the Perfect Plan"}
            description={
              i18n.language === "it"
                ? "Scegli la soluzione ideale per le tue esigenze e inizia oggi."
                : "Select the ideal package for your needs and start building today."
            }
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
