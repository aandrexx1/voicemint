"use client";

import { Button } from "@/components/ui/button";
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
}) {
  return (
    <div className="relative min-h-screen w-full bg-transparent text-foreground md:h-screen md:overflow-hidden">
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
