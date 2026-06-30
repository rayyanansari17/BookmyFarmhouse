"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Loader2, User, Phone, Building2, FileText, Mail, Shield, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function VendorProfilePage() {
  const { data: session } = useSession();
  const [form, setForm] = useState({
    name: "",
    businessName: "",
    phone: "",
    whatsapp: "",
    about: "",
  });
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (session?.user && !hydrated) {
      setForm({
        name: session.user.name ?? "",
        businessName: session.user.businessName ?? "",
        phone: session.user.phone ?? "",
        whatsapp: "",
        about: session.user.about ?? "",
      });
      setHydrated(true);
    }
  }, [session, hydrated]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  return (
    <div className="max-w-2xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Manage your vendor profile and account details
        </p>
      </div>

      {/* Avatar & account info */}
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={session?.user.profileImage} />
          <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
            {session?.user.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-foreground text-lg">{session?.user.name}</p>
          <p className="text-muted-foreground text-sm">{session?.user.email}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs capitalize gap-1">
              <Shield className="h-3 w-3" />
              {session?.user.role}
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Read-only account info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Mail className="h-3.5 w-3.5" /> Email (read-only)
          </div>
          <p className="text-sm text-foreground">{session?.user.email}</p>
        </div>
      </div>

      <Separator />

      {/* Editable form */}
      <form onSubmit={handleSave} className="space-y-5">
        <h2 className="font-semibold text-foreground">Edit Profile</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              <User className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
              Full Name
            </Label>
            <Input placeholder="Rahul Sharma" {...field("name")} />
          </div>
          <div className="space-y-1.5">
            <Label>
              <Building2 className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
              Business Name
            </Label>
            <Input placeholder="Green Valley Farms" {...field("businessName")} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>
              <Phone className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
              Phone
            </Label>
            <Input type="tel" placeholder="9876543210" {...field("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label>WhatsApp (optional)</Label>
            <Input type="tel" placeholder="9876543210" {...field("whatsapp")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>
            <FileText className="h-3.5 w-3.5 inline mr-1.5 text-primary" />
            About / Bio
          </Label>
          <Textarea
            placeholder="Tell customers about yourself and your property..."
            rows={4}
            {...field("about")}
          />
          <p className="text-xs text-muted-foreground">
            {form.about.length}/1000 characters
          </p>
        </div>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto px-8">
          {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Changes
        </Button>
      </form>
    </div>
  );
}
