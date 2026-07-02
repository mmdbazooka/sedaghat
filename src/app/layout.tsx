import { Peyda } from "@/utils/fonts/fonts";
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "قالیشویی صداقت",
  description: "پنل مدیریت مشتریان",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className={`bg-linear-to-br from-blue-50 via-white to-blue-100 min-h-screen font-sans text-gray-800 ${Peyda.variable}`}>
        <header className="bg-linear-to-r from-blue-700 to-blue-900 text-white shadow-xl">
          <div className="container mx-auto px-4 py-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <h1 className="text-2xl font-extrabold tracking-tight">
                قالیشویی و مبل شویی صداقت
              </h1>
            </div>
            <span className="text-blue-200 text-sm">مدیریت هوشمند مشتریان</span>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {children}
        </main>
      </body>
    </html>
  );
}
