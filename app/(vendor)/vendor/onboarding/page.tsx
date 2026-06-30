"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Loader2, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function VendorOnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [form, setForm] = useState({ phone: "", businessName: "", about: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.match(/^[6-9]\d{9}$/)) {
      toast.error("Enter a valid 10-digit Indian mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      await update();
      toast.success("Profile complete! Welcome aboard.");
      router.push("/vendor");
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Complete your profile</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Just a few more details to get your vendor account ready
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Phone number <span className="text-destructive">*</span></Label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                required
              />
              <p className="text-xs text-muted-foreground">10-digit Indian mobile number</p>
            </div>
            <div className="space-y-1.5">
              <Label>Business name</Label>
              <Input
                placeholder="Your farm / property name"
                value={form.businessName}
                onChange={(e) => setForm((p) => ({ ...p, businessName: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>About you</Label>
              <Textarea
                placeholder="Tell guests a little about yourself and your property..."
                value={form.about}
                onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
                rows={3}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Complete Setup
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
