export async function sendBulkSms(phones: string[], text: string) {
  try {
    const username = process.env.MELIPAYAMAK_USERNAME;
    const apiKey = process.env.MELIPAYAMAK_API_KEY;
    const from = process.env.MELIPAYAMAK_FROM;
    const to = phones.join(",");

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
    console.log("SMS Bulk Result:", result);

    return { success: result.RetStatus === 1, messageId: result.Value };
  } catch (error) {
    console.error("SMS Bulk Error:", error);
    return { success: false, error: "ارسال پیامک گروهی ناموفق بود" };
  }
}