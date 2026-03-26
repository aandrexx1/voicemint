import { MinimalAuthPage } from "@/components/ui/minimal-auth-page";

export default function MinimalAuthDemoPage() {
  return (
    <MinimalAuthPage
      onBack={() => {
        window.location.href = "/";
      }}
      homeLabel="Home"
      title="Sign In or Join Now!"
      subtitle="Login or create your VoiceMint account."
      googleLabel="Continue with Google"
      githubLabel="Continue with GitHub"
      orEmailLabel="or with email"
      socialDisabledTitle="Coming soon"
      footer={
        <p>
          By continuing you agree to our{" "}
          <a href="#" className="text-foreground underline underline-offset-4 hover:text-primary">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="text-foreground underline underline-offset-4 hover:text-primary">
            Privacy Policy
          </a>
          .
        </p>
      }
    >
      <p className="text-sm text-muted-foreground">Demo shell — wire your form in AuthPage.</p>
    </MinimalAuthPage>
  );
}
