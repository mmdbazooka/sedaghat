import mongoose, { Schema, Document } from "mongoose";

export interface IInvoiceItem {
  type: string;
  carpet_type: string;
  square_meters: number;
  unit_price: number;
  pricing_mode: string;
  quantity: number;
  total: number;
  extra_services?: {
    stain_removal?: { enabled: boolean; price: number };
    double_wash?: { enabled: boolean; price: number };
    premium_wash?: { enabled: boolean; price: number };
  };
}

export interface IInvoice extends Document {
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  items: IInvoiceItem[];
  delivery_price: number;
  subtotal: number;
  total_with_delivery: number;
  discount_percent: number;
  discount_amount: number;
  final_amount: number;
  order_status: string;
  payment_status: string;
  delivery_date: string;
  address: string;
  note: string;
  created_at: Date;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
  type: { type: String, default: "" },
  carpet_type: { type: String, default: "" },
  square_meters: { type: Number, default: 0 },
  unit_price: { type: Number, default: 0 },
  pricing_mode: { type: String, default: "meter" },
  quantity: { type: Number, default: 1 },
  total: { type: Number, default: 0 },
}, { strict: false, _id: true });

const InvoiceSchema = new Schema<IInvoice>({
  invoice_number: { type: String, required: true, unique: true },
  customer_id: { type: String, required: true },
  customer_name: { type: String, default: "" },
  customer_phone: { type: String, required: true },
  service_type: { type: String, default: "carpet" },
  items: { type: [InvoiceItemSchema], default: [] },
  delivery_price: { type: Number, default: 0 },
  subtotal: { type: Number, default: 0 },
  total_with_delivery: { type: Number, default: 0 },
  discount_percent: { type: Number, default: 0 },
  discount_amount: { type: Number, default: 0 },
  final_amount: { type: Number, default: 0 },
  order_status: { type: String, default: "registered" },
  payment_status: { type: String, default: "pending" },
  delivery_date: { type: String, default: "" },
  address: { type: String, default: "" },
  note: { type: String, default: "" },
  created_at: { type: Date, default: Date.now },
}, { strict: false });

export default mongoose.models.Invoice || mongoose.model<IInvoice>("Invoice", InvoiceSchema);