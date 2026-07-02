"use client";
import { useState } from "react";
import { Upload, X } from "lucide-react";

export default function BulkImportForm({ onImported }: { onImported: () => void }) {
  const [data, setData] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: number; skipped: number; errors: string[] } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/customers/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });

    const json = await res.json();
    setResult(json);
    setLoading(false);
    
    if (json.success > 0) {
      setData("");
      onImported();
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-100">
      <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
        <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
        وارد کردن گروهی مشتریان
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs text-gray-500 mb-2">
            فرمت: هر خط = <code className="bg-gray-100 px-1 rounded">نام‌خانوادگی 09xxxxxxxxx</code>
          </p>
          <textarea
            value={data}
            onChange={(e) => setData(e.target.value)}
            placeholder={`ابراهیمی 09119568573\nاکبرزاده 09925357715\nحاجی پور 09336721523`}
            rows={10}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 font-mono"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || !data.trim()}
          className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? "در حال وارد کردن..." : `وارد کردن مشتریان`}
        </button>
      </form>

      {/* نتیجه */}
      {result && (
        <div className="mt-4 p-3 bg-gray-50 rounded-xl text-sm space-y-1">
          <p className="text-green-600">✅ {result.success} مشتری با موفقیت ثبت شد</p>
          {result.skipped > 0 && <p className="text-yellow-600">⚠️ {result.skipped} شماره تکراری رد شد</p>}
          {result.errors.length > 0 && (
            <div className="text-red-600">
              <p>❌ {result.errors.length} خطا:</p>
              <ul className="list-disc list-inside text-xs mt-1 max-h-32 overflow-y-auto">
                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}
          <button onClick={() => setResult(null)} className="text-gray-400 hover:text-gray-600 mt-1 flex items-center gap-1 text-xs"><X className="w-3 h-3" />بستن</button>
        </div>
      )}
    </div>
  );
}