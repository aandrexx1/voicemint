"use client";;
import { motion } from "framer-motion";
import React, {
  useState,
  useRef,
  useEffect,
  createContext,
  useContext,
} from "react";
import confetti from "canvas-confetti";
import { Check, Star as LucideStar } from "lucide-react";
import NumberFlow from "@number-flow/react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// --- UTILITY FUNCTIONS ---

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function useMediaQuery(query) {
  const [value, setValue] = useState(false);

  useEffect(() => {
    function onChange(event) {
      setValue(event.matches);
    }

    const result = matchMedia(query);
    result.addEventListener("change", onChange);
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}

// --- BASE UI COMPONENTS (BUTTON) ---

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
});
Button.displayName = "Button";

const DEFAULT_PRICING_UI = {
  monthly: "Monthly",
  annual: "Annual",
  saveAnnual: "(Save 20%)",
  billedMonthly: "Billed Monthly",
  billedAnnually: "Billed Annually",
  mostPopular: "Most Popular",
  priceCustom: "Custom",
  periodMonth: "month",
};

// Context for state management
const PricingContext = createContext({
  isMonthly: true,
  setIsMonthly: () => {},
  uiLabels: DEFAULT_PRICING_UI,
});

// Main PricingSection Component
export function PricingSection({
  plans,
  title = "Simple, Transparent Pricing",
  description = "Choose the plan that's right for you. All plans include our core features and support.",
  onPlanButtonClick,
  uiLabels,
}) {
  const [isMonthly, setIsMonthly] = useState(true);
  const mergedUi = { ...DEFAULT_PRICING_UI, ...uiLabels };

  return (
    <PricingContext.Provider value={{ isMonthly, setIsMonthly, uiLabels: mergedUi }}>
      <div className="relative w-full bg-transparent py-20 sm:py-24">
        <div className="relative z-10 container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <h2
              className="text-4xl font-bold tracking-tighter sm:text-5xl text-neutral-900 dark:text-white">
              {title}
            </h2>
            <p className="text-muted-foreground text-lg whitespace-pre-line">
              {description}
            </p>
          </div>
          <PricingToggle />
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 items-stretch gap-8">
            {plans.map((plan, index) => (
              <PricingCard
                key={index}
                plan={plan}
                index={index}
                onPlanButtonClick={onPlanButtonClick}
              />
            ))}
          </div>
        </div>
      </div>
    </PricingContext.Provider>
  );
}

