import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoGscMetricDocument extends Document {
  blogSlug: string;
  date: Date;
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
  device: "MOBILE" | "DESKTOP" | "TABLET";
  country: string;
  syncedAt: Date;
}

const SeoGscMetricSchema = new Schema<ISeoGscMetricDocument>({
  blogSlug: { type: String, required: true },
  date: { type: Date, required: true },
  query: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  impressions: { type: Number, default: 0 },
  ctr: { type: Number, default: 0 },
  position: { type: Number, default: 0 },
  device: { type: String, enum: ["MOBILE", "DESKTOP", "TABLET"], default: "DESKTOP" },
  country: { type: String, default: "ind" },
  syncedAt: { type: Date, default: Date.now },
});

// Unique compound index — used for upserts (no duplicates per page+date+query+device)
SeoGscMetricSchema.index(
  { blogSlug: 1, date: 1, query: 1, device: 1 },
  { unique: true }
);
SeoGscMetricSchema.index({ blogSlug: 1, date: -1 });
SeoGscMetricSchema.index({ date: -1 });

const SeoGscMetric: Model<ISeoGscMetricDocument> =
  mongoose.models.SeoGscMetric ??
  mongoose.model<ISeoGscMetricDocument>("SeoGscMetric", SeoGscMetricSchema);
export default SeoGscMetric;
