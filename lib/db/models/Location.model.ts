import mongoose, { Schema, Document, Model } from "mongoose";
import { slugify } from "@/lib/utils";

export interface ILocationDocument extends Document {
  city: string;
  state: string;
  slug: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocationDocument>(
  {
    city: { type: String, required: true, unique: true, trim: true },
    state: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

LocationSchema.index({ isActive: 1 });

LocationSchema.pre("save", async function () {
  if (this.isModified("city") || this.isModified("state") || !this.slug) {
    this.slug = slugify(`${this.city} ${this.state}`);
  }
});

const Location: Model<ILocationDocument> =
  mongoose.models.Location ??
  mongoose.model<ILocationDocument>("Location", LocationSchema);

export default Location;
