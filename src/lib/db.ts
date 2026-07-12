import connectDB from "./mongodb";
import CustomerModel from "@/models/Customer";
import InvoiceModel from "@/models/Invoice";
import type { IInvoice, IInvoiceItem } from "@/models/Invoice";

// ====== TYPES ======

export type OrderStatus = 
  | 'registered'
  | 'received'
  | 'washing'
  | 'drying'
  | 'ready'
  | 'delivered'
  | 'cancelled';

export type PaymentStatus = 'pending' | 'paid' | 'cash_on_delivery';

export interface Invoice {
  id: string;
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
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_date: string;
  address: string;
  created_at: string;
  note: string;
}

// ====== CUSTOMER FUNCTIONS ======

export async function getCustomers(page: number = 1, limit: number = 10) {
  await connectDB();
  const skip = (page - 1) * limit;
  const [customers, total] = await Promise.all([
    CustomerModel.find().sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    CustomerModel.countDocuments(),
  ]);
  return { customers, total };
}

export async function addCustomer(customer: {
  first_name: string;
  last_name: string;
  phone: string;
  created_at: Date;
}) {
  await connectDB();
  return CustomerModel.create(customer);
}

export async function getCustomerByPhone(phone: string) {
  await connectDB();
  return CustomerModel.findOne({ phone }).lean();
}

export async function getCustomerById(id: string) {
  await connectDB();
  const customer = await CustomerModel.findById(id).lean();
  if (!customer) return null;
  return {
    ...customer,
    id: customer._id ? customer._id.toString() : "",
  };
}

export async function getAllPhones(): Promise<string[]> {
  await connectDB();
  const customers = await CustomerModel.find({}, "phone").lean();
  return customers.map((c) => c.phone);
}

export async function deleteCustomer(id: string) {
  await connectDB();
  return CustomerModel.findByIdAndDelete(id);
}

// ====== INVOICE FUNCTIONS ======

export async function getInvoices() {
  await connectDB();
  return InvoiceModel.find().sort({ created_at: -1 }).lean();
}

export async function getInvoiceById(id: string) {
  await connectDB();
  return InvoiceModel.findById(id).lean();
}

export async function addInvoice(invoice: {
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
}) {
  await connectDB();
  const doc = new InvoiceModel(invoice);
  doc.items.forEach((item: IInvoiceItem & { extra_services?: Record<string, unknown> }, idx: number) => {
    if (item.extra_services) {
      doc.markModified(`items.${idx}.extra_services`);
    }
  });
  return doc.save();
}

export async function updateInvoice(id: string, updates: Partial<IInvoice>) {
  await connectDB();
  return InvoiceModel.findByIdAndUpdate(id, updates, { new: true }).lean();
}

export async function deleteInvoice(id: string) {
  await connectDB();
  return InvoiceModel.findByIdAndDelete(id);
}

export async function generateInvoiceNumber(): Promise<string> {
  await connectDB();
  const year = new Date().getFullYear().toString();
  const random = Math.floor(1000 + Math.random() * 9000); 
  const timestamp = Date.now().toString().slice(-4);
  return `SDQ_${year}_${random}${timestamp}`;
}