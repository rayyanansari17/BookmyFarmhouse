import Link from "next/link";
import { CheckCircle, TrendingUp, Globe, Star, ArrowRight, Banknote, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Become a Vendor — List Your Property",
  description:
    "Join 500+ venue owners on BookMyFarmhouse. List your farmhouse or event space and connect with thousands of event planners.",
};

const BENEFITS = [
  {
    icon: Users,
    title: "Reach Thousands of Customers",
    description: "Get discovered by thousands of event planners actively searching for venues like yours.",
  },
  {
    icon: Banknote,
    title: "Free to List",
    description: "No listing fees, no commissions. Keep 100% of what you earn from every booking.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Professional dashboard to manage leads, track performance, and grow your revenue.",
  },
  {
    icon: Zap,
    title: "Instant Lead Notifications",
    description: "Get notified the moment someone inquires about your property. Never miss a lead.",
  },
];

const STEPS = [
  { step: "01", title: "Create Your Account", desc: "Sign up free and set up your vendor profile in minutes." },
  { step: "02", title: "List Your Property", desc: "Add photos, details, pricing, and amenities. Our team reviews within 24 hours." },
  { step: "03", title: "Start Receiving Leads", desc: "Once approved, customers can discover and inquire about your venue." },
];

const CHECKLIST = [
  "No listing fees or commissions",
  "Professional dashboard & analytics",
  "Direct customer inquiries",
  "24-hour review turnaround",
  "Cloudinary-powered image hosting",
  "Google Analytics integration",
];

export default function BecomeVendorPage() {
  return (
    <div className="pt-16 bg-background">
      {/* Hero */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <Star className="h-4 w-4 fill-current" />
            Join 500+ Venue Owners
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            List Your Property.{" "}
            <span className="text-primary">Grow Your Business.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Connect with thousands of event planners looking for farmhouses, banquet halls, and
            outdoor venues across India. It&apos;s free to list.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/vendor/register">
              <Button size="lg" className="bg-primary hover:bg-primary/90 px-8 h-12 font-semibold">
                Start Listing Free
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/vendor/login">
              <Button size="lg" variant="outline" className="px-8 h-12">
                Already a Vendor? Login
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
            Everything You Need to Succeed
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map(({ icon: Icon, title, description }) => (
              <Card key={title} className="border-border hover:border-primary/30 hover:shadow-md transition-all group">
                <CardContent className="p-5">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground mb-1.5 text-sm">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground text-center mb-10">
            Get Listed in 3 Simple Steps
          </h2>
          <div className="space-y-6">
            {STEPS.map(({ step, title, desc }, i) => (
              <div key={step} className="flex items-start gap-6 p-5 bg-background rounded-xl border border-border">
                <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                  {step}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Checklist + CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-6">What&apos;s Included — Free</h2>
              <ul className="space-y-3">
                {CHECKLIST.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary rounded-2xl p-8 text-center">
              <Globe className="h-10 w-10 text-primary-foreground mx-auto mb-4" />
              <h3 className="text-xl font-bold text-primary-foreground mb-3">
                Ready to Get Started?
              </h3>
              <p className="text-primary-foreground/80 text-sm mb-6">
                Join hundreds of venue owners already growing their business on BookMyFarmhouse.
              </p>
              <Link href="/vendor/register">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 font-semibold w-full">
                  Create Free Account
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
