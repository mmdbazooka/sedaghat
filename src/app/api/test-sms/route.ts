import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.MELIPAYAMAK_API_KEY;
  const from = process.env.MELIPAYAMAK_FROM;

  const response = await fetch(
    `https://console.melipayamak.com/api/send/simple/2f5d4565-fe40-468b-bf53-2434fcbe3c98`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        from: from,
        to: "09027912478",
        text: "تست پیامک از قالیشویی صداقت",
      }),
    }
  );

  const status = response.status;
  const text = await response.text();

  return NextResponse.json({
    status,
    text,
    apiKey,
    from,
  });
}