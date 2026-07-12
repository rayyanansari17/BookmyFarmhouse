import mongoose, { Model, Schema } from "mongoose";

export type LogAction = "LOGIN" | "LOGOUT" | "CREATE" | "READ" | "UPDATE" | "DELETE";

export interface IRequestLog {
  _id: string;
  action: LogAction;
  method: string;
  path: string;
  status: number | null;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  userRole: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface IRequestLogDocument extends Omit<IRequestLog, "_id" | "createdAt"> {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
}

const RequestLogSchema = new Schema<IRequestLogDocument>(
  {
    action: { type: String, enum: ["LOGIN", "LOGOUT", "CREATE", "READ", "UPDATE", "DELETE"], required: true },
    method: { type: String, required: true },
    path: { type: String, required: true },
    status: { type: Number, default: null },
    userId: { type: String, default: null },
    userName: { type: String, default: null },
    userEmail: { type: String, default: null },
    userRole: { type: String, default: null },
    ipAddress: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

RequestLogSchema.index({ createdAt: -1 });
// Auto-expire logs after 90 days
RequestLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7_776_000 });

const RequestLog: Model<IRequestLogDocument> =
  mongoose.models.RequestLog ??
  mongoose.model<IRequestLogDocument>("RequestLog", RequestLogSchema);

export default RequestLog;
