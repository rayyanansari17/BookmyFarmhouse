import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFaqPair {
  question: string;
  answer: string;
}

export interface IInternalLink {
  anchor: string;
  targetSlug: string;
}

export interface IImprovementRecord {
  triggeredBy: string;
  changedFields: string[];
  improvedAt: Date;
}

export type BlogStatus =
  | "keyword_identified"
  | "brief_generated"
  | "content_generated"
  | "pending_review"
  | "approved"
  | "scheduled"
  | "published"
  | "active_monitoring";

export type BlogContentType =
  | "location-page"
  | "comparison"
  | "how-to"
  | "faq-cluster"
  | "geo-summary";

export interface IBlogDocument extends Document {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  bodyHtml: string;
  faqSchema: IFaqPair[];
  geoAnswerBlock?: string;
  schemaTypes: string[];
  targetKeyword: string;
  secondaryKeywords: string[];
  contentType: BlogContentType;
  personaTags: string[];
  internalLinks: IInternalLink[];
  wordCount: number;
  keywordDensity: number;
  readabilityScore: number;
  status: BlogStatus;
  publishedAt?: Date;
  scheduledFor?: Date;
  lastImprovedAt?: Date;
  improvementHistory: IImprovementRecord[];
  seoScore: number;
  generatedBy?: string;
  featuredImage?: { url: string; publicId: string };
  createdAt: Date;
  updatedAt: Date;
}

const FaqPairSchema = new Schema<IFaqPair>(
  { question: { type: String, required: true }, answer: { type: String, required: true } },
  { _id: false }
);

const InternalLinkSchema = new Schema<IInternalLink>(
  { anchor: { type: String, required: true }, targetSlug: { type: String, required: true } },
  { _id: false }
);

const ImprovementRecordSchema = new Schema<IImprovementRecord>(
  {
    triggeredBy: { type: String, required: true },
    changedFields: [{ type: String }],
    improvedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const BlogSchema = new Schema<IBlogDocument>(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    title: { type: String, required: true, trim: true },
    metaTitle: { type: String, default: "" },
    metaDescription: { type: String, default: "" },
    h1: { type: String, default: "" },
    bodyHtml: { type: String, default: "" },
    faqSchema: [FaqPairSchema],
    geoAnswerBlock: { type: String },
    schemaTypes: [{ type: String }],
    targetKeyword: { type: String, required: true, trim: true },
    secondaryKeywords: [{ type: String }],
    contentType: {
      type: String,
      enum: ["location-page", "comparison", "how-to", "faq-cluster", "geo-summary"],
      required: true,
    },
    personaTags: [{ type: String }],
    internalLinks: [InternalLinkSchema],
    wordCount: { type: Number, default: 0 },
    keywordDensity: { type: Number, default: 0 },
    readabilityScore: { type: Number, default: 0 },
    status: {
      type: String,
      enum: [
        "keyword_identified",
        "brief_generated",
        "content_generated",
        "pending_review",
        "approved",
        "scheduled",
        "published",
        "active_monitoring",
      ],
      default: "keyword_identified",
    },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    lastImprovedAt: { type: Date },
    improvementHistory: [ImprovementRecordSchema],
    seoScore: { type: Number, default: 0 },
    generatedBy: { type: String },
    featuredImage: {
      url: { type: String },
      publicId: { type: String },
    },
  },
  { timestamps: true }
);

BlogSchema.index({ status: 1 });
BlogSchema.index({ targetKeyword: 1 });
BlogSchema.index({ publishedAt: -1 });
BlogSchema.index({ contentType: 1, status: 1 });

const Blog: Model<IBlogDocument> =
  mongoose.models.Blog ?? mongoose.model<IBlogDocument>("Blog", BlogSchema);
export default Blog;
