import { NextResponse } from 'next/server';
import { addInvoice, generateInvoiceNumber, getCustomerById, getInvoices } from '@/lib/db';
import type { OrderStatus, PaymentStatus } from '@/lib/db';
import { sendSingleSms } from '@/lib/sms-single';

interface InvoiceItemInput {
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

export async function GET() {
  const invoices = await getInvoices();
  return NextResponse.json(invoices);
}

export async function POST(req: Request) {
  const body = await req.json();
  const {
    customer_id,
    items,
    delivery_price,
    service_type,
    discount_percent,
    order_status,
    payment_status,
    delivery_date,
    address,
    note,
  } = body as {
    customer_id: string;
    items: InvoiceItemInput[];
    delivery_price: number;
    service_type: string;
    discount_percent: number;
    order_status: OrderStatus;
    payment_status: PaymentStatus;
    delivery_date: string;
    address: string;
    note: string;
  };

  if (!customer_id || !items || items.length === 0) {
    return NextResponse.json({ error: 'اطلاعات فاکتور ناقص است' }, { status: 400 });
  }

  const customer = await getCustomerById(customer_id);
  if (!customer) {
    return NextResponse.json({ error: 'مشتری یافت نشد' }, { status: 404 });
  }

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const totalWithDelivery = subtotal + (delivery_price || 0);
  const discountAmount = (totalWithDelivery * (discount_percent || 0)) / 100;
  const finalAmount = totalWithDelivery - discountAmount;
  const invoiceNumber = await generateInvoiceNumber();

  const newInvoice = await addInvoice({
    invoice_number: invoiceNumber,
    customer_id: customer.id,
    customer_name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || 'بدون نام',
    customer_phone: customer.phone,
    service_type: service_type || 'carpet',
    items: items.map((item) => ({
      type: item.type,
      carpet_type: item.carpet_type,
      square_meters: item.square_meters,
      unit_price: item.unit_price,
      pricing_mode: item.pricing_mode,
      quantity: item.quantity,
      total: item.total,
      extra_services: item.extra_services || {},
    })),
    delivery_price: delivery_price || 0,
    subtotal,
    total_with_delivery: totalWithDelivery,
    discount_percent: discount_percent || 0,
    discount_amount: discountAmount,
    final_amount: finalAmount,
    order_status: order_status || 'registered',
    payment_status: payment_status || 'pending',
    delivery_date: delivery_date || '',
    address: address || '',
    note: note || '',
  });

  // ====== ساخت متن پیامک ======
  const itemsSummary = items
    .map((item) => {
      const extraServices = [];
      if (item.extra_services?.stain_removal?.enabled) {
        extraServices.push(`لکه‌برداری ${item.extra_services.stain_removal.price.toLocaleString()}`);
      }
      if (item.extra_services?.double_wash?.enabled) {
        extraServices.push(`دوبار شو ${item.extra_services.double_wash.price.toLocaleString()}`);
      }
      if (item.extra_services?.premium_wash?.enabled) {
        extraServices.push(`اعلا شور ${item.extra_services.premium_wash.price.toLocaleString()}`);
      }
      const extraText = extraServices.length > 0 ? ` (${extraServices.join("، ")})` : "";
      const qtyText = item.quantity > 1 ? ` (${item.quantity} عدد)` : "";
      return `• ${item.carpet_type}${qtyText}\n  ${item.total.toLocaleString()} تومان${extraText}`;
    })
    .join("\n");

  let smsText = `قالیشویی و مبل شویی صداقت\n\n${itemsSummary}\n`;

  if (discount_percent > 0) {
    smsText += `\nتخفیف: ${discount_percent}٪`;
  }

  smsText += `\n\nمبلغ کل: ${finalAmount.toLocaleString()} تومان`;

  if (payment_status === "pending") {
    smsText += `\n\nشماره کارت:\n6037-9982-1592-2260\nبه نام سمیه ولی`;
  } else if (payment_status === "cash_on_delivery") {
    smsText += `\nپرداخت در محل`;
  }

  if (delivery_date) {
    const d = new Date(delivery_date);
    const persianDate = new Intl.DateTimeFormat("fa-IR").format(d);
    smsText += `\n\nتاریخ تحویل: ${persianDate}`;
  }

  smsText += `\n\nبا مدیریت خانم مهندس ولی`;

  // ====== ارسال پیامک ======
  await sendSingleSms(customer.phone, smsText);

  return NextResponse.json(newInvoice, { status: 201 });
}