"use client";

import { motion, useReducedMotion } from "motion/react";
import { FacebookIcon, FrameIcon, InstagramIcon, LinkedinIcon, YoutubeIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

const footerLinks = {
  product: [
    { titleKey: "footer_product_features", href: "pricing" },
    { titleKey: "footer_product_pricing", href: "pricing" },
    { titleKey: "footer_product_integration", href: "pricing" },
  ],
  social: [
    { title: "Facebook", href: "#", icon: FacebookIcon },
    { title: "Instagram", href: "#", icon: InstagramIcon },
    { title: "YouTube", href: "#", icon: YoutubeIcon },
    { title: "LinkedIn", href: "#", icon: LinkedinIcon },
  ],
};

export function Footer({ onLogin, onOpenTerms, onOpenPrivacy, lang, onChangeLang }) {
  const { t } = useTranslation();

  const resolveAction = (action) => {
    if (action === "terms" && onOpenTerms) return onOpenTerms;
    if (action === "privacy" && onOpenPrivacy) return onOpenPrivacy;
    return null;
  };

  const scrollToId = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState({}, "", window.location.pathname);
  };

  return (
    <footer className="relative mx-auto flex w-full max-w-6xl flex-col items-center justify-center rounded-t-4xl border-t border-white/10 bg-[radial-gradient(35%_128px_at_50%_0%,theme(backgroundColor.white/8%),transparent)] px-6 py-12 md:rounded-t-6xl lg:py-16">
      <div className="bg-foreground/20 absolute top-0 left-1/2 h-px w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full blur" />

      <div className="grid w-full gap-10 xl:grid-cols-3 xl:gap-8">
        <AnimatedContainer className="space-y-4">
          <FrameIcon className="size-8 text-white/90" />
          <p className="mt-8 max-w-xs text-sm text-white/50 md:mt-0">{t("footer_tagline")}</p>
          <button
            type="button"
            onClick={onLogin}
            className="rounded-full border border-white/15 px-4 py-2 text-xs text-white/80 transition-colors hover:border-white/40 hover:text-white"
          >
            {t("footer_link_login")}
          </button>
        </AnimatedContainer>

        <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-3 xl:col-span-2 xl:mt-0">
          <AnimatedContainer delay={0.2}>
            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-white/50">{t("footer_column_product")}</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/65">
                {footerLinks.product.map((link) => (
                  <li key={link.titleKey}>
                    <button
                      type="button"
                      onClick={() => scrollToId(link.href)}
                      className="inline-flex items-center transition-colors hover:text-white"
                    >
                      {t(link.titleKey)}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedContainer>

          <AnimatedContainer delay={0.3}>
            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-white/50">{t("footer_column_social")}</h3>
              <ul className="mt-4 space-y-2 text-sm text-white/65">
                {footerLinks.social.map((link) => (
                  <li key={link.title}>
                    <a href={link.href} className="inline-flex items-center gap-2 transition-colors hover:text-white">
                      {link.icon ? <link.icon className="size-4" /> : null}
                      {link.title}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-6 space-y-2 text-sm text-white/65">
                <button
                  type="button"
                  onClick={onOpenTerms}
                  className="inline-flex items-center transition-colors hover:text-white"
                >
                  {t("footer_link_terms")}
                </button>
                <button
                  type="button"
                  onClick={onOpenPrivacy}
                  className="inline-flex items-center transition-colors hover:text-white"
                >
                  {t("footer_link_privacy")}
                </button>
              </div>
            </div>
          </AnimatedContainer>

          <AnimatedContainer delay={0.4} className="col-span-2 md:col-span-1 md:justify-self-end">
            <div>
              <h3 className="text-xs uppercase tracking-[0.18em] text-white/50">
                {lang === "it" ? "Lingua" : "Language"}
              </h3>
              <div className="mt-4 inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.04] p-1">
                <button
                  type="button"
                  onClick={() => onChangeLang?.("it")}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    lang === "it" ? "bg-white text-black shadow-sm" : "text-white/55 hover:text-white"
                  }`}
                >
                  IT
                </button>
                <button
                  type="button"
                  onClick={() => onChangeLang?.("en")}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${
                    lang === "en" ? "bg-white text-black shadow-sm" : "text-white/55 hover:text-white"
                  }`}
                >
                  EN
                </button>
              </div>
            </div>
          </AnimatedContainer>
        </div>
      </div>

      <div className="mt-12 flex w-full flex-col items-start justify-between gap-3 border-t border-white/10 pt-6 text-xs text-white/35 sm:flex-row sm:items-center">
        <p>{t("footer")}</p>
        <p>{t("hero_tag")}</p>
      </div>
    </footer>
  );
}

function AnimatedContainer({ className, delay = 0.1, children }) {
  const shouldReduceMotion = useReducedMotion();
  if (shouldReduceMotion) return <div className={className}>{children}</div>;

  return (
    <motion.div
      initial={{ filter: "blur(4px)", translateY: -8, opacity: 0 }}
      whileInView={{ filter: "blur(0px)", translateY: 0, opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.8 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
