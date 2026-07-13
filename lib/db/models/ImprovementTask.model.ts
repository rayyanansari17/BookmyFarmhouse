import mongoose, { Schema, Document, Model } from "mongoose";

export type TriggerType =
  | "LOW_CTR_HIGH_IMP"
  | "POSITION_DROP"
  | "POSITION_OPPORTUNITY"
  | "THIN_CONTENT"
  | "ORPHAN_PAGE"
  | "CANNIBALIZATION"
  | "MISSING_SCHEMA"
  | "CWV_FAIL"
  | "STALE_CONTENT"
  | "NEW_QUERY_OPPORTUNITY"
  | "MISSING_GEO_BLOCK"
  | "HIGH_BOUNCE"
  | "LOW_CONVERSION";

export interface IImprovementTaskDocument extends Document {
  blogSlug: string;
  triggerType: TriggerType;
  triggerSignal: Record<string, unknown>;
  priority: "high" | "medium" | "low";
  suggestedAction: string;
  aiSuggestion?: string;
  status: "pending" | "in_progress" | "applied" | "dismissed";
  appliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ImprovementTaskSchema = new Schema<IImprovementTaskDocument>(
  {
    blogSlug: { type: String, required: true },
    triggerType: {
      type: String,
      enum: [
        "LOW_CTR_HIGH_IMP", "POSITION_DROP", "POSITION_OPPORTUNITY", "THIN_CONTENT",
        "ORPHAN_PAGE", "CANNIBALIZATION", "MISSING_SCHEMA", "CWV_FAIL", "STALE_CONTENT",
        "NEW_QUERY_OPPORTUNITY", "MISSING_GEO_BLOCK", "HIGH_BOUNCE", "LOW_CONVERSION",
      ],
      required: true,
    },
    triggerSignal: { type: Schema.Types.Mixed, default: {} },
    priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
    suggestedAction: { type: String, default: "" },
    aiSuggestion: { type: String },
    status: {
      type: String,
      enum: ["pending", "in_progress", "applied", "dismissed"],
      default: "pending",
    },
    appliedAt: { type: Date },
  },
  { timestamps: true }
);

ImprovementTaskSchema.index({ blogSlug: 1, status: 1 });
ImprovementTaskSchema.index({ status: 1, priority: 1 });

const ImprovementTask: Model<IImprovementTaskDocument> =
  mongoose.models.ImprovementTask ??
  mongoose.model<IImprovementTaskDocument>("ImprovementTask", ImprovementTaskSchema);
export default ImprovementTask;
