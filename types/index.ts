// Core domain types mirroring the Mongoose models

export interface IUser {
  _id: string;
  name: string;
  email: string;
  role: "vendor" | "admin";
  phone?: string;
  whatsapp?: string;
  isActive: boolean;
  isSuspended: boolean;
  suspensionReason?: string;
  businessName?: string;
  profileImage?: string;
  profileImagePublicId?: string;
  about?: string;
  authProvider: "local" | "google";
  googleId?: string;
  // Freemium subscription
  subscriptionPlan?: "free" | "growth" | "pro";
  subscriptionExpiresAt?: string;
  trialEndsAt?: string;
  monthlyLeadRevealCount?: number;
  leadCountResetAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPropertyImage {
  url: string;
  publicId: string;
  order: number;
}

export interface IActivityLog {
  action: "submitted" | "approved" | "rejected" | "edited" | "deleted" | "restored";
  performedBy: string | IUser;
  note?: string;
  timestamp: string;
}

export interface IProperty {
  _id: string;
  vendorId: string | IUser;
  title: string;
  slug: string;
  description: string;
  location: {
    city: string;
    state: string;
    address?: string;
  };
  capacity: {
    min: number;
    max: number;
  };
  priceRange: {
    min: number;
    max: number;
  };
  amenities: string[];
  rules?: string;
  images: IPropertyImage[];
  status: "pending" | "approved" | "rejected";
  isDeleted: boolean;
  deletedAt?: string;
  rating?: number;
  activityLog: IActivityLog[];
  eventTypes?: string[];
  tags?: string[];
  // Scraper fields
  source?: "vendor" | "scraped";
  claimed?: boolean;
  claimedAt?: string;
  googlePlaceId?: string;
  scrapedPhone?: string;
  scrapedWebsite?: string;
  externalImageUrls?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface IInquiryCustomer {
  name: string;
  phone: string;
  email: string;
}

export interface IInquiry {
  _id: string;
  propertyId: string | IProperty;
  vendorId: string | IUser;
  customer: IInquiryCustomer;
  eventDate: string;
  guestCount: number;
  eventType: "birthday" | "wedding" | "corporate" | "reunion" | "photoshoot" | "other";
  message?: string;
  status: "new" | "contacted" | "converted" | "closed";
  createdAt: string;
  updatedAt: string;
}

export interface ILocation {
  _id: string;
  city: string;
  state: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// API Response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    pages: number;
    current: number;
    limit: number;
  };
}

// Search filters for property search
export interface PropertySearchParams {
  city?: string;
  priceMin?: number;
  priceMax?: number;
  minGuests?: number;
  maxGuests?: number;
  amenities?: string[];
  search?: string;
  sortBy?: "rating" | "price_asc" | "price_desc" | "newest";
  page?: number;
  limit?: number;
}

// NextAuth session extension
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      role: "vendor" | "admin";
      phone?: string;
      whatsapp?: string;
      businessName?: string;
      profileImage?: string;
      about?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    role: "vendor" | "admin";
    phone?: string;
    whatsapp?: string;
    businessName?: string;
    profileImage?: string;
    about?: string;
  }
}

// JWT augmentation — next-auth v5 exposes JWT via "next-auth" itself
declare module "next-auth" {
  interface JWT {
    id: string;
    role: "vendor" | "admin";
    phone?: string;
    whatsapp?: string;
    businessName?: string;
    profileImage?: string;
    about?: string;
  }
}

// Static data
export const AMENITIES_LIST = [
  "Swimming Pool",
  "Lawn",
  "Parking",
  "Catering",
  "DJ",
  "Bonfire",
  "Air Conditioning",
  "Generator",
  "Wifi",
  "Security",
  "Changing Rooms",
  "Kitchen",
  "Bar",
  "Stage",
  "Projector",
] as const;

export const EVENT_TYPES = [
  "birthday",
  "wedding",
  "corporate",
  "reunion",
  "photoshoot",
  "other",
] as const;

export type AmenityType = (typeof AMENITIES_LIST)[number];
export type EventType = (typeof EVENT_TYPES)[number];
