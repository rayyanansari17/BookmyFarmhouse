import { z } from "zod";

// ── Auth ──────────────────────────────────────────────────────────────────────

export const registerSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number").optional(),
  whatsapp: z.string().optional(),
  businessName: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

// ── Property ──────────────────────────────────────────────────────────────────

export const createPropertySchema = z.object({
  title: z.string().min(10, "Title must be at least 10 characters").max(100),
  description: z.string().min(10, "Description must be at least 10 characters").max(5000),
  city: z.string().min(1, "City is required"),
  state: z.string().optional(),
  address: z.string().optional(),
  capacityMin: z.coerce.number().min(1),
  capacityMax: z.coerce.number().min(1),
  priceMin: z.coerce.number().min(0),
  priceMax: z.coerce.number().min(0),
  amenities: z.array(z.string()).default([]),
  rules: z.string().max(2000).optional(),
  eventTypes: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
});

export const updatePropertySchema = createPropertySchema.partial();

// ── Inquiry ───────────────────────────────────────────────────────────────────

export const createInquirySchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  customer: z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian phone number"),
    email: z.string().email("Invalid email"),
  }),
  eventDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: "Event date must be in the future",
  }),
  guestCount: z.coerce.number().min(1, "At least 1 guest required"),
  eventType: z.enum(["birthday", "wedding", "corporate", "reunion", "photoshoot", "other"]),
  message: z.string().max(500).optional(),
});

// ── Location ──────────────────────────────────────────────────────────────────

export const createLocationSchema = z.object({
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
});

// ── Vendor Profile ────────────────────────────────────────────────────────────

export const updateProfileSchema = z.object({
  name: z.string().min(3).optional(),
  businessName: z.string().optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional().or(z.literal("")),
  whatsapp: z.string().optional(),
  about: z.string().max(1000).optional(),
});

// ── Admin ─────────────────────────────────────────────────────────────────────

export const updatePropertyStatusSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  note: z.string().optional(),
});

export const updateRatingSchema = z.object({
  rating: z.coerce.number().min(0).max(5),
});

export const updateVendorStatusSchema = z.object({
  isActive: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  suspensionReason: z.string().optional(),
});

export const updateInquiryStatusSchema = z.object({
  status: z.enum(["new", "contacted", "converted", "closed"]),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreatePropertyInput = z.infer<typeof createPropertySchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
