import { NextResponse } from "next/server";
import { getAllPhones } from "@/lib/db";
import { sendBulkSms } from "@/lib/sms-bulk";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "متن پیام الزامی است" }, { status: 400 });
  }

  const phones = await getAllPhones();
  if (phones.length === 0) {
    return NextResponse.json({ error: "هیچ شماره‌ای موجود نیست" }, { status: 400 });
  }

  const result = await sendBulkSms(phones, text);
  console.log("Bulk SMS Result:", result);

  return NextResponse.json({ success: result.success });
}