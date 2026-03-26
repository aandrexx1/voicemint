"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FAQSection({
  title = "Product & Account Help",
  subtitle = "Frequently Asked Questions",
  description = "Get instant answers to the most common questions about your account, product setup, and updates.",
  buttonLabel = "Browse All FAQs →",
  onButtonClick,
  faqsLeft,
  faqsRight,
  className,
}) {
  return (
    <section className={cn("w-full max-w-5xl mx-auto py-16 px-4", className)}>
      <div className="text-center mb-10">
        <p className="text-sm text-muted-foreground font-medium tracking-wide mb-2">{subtitle}</p>
        <h2 className="text-3xl md:text-4xl font-semibold mb-3 text-foreground">{title}</h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-6">{description}</p>
        <Button variant="default" className="rounded-full" onClick={onButtonClick}>
          {buttonLabel}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
        {[faqsLeft, faqsRight].map((faqColumn, columnIndex) => (
          <Accordion key={columnIndex} type="single" collapsible className="space-y-4">
            {faqColumn.map((faq, i) => (
              <AccordionItem
                key={i}
                value={`item-${columnIndex}-${i}`}
                className="border-b border-white/10"
              >
                <AccordionTrigger className="text-base font-medium text-foreground hover:no-underline">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  <div className="min-h-[40px] transition-all duration-200 ease-in-out">{faq.answer}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ))}
      </div>
    </section>
  );
}
