import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScrapedListingDocument extends Document {
  source: "justdial" | "sulekha" | "wedmegood" | "manual";
  sourceUrl?: string;
  scrapeJobId?: string;
  scrapedAt: Date;

  name: string;
  area?: string;
  city: string;
  address?: string;
  phone?: string;
  phones: string[];
  imageUrls: string[];
  amenities: string[];
  capacity?: number;
  priceRange?: string;
  description?: string;
  category: "farmhouse" | "banquet" | "resort" | "villa";

  status: "pending" | "approved" | "rejected" | "published";
  adminNotes?: string;
  editedData?: Record<string, unknown>;

  publishedPropertyId?: mongoose.Types.ObjectId;
  publishedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const ScrapedListingSchema = new Schema<IScrapedListingDocument>(
  {
    source: {
      type: String,
      enum: ["justdial", "sulekha", "wedmegood", "manual"],
      required: true,
    },
    sourceUrl: { type: String, trim: true },
    scrapeJobId: { type: String },
    scrapedAt: { type: Date, default: Date.now },

    name: { type: String, required: true, trim: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, lowercase: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    phones: [{ type: String, trim: true }],
    imageUrls: [{ type: String }],
    amenities: [{ type: String }],
    capacity: { type: Number },
    priceRange: { type: String, trim: true },
    description: { type: String, maxlength: 5000 },
    category: {
      type: String,
      enum: ["farmhouse", "banquet", "resort", "villa"],
      default: "farmhouse",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "published"],
      default: "pending",
    },
    adminNotes: { type: String },
    editedData: { type: Schema.Types.Mixed },

    publishedPropertyId: { type: Schema.Types.ObjectId, ref: "Property" },
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

ScrapedListingSchema.index({ status: 1, city: 1 });
ScrapedListingSchema.index({ source: 1, status: 1 });
ScrapedListingSchema.index({ scrapeJobId: 1 });
ScrapedListingSchema.index({ phone: 1 });

const ScrapedListing: Model<IScrapedListingDocument> =
  mongoose.models.ScrapedListing ??
  mongoose.model<IScrapedListingDocument>("ScrapedListing", ScrapedListingSchema);

export default ScrapedListing;
