import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  first_name: string;
  last_name: string;
  phone: string;
  created_at: Date;
}

const CustomerSchema = new Schema<ICustomer>({
  first_name: { type: String, default: "" },
  last_name: { type: String, default: "" },
  phone: { type: String, required: true, unique: true },
  created_at: { type: Date, default: Date.now },
});

export default mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);