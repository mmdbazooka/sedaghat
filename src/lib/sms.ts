export async function sendSms(to: string, text: string) {
  try {
    const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.MELIPAYAMAK_USERNAME,
        password: process.env.MELIPAYAMAK_PASSWORD,
        from: process.env.MELIPAYAMAK_FROM,
        to: to,
        text: text,
      }),
    });
    const result = await response.json();
    return { success: result.RetStatus === 1 };
  } catch (error) {
    return { success: false };
  }
}