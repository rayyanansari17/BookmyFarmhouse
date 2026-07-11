import mongoose, { Schema, Document, Model } from "mongoose";
import { slugify } from "@/lib/utils";

export interface IPropertyImage {
  url: string;
  publicId: string;
  order: number;
}

export interface IActivityLog {
  action: "submitted" | "approved" | "rejected" | "edited" | "deleted" | "restored";
  performedBy: mongoose.Types.ObjectId;
  note?: string;
  timestamp: Date;
}

export interface IPropertyDocument extends Document {
  vendorId: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  location: { city: string; state: string; address?: string };
  capacity: { min: number; max: number };
  priceRange: { min: number; max: number };
  amenities: string[];
  rules?: string;
  images: IPropertyImage[];
  status: "pending" | "approved" | "rejected";
  isDeleted: boolean;
  deletedAt?: Date;
  rating?: number;
  activityLog: IActivityLog[];
  eventTypes?: string[];
  tags?: string[];
  // Scraper fields
  source: "vendor" | "scraped";
  claimed: boolean;
  claimedAt?: Date;
  googlePlaceId?: string;
  scrapedPhone?: string;
  scrapedWebsite?: string;
  externalImageUrls: string[];
  createdAt: Date;
  updatedAt: Date;
}

const PropertySchema = new Schema<IPropertyDocument>(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, minlength: 10, maxlength: 100, trim: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, minlength: 10, maxlength: 5000 },
    location: {
      city: { type: String, required: true, lowercase: true, trim: true },
      state: { type: String, trim: true },
      address: { type: String, trim: true },
    },
    capacity: {
      min: { type: Number, min: 1 },
      max: { type: Number },
    },
    priceRange: {
      min: { type: Number, min: 0 },
      max: { type: Number },
    },
    amenities: [{ type: String }],
    rules: { type: String, maxlength: 2000 },
    images: [
      {
        url: String,
        publicId: String,
        order: { type: Number, default: 0 },
      },
    ],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
    rating: { type: Number, min: 0, max: 5 },
    activityLog: [
      {
        action: {
          type: String,
          enum: ["submitted", "approved", "rejected", "edited", "deleted", "restored"],
        },
        performedBy: { type: Schema.Types.ObjectId, ref: "User" },
        note: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    eventTypes: [{ type: String }],
    tags: [{ type: String }],
    // Scraper fields
    source: { type: String, enum: ["vendor", "scraped"], default: "vendor" },
    claimed: { type: Boolean, default: false, index: true },
    claimedAt: { type: Date },
    googlePlaceId: { type: String, sparse: true, unique: true },
    scrapedPhone: { type: String, trim: true },
    scrapedWebsite: { type: String, trim: true },
    externalImageUrls: [{ type: String }],
  },
  { timestamps: true }
);

PropertySchema.index({ status: 1, isDeleted: 1 });
PropertySchema.index({ "location.city": 1, status: 1, isDeleted: 1 });
PropertySchema.index({ "priceRange.min": 1, "priceRange.max": 1 });
PropertySchema.index({ "capacity.max": 1 });
PropertySchema.index({ source: 1, claimed: 1, status: 1 });
PropertySchema.index(
  { title: "text", description: "text" },
  { weights: { title: 10, description: 5 } }
);

// Auto-generate slug only on first save — immutable after creation
PropertySchema.pre("save", async function () {
  if (!this.isNew || this.slug) return;

  const base = slugify(`${this.title} ${this.location.city}`);
  let slug = base;
  let count = 0;

  while (await (this.constructor as Model<IPropertyDocument>).findOne({ slug })) {
    count++;
    slug = `${base}-${count}`;
  }

  this.slug = slug;
});

const Property: Model<IPropertyDocument> =
  mongoose.models.Property ??
  mongoose.model<IPropertyDocument>("Property", PropertySchema);

export default Property;
