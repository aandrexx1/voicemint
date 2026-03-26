"use client";

import { Button } from "@/components/ui/button";
import { Particles } from "@/components/ui/particles";
import { ChevronLeftIcon, GithubIcon } from "lucide-react";

function GoogleIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <g>
        <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
      </g>
    </svg>
  );
}

export function MinimalAuthPage({
  onBack,
  homeLabel = "Home",
  title,
  subtitle,
  googleLabel = "Continue with Google",
  githubLabel = "Continue with GitHub",
  orEmailLabel = "or with email",
  socialDisabledTitle = "",
  children,
  footer,
  particleColor = "#666666",
}) {
  return (
    <div className="relative min-h-screen w-full md:h-screen md:overflow-hidden bg-background text-foreground">
      <Particles color={particleColor} quantity={120} ease={20} className="absolute inset-0" />
      <div aria-hidden className="absolute inset-0 isolate -z-10 contain-strict">
        <div className="absolute top-0 left-0 h-[320px] w-[140px] -translate-y-[35%] -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,rgba(255,255,255,0.06)_0,hsla(0,0%,55%,0.02)_50%,rgba(255,255,255,0.02)_80%)]" />
        <div className="absolute top-0 left-0 h-[320px] w-[60px] translate-x-[5%] -translate-y-1/2 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)]" />
        <div className="absolute top-0 left-0 h-[320px] w-[60px] -translate-y-[35%] -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,rgba(255,255,255,0.04)_0,rgba(255,255,255,0.01)_80%,transparent_100%)]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-4 py-16 md:py-0">
        <Button type="button" variant="ghost" className="absolute top-4 left-4" onClick={onBack}>
          <ChevronLeftIcon className="me-1 size-4" />
          {homeLabel}
        </Button>

        <div className="mx-auto w-full max-w-sm space-y-4 sm:w-sm">
          <div className="flex items-center">
            <img
              src="/text_logo.png"
              alt="VoiceMint"
              className="h-8 w-auto max-w-[220px] object-contain object-left opacity-95"
            />
          </div>

          <div className="flex flex-col space-y-1">
            <h1 className="font-heading text-2xl font-bold tracking-wide">{title}</h1>
            <p className="text-base text-muted-foreground">{subtitle}</p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              size="lg"
              className="w-full"
              disabled
              title={socialDisabledTitle}
            >
              <GoogleIcon className="me-2 size-4" />
              {googleLabel}
            </Button>
            <Button
              type="button"
              size="lg"
              variant="outline"
              className="w-full"
              disabled
              title={socialDisabledTitle}
            >
              <GithubIcon strokeWidth={2.5} className="me-2 size-4" />
              {githubLabel}
            </Button>
          </div>

          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center" aria-hidden>
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-background px-3 text-muted-foreground">{orEmailLabel}</span>
            </div>
          </div>

          {children}

          {footer != null ? (
            <div className="pt-6 text-sm text-muted-foreground">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
