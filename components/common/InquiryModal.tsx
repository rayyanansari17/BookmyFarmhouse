"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { CheckCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInquirySchema, type CreateInquiryInput } from "@/lib/validators";
import type { IProperty } from "@/types";

interface InquiryModalProps {
  property: IProperty | null;
  open: boolean;
  onClose: () => void;
}

const EVENT_TYPES = [
  { value: "birthday", label: "Birthday Party" },
  { value: "wedding", label: "Wedding" },
  { value: "corporate", label: "Corporate Event" },
  { value: "reunion", label: "Family Reunion" },
  { value: "photoshoot", label: "Photo / Film Shoot" },
  { value: "other", label: "Other" },
];

export function InquiryModal({ property, open, onClose }: InquiryModalProps) {
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInquiryInput>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createInquirySchema) as any,
    defaultValues: {
      propertyId: property?._id ?? "",
      customer: { name: "", phone: "", email: "" },
      guestCount: 1,
      message: "",
    },
  });

  const onSubmit = async (data: CreateInquiryInput) => {
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, propertyId: property?._id }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit inquiry");
    }
  };

  const handleClose = () => {
    reset();
    setSubmitted(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {submitted ? (
          <div className="py-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">Inquiry Sent!</h3>
              <p className="text-sm text-muted-foreground mt-1">
                The venue owner will contact you within 24 hours.
              </p>
            </div>
            <Button onClick={handleClose} className="mt-2">
              Close
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="text-lg">Inquire About This Venue</DialogTitle>
              <DialogDescription className="text-sm">
                {property?.title} — {property?.location.city}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Your Name *</Label>
                  <Input id="name" placeholder="Rahul Sharma" {...register("customer.name")} />
                  {errors.customer?.name && (
                    <p className="text-xs text-destructive">{errors.customer.name.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input id="phone" placeholder="9876543210" {...register("customer.phone")} />
                  {errors.customer?.phone && (
                    <p className="text-xs text-destructive">{errors.customer.phone.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" placeholder="rahul@example.com" {...register("customer.email")} />
                {errors.customer?.email && (
                  <p className="text-xs text-destructive">{errors.customer.email.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="eventDate">Event Date *</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    min={new Date().toISOString().split("T")[0]}
                    {...register("eventDate")}
                  />
                  {errors.eventDate && (
                    <p className="text-xs text-destructive">{errors.eventDate.message}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="guests">Guests *</Label>
                  <Input
                    id="guests"
                    type="number"
                    min="1"
                    placeholder="50"
                    {...register("guestCount", { valueAsNumber: true })}
                  />
                  {errors.guestCount && (
                    <p className="text-xs text-destructive">{errors.guestCount.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Event Type *</Label>
                <Select onValueChange={(val) => setValue("eventType", val as CreateInquiryInput["eventType"])}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.eventType && (
                  <p className="text-xs text-destructive">{errors.eventType.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="message">Message (optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Any specific requirements or questions..."
                  rows={3}
                  {...register("message")}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Send Inquiry
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
