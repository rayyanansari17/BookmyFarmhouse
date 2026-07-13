import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISeoGa4MetricDocument extends Document {
  blogSlug: string;
  date: Date;
  sessions: number;
  engagedSessions: number;
  engagementRate: number;
  avgEngagementTimeSeconds: number;
  bounceRate: number;
  newUsers: number;
  returningUsers: number;
  conversions: number;
  deviceCategory: "mobile" | "desktop" | "tablet";
  userCity: string;
  syncedAt: Date;
}

const SeoGa4MetricSchema = new Schema<ISeoGa4MetricDocument>({
  blogSlug: { type: String, required: true },
  date: { type: Date, required: true },
  sessions: { type: Number, default: 0 },
  engagedSessions: { type: Number, default: 0 },
  engagementRate: { type: Number, default: 0 },
  avgEngagementTimeSeconds: { type: Number, default: 0 },
  bounceRate: { type: Number, default: 0 },
  newUsers: { type: Number, default: 0 },
  returningUsers: { type: Number, default: 0 },
  conversions: { type: Number, default: 0 },
  deviceCategory: { type: String, enum: ["mobile", "desktop", "tablet"], default: "desktop" },
  userCity: { type: String, default: "" },
  syncedAt: { type: Date, default: Date.now },
});

SeoGa4MetricSchema.index(
  { blogSlug: 1, date: 1, deviceCategory: 1 },
  { unique: true }
);
SeoGa4MetricSchema.index({ blogSlug: 1, date: -1 });

const SeoGa4Metric: Model<ISeoGa4MetricDocument> =
  mongoose.models.SeoGa4Metric ??
  mongoose.model<ISeoGa4MetricDocument>("SeoGa4Metric", SeoGa4MetricSchema);
export default SeoGa4Metric;
