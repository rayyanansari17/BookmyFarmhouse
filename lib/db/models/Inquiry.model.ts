import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInquiryDocument extends Document {
  propertyId: mongoose.Types.ObjectId;
  vendorId: mongoose.Types.ObjectId;
  customer: {
    name: string;
    phone: string;
    email: string;
  };
  eventDate: Date;
  guestCount: number;
  eventType: "birthday" | "wedding" | "corporate" | "reunion" | "photoshoot" | "other";
  message?: string;
  status: "new" | "contacted" | "converted" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

const InquirySchema = new Schema<IInquiryDocument>(
  {
    propertyId: { type: Schema.Types.ObjectId, ref: "Property", required: true, index: true },
    // Denormalized for efficient vendor-dashboard queries without a join
    vendorId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    customer: {
      name: { type: String, required: true, minlength: 2, trim: true },
      phone: {
        type: String,
        required: true,
        match: [/^[6-9]\d{9}$/, "Invalid Indian phone number"],
      },
      email: { type: String, required: true, lowercase: true, trim: true },
    },
    eventDate: {
      type: Date,
      required: true,
      validate: {
        validator: (v: Date) => v > new Date(),
        message: "Event date must be in the future",
      },
    },
    guestCount: { type: Number, required: true, min: 1 },
    eventType: {
      type: String,
      enum: ["birthday", "wedding", "corporate", "reunion", "photoshoot", "other"],
      required: true,
    },
    message: { type: String, maxlength: 500 },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
    },
  },
  { timestamps: true }
);

InquirySchema.index({ vendorId: 1, status: 1 });
InquirySchema.index({ propertyId: 1, vendorId: 1 });
InquirySchema.index({ createdAt: -1 });
InquirySchema.index({ "customer.email": 1, createdAt: -1 });

const Inquiry: Model<IInquiryDocument> =
  mongoose.models.Inquiry ??
  mongoose.model<IInquiryDocument>("Inquiry", InquirySchema);

export default Inquiry;
