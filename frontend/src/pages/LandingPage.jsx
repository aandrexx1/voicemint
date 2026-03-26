import { useTranslation } from "react-i18next"
import { HeroWave } from "../components/ui/ai-input-hero"
import { FAQSection } from "@/components/ui/faqsection"
import { Footer } from "@/components/ui/footer-section"
import axios from "axios"
import { PricingSection } from "@/components/ui/pricing"

const API = "https://voicemint-backend.onrender.com"

export default function LandingPage({ token, user, onGetStarted, onLogin, onOpenTerms, onOpenPrivacy, onOpenProfile }) {
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

  const pricingPlans = [
    {
      name: "Free Plan",
      price: "0",
      yearlyPrice: "0",
      period: "month",
      features: [
        "Up to  projects",
        "Basic analytics",
        "48-hour support response time",
        "Limited API access",
        "Community support",
      ],
      description: "Perfect for individuals and small projects.",
      buttonText: "Start Free Trial",
      href: "/",
    },
    {
      name: "Professional",
      price: "99",
      yearlyPrice: "79",
      period: "month",
      features: [
        "Unlimited projects",
        "Advanced analytics",
        "24-hour support response time",
        "Full API access",
        "Priority support & Team collaboration",
      ],
      description: "Ideal for growing teams and businesses.",
      buttonText: "Get Started",
      href: "/",
      isPopular: true,
    },
    {
      name: "Enterprise",
      price: "299",
      yearlyPrice: "239",
      period: "month",
      features: [
        "Everything in Professional",
        "Custom solutions & integrations",
        "Dedicated account manager",
        "SSO Authentication & Advanced security",
      ],
      description: "For large organizations with specific needs.",
      buttonText: "Contact Sales",
      href: "/",
    },
  ]

  return (
    <div className="relative min-h-screen w-full text-white">
      <div className="relative z-10">
        <HeroWave
          title={heroTitle}
          subtitle={t("hero_desc")}
          placeholder={i18n.language === "it" ? "Descrivi l'argomento..." : "Describe your topic..."}
          buttonText={i18n.language === "it" ? "Genera" : "Generate"}
          onLogin={onLogin}
          onGetStarted={onGetStarted}
          onProfile={onOpenProfile}
          isLoggedIn={!!token}
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

        <section id="pricing" className="scroll-mt-28">
          <PricingSection
            plans={pricingPlans}
            title={i18n.language === "it" ? "Trova il piano perfetto" : "Find the Perfect Plan"}
            description={
              i18n.language === "it"
                ? "Scegli la soluzione ideale per le tue esigenze e inizia oggi."
                : "Select the ideal package for your needs and start building today."
            }
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
