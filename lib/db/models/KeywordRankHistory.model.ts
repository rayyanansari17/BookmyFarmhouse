import mongoose, { Schema, Document, Model } from "mongoose";

export interface IKeywordRankHistoryDocument extends Document {
  keyword: string;
  blogSlug: string;
  checkedAt: Date;
  position: number;
  positionDelta7d: number;
  positionDelta30d: number;
  serpFeatures: string[];
  estimatedMonthlyTraffic: number;
  source: "dataforseo" | "gsc_proxy";
}

const KeywordRankHistorySchema = new Schema<IKeywordRankHistoryDocument>({
  keyword: { type: String, required: true },
  blogSlug: { type: String, required: true },
  checkedAt: { type: Date, default: Date.now },
  position: { type: Number, default: 0 },
  positionDelta7d: { type: Number, default: 0 },
  positionDelta30d: { type: Number, default: 0 },
  serpFeatures: [{ type: String }],
  estimatedMonthlyTraffic: { type: Number, default: 0 },
  source: { type: String, enum: ["dataforseo", "gsc_proxy"], default: "gsc_proxy" },
});

KeywordRankHistorySchema.index({ keyword: 1, checkedAt: -1 });
KeywordRankHistorySchema.index({ blogSlug: 1, checkedAt: -1 });

const KeywordRankHistory: Model<IKeywordRankHistoryDocument> =
  mongoose.models.KeywordRankHistory ??
  mongoose.model<IKeywordRankHistoryDocument>("KeywordRankHistory", KeywordRankHistorySchema);
export default KeywordRankHistory;
