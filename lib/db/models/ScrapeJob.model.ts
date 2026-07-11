import mongoose, { Schema, Document, Model } from "mongoose";

export interface IScrapeJobDocument extends Document {
  source: string;
  query: string;
  city: string;
  limit: number;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  found: number;
  imported: number;
  duplicatesSkipped: number;
  error?: string;
  callbackUrl: string;
  startedAt?: Date;
  completedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  logs: string[];
  createdAt: Date;
  updatedAt: Date;
}

const ScrapeJobSchema = new Schema<IScrapeJobDocument>(
  {
    source: { type: String, required: true },
    query: { type: String, required: true },
    city: { type: String, required: true, lowercase: true, trim: true },
    limit: { type: Number, default: 50 },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "failed"],
      default: "queued",
    },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    found: { type: Number, default: 0 },
    imported: { type: Number, default: 0 },
    duplicatesSkipped: { type: Number, default: 0 },
    error: { type: String },
    callbackUrl: { type: String, required: true },
    startedAt: { type: Date },
    completedAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    // Capped at 50 entries — newest appended at end
    logs: [{ type: String }],
  },
  { timestamps: true }
);

ScrapeJobSchema.index({ status: 1, createdAt: -1 });

const ScrapeJob: Model<IScrapeJobDocument> =
  mongoose.models.ScrapeJob ??
  mongoose.model<IScrapeJobDocument>("ScrapeJob", ScrapeJobSchema);

export default ScrapeJob;
