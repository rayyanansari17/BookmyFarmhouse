import mongoose, { Schema, Document, Model } from "mongoose";

export type CwvStatus = "good" | "needs-improvement" | "poor";

export interface ISeoCwvMetricDocument extends Document {
  blogSlug: string;
  checkedAt: Date;
  lcpMs: number;
  inpMs: number;
  clsScore: number;
  fcpMs: number;
  ttfbMs: number;
  lcpStatus: CwvStatus;
  inpStatus: CwvStatus;
  clsStatus: CwvStatus;
  mobileUsabilityIssues: string[];
  overallStatus: CwvStatus;
}

const SeoCwvMetricSchema = new Schema<ISeoCwvMetricDocument>({
  blogSlug: { type: String, required: true },
  checkedAt: { type: Date, default: Date.now },
  lcpMs: { type: Number, default: 0 },
  inpMs: { type: Number, default: 0 },
  clsScore: { type: Number, default: 0 },
  fcpMs: { type: Number, default: 0 },
  ttfbMs: { type: Number, default: 0 },
  lcpStatus: { type: String, enum: ["good", "needs-improvement", "poor"], default: "good" },
  inpStatus: { type: String, enum: ["good", "needs-improvement", "poor"], default: "good" },
  clsStatus: { type: String, enum: ["good", "needs-improvement", "poor"], default: "good" },
  mobileUsabilityIssues: [{ type: String }],
  overallStatus: { type: String, enum: ["good", "needs-improvement", "poor"], default: "good" },
});

SeoCwvMetricSchema.index({ blogSlug: 1, checkedAt: -1 });

const SeoCwvMetric: Model<ISeoCwvMetricDocument> =
  mongoose.models.SeoCwvMetric ??
  mongoose.model<ISeoCwvMetricDocument>("SeoCwvMetric", SeoCwvMetricSchema);
export default SeoCwvMetric;
