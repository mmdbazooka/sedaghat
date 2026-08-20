"use client";
import { Copy, FileText, Search } from "lucide-react";
import { useState, useEffect } from "react";

interface Customer {
  _id?: string;
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

export interface InvoiceItem {
  type:
    | "carpet"
    | "sofa"
    | "moquette"
    | "moquette_palaz"
    | "padari"
    | "handwoven";
  carpet_type: string;
  square_meters: number;
  unit_price: number;
  pricing_mode: "meter" | "total";
  quantity: number;
  total: number;
  extra_services?: {
    stain_removal?: { enabled: boolean; price: number }; // لکه‌برداری
    double_wash?: { enabled: boolean; price: number }; // دوبار شو
    premium_wash?: { enabled: boolean; price: number }; // اعلا شور
  };
}

export default function CreateInvoiceForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      type: "carpet",
      carpet_type: "",
      square_meters: 0,
      unit_price: 0,
      pricing_mode: "meter",
      quantity: 1,
      total: 0,
      extra_services: {
        stain_removal: { enabled: false, price: 0 },
        double_wash: { enabled: false, price: 0 },
        premium_wash: { enabled: false, price: 0 },
      },
    },
  ]);
  const [serviceType, setServiceType] = useState<"carpet" | "sofa">("carpet");
  const [deliveryPrice, setDeliveryPrice] = useState(250000);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [generatedSmsText, setGeneratedSmsText] = useState("");
  const [generatedInvoiceNumber, setGeneratedInvoiceNumber] = useState("");
  const [generatedCustomerPhone, setGeneratedCustomerPhone] = useState("");
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>("registered");
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"preset" | "custom">(
    "preset"
  );
  const [customDeliveryPrice, setCustomDeliveryPrice] = useState(0);

  useEffect(() => {
    fetch("/api/customers?page=1&limit=999999")
      .then((res) => res.json())
      .then((data) => setCustomers(data.customers || data));
  }, []);

  // فیلتر مشتریان بر اساس جستجو
  const filteredCustomers = (customers || []).filter(
    (c) =>
      `${c.first_name || ""} ${c.last_name || ""}`.includes(searchTerm) ||
      c.phone.includes(searchTerm)
  );

  // قیمت‌های پیش‌فرض متری
  const meterPrices: Record<string, number> = {
    "2 متری": 105000,
    "4 متری": 105000,
    "6 متری": 105000,
    "9 متری": 105000,
    "12 متری": 105000,
    پادری: 105000,
    "دست بافت": 250000,
    "موکت معمولی": 35500,
    "موکت پالاز": 52500,
    "فرش کناره": 105000,
    "تشک 1 نفره": 2400000,
    "تشک 2 نفره": 3500000,
  };

  // ابعاد هر نوع
  const carpetSizes: Record<string, number> = {
    "2 متری": 2,
    "4 متری": 4,
    "6 متری": 6,
    "9 متری": 9,
    "12 متری": 12,
    پادری: 1,
    "دست بافت": 0,
    "موکت معمولی": 0,
    "موکت پالاز": 0,
    "فرش کناره": 0,
    "تشک 1 نفره": 0,
    "تشک 2 نفره": 0,
  };

  // قیمت مبل
  const sofaPrices: Record<string, number> = {
    "7 نفره": 3500000,
    "8 نفره": 4000000,
    "9 نفره": 4500000,
    نفری: 500000,
  };

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const actualDeliveryPrice =
    deliveryMode === "custom" ? customDeliveryPrice : deliveryPrice;
  const totalWithDelivery = subtotal + actualDeliveryPrice;
  const discountAmount = (totalWithDelivery * discountPercent) / 100;
  const finalAmount = totalWithDelivery - discountAmount;

  const toEnglishNumber = (value: string): string => {
    const persianNumbers = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
    return value.replace(/[۰-۹]/g, (d) => String(persianNumbers.indexOf(d)));
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        type: serviceType,
        carpet_type: serviceType === "sofa" ? "7 نفره" : "",
        square_meters: 0,
        unit_price: serviceType === "sofa" ? sofaPrices["7 نفره"] : 0,
        pricing_mode: serviceType === "sofa" ? "total" : "meter",
        quantity: 1,
        total: serviceType === "sofa" ? sofaPrices["7 نفره"] : 0,
        extra_services: {
          stain_removal: { enabled: false, price: 0 },
          double_wash: { enabled: false, price: 0 },
          premium_wash: { enabled: false, price: 0 },
        },
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const calcTotal = (it: InvoiceItem): number => {
    let base = 0;
    if (serviceType === "sofa" && it.carpet_type === "نفری") {
      it.unit_price = 500000;
      base = it.quantity * 500000;
    } else if (it.pricing_mode === "meter") {
      base = it.quantity * it.square_meters * it.unit_price;
    } else {
      base = it.quantity * it.unit_price;
    }
    if (it.extra_services?.stain_removal?.enabled)
      base += it.extra_services.stain_removal.price || 0;
    if (it.extra_services?.double_wash?.enabled)
      base += it.extra_services.double_wash.price || 0;
    if (it.extra_services?.premium_wash?.enabled)
      base += it.extra_services.premium_wash.price || 0;
    return base;
  };

  const updateItem = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    const updatedItem = { ...newItems[index], [field]: value };

    if (field === "carpet_type") {
      if (serviceType === "sofa") {
        updatedItem.unit_price = sofaPrices[value as string] || 0;
        updatedItem.pricing_mode = "total";
      } else {
        const size = carpetSizes[value as string] || 0;
        if (
          ["موکت معمولی", "موکت پالاز", "دست بافت", "فرش کناره"].includes(
            value as string
          )
        ) {
          updatedItem.square_meters = 0;
        } else if (size > 0) {
          updatedItem.square_meters = size;
        }
        updatedItem.unit_price = meterPrices[value as string] || 0;
        if (["تشک 1 نفره", "تشک 2 نفره"].includes(value as string)) {
          updatedItem.pricing_mode = "total";
        }
      }
    }

    // ✅ استفاده از calcTotal به جای محاسبه دستی
    updatedItem.total = calcTotal(updatedItem);

    newItems[index] = updatedItem;
    setItems(newItems);
  };

  const handleServiceTypeChange = (type: "carpet" | "sofa") => {
    setServiceType(type);
    setItems([
      {
        type: type,
        carpet_type: type === "sofa" ? "7 نفره" : "",
        square_meters: 0,
        unit_price: type === "sofa" ? sofaPrices["7 نفره"] : 0,
        pricing_mode: "total",
        quantity: 1,
        total: type === "sofa" ? sofaPrices["7 نفره"] : 0,
      },
    ]);
  };

  const getPersianDays = (year: number, month: number) => {
    const daysInMonth =
      month <= 6 ? 31 : month <= 11 ? 30 : year % 4 === 3 ? 30 : 29;
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    const firstDayDate = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDayDate.getDay() + 1;
    const offset = firstDayOfWeek >= 7 ? 0 : firstDayOfWeek;
    for (let i = 0; i < offset; i++) {
      days.unshift(0);
    }
    return days;
  };

  const [calendarYear, setCalendarYear] = useState(() => {
    const now = new Date();
    const gYear = now.getFullYear();
    const nowruz = new Date(gYear, 2, 21);
    const persianYear = nowruz <= now ? gYear - 621 : gYear - 622;

    return persianYear;
  });

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    const gYear = now.getFullYear();
    const nowruz = new Date(gYear, 2, 21);
    const diff = Math.floor(
      (now.getTime() - nowruz.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff < 0) {
      return 12;
    }

    const persianMonths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    let remaining = diff;
    let month = 1;

    for (let i = 0; i < 12; i++) {
      if (remaining < persianMonths[i]) {
        month = i + 1;
        break;
      }
      remaining -= persianMonths[i];
    }

    return month;
  });

  const convertToGregorian = (dateStr: string): string => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("/").map(Number);
    const persianMonths = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
    const gYear = year + 621;
    let days = 0;

    for (let i = 0; i < month - 1; i++) {
      days += persianMonths[i];
    }
    days += day - 1;

    const gDate = new Date(gYear, 2, 21);
    gDate.setDate(gDate.getDate() + days);

    const gy = gDate.getFullYear();
    const gm = String(gDate.getMonth() + 1).padStart(2, "0");
    const gd = String(gDate.getDate()).padStart(2, "0");

    return `${gy}-${gm}-${gd}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formattedDate = convertToGregorian(deliveryDate);

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: selectedCustomer,
        items,
        delivery_price: actualDeliveryPrice,
        service_type: serviceType,
        discount_percent: discountPercent,
        order_status: orderStatus,
        payment_status: paymentStatus,
        delivery_date: formattedDate,
        address,
        note,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (res.ok) {
      const itemsSummary = items
        .map((item) => {
          const extraServices = [];
          if (item.extra_services?.stain_removal?.enabled) {
            extraServices.push(
              `لکه‌برداری ${item.extra_services.stain_removal.price.toLocaleString()}`
            );
          }
          if (item.extra_services?.double_wash?.enabled) {
            extraServices.push(
              `دوبار شو ${item.extra_services.double_wash.price.toLocaleString()}`
            );
          }
          if (item.extra_services?.premium_wash?.enabled) {
            extraServices.push(
              `اعلا شور ${item.extra_services.premium_wash.price.toLocaleString()}`
            );
          }

          const extraText =
            extraServices.length > 0 ? ` (${extraServices.join("، ")})` : "";
          const qtyText = item.quantity > 1 ? ` (${item.quantity} عدد)` : "";
          return `• ${
            item.carpet_type
          }${qtyText}\n  ${item.total.toLocaleString()} تومان${extraText}`;
        })
        .join("\n");

      let smsText = `قالیشویی و مبل شویی صداقت\n\n${itemsSummary}\n`;

      if (discountPercent > 0) {
        smsText += `\nتخفیف: ${discountPercent}٪`;
      }

      smsText += `\n\nمبلغ کل: ${finalAmount.toLocaleString()} تومان`;

      if (paymentStatus === "pending") {
        smsText += `\n\nشماره کارت:\n6037-9982-1592-2260\nبه نام سمیه ولی`;
      } else if (paymentStatus === "cash_on_delivery") {
        smsText += `\nپرداخت در محل`;
      }

      if (deliveryDate) {
        smsText += `\n\nتاریخ تحویل: ${deliveryDate}`;
      }

      smsText += `\n\nبا مدیریت خانم مهندس ولی`;

      const phone =
        customers.find((c) => (c._id?.toString() || c.id) === selectedCustomer)
          ?.phone || "";

      setGeneratedSmsText(smsText);
      setGeneratedInvoiceNumber(data.invoice_number);
      setGeneratedCustomerPhone(phone);

      setMsg({
        type: "success",
        text: `✅ فاکتور ${data.invoice_number} با موفقیت صادر شد`,
      });
      setItems([
        {
          type: "carpet",
          carpet_type: "",
          square_meters: 0,
          unit_price: 0,
          pricing_mode: "meter",
          quantity: 1,
          total: 0,
        },
      ]);
      setSelectedCustomer("");
      setSearchTerm("");
      setDeliveryPrice(250000);
      setDeliveryMode("preset");
      setCustomDeliveryPrice(0);
      setDiscountPercent(0);
      setPaymentStatus("pending");
      setDeliveryDate("");
      setShowCalendar(false);
      setOrderStatus("registered");
      setAddress("");
      setNote("");
    } else {
      setMsg({ type: "error", text: `❌ ${data.error}` });
    }
  };

  const getItemOptions = () => {
    return [
      "2 متری",
      "4 متری",
      "6 متری",
      "9 متری",
      "12 متری",
      "پادری",
      "دست بافت",
      "موکت معمولی",
      "موکت پالاز",
      "فرش کناره",
      "تشک 1 نفره",
      "تشک 2 نفره",
    ];
  };

  const sofaOptions = ["7 نفره", "8 نفره", "9 نفره", "نفری"];

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-blue-100">
      <h3 className="text-xl font-bold text-blue-800 mb-6 flex items-center gap-2">
        <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
        صدور فاکتور جدید
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* انتخاب مشتری با جستجو */}
        {/* انتخاب مشتری با جستجو */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            انتخاب مشتری *
          </label>

          {/* input جستجو */}
          <div className="relative">
            <Search className="w-4.5 h-4.5 absolute right-3 top-2.5" />
            <input
              type="text"
              placeholder="جستجوی مشتری بر اساس نام، نام خانوادگی یا شماره..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedCustomer(""); // با تایپ کردن، انتخاب قبلی پاک بشه
              }}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* dropdown نتایج - فقط وقتی searchTerm خالی نیست و مشتری انتخاب نشده */}
          {searchTerm && !selectedCustomer && (
            <div className="border border-gray-200 rounded-xl mt-1 max-h-48 overflow-y-auto shadow-lg bg-white">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((c, i) => (
                  <div
                    key={c._id?.toString() || i}
                    onClick={() => {
                      setSelectedCustomer(c._id?.toString() || "");
                      setSearchTerm("");
                    }}
                    className="px-4 py-3 cursor-pointer hover:bg-blue-50 transition border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium">
                      {c.first_name || ""} {c.last_name || ""}
                    </span>
                    <span className="text-gray-500 text-sm mr-2">
                      {c.phone}
                    </span>
                  </div>
                ))
              ) : (
                <p className="px-4 py-3 text-gray-400 text-sm">
                  هیچ مشتری‌ای یافت نشد
                </p>
              )}
            </div>
          )}

          {/* نمایش مشتری انتخاب شده */}
          {selectedCustomer && (
            <div className="mt-2 bg-blue-50 rounded-xl p-3 flex justify-between items-center">
              <span>
                {customers.find(
                  (c) => (c._id?.toString() || c.id) === selectedCustomer
                )?.first_name || ""}{" "}
                {customers.find(
                  (c) => (c._id?.toString() || c.id) === selectedCustomer
                )?.last_name || ""}{" "}
                -{" "}
                {
                  customers.find(
                    (c) => (c._id?.toString() || c.id) === selectedCustomer
                  )?.phone
                }
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedCustomer("");
                  setSearchTerm("");
                }}
                className="text-red-500 text-sm hover:underline"
              >
                تغییر
              </button>
            </div>
          )}
        </div>

        {/* نوع خدمت */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700">
            نوع خدمت *
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handleServiceTypeChange("carpet")}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                serviceType === "carpet"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🧹 فرش / موکت / تشک
            </button>
            <button
              type="button"
              onClick={() => handleServiceTypeChange("sofa")}
              className={`flex-1 py-3 rounded-xl font-bold transition ${
                serviceType === "sofa"
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              🛋️ مبل
            </button>
          </div>
        </div>

        {/* آیتم‌های فاکتور */}
        <div>
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-medium text-gray-700">
              {serviceType === "carpet" ? "فرش / موکت / تشک" : "مبل"}
            </label>
            <button
              type="button"
              onClick={addItem}
              className="text-blue-600 text-sm hover:underline"
            >
              + افزودن آیتم
            </button>
          </div>

          <div className="space-y-3">
            {items.map((item, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-xl space-y-2">
                {/* ردیف اول - موبایل و دسکتاپ */}
                <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                  {/* انتخاب نوع */}
                  <div className="col-span-2 sm:col-span-4">
                    <label className="text-xs text-gray-500 mb-1 block">
                      {serviceType === "sofa" ? "نوع مبل" : "نوع"}
                    </label>
                    <select
                      value={item.carpet_type}
                      onChange={(e) =>
                        updateItem(index, "carpet_type", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400"
                      required
                    >
                      <option value="">-- انتخاب --</option>
                      {serviceType === "sofa"
                        ? sofaOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))
                        : getItemOptions().map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                    </select>
                  </div>

                  {/* متراژ (فقط برای موکت و دست‌بافت در حالت متری) */}
                  {serviceType === "carpet" &&
                    [
                      "موکت معمولی",
                      "موکت پالاز",
                      "دست بافت",
                      "پادری",
                      "فرش کناره",
                    ].includes(item.carpet_type) &&
                    item.pricing_mode === "meter" && (
                      <div className="col-span-2 sm:col-span-2">
                        <label className="text-xs text-gray-500 mb-1 block">
                          متراژ
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={
                            item.square_meters === 0 ? "" : item.square_meters
                          }
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "") {
                              updateItem(index, "square_meters", 0);
                            } else {
                              updateItem(
                                index,
                                "square_meters",
                                parseFloat(toEnglishNumber(val)) || 0
                              );
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                    )}

                  {/* حالت قیمت */}
                  <div className="col-span-2 sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">
                      محاسبه
                    </label>
                    <select
                      value={item.pricing_mode}
                      onChange={(e) =>
                        updateItem(index, "pricing_mode", e.target.value)
                      }
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none focus:ring-1 focus:ring-blue-400"
                      disabled={["تشک 1 نفره", "تشک 2 نفره"].includes(
                        item.carpet_type
                      )}
                    >
                      {serviceType === "carpet" &&
                        !["تشک 1 نفره", "تشک 2 نفره"].includes(
                          item.carpet_type
                        ) && <option value="meter">متری</option>}
                      <option value="total">کل</option>
                    </select>
                  </div>

                  {/* قیمت */}
                  <div className="col-span-2 sm:col-span-2">
                    <label className="text-xs text-gray-500 mb-1 block">
                      قیمت
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.unit_price === 0 ? "" : item.unit_price}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          updateItem(index, "unit_price", 0);
                        } else {
                          updateItem(
                            index,
                            "unit_price",
                            parseInt(toEnglishNumber(val)) || 0
                          );
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400"
                      required
                    />
                  </div>

                  {/* تعداد و جمع */}
                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      تعداد
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={item.quantity === 1 ? "" : item.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") {
                          updateItem(index, "quantity", 1);
                        } else {
                          updateItem(
                            index,
                            "quantity",
                            parseInt(toEnglishNumber(val)) || 1
                          );
                        }
                      }}
                      className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs text-gray-500 mb-1 block">
                      جمع
                    </label>
                    <div className="py-2 text-xs sm:text-sm font-medium text-center">
                      {item.total.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* دکمه حذف */}
                {/* سطر خدمات اضافه و حذف */}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  {/* خدمات اضافه - فقط برای carpet */}
                  {serviceType === "carpet" && (
                    <div className="flex flex-wrap gap-3">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            item.extra_services?.stain_removal?.enabled || false
                          }
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              extra_services: {
                                ...newItems[index].extra_services,
                                stain_removal: {
                                  enabled: e.target.checked,
                                  price: 0,
                                },
                              },
                              total: calcTotal({
                                ...newItems[index],
                                extra_services: {
                                  ...newItems[index].extra_services,
                                  stain_removal: {
                                    enabled: e.target.checked,
                                    price: 0,
                                  },
                                },
                              }),
                            };
                            setItems(newItems);
                          }}
                          className="w-3 h-3"
                        />
                        <span>لکه‌برداری</span>
                        {item.extra_services?.stain_removal?.enabled && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.extra_services?.stain_removal?.price === 0
                                ? ""
                                : item.extra_services?.stain_removal?.price
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const price =
                                val === ""
                                  ? 0
                                  : parseInt(toEnglishNumber(val)) || 0;
                              const newItems = [...items];
                              newItems[index] = {
                                ...newItems[index],
                                extra_services: {
                                  ...newItems[index].extra_services,
                                  stain_removal: { enabled: true, price },
                                },
                                total: calcTotal({
                                  ...newItems[index],
                                  extra_services: {
                                    ...newItems[index].extra_services,
                                    stain_removal: { enabled: true, price },
                                  },
                                }),
                              };
                              setItems(newItems);
                            }}
                            placeholder="تومان"
                            className="w-30 px-1 py-1 border border-gray-300 rounded text-[10px] outline-none"
                          />
                        )}
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            item.extra_services?.double_wash?.enabled || false
                          }
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              extra_services: {
                                ...newItems[index].extra_services,
                                double_wash: {
                                  enabled: e.target.checked,
                                  price: 0,
                                },
                              },
                            };
                            newItems[index].total = calcTotal(newItems[index]);
                            setItems(newItems);
                          }}
                          className="w-3 h-3"
                        />
                        <span>دوبار شو</span>
                        {item.extra_services?.double_wash?.enabled && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.extra_services?.double_wash?.price === 0
                                ? ""
                                : item.extra_services?.double_wash?.price
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const price =
                                val === ""
                                  ? 0
                                  : parseInt(toEnglishNumber(val)) || 0;
                              const newItems = [...items];
                              newItems[index] = {
                                ...newItems[index],
                                extra_services: {
                                  ...newItems[index].extra_services,
                                  double_wash: { enabled: true, price },
                                },
                                total: calcTotal({
                                  ...newItems[index],
                                  extra_services: {
                                    ...newItems[index].extra_services,
                                    double_wash: { enabled: true, price },
                                  },
                                }),
                              };
                              setItems(newItems);
                            }}
                            placeholder="تومان"
                            className="w-30 px-1 py-1 border border-gray-300 rounded text-[10px] outline-none"
                          />
                        )}
                      </label>

                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            item.extra_services?.premium_wash?.enabled || false
                          }
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index] = {
                              ...newItems[index],
                              extra_services: {
                                ...newItems[index].extra_services,
                                premium_wash: {
                                  enabled: e.target.checked,
                                  price: 0,
                                },
                              },
                            };
                            newItems[index].total = calcTotal(newItems[index]);
                            setItems(newItems);
                          }}
                          className="w-3 h-3"
                        />
                        <span>اعلا شور</span>
                        {item.extra_services?.premium_wash?.enabled && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.extra_services?.premium_wash?.price === 0
                                ? ""
                                : item.extra_services?.premium_wash?.price
                            }
                            onChange={(e) => {
                              const val = e.target.value;
                              const price =
                                val === ""
                                  ? 0
                                  : parseInt(toEnglishNumber(val)) || 0;
                              const newItems = [...items];
                              newItems[index] = {
                                ...newItems[index],
                                extra_services: {
                                  ...newItems[index].extra_services,
                                  premium_wash: { enabled: true, price },
                                },
                                total: calcTotal({
                                  ...newItems[index],
                                  extra_services: {
                                    ...newItems[index].extra_services,
                                    premium_wash: { enabled: true, price },
                                  },
                                }),
                              };
                              setItems(newItems);
                            }}
                            placeholder="تومان"
                            className="w-30 px-1 py-1 border border-gray-300 rounded text-[10px] outline-none"
                          />
                        )}
                      </label>
                    </div>
                  )}

                  {/* دکمه حذف */}
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm flex items-center gap-1 shrink-0"
                    disabled={items.length === 1}
                  >
                    <span>✕</span> حذف
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* کرایه حمل و تخفیف */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-blue-50 p-4 rounded-xl [&>div]:flex [&>div]:flex-col [&>div]:justify-center [&>div]:items-center">
          <div>
            <label className="text-sm text-gray-600 self-start">
              کرایه حمل:
            </label>
            <select
              value={deliveryMode}
              onChange={(e) => {
                setDeliveryMode(e.target.value as "preset" | "custom");
                if (e.target.value === "preset") setCustomDeliveryPrice(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none mt-1"
            >
              <option value="preset">انتخاب از پیش‌فرض</option>
              <option value="custom">دستی</option>
            </select>

            {deliveryMode === "preset" ? (
              <select
                value={deliveryPrice}
                onChange={(e) => setDeliveryPrice(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none mt-1"
              >
                <option value="0">بدون کرایه</option>
                <option value="250000">۲۵۰,۰۰۰ تومان</option>
                <option value="300000">۳۰۰,۰۰۰ تومان</option>
              </select>
            ) : (
              <input
                type="text"
                inputMode="numeric"
                value={customDeliveryPrice === 0 ? "" : customDeliveryPrice}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setCustomDeliveryPrice(0);
                  } else {
                    setCustomDeliveryPrice(parseInt(toEnglishNumber(val)) || 0);
                  }
                }}
                placeholder="مبلغ کرایه (تومان)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none mt-1"
              />
            )}
          </div>
          <div className="gap-4">
            <label className="text-sm text-gray-600">جمع با کرایه:</label>
            <div className="text-lg font-bold text-gray-800">
              {totalWithDelivery.toLocaleString()} تومان
            </div>
          </div>
          <div className="gap-2">
            <label className="text-sm text-gray-600 self-start">
              درصد تخفیف:
            </label>
            <div className="w-full flex-row! self-start flex-nowrap">
              <input
                type="text"
                inputMode="numeric"
                value={discountPercent === 0 ? "" : discountPercent}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === "") {
                    setDiscountPercent(0);
                  } else {
                    setDiscountPercent(parseInt(toEnglishNumber(val)) || 0);
                  }
                }}
                className="w-3/10 bg-white px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none self-start"
              />
              <span className="text-sm text-red-500 mr-2 w-4/10">
                (-{discountAmount.toLocaleString()} تومان)
              </span>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-xl text-center">
          <label className="text-sm text-gray-600">مبلغ نهایی:</label>
          <div className="text-2xl font-extrabold text-green-700">
            {finalAmount.toLocaleString()} تومان
          </div>
        </div>

        {/* اطلاعات تکمیلی */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              وضعیت پرداخت
            </label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="pending">در انتظار پرداخت</option>
              <option value="paid">پرداخت شده</option>
              <option value="cash_on_delivery">پرداخت در محل</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              تاریخ تحویل (شمسی)
            </label>
            <div className="relative">
              <input
                type="text"
                value={deliveryDate}
                readOnly
                onClick={() => setShowCalendar(!showCalendar)}
                placeholder="انتخاب تاریخ تحویل"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-400 text-right cursor-pointer"
              />

              {showCalendar && (
                <div className="absolute top-full mt-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-72">
                  {/* هدر ماه و سال */}
                  <div className="flex justify-between items-center mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 1) {
                          setCalendarMonth(12);
                          setCalendarYear(calendarYear - 1);
                        } else {
                          setCalendarMonth(calendarMonth - 1);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      →
                    </button>
                    <span className="font-bold text-sm">
                      {calendarYear}/{String(calendarMonth).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 12) {
                          setCalendarMonth(1);
                          setCalendarYear(calendarYear + 1);
                        } else {
                          setCalendarMonth(calendarMonth + 1);
                        }
                      }}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      ←
                    </button>
                  </div>

                  {/* روزهای هفته */}
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {["ش", "ی", "د", "س", "چ", "پ", "ج"].map((day) => (
                      <div
                        key={day}
                        className="text-center text-xs font-medium text-gray-500 py-1"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* روزها */}
                  <div className="grid grid-cols-7 gap-1">
                    {getPersianDays(calendarYear, calendarMonth).map(
                      (day, idx) => {
                        if (day === 0) {
                          return <div key={`empty-${idx}`} />;
                        }

                        // محاسبه امروز شمسی
                        const now = new Date();
                        const gYear = now.getFullYear();
                        const nowruz = new Date(gYear, 2, 21);
                        const diff = Math.floor(
                          (now.getTime() - nowruz.getTime()) /
                            (1000 * 60 * 60 * 24)
                        );

                        let pYear = gYear - 621;
                        let remaining = diff;

                        if (diff < 0) {
                          pYear = gYear - 622;
                          const prevNowruz = new Date(gYear - 1, 2, 21);
                          remaining = Math.floor(
                            (now.getTime() - prevNowruz.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                        }

                        const months = [
                          31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29,
                        ];
                        let tMonth = 1;
                        let tDay = remaining + 1;

                        for (let i = 0; i < 12; i++) {
                          if (remaining < months[i]) {
                            tMonth = i + 1;
                            tDay = remaining + 1;
                            break;
                          }
                          remaining -= months[i];
                        }

                        const isToday =
                          calendarYear === pYear &&
                          calendarMonth === tMonth &&
                          day === tDay;
                        const isSelected =
                          deliveryDate ===
                          `${calendarYear}/${String(calendarMonth).padStart(
                            2,
                            "0"
                          )}/${String(day).padStart(2, "0")}`;

                        return (
                          <button
                            key={day}
                            type="button"
                            onClick={() => {
                              setDeliveryDate(
                                `${calendarYear}/${String(
                                  calendarMonth
                                ).padStart(2, "0")}/${String(day).padStart(
                                  2,
                                  "0"
                                )}`
                              );
                              setShowCalendar(false);
                            }}
                            className={`text-center py-2 text-sm rounded-lg transition ${
                              isSelected
                                ? "bg-blue-600 text-white"
                                : isToday
                                ? "bg-blue-100 text-blue-800 font-bold ring-2 ring-blue-400"
                                : "hover:bg-blue-50"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      }
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowCalendar(false)}
                    className="w-full mt-2 py-1.5 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
                  >
                    بستن
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">
              وضعیت سفارش
            </label>
            <select
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="registered">ثبت شده</option>
              <option value="received">تحویل گرفته شد</option>
              <option value="washing">در حال شستشو</option>
              <option value="drying">در حال خشک‌شویی</option>
              <option value="ready">آماده تحویل</option>
              <option value="delivered">تحویل داده شد</option>
              <option value="cancelled">لغو شده</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">آدرس</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="آدرس کامل مشتری..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 mb-1 block">یادداشت</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="توضیحات اضافی..."
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-linear-to-r from-blue-600 to-blue-700 text-white font-bold py-4 rounded-xl hover:shadow-xl transition disabled:opacity-50 text-lg"
        >
          {loading ? "در حال صدور فاکتور..." : "صدور فاکتور"}
        </button>
      </form>
      {generatedSmsText && (
        <div className="bg-linear-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg">
          {/* هدر - شماره و دکمه‌ها */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-xs text-gray-500">ارسال پیامک به</p>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-blue-800 font-mono tracking-wide">
                    {generatedCustomerPhone}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedCustomerPhone);
                      setCopiedText("شماره");
                      setTimeout(() => setCopiedText(null), 1500);
                    }}
                    className="p-1.5 bg-white text-blue-600 rounded-lg hover:bg-blue-100 transition border border-blue-200 relative"
                    title="کپی شماره"
                  >
                    <Copy className="w-4 h-4 text-blue-600" />
                    {copiedText === "شماره" && (
                      <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                        ✓ کپی شد
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedSmsText);
                  setCopiedText("پیامک");
                  setTimeout(() => setCopiedText(null), 1500);
                }}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2 shadow-md relative"
              >
                <Copy className="w-4 h-4 text-blue-50" />
                کپی پیامک
                {copiedText === "پیامک" && (
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap">
                    ✓ کپی شد
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* متن پیامک */}
          <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-inner">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed font-sans">
              {generatedSmsText}
            </pre>
          </div>

          {/* فوتر */}
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>
              شماره فاکتور:{" "}
              <strong className="text-blue-700">
                {generatedInvoiceNumber}
              </strong>
            </span>
            <span>فاکتور با موفقیت ثبت شد ✅</span>
          </div>
        </div>
      )}
    </div>
  );
}
