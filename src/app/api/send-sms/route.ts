import { NextResponse } from "next/server";
import { getAllPhones } from "@/lib/db";
import { sendSms } from "@/lib/sms";

export async function POST(req: Request) {
  const { text } = await req.json();

  if (!text) {
    return NextResponse.json({ error: "متن پیام الزامی است" }, { status: 400 });
  }

  const phones = await getAllPhones();
  if (phones.length === 0) {
    return NextResponse.json({ error: "هیچ شماره‌ای موجود نیست" }, { status: 400 });
  }

  const numbersList = phones.join(",");
  await sendSms(numbersList, text);

  return NextResponse.json({ success: true });
}