// Pricing Toggle Component
function PricingToggle() {
  const { isMonthly, setIsMonthly, uiLabels } = useContext(PricingContext);
  const confettiRef = useRef(null);
  const monthlyBtnRef = useRef(null);
  const annualBtnRef = useRef(null);

  const [pillStyle, setPillStyle] = useState({});

  useEffect(() => {
    const btnRef = isMonthly ? monthlyBtnRef : annualBtnRef;
    if (btnRef.current) {
      setPillStyle({
        width: btnRef.current.offsetWidth,
        transform: `translateX(${btnRef.current.offsetLeft}px)`,
      });
    }
  }, [isMonthly]);

  const handleToggle = (monthly) => {
    if (isMonthly === monthly) return;
    setIsMonthly(monthly);

    if (!monthly && confettiRef.current) {
      const rect = annualBtnRef.current?.getBoundingClientRect();
      if (!rect) return;

      const originX = (rect.left + rect.width / 2) / window.innerWidth;
      const originY = (rect.top + rect.height / 2) / window.innerHeight;

      confetti({
        particleCount: 80,
        spread: 80,
        origin: { x: originX, y: originY },
        colors: [
          "hsl(var(--primary))",
          "hsl(var(--background))",
          "hsl(var(--accent))",
        ],
        ticks: 300,
        gravity: 1.2,
        decay: 0.94,
        startVelocity: 30,
      });
    }
  };

  return (
    <div className="flex justify-center">
      <div
        ref={confettiRef}
        className="relative flex w-fit items-center rounded-full bg-muted p-1">
        <motion.div
          className="absolute left-0 top-0 h-full rounded-full bg-primary p-1"
          style={pillStyle}
          transition={{ type: "spring", stiffness: 500, damping: 40 }} />
        <button
          ref={monthlyBtnRef}
          onClick={() => handleToggle(true)}
          className={cn(
            "relative z-10 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
            isMonthly
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}>
          {uiLabels.monthly}
        </button>
        <button
          ref={annualBtnRef}
          onClick={() => handleToggle(false)}
          className={cn(
            "relative z-10 rounded-full px-4 sm:px-6 py-2 text-sm font-medium transition-colors",
            !isMonthly
              ? "text-primary-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}>
          {uiLabels.annual}
          <span
            className={cn("hidden sm:inline", !isMonthly ? "text-primary-foreground/80" : "")}>
            {" "}
            {uiLabels.saveAnnual}
          </span>
        </button>
      </div>
    </div>
  );
}

// Pricing Card Component
function isCustomPrice(plan, isMonthly) {
  const raw = isMonthly ? plan.price : plan.yearlyPrice;
  if (raw == null) return true;
  if (typeof raw === "string" && raw.trim().toLowerCase() === "custom") return true;
  const n = Number(raw);
  return Number.isNaN(n);
}

function PricingCard({
  plan,
  index,
  onPlanButtonClick,
}) {
  const { isMonthly } = useContext(PricingContext);
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const custom = isCustomPrice(plan, isMonthly);
  const numericPrice = custom
    ? 0
    : Number(isMonthly ? plan.price : plan.yearlyPrice);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      whileInView={{
        y: plan.isPopular && isDesktop ? -20 : 0,
        opacity: 1,
      }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        type: "spring",
        stiffness: 100,
        damping: 20,
        delay: index * 0.15,
      }}
      className={cn(
        "h-full rounded-2xl p-8 flex flex-col relative bg-background/70 backdrop-blur-sm",
        plan.isPopular
          ? "border-2 border-primary shadow-xl"
          : "border border-border"
      )}>
      {plan.isPopular && (
        <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2">
          <div className="bg-primary py-1.5 px-4 rounded-full flex items-center gap-1.5">
            <LucideStar className="text-primary-foreground h-4 w-4 fill-current" />
            <span className="text-primary-foreground text-sm font-semibold">
              {uiLabels.mostPopular}
            </span>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col text-center">
        <h3 className="text-xl font-semibold text-foreground">{plan.name}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {plan.description}
        </p>
        <div className="mt-6 flex items-baseline justify-center gap-x-1 flex-wrap">
          {custom ? (
            <span className="text-5xl font-bold tracking-tight text-foreground">
              {uiLabels.priceCustom}
            </span>
          ) : (
            <>
              <span className="text-5xl font-bold tracking-tight text-foreground">
                <NumberFlow
                  value={numericPrice}
                  format={{
                    style: "currency",
                    currency: "USD",
                    minimumFractionDigits: 0,
                  }}
                  className="font-variant-numeric: tabular-nums"
                />
              </span>
              <span className="text-sm font-semibold leading-6 tracking-wide text-muted-foreground">
                / {uiLabels.periodMonth}
              </span>
            </>
          )}
        </div>
        {!custom && (
          <p className="text-xs text-muted-foreground mt-2">
            {isMonthly ? uiLabels.billedMonthly : uiLabels.billedAnnually}
          </p>
        )}

        <ul
          role="list"
          className="mt-8 flex-1 space-y-3 text-sm leading-6 text-left text-muted-foreground">
          {plan.features.map((feature) => (
            <li key={feature} className="flex gap-x-3">
              <Check className="h-6 w-5 flex-none text-primary" aria-hidden="true" />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto shrink-0 pt-8">
          {plan.contactPath ? (
            <button
              type="button"
              onClick={() =>
                onPlanButtonClick(plan, {
                  interval: isMonthly ? "month" : "year",
                })
              }
              className={cn(
                buttonVariants({
                  variant: plan.isPopular ? "default" : "outline",
                  size: "lg",
                }),
                "w-full",
              )}
            >
              {plan.buttonText}
            </button>
          ) : onPlanButtonClick ? (
            <button
              type="button"
              onClick={() =>
                onPlanButtonClick(plan, {
                  interval: isMonthly ? "month" : "year",
                })
              }
              className={cn(
                buttonVariants({
                  variant: plan.isPopular ? "default" : "outline",
                  size: "lg",
                }),
                "w-full",
              )}
            >
              {plan.buttonText}
            </button>
          ) : (
            <a
              href={plan.href}
              className={cn(
                buttonVariants({
                  variant: plan.isPopular ? "default" : "outline",
                  size: "lg",
                }),
                "w-full",
              )}
            >
              {plan.buttonText}
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
