import { NextResponse } from 'next/server';
import CustomerModel from '@/models/Customer';
import connectDB from '@/lib/mongodb';

export async function POST(req: Request) {
  const { data } = await req.json();
  
  if (!data || typeof data !== 'string') {
    return NextResponse.json({ error: 'داده‌ای ارسال نشده' }, { status: 400 });
  }

  await connectDB();

  const lines = data.split('\n').filter(line => line.trim());
  const results = { success: 0, skipped: 0, errors: [] as string[] };

  for (const line of lines) {
    // پترن: "نام خانوادگی 09xxxxxxxxx" یا "نام خانوادگی: 09xxxxxxxxx"
    const match = line.match(/(.+?)[:\s]+(09\d{9})/);
    
    if (!match) {
      results.errors.push(`فرمت نامعتبر: ${line}`);
      continue;
    }

    const lastName = match[1].trim();
    const phone = match[2];

    // چک تکراری
    const exists = await CustomerModel.findOne({ phone });
    if (exists) {
      results.skipped++;
      continue;
    }

    try {
      await CustomerModel.create({
        first_name: '',
        last_name: lastName,
        phone,
        created_at: new Date(),
      });
      results.success++;
    } catch {
      results.errors.push(`خطا در ثبت: ${line}`);
    }
  }

  return NextResponse.json(results);
}