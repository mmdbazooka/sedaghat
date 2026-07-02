"use client";
import { Text } from "lucide-react";
import { useState } from "react";

export default function BulkSmsForm() {
  const [text, setText] = useState("");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({ type: "success", text: "📨 پیامک گروهی با موفقیت ارسال شد" });
      setText("");
    } else {
      setMsg({ type: "error", text: data.error || "خطا" });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center gap-2 mb-4">
        <Text className="w-5 h-5 sm:w-6 sm:h-6" /> ارسال پیامک به همه مشتریان
      </h3>
      {msg && (
        <div
          className={`mb-4 p-3 rounded-xl text-sm ${
            msg.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-600"
          }`}
        >
          {msg.text}
        </div>
      )}
      <form onSubmit={handleSend}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="متن پیامک خود را بنویسید..."
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none mb-4"
          required
        />
        <button
          type="submit"
          className="bg-linear-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-8 rounded-xl hover:shadow-lg transition"
        >
          ارسال پیامک گروهی
        </button>
      </form>
    </div>
  );
}
