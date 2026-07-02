"use client";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function AddCustomerForm({
  onCustomerAdded,
}: {
  onCustomerAdded: () => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, phone }),
    });
    const data = await res.json();
    if (res.ok) {
      setMsg({
        type: "success",
        text: "✅ مشتری با موفقیت ثبت شد", // ← تغییر
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      onCustomerAdded();
    } else {
      setMsg({ type: "error", text: `❌ ${data.error}` });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center gap-2 mb-4">
        <Plus className="w-5 h-5 sm:w-6 sm:h-6" /> افزودن مشتری جدید
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
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <input
          placeholder="نام (اختیاری)"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          placeholder="نام خانوادگی (اختیاری)"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
        />
        <input
          placeholder="شماره موبایل * 09xxxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-400 outline-none"
          required
        />
        <button
          type="submit"
          className="md:col-span-3 bg-linear-to-r cursor-pointer from-blue-600 to-blue-700 text-white font-semibold py-3 rounded-xl hover:shadow-lg transition"
        >
          ثبت مشتری
        </button>
      </form>
    </div>
  );
}
