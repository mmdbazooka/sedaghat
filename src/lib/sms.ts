export async function sendSms(to: string, text: string) {
  try {
    const apiKey = process.env.MELIPAYAMAK_API_KEY;
    const from = process.env.MELIPAYAMAK_FROM;

    // تبدیل رشته "0912xxx,0935xxx" به آرایه
    const toArray = to.split(",").map((num) => num.trim());

    const response = await fetch(
      `https://console.melipayamak.com/api/send/advanced/${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: from,
          to: toArray,
          text: text,
          udh: "",
        }),
      }
    );

    const resultText = await response.text();
    console.log("SMS Raw:", resultText);

    if (!resultText) {
      return { success: true };
    }

    try {
      const result = JSON.parse(resultText);
      console.log("SMS Result:", result);
      return { success: result.status === "success" || !!result.recId };
    } catch {
      const isSuccess = /^\d+/.test(resultText.trim());
      return { success: isSuccess };
    }
  } catch (error) {
    console.error("SMS Error:", error);
    return { success: false, error: "ارسال پیامک ناموفق بود" };
  }
}