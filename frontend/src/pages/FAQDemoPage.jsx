import { FAQSection } from "@/components/ui/faqsection";

export default function FAQDemoPage() {
  const faqsLeft = [
    {
      question: "What makes this platform different?",
      answer:
        "Our platform combines AI-driven insights with human-centered design to help you build and scale digital experiences faster than ever.",
    },
    {
      question: "Can I use it for both personal and commercial projects?",
      answer:
        "Absolutely. You can use it freely for your personal projects, startups, or client work as long as you comply with our license terms.",
    },
    {
      question: "Does it support collaboration?",
      answer:
        "Yes, teams can collaborate in real-time using shared workspaces. You can invite members and manage permissions directly from your dashboard.",
    },
    {
      question: "How does the analytics system work?",
      answer:
        "We track anonymous performance metrics to help you understand usage trends and improve user experience. You have full control over data collection.",
    },
    {
      question: "Is there a mobile version available?",
      answer:
        "Yes, our mobile app offers key features such as notifications, dashboards, and workspace access for on-the-go productivity.",
    },
  ];

  const faqsRight = [
    {
      question: "How often are new updates released?",
      answer:
        "We roll out major updates every quarter, along with smaller improvements and bug fixes on a biweekly basis.",
    },
    {
      question: "Can I integrate it with external APIs?",
      answer:
        "Yes, the system provides REST and GraphQL APIs that make integration with third-party tools and custom workflows easy.",
    },
    {
      question: "Does the platform support dark mode?",
      answer:
        "Of course! You can toggle between light and dark themes, and your preference will be saved automatically across sessions.",
    },
    {
      question: "What happens if I lose my data?",
      answer:
        "All your data is backed up automatically every 24 hours. You can restore it from any previous snapshot in your account settings.",
    },
    {
      question: "Can I customize the UI components?",
      answer:
        "Yes, every component is built to be theme-aware and fully customizable using Tailwind CSS variables or your own design tokens.",
    },
  ];

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <a
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          ← VoiceMint
        </a>
      </div>
      <FAQSection
        title="Platform & Product Support"
        subtitle="Frequently Asked Questions"
        description="Everything you need to know about how our platform works, from setup and customization to integrations and updates."
        buttonLabel="See Full Help Center →"
        faqsLeft={faqsLeft}
        faqsRight={faqsRight}
      />
    </main>
  );
}
