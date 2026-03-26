import { Footer } from "@/components/ui/footer-section";

export default function FooterDemoPage() {
  return (
    <div className="relative flex min-h-svh flex-col text-white">
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="font-mono text-2xl font-bold">Scroll Down!</h1>
      </div>
      <Footer lang="en" onChangeLang={() => {}} />
    </div>
  );
}
