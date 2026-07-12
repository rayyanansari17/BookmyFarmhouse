"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Check, Zap, Crown, Star, MessageCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    period: "forever",
    icon: Star,
    description: "Get started with basic lead access",
    color: "border-border",
    badge: null,
    features: [
      "5 lead reveals per month",
      "Manage up to 3 listings",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Your current plan",
    disabled: true,
  },
  {
    id: "growth",
    name: "Growth",
    price: "₹999",
    period: "per month",
    icon: Zap,
    description: "Perfect for growing venue businesses",
    color: "border-primary",
    badge: "Most Popular",
    features: [
      "30 lead reveals per month",
      "Unlimited listings",
      "Priority listing placement",
      "WhatsApp support",
      "Lead analytics",
    ],
    cta: "Upgrade to Growth",
    disabled: false,
    whatsappMsg: "Hi, I want to upgrade my BookMyFarmhouse vendor account to the Growth plan (₹999/month).",
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹2,499",
    period: "per month",
    icon: Crown,
    description: "For serious venues with high inquiry volume",
    color: "border-amber-500",
    badge: "Best Value",
    features: [
      "Unlimited lead reveals",
      "Unlimited listings",
      "Featured listing badge",
      "Dedicated account manager",
      "Custom analytics reports",
      "Priority review (12 hrs)",
    ],
    cta: "Upgrade to Pro",
    disabled: false,
    whatsappMsg: "Hi, I want to upgrade my BookMyFarmhouse vendor account to the Pro plan (₹2,499/month).",
  },
] as const;

const WHATSAPP_NUMBER = "919000000000"; // replace with your actual number

export default function UpgradePage() {
  const { data: session } = useSession();
  const currentPlan = (session?.user as { subscriptionPlan?: string })?.subscriptionPlan ?? "free";
  const [contacted, setContacted] = useState<string | null>(null);

  function handleUpgrade(plan: typeof PLANS[number]) {
    if (plan.disabled) return;
    const msg = encodeURIComponent(
      `${plan.whatsappMsg}\n\nAccount email: ${session?.user?.email ?? "—"}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    setContacted(plan.id);
    toast.success(`WhatsApp opened — send the message to complete your upgrade request`);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/vendor/leads"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>
        <h1 className="text-2xl font-bold text-foreground">Upgrade Your Plan</h1>
        <p className="text-muted-foreground mt-1">
          Unlock more lead reveals and grow your venue business.
        </p>
      </div>

      {/* Current usage banner */}
      <div className="rounded-xl border border-border bg-muted/40 px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Current plan</p>
          <p className="font-semibold text-foreground capitalize mt-0.5">{currentPlan}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Lead reveals this month</p>
          <p className="font-semibold text-foreground mt-0.5">
            {currentPlan === "free" ? "5" : currentPlan === "growth" ? "30" : "∞"} per month
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Account</p>
          <p className="font-semibold text-foreground mt-0.5 truncate max-w-[200px]">{session?.user?.email}</p>
        </div>
      </div>

      {/* Plan cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = plan.id === currentPlan;
          const wasContacted = contacted === plan.id;

          return (
            <div
              key={plan.id}
              className={`relative rounded-2xl border-2 bg-card p-6 flex flex-col gap-5 ${
                plan.id === "growth" ? "border-primary shadow-lg shadow-primary/10" : plan.color
              }`}
            >
              {/* Badge */}
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge
                    className={plan.id === "growth" ? "bg-primary text-primary-foreground" : "bg-amber-500 text-white"}
                  >
                    {plan.badge}
                  </Badge>
                </div>
              )}

              {/* Plan header */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    plan.id === "growth" ? "bg-primary/10" : plan.id === "pro" ? "bg-amber-50 dark:bg-amber-900/20" : "bg-muted"
                  }`}>
                    <Icon className={`h-4 w-4 ${
                      plan.id === "growth" ? "text-primary" : plan.id === "pro" ? "text-amber-500" : "text-muted-foreground"
                    }`} />
                  </div>
                  <span className="font-bold text-foreground">{plan.name}</span>
                  {isCurrent && (
                    <Badge variant="secondary" className="text-[10px] ml-auto">Current</Badge>
                  )}
                </div>
                <div className="mt-3">
                  <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-sm text-muted-foreground ml-1">/{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
              </div>

              {/* Features */}
              <ul className="space-y-2 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className={`h-4 w-4 mt-0.5 shrink-0 ${
                      plan.id === "growth" ? "text-primary" : plan.id === "pro" ? "text-amber-500" : "text-muted-foreground"
                    }`} />
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Button
                className={`w-full gap-2 ${
                  plan.id === "growth"
                    ? ""
                    : plan.id === "pro"
                    ? "bg-amber-500 hover:bg-amber-600 text-white"
                    : ""
                }`}
                variant={plan.disabled ? "outline" : "default"}
                disabled={plan.disabled || isCurrent}
                onClick={() => handleUpgrade(plan)}
              >
                {wasContacted ? (
                  <>
                    <Check className="h-4 w-4" /> Request sent via WhatsApp
                  </>
                ) : plan.disabled || isCurrent ? (
                  plan.cta
                ) : (
                  <>
                    <MessageCircle className="h-4 w-4" /> {plan.cta}
                  </>
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="rounded-xl border border-border bg-muted/30 p-6">
        <h2 className="font-semibold text-foreground mb-4">How upgrading works</h2>
        <ol className="space-y-3">
          {[
            { n: "1", t: "Click the upgrade button", d: "It opens WhatsApp with a pre-filled message to our team." },
            { n: "2", t: "Send the message", d: "Our team will confirm your plan and share payment details." },
            { n: "3", t: "Plan activated within 24 hours", d: "Once payment is confirmed your leads limit is updated immediately." },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {step.n}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{step.t}</p>
                <p className="text-sm text-muted-foreground">{step.d}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
