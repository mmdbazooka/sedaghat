import { NextResponse } from 'next/server';
import { getCustomers, addCustomer, getCustomerByPhone, deleteCustomer } from '@/lib/db';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  
  const data = await getCustomers(page, limit);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const { firstName, lastName, phone } = await req.json();

  if (!phone || !/^09\d{9}$/.test(phone)) {
    return NextResponse.json(
      { error: 'شماره موبایل معتبر نیست (باید با ۰۹ شروع و ۱۱ رقم باشد)' },
      { status: 400 }
    );
  }

  const exists = await getCustomerByPhone(phone);
  if (exists) {
    return NextResponse.json(
      { error: 'این شماره قبلاً ثبت شده است' },
      { status: 409 }
    );
  }

  const newCustomer = await addCustomer({ 
    first_name: firstName || '',
    last_name: lastName || '',
    phone,
    created_at: new Date(),
  });

  return NextResponse.json(newCustomer, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  
  if (!id) {
    return NextResponse.json({ error: "آیدی مشتری الزامی است" }, { status: 400 });
  }

  await deleteCustomer(id);
  return NextResponse.json({ success: true });
}