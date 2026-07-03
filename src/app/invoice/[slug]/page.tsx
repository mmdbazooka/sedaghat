import { getInvoices, Invoice } from "@/lib/db";
import { PhoneCall } from "lucide-react";
import { notFound } from "next/navigation";
import { Fragment } from "react/jsx-runtime";

interface ItemType {
  carpet_type?: string;
  square_meters?: number;
  unit_price?: number;
  pricing_mode?: string;
  quantity?: number;
  total?: number;
  extra_services?: {
    stain_removal?: { enabled: boolean; price: number };
    double_wash?: { enabled: boolean; price: number };
    premium_wash?: { enabled: boolean; price: number };
  };
}

const orderStatusLabels: Record<string, string> = {
  registered: "ثبت شده",
  received: "تحویل گرفته شد",
  washing: "در حال شستشو",
  drying: "در حال خشک‌شویی",
  ready: "آماده تحویل",
  delivered: "تحویل داده شد",
  cancelled: "لغو شده",
};

const orderStatusColors: Record<string, string> = {
  registered: "bg-gray-100 text-gray-700",
  received: "bg-cyan-100 text-cyan-700",
  washing: "bg-blue-100 text-blue-700",
  drying: "bg-indigo-100 text-indigo-700",
  ready: "bg-yellow-100 text-yellow-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const invoices = await getInvoices();
  const invoice = invoices.find((inv) => inv.invoice_number === slug) as
    | Invoice
    | undefined;
  if (!invoice) {
    notFound();
  }

  const statusLabels: Record<string, string> = {
    pending: "در انتظار پرداخت",
    paid: "پرداخت شده",
    cash_on_delivery: "پرداخت در محل",
  };

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    paid: "bg-green-100 text-green-800",
    cash_on_delivery: "bg-blue-100 text-blue-800",
  };

  const serviceTypeLabel =
    invoice.service_type === "sofa" ? "شستشوی مبل" : "قالیشویی";

  const hasExtraServices = invoice.items.some(
    (item: ItemType) =>
      item.extra_services?.stain_removal?.enabled ||
      item.extra_services?.double_wash?.enabled ||
      item.extra_services?.premium_wash?.enabled
  );

  return (
    <div
      className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100 py-4 sm:py-8 px-3 sm:px-4"
      dir="rtl"
    >
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-700 to-blue-900 text-white rounded-t-2xl p-4 sm:p-6 text-center">
          <span className="text-3xl sm:text-4xl">✨</span>
          <h1 className="text-xl sm:text-2xl font-bold mt-2">
            قالیشویی و مبل شویی صداقت
          </h1>
          <p className="text-blue-200 mt-1 text-sm sm:text-base">فاکتور رسمی</p>
        </div>

        <div className="bg-white shadow-2xl rounded-b-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 flex flex-col items-center gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 flex items-center justify-center gap-1 mb-1">
                <PhoneCall className="size-4" />
                دفتر
              </p>
              <p className="text-xl sm:text-2xl font-extrabold text-blue-800">
                ۰۱۱۳۳۳۹۲۰۶۸
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-6 w-full border-t border-blue-200 pt-3">
              <p className="text-base sm:text-lg font-bold text-blue-700">
                ۰۹۱۹۳۳۱۶۳۵۴
              </p>
              <p className="text-base sm:text-lg font-bold text-blue-700">
                ۰۹۲۲۳۶۸۴۱۲۵
              </p>
              <p className="text-base sm:text-lg font-bold text-blue-700">
                ۰۹۲۲۳۲۸۷۳۲۳
              </p>
            </div>
          </div>

          {/* Invoice Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 border-b pb-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500">شماره فاکتور</p>
              <p className="text-lg sm:text-xl font-bold text-blue-800 break-all">
                {invoice.invoice_number}
              </p>
            </div>
            <div className="sm:text-left">
              <p className="text-xs sm:text-sm text-gray-500">تاریخ</p>
              <p className="text-sm sm:text-base font-medium">
                {new Date(invoice.created_at).toLocaleDateString("fa-IR")}
              </p>
            </div>
          </div>

          {/* Service Type */}
          <div className="bg-blue-50 rounded-xl p-2 sm:p-3 text-center">
            <span className="text-blue-800 text-sm sm:text-base font-bold">
              {serviceTypeLabel}
            </span>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <h3 className="font-bold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">
              اطلاعات مشتری
            </h3>
            <p className="text-base sm:text-lg font-medium">
              {invoice.customer_name}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              {invoice.customer_phone}
            </p>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-bold text-gray-700 mb-2 sm:mb-3 text-sm sm:text-base">
              اقلام فاکتور
            </h3>
            <div className="block sm:hidden space-y-3">
              {invoice.items.map((item: ItemType, index: number) => {
                return (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-xl p-3 border border-gray-100"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium text-sm">
                        {item.carpet_type}
                      </span>
                      <span className="font-bold text-green-700 text-sm">
                        {item.total?.toLocaleString()} تومان
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                      {invoice.service_type !== "sofa" && (
                        <div>
                          <span className="text-gray-400">متراژ: </span>
                          {item.square_meters && item.square_meters > 0
                            ? item.square_meters
                            : "-"}
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">قیمت: </span>
                        {item.pricing_mode === "meter"
                          ? `${item.unit_price?.toLocaleString()} متری`
                          : item.unit_price?.toLocaleString()}
                      </div>
                      <div>
                        <span className="text-gray-400">تعداد: </span>
                        {item.quantity}
                      </div>
                    </div>
                    {/* خدمات اضافه - موبایل */}
                    <div className="mt-2 pt-2 border-t border-gray-200 space-y-1">
                      {item.extra_services?.stain_removal?.enabled && (
                        <p className="text-xs text-gray-500">
                          🧹 لکه‌برداری:{" "}
                          {item.extra_services.stain_removal.price?.toLocaleString()}{" "}
                          تومان
                        </p>
                      )}
                      {item.extra_services?.double_wash?.enabled && (
                        <p className="text-xs text-gray-500">
                          🔄 دوبار شو:{" "}
                          {item.extra_services.double_wash.price?.toLocaleString()}{" "}
                          تومان
                        </p>
                      )}
                      {item.extra_services?.premium_wash?.enabled && (
                        <p className="text-xs text-gray-500">
                          ✨ اعلا شور:{" "}
                          {item.extra_services.premium_wash.price?.toLocaleString()}{" "}
                          تومان
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b-2 border-blue-200 text-blue-800">
                    <th className="py-2 px-2 text-sm">نوع</th>
                    {invoice.service_type !== "sofa" && (
                      <th className="py-2 px-2 text-center text-sm">متراژ</th>
                    )}
                    <th className="py-2 px-2 text-sm">قیمت واحد</th>
                    <th className="py-2 px-2 text-center text-sm">تعداد</th>
                    <th className="py-2 px-2 text-sm">جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: ItemType, index: number) => (
                    <Fragment key={index}>
                      {/* ردیف اصلی آیتم */}
                      <tr className="border-b border-gray-100">
                        <td className="py-3 px-2 text-sm">
                          {item.carpet_type}
                        </td>
                        {invoice.service_type !== "sofa" && (
                          <td className="py-3 px-2 text-center text-sm">
                            {item.square_meters && item.square_meters > 0
                              ? item.square_meters
                              : "-"}
                          </td>
                        )}
                        <td className="py-3 px-2 text-sm">
                          {item.pricing_mode === "meter"
                            ? `${item.unit_price?.toLocaleString()} (متری)`
                            : item.unit_price?.toLocaleString()}
                        </td>
                        <td className="py-3 px-2 text-center text-sm">
                          {item.quantity}
                        </td>
                        <td className="py-3 px-2 font-medium text-sm">
                          {item.total?.toLocaleString()}
                        </td>
                      </tr>

                      {/* ردیف خدمات اضافه - فقط برای همین آیتم */}
                      {(item.extra_services?.stain_removal?.enabled ||
                        item.extra_services?.double_wash?.enabled ||
                        item.extra_services?.premium_wash?.enabled) && (
                        <tr className="bg-gray-50">
                          <td
                            colSpan={invoice.service_type !== "sofa" ? 5 : 4}
                            className="py-2 px-2"
                          >
                            <div className="text-xs text-gray-500 flex gap-4">
                              {item.extra_services?.stain_removal?.enabled && (
                                <span>
                                  🧹 لکه‌برداری:{" "}
                                  {item.extra_services.stain_removal.price?.toLocaleString()}{" "}
                                  تومان
                                </span>
                              )}
                              {item.extra_services?.double_wash?.enabled && (
                                <span>
                                  🔄 دوبار شو:{" "}
                                  {item.extra_services.double_wash.price?.toLocaleString()}{" "}
                                  تومان
                                </span>
                              )}
                              {item.extra_services?.premium_wash?.enabled && (
                                <span>
                                  ✨ اعلا شور:{" "}
                                  {item.extra_services.premium_wash.price?.toLocaleString()}{" "}
                                  تومان
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="bg-blue-50 rounded-xl p-3 sm:p-4 space-y-2">
            <div className="flex justify-between text-sm sm:text-base">
              <span>جمع اقلام:</span>
              <span className="font-medium">
                {invoice.subtotal?.toLocaleString()} تومان
              </span>
            </div>
            {invoice.delivery_price > 0 && (
              <div className="flex justify-between text-sm sm:text-base">
                <span>کرایه حمل:</span>
                <span className="font-medium">
                  {invoice.delivery_price?.toLocaleString()} تومان
                </span>
              </div>
            )}
            <div className="flex justify-between border-t border-blue-200 pt-2 text-sm sm:text-base">
              <span>جمع با کرایه:</span>
              <span className="font-medium">
                {invoice.total_with_delivery?.toLocaleString()} تومان
              </span>
            </div>
            {invoice.discount_percent > 0 && (
              <div className="flex justify-between text-red-600 text-sm sm:text-base">
                <span>تخفیف ({invoice.discount_percent}%):</span>
                <span>-{invoice.discount_amount?.toLocaleString()} تومان</span>
              </div>
            )}
            <div className="flex justify-between text-base sm:text-lg font-extrabold text-green-700 border-t border-blue-200 pt-2">
              <span>مبلغ قابل پرداخت:</span>
              <span>{invoice.final_amount?.toLocaleString()} تومان</span>
            </div>

            {/* شماره کارت */}
            <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-3 sm:p-4 mt-3 text-center space-y-2">
              <p className="text-sm sm:text-base font-bold text-blue-800">
                💳 اطلاعات پرداخت
              </p>
              <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-inner">
                <code
                  className="text-lg sm:text-xl font-extrabold text-blue-700 tracking-wider select-all break-all"
                  dir="ltr"
                >
                  6037-9982-1592-2260
                </code>
              </div>
              <p className="text-sm sm:text-base font-medium text-gray-700">
                به نام:{" "}
                <span className="text-blue-800 font-bold">سمیه ولی</span>
              </p>
            </div>
          </div>

          {/* Status & Delivery */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                وضعیت سفارش
              </p>
              <span
                className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                  orderStatusColors[invoice.order_status]
                }`}
              >
                {orderStatusLabels[invoice.order_status]}
              </span>
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-500 mb-1">
                وضعیت پرداخت
              </p>
              <span
                className={`inline-block px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium ${
                  statusColors[invoice.payment_status]
                }`}
              >
                {statusLabels[invoice.payment_status]}
              </span>
            </div>
            {invoice.delivery_date && (
              <div>
                <p className="text-xs sm:text-sm text-gray-500 mb-1">
                  تاریخ تحویل
                </p>
                <p className="text-sm sm:text-base font-medium">
                  {new Date(invoice.delivery_date).toLocaleDateString("fa-IR")}
                </p>
              </div>
            )}
          </div>

          {/* Address */}
          {invoice.address && (
            <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
              <h3 className="font-bold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">
                آدرس
              </h3>
              <p className="text-sm sm:text-base">{invoice.address}</p>
            </div>
          )}

          {/* Note */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4 space-y-2">
            <p className="text-xs sm:text-sm text-red-600 leading-relaxed">
              به دلیل متغیر بودن رانندگان، درصورت عدم تماس و هماهنگی با دفتر،
              هیچگونه مسئولیتی پذیرفته نمی‌شود
            </p>
            <p className="text-xs sm:text-sm leading-relaxed">
              هرگونه پوسیدگی که منجر به پارگی شود به عهده این موسسه نمی‌باشد
            </p>
            <p className="text-xs sm:text-sm leading-relaxed">
              بعد از خروج پرسنل هیچگونه مسئولیتی به عهده این قالیشویی نمی‌باشد
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-4 sm:mt-6 text-gray-400 text-xs sm:text-sm">
          <p>قالیشویی صداقت - با تشکر از اعتماد شما</p>
          <p>این فاکتور به صورت آنلاین صادر شده است</p>
        </div>
      </div>
    </div>
  );
}
