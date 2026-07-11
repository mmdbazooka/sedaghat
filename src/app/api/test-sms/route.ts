import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.MELIPAYAMAK_API_KEY;
  const from = process.env.MELIPAYAMAK_FROM;

  const response = await fetch(
    `https://rest.payamak-panel.com/api/SmartSMS/Send`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username : "9118934898",
        password : apiKey,
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