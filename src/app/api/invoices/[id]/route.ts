import { NextResponse } from "next/server";
import { getInvoiceById, updateInvoice, deleteInvoice } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "فاکتور یافت نشد" }, { status: 404 });
  }
  return NextResponse.json(invoice);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const updated = await updateInvoice(id, body);
  if (!updated) {
    return NextResponse.json({ error: "فاکتور یافت نشد" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteInvoice(id);
  return NextResponse.json({ success: true });
}