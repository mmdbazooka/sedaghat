export async function sendSingleSms(to: string, text: string) {
  try {
    const username = process.env.MELIPAYAMAK_USERNAME || "9118934898";
    const apiKey = process.env.MELIPAYAMAK_API_KEY;
    const from = process.env.MELIPAYAMAK_FROM;

    const response = await fetch(
      "https://rest.payamak-panel.com/api/SmartSMS/Send",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username,
          password: apiKey,
          from: from,
          to: to,
          text: text,
        }),
      }
    );

    const result = await response.json();
    console.log("SMS Single Result:", result);

    return { success: result.RetStatus === 1, messageId: result.Value };
  } catch (error) {
    console.error("SMS Single Error:", error);
    return { success: false, error: "ارسال پیامک ناموفق بود" };
  }
}