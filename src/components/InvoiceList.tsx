"use client";
import { useEffect, useState, useMemo, Fragment } from "react";
import {
  Search,
  Eye,
  Trash2,
  Edit3,
  ChevronRight,
  ChevronLeft,
  FileText,
  AlertTriangle,
  X,
  ShoppingCart,
  TrendingUp,
  CalendarDays,
  Clock,
  Truck,
  StickyNote,
  Download,
  HelpCircle,
  Edit,
} from "lucide-react";

interface InvoiceItem {
  description?: string;
  carpet_type?: string;
  quantity: number;
  unit_price: number;
  total: number;
  square_meters?: number;
  type?: string;
  pricing_mode?: string;
  extra_services?: {
    stain_removal?: { enabled: boolean; price: number };
    double_wash?: { enabled: boolean; price: number };
    premium_wash?: { enabled: boolean; price: number };
  };
}

interface Invoice {
  _id?: string;
  id?: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  items: InvoiceItem[];
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  final_amount: number;
  order_status: string;
  service_type: string;
  delivery_price: number;
  payment_status: "pending" | "paid" | "cash_on_delivery";
  delivery_date: string;
  address: string;
  created_at: string;
  note: string;
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

const paymentStatusLabels: Record<string, string> = {
  pending: "در انتظار",
  paid: "پرداخت شده",
  cash_on_delivery: "پرداخت در محل",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  cash_on_delivery: "bg-blue-100 text-blue-800",
};

const getItemOptions = () => [
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

const sofaOptions = ["7 نفره", "8 نفره", "9 نفره", "نفری"];

const monthNames = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];

const ITEMS_PER_PAGE = 10;
const exportInvoices = () => {
  fetch("/api/invoices?page=1&limit=999999")
    .then((res) => res.json())
    .then((data) => {
      const invoicesList = data.invoices || data;
      const lines = invoicesList.map((inv: Invoice) => {
        const itemsList = inv.items
          .map(
            (item) =>
              `${item.carpet_type || item.description || "نامشخص"}, ${
                item.quantity
              }, ${item.unit_price}`
          )
          .join("; ");

        return `${inv.customer_name} ${inv.customer_phone} | ${
          inv.service_type
        } | ${itemsList} | ${inv.delivery_price} | ${inv.discount_percent} | ${
          inv.payment_status
        } | ${inv.order_status} | ${inv.address || ""} | ${inv.note || ""}`;
      });

      const blob = new Blob([lines.join("\n")], { type: "text/plain" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "invoices-import-format.txt";
      a.click();
    });
};

const getPersianMonth = (dateStr: string) => {
  const d = new Date(dateStr);
  const gYear = d.getFullYear();
  const nowruz = new Date(gYear, 2, 21);
  let persianYear: number;
  let diff: number;

  if (d < nowruz) {
    persianYear = gYear - 622;
    const prevNowruz = new Date(gYear - 1, 2, 21);
    diff = Math.floor(
      (d.getTime() - prevNowruz.getTime()) / (1000 * 60 * 60 * 24)
    );
  } else {
    persianYear = gYear - 621;
    diff = Math.floor((d.getTime() - nowruz.getTime()) / (1000 * 60 * 60 * 24));
  }

  const persianMonthsDays = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];
  let remaining = diff;
  let month = 1;
  for (let i = 0; i < 12; i++) {
    if (remaining < persianMonthsDays[i]) {
      month = i + 1;
      break;
    }
    remaining -= persianMonthsDays[i];
  }
  return { year: persianYear, month };
};

const formatPrice = (price: number) => {
  if (price >= 1000000) {
    return (price / 1000000).toFixed(3) + " میلیون";
  }
  return price.toLocaleString();
};

export default function InvoiceList({
  refreshTrigger = 0,
}: {
  refreshTrigger?: number;
}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editingStatus, setEditingStatus] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState<Invoice | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("current");
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteInvoice, setNoteInvoice] = useState<Invoice | null>(null);
  const [showExportGuide, setShowExportGuide] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editItems, setEditItems] = useState<InvoiceItem[]>([]);
  const [editDeliveryPrice, setEditDeliveryPrice] = useState(0);
  const [editDiscountPercent, setEditDiscountPercent] = useState(0);
  const [editPaymentStatus, setEditPaymentStatus] = useState<
    "pending" | "paid" | "cash_on_delivery"
  >("pending");
  const [editOrderStatus, setEditOrderStatus] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editNote, setEditNote] = useState("");

  const openEditModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditItems([...inv.items]);
    setEditDeliveryPrice(inv.delivery_price || 0);
    setEditDiscountPercent(inv.discount_percent || 0);
    setEditPaymentStatus(inv.payment_status);
    setEditOrderStatus(inv.order_status);
    setEditAddress(inv.address || "");
    setEditNote(inv.note || "");
    setShowEditModal(true);
  };

  const saveEdit = () => {
    if (!editingInvoice) return;

    const subtotal = editItems.reduce((sum, item) => {
      const qty = item.quantity || 0;
      const price = item.unit_price || 0;
      const sm = item.square_meters || 1;
      return (
        sum + (item.pricing_mode === "meter" ? qty * price * sm : qty * price)
      );
    }, 0);
    const totalWithDelivery = subtotal + editDeliveryPrice;
    const discountAmount = (totalWithDelivery * editDiscountPercent) / 100;
    const finalAmount = totalWithDelivery - discountAmount;

    const updates = {
      items: editItems,
      delivery_price: editDeliveryPrice,
      discount_percent: editDiscountPercent,
      payment_status: editPaymentStatus as
        | "pending"
        | "paid"
        | "cash_on_delivery",
      order_status: editOrderStatus,
      address: editAddress,
      note: editNote,
      subtotal,
      total_with_delivery: totalWithDelivery,
      discount_amount: discountAmount,
      final_amount: finalAmount,
    };

    fetch(`/api/invoices/${editingInvoice._id || editingInvoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }).then((res) => {
      if (res.ok) {
        setInvoices(
          invoices.map((inv) =>
            (inv._id || inv.id) === (editingInvoice._id || editingInvoice.id)
              ? { ...inv, ...updates }
              : inv
          )
        );
        setShowEditModal(false);
      }
    });
  };

  const fetchInvoices = () => {
    fetch("/api/invoices")
      .then((res) => res.json())
      .then((data) => setInvoices(data));
  };

  useEffect(() => {
    fetchInvoices();
  }, [refreshTrigger]);

  const stats = useMemo(() => {
    const availableMonths = new Set<string>();
    let filteredForStats = invoices;

    if (selectedMonth === "current") {
      const now = new Date();
      const currentPM = getPersianMonth(now.toISOString());
      filteredForStats = invoices.filter((inv) => {
        const pm = getPersianMonth(inv.created_at);
        return pm.year === currentPM.year && pm.month === currentPM.month;
      });
    } else if (selectedMonth !== "all") {
      const [year, month] = selectedMonth.split("-").map(Number);
      filteredForStats = invoices.filter((inv) => {
        const pm = getPersianMonth(inv.created_at);
        return pm.year === year && pm.month === month;
      });
    }

    invoices.forEach((inv) => {
      const pm = getPersianMonth(inv.created_at);
      availableMonths.add(`${pm.year}-${pm.month}`);
    });

    const sortedMonths = Array.from(availableMonths).sort((a, b) =>
      b.localeCompare(a)
    );
    const totalOrders = filteredForStats.length;

    // ✅ تفکیک بر اساس service_type
    const carpetRevenue = filteredForStats
      .filter((inv) => inv.service_type !== "sofa")
      .reduce((sum, inv) => sum + inv.final_amount, 0);

    const sofaRevenue = filteredForStats
      .filter((inv) => inv.service_type === "sofa")
      .reduce((sum, inv) => sum + inv.final_amount, 0);

    const totalRevenue = carpetRevenue + sofaRevenue;

    const activeOrders = filteredForStats.filter(
      (inv) => !["delivered", "cancelled", "ready"].includes(inv.order_status)
    ).length;
    const readyOrders = filteredForStats.filter(
      (inv) => inv.order_status === "ready"
    ).length;

    return {
      totalOrders,
      totalRevenue,
      carpetRevenue,
      sofaRevenue,
      activeOrders,
      readyOrders,
      availableMonths: sortedMonths,
    };
  }, [invoices, selectedMonth]);

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.customer_name?.includes(searchTerm) ||
      inv.customer_phone?.includes(searchTerm) ||
      inv.invoice_number?.includes(searchTerm)
  );

  const sortedInvoices = [...filteredInvoices].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const customerOrderCounts: Record<string, number> = {};
  sortedInvoices.forEach((inv) => {
    customerOrderCounts[inv.customer_id] =
      (customerOrderCounts[inv.customer_id] || 0) + 1;
  });

  const totalPages = Math.ceil(sortedInvoices.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedInvoices = sortedInvoices.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  const viewInvoice = (invoiceNumber: string) => {
    window.open(`/invoice/${invoiceNumber}`, "_blank");
  };

  const openDeleteModal = (inv: Invoice) => {
    setInvoiceToDelete(inv);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (invoiceToDelete) {
      fetch(`/api/invoices/${invoiceToDelete._id || invoiceToDelete.id}`, {
        method: "DELETE",
      }).then((res) => {
        if (res.ok) {
          setInvoices(
            invoices.filter(
              (inv) =>
                (inv._id || inv.id) !==
                (invoiceToDelete._id || invoiceToDelete.id)
            )
          );
          setShowDeleteModal(false);
          setInvoiceToDelete(null);
        }
      });
    }
  };

  const handleStatusChange = (invId: string, newStatus: string) => {
    fetch(`/api/invoices/${invId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order_status: newStatus }),
    }).then((res) => {
      if (res.ok) {
        setInvoices(
          invoices.map((inv) =>
            (inv._id || inv.id) === invId
              ? { ...inv, order_status: newStatus }
              : inv
          )
        );
        setEditingStatus(null);
      }
    });
  };

  const openNoteModal = (inv: Invoice) => {
    setNoteInvoice(inv);
    setShowNoteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* انتخاب ماه */}
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-blue-600" />
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
        >
          <option value="all">همه ماه‌ها</option>
          <option value="current">ماه جاری</option>
          {stats.availableMonths.map((m) => {
            const [y, mo] = m.split("-").map(Number);
            return (
              <option key={m} value={m}>
                {monthNames[mo - 1]} {y}
              </option>
            );
          })}
        </select>
      </div>

      {/* کارت‌های آماری */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl shadow p-3 sm:p-4 border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-5 h-5 text-blue-600" />
            <span className="text-xs text-gray-500">کل سفارشات</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-blue-800">
            {stats.totalOrders}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-3 sm:p-4 border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <span className="text-xs text-gray-500">درآمد</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-green-700">
            {formatPrice(stats.totalRevenue)}
          </p>
          <div className="flex justify-between text-[10px] sm:text-xs text-gray-500 mt-1 border-t pt-1">
            <span>فرش: {formatPrice(stats.carpetRevenue)}</span>
            <span>مبل: {formatPrice(stats.sofaRevenue)}</span>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow p-3 sm:p-4 border border-cyan-100">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            <span className="text-xs text-gray-500">در حال انجام</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-cyan-700">
            {stats.activeOrders}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow p-3 sm:p-4 border border-yellow-100">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="w-5 h-5 text-yellow-600" />
            <span className="text-xs text-gray-500">آماده تحویل</span>
          </div>
          <p className="text-xl sm:text-2xl font-extrabold text-yellow-700">
            {stats.readyOrders}
          </p>
        </div>
      </div>

      {/* لیست فاکتورها */}
      <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-100">
        <h3 className="text-lg sm:text-xl font-bold text-blue-800 mb-4 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
            لیست فاکتورها
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={exportInvoices}
              className="bg-blue-500 text-white px-3 py-1.5 rounded-xl hover:bg-blue-600 transition text-xs flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              خروجی
            </button>
            <button
              onClick={() => setShowExportGuide(true)}
              className="p-1.5 bg-gray-100 text-gray-500 rounded-lg hover:bg-gray-200 transition"
              title="راهنما"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </h3>
        <div className="relative mb-4">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="جستجوی فاکتور..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {paginatedInvoices.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            هیچ فاکتوری یافت نشد
          </p>
        ) : (
          <>
            {/* موبایل */}
            <div className="block sm:hidden space-y-3">
              {paginatedInvoices.map((inv) => (
                <div
                  key={inv._id?.toString() || inv.id}
                  className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-blue-700 font-bold text-sm">
                        {inv.invoice_number}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(inv.created_at).toLocaleDateString("fa-IR")}
                      </p>
                    </div>
                    {customerOrderCounts[inv.customer_id] > 1 && (
                      <span className="bg-orange-100 text-orange-700 text-[10px] px-1.5 py-0.5 rounded-full">
                        {customerOrderCounts[inv.customer_id]} سفارش
                      </span>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{inv.customer_name}</p>
                    <p className="text-gray-500 text-xs">
                      {inv.customer_phone}
                    </p>
                  </div>
                  <div>
                    {editingStatus === (inv._id || inv.id) ? (
                      <select
                        value={inv.order_status}
                        onChange={(e) =>
                          handleStatusChange(
                            inv._id || inv.id || "",
                            e.target.value
                          )
                        }
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none"
                      >
                        {Object.entries(orderStatusLabels).map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          orderStatusColors[inv.order_status]
                        }`}
                      >
                        {orderStatusLabels[inv.order_status]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 justify-between items-center mt-4">
                    <span className="font-bold text-green-700 text-sm">
                      {inv.final_amount?.toLocaleString()} تومان
                    </span>
                    <div className="w-full flex justify-between gap-2">
                      <button
                        onClick={() => viewInvoice(inv.invoice_number)}
                        className="p-3 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                        title="مشاهده"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() =>
                          setEditingStatus(inv._id || inv.id || "")
                        }
                        className="p-3 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100"
                        title="تغییر وضعیت"
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(inv)}
                        className="p-3 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                        title="ویرایش فاکتور"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openNoteModal(inv)}
                        className="p-3 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                        title="یادداشت"
                      >
                        <StickyNote className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(inv)}
                        className="p-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                        title="حذف"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* دسکتاپ */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-right">
                <thead>
                  <tr className="border-b-2 border-blue-200 text-blue-800">
                    <th className="py-3 px-2 text-sm">#</th>
                    <th className="py-3 px-2 text-sm">شماره فاکتور</th>
                    <th className="py-3 px-2 text-sm">مشتری</th>
                    <th className="py-3 px-2 text-sm">مبلغ</th>
                    <th className="py-3 px-2 text-sm">وضعیت سفارش</th>
                    <th className="py-3 px-2 text-sm">پرداخت</th>
                    <th className="py-3 px-2 text-sm">تاریخ</th>
                    <th className="py-3 px-2 text-sm">عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedInvoices.map((inv, idx) => (
                    <tr
                      key={inv._id?.toString() || idx}
                      className="border-b border-gray-100 hover:bg-blue-50 transition"
                    >
                      <td className="py-3 px-2 text-xs text-gray-400">
                        <span className="m-1 bg-blue-100 text-blue-600 text-[10px] flex items-center justify-center p-1 rounded-full">
                          {startIndex + idx + 1}
                        </span>
                        {customerOrderCounts[inv.customer_id] > 1 && (
                          <span className="m-1 bg-orange-100 text-orange-600 text-[10px] flex items-center justify-center p-1 rounded-full">
                            {customerOrderCounts[inv.customer_id]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 font-mono text-blue-700 text-sm">
                        {inv.invoice_number}
                      </td>
                      <td className="py-3 px-2 text-sm">
                        <p>{inv.customer_name}</p>
                        <p className="text-xs text-gray-400">
                          {inv.customer_phone}
                        </p>
                      </td>
                      <td className="py-3 px-2 font-bold text-green-700 text-sm">
                        {inv.final_amount?.toLocaleString()}
                      </td>
                      <td className="py-3 px-2">
                        {editingStatus === (inv._id || inv.id) ? (
                          <select
                            value={inv.order_status}
                            onChange={(e) =>
                              handleStatusChange(
                                inv._id || inv.id || "",
                                e.target.value
                              )
                            }
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs outline-none"
                            autoFocus
                            onBlur={() => setEditingStatus(null)}
                          >
                            {Object.entries(orderStatusLabels).map(([v, l]) => (
                              <option key={v} value={v}>
                                {l}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                              orderStatusColors[inv.order_status]
                            }`}
                          >
                            {orderStatusLabels[inv.order_status]}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            paymentStatusColors[inv.payment_status]
                          }`}
                        >
                          {paymentStatusLabels[inv.payment_status]}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-sm text-gray-500">
                        {new Date(inv.created_at).toLocaleDateString("fa-IR")}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <button
                            onClick={() => viewInvoice(inv.invoice_number)}
                            className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"
                            title="مشاهده"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setEditingStatus(inv._id || inv.id || "")
                            }
                            className="p-2 bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100"
                            title="ویرایش وضعیت"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(inv)}
                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100"
                            title="ویرایش فاکتور"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openNoteModal(inv)}
                            className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100"
                            title="یادداشت"
                          >
                            <StickyNote className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(inv)}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note Modal */}
            {showNoteModal && noteInvoice && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full text-right">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <StickyNote className="w-5 h-5 text-purple-600" />
                      اطلاعات و یادداشت
                    </h4>
                    <button
                      onClick={() => setShowNoteModal(false)}
                      className="p-1 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-3 text-sm">
                    <div className="bg-blue-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">مشتری:</p>
                      <p className="font-bold">
                        {noteInvoice.customer_name} -{" "}
                        {noteInvoice.customer_phone}
                      </p>
                    </div>
                    {noteInvoice.address && (
                      <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-500">آدرس:</p>
                        <p>{noteInvoice.address}</p>
                      </div>
                    )}
                    <div className="bg-yellow-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500">یادداشت ادمین:</p>
                      <p>{noteInvoice.note || "بدون یادداشت"}</p>
                    </div>
                  </div>
                  {/* خدمات اضافه */}
                  {noteInvoice.items?.some(
                    (item: InvoiceItem) =>
                      item.extra_services?.stain_removal?.enabled ||
                      item.extra_services?.double_wash?.enabled ||
                      item.extra_services?.premium_wash?.enabled
                  ) && (
                    <div className="bg-purple-50 rounded-xl p-3 mt-2">
                      <p className="text-xs text-gray-500 mb-1">خدمات اضافه:</p>
                      {noteInvoice.items.map((item: InvoiceItem, i: number) => (
                        <div key={i} className="text-xs text-gray-600">
                          {item.extra_services?.stain_removal?.enabled && (
                            <p>
                              🧹 لکه‌برداری:{" "}
                              {item.extra_services.stain_removal.price?.toLocaleString()}{" "}
                              ت
                            </p>
                          )}
                          {item.extra_services?.double_wash?.enabled && (
                            <p>
                              🔄 دوبار شو:{" "}
                              {item.extra_services.double_wash.price?.toLocaleString()}{" "}
                              ت
                            </p>
                          )}
                          {item.extra_services?.premium_wash?.enabled && (
                            <p>
                              ✨ اعلا شور:{" "}
                              {item.extra_services.premium_wash.price?.toLocaleString()}{" "}
                              ت
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="w-full mt-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
                  >
                    بستن
                  </button>
                </div>
              </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && invoiceToDelete && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    تأیید حذف
                  </h4>
                  <p className="text-sm text-gray-600 mb-2">
                    آیا از حذف فاکتور{" "}
                    <span className="font-bold text-blue-700">
                      {invoiceToDelete.invoice_number}
                    </span>{" "}
                    مطمئن هستید؟
                  </p>
                  <p className="text-xs text-gray-400 mb-4">
                    مشتری: {invoiceToDelete.customer_name}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setShowDeleteModal(false)}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      انصراف
                    </button>
                    <button
                      onClick={confirmDelete}
                      className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-4 pt-4 border-t flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* صفحه اول */}
                {currentPage > 3 && (
                  <>
                    <button
                      onClick={() => setCurrentPage(1)}
                      className="w-8 h-8 rounded-lg text-sm hover:bg-gray-100"
                    >
                      ۱
                    </button>
                    {currentPage > 4 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                  </>
                )}

                {/* صفحات نزدیک */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => Math.abs(page - currentPage) <= 1)
                  .map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        currentPage === page
                          ? "bg-blue-600 text-white"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                {/* صفحه آخر */}
                {currentPage < totalPages - 2 && (
                  <>
                    {currentPage < totalPages - 3 && (
                      <span className="px-1 text-gray-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className="w-8 h-8 rounded-lg text-sm hover:bg-gray-100"
                    >
                      {totalPages}
                    </button>
                  </>
                )}

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
      {/* Edit Modal */}
      {showEditModal && editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full my-8 text-right">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <Edit className="w-5 h-5 text-green-600" />
                ویرایش فاکتور {editingInvoice.invoice_number}
              </h4>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 max-h-[70vh] overflow-y-auto">
              {/* مشتری */}
              <div className="bg-blue-50 rounded-xl p-3">
                <p className="text-xs text-gray-500">مشتری:</p>
                <p className="font-bold">
                  {editingInvoice.customer_name} -{" "}
                  {editingInvoice.customer_phone}
                </p>
              </div>

              {/* آیتم‌ها */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  اقلام فاکتور
                </label>
                {editItems.map((item, idx: number) => (
                  <Fragment key={idx}>
                    <div className="bg-gray-50 p-3 rounded-lg mb-2 space-y-2">
                      {/* ردیف اول - نوع و محاسبه */}
                      <div className="grid grid-cols-2 sm:grid-cols-12 gap-2 items-end">
                        {/* نوع */}
                        <div className="col-span-2 sm:col-span-3">
                          <label className="text-[10px] text-gray-500 mb-1 block">
                            نوع
                          </label>
                          <select
                            value={item.carpet_type || ""}
                            onChange={(e) => {
                              const newItems = [...editItems];
                              newItems[idx] = {
                                ...newItems[idx],
                                carpet_type: e.target.value,
                              };
                              setEditItems(newItems);
                            }}
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none"
                          >
                            <option value="">-- انتخاب --</option>
                            {editingInvoice?.service_type === "sofa"
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

                        {/* محاسبه */}
                        <div className="col-span-2 sm:col-span-2">
                          <label className="text-[10px] text-gray-500 mb-1 block">
                            محاسبه
                          </label>
                          <select
                            value={item.pricing_mode || "total"}
                            onChange={(e) => {
                              const newItems = [...editItems];
                              const newMode = e.target.value;
                              newItems[idx] = {
                                ...newItems[idx],
                                pricing_mode: newMode,
                                total:
                                  newMode === "meter"
                                    ? (item.quantity || 0) *
                                      (item.unit_price || 0) *
                                      (item.square_meters || 1)
                                    : (item.quantity || 0) *
                                      (item.unit_price || 0),
                              };
                              setEditItems(newItems);
                            }}
                            className="w-full px-1 py-2 border border-gray-300 rounded-lg text-[10px] sm:text-xs outline-none"
                          >
                            <option value="meter">متری</option>
                            <option value="total">کل</option>
                          </select>
                        </div>

                        {/* متراژ - فقط متری */}
                        {item.pricing_mode === "meter" && (
                          <div className="col-span-2 sm:col-span-2">
                            <label className="text-[10px] text-gray-500 mb-1 block">
                              متراژ
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={
                                item.square_meters === 0
                                  ? ""
                                  : item.square_meters
                              }
                              onChange={(e) => {
                                const val = e.target.value;
                                const newItems = [...editItems];
                                const sm =
                                  val === "" ? 0 : parseFloat(val) || 0;
                                newItems[idx] = {
                                  ...newItems[idx],
                                  square_meters: sm,
                                  total:
                                    (item.quantity || 0) *
                                    (item.unit_price || 0) *
                                    (sm || 1),
                                };
                                setEditItems(newItems);
                              }}
                              placeholder="متر"
                              className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none"
                            />
                          </div>
                        )}

                        {/* قیمت */}
                        <div
                          className={
                            item.pricing_mode === "meter"
                              ? "col-span-2 sm:col-span-2"
                              : "col-span-2 sm:col-span-2"
                          }
                        >
                          <label className="text-[10px] text-gray-500 mb-1 block">
                            قیمت
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.unit_price === 0 ? "" : item.unit_price}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...editItems];
                              const price = val === "" ? 0 : parseInt(val) || 0;
                              newItems[idx] = {
                                ...newItems[idx],
                                unit_price: price,
                                total:
                                  (item.quantity || 0) *
                                  price *
                                  (item.pricing_mode === "meter"
                                    ? item.square_meters || 1
                                    : 1),
                              };
                              setEditItems(newItems);
                            }}
                            placeholder="تومان"
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none"
                          />
                        </div>

                        {/* تعداد */}
                        <div className="col-span-2 sm:col-span-1">
                          <label className="text-[10px] text-gray-500 mb-1 block">
                            تعداد
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity === 1 ? "" : item.quantity}
                            onChange={(e) => {
                              const val = e.target.value;
                              const newItems = [...editItems];
                              const qty = val === "" ? 1 : parseInt(val) || 1;
                              newItems[idx] = {
                                ...newItems[idx],
                                quantity: qty,
                                total:
                                  qty *
                                  (item.unit_price || 0) *
                                  (item.pricing_mode === "meter"
                                    ? item.square_meters || 1
                                    : 1),
                              };
                              setEditItems(newItems);
                            }}
                            placeholder="عدد"
                            className="w-full px-2 py-2 border border-gray-300 rounded-lg text-xs sm:text-sm outline-none"
                          />
                        </div>

                        {/* جمع */}
                        <div className="col-span-2 sm:col-span-1 text-center">
                          <label className="text-[10px] text-gray-500 mb-1 block">
                            جمع
                          </label>
                          <div className="py-2 text-xs sm:text-sm font-bold text-green-700">
                            {item.total?.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* خدمات اضافه */}
                    <div className="col-span-full flex flex-wrap gap-2 text-[10px] mt-1">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={
                            item.extra_services?.stain_removal?.enabled || false
                          }
                          onChange={(e) => {
                            const newItems = [...editItems];
                            newItems[idx] = {
                              ...newItems[idx],
                              extra_services: {
                                ...newItems[idx].extra_services,
                                stain_removal: {
                                  enabled: e.target.checked,
                                  price:
                                    newItems[idx].extra_services?.stain_removal
                                      ?.price || 0,
                                },
                              },
                            };
                            setEditItems(newItems);
                          }}
                          className="w-3 h-3"
                        />
                        لکه‌برداری
                        {item.extra_services?.stain_removal?.enabled && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.extra_services?.stain_removal?.price || ""
                            }
                            onChange={(e) => {
                              const newItems = [...editItems];
                              newItems[idx] = {
                                ...newItems[idx],
                                extra_services: {
                                  ...newItems[idx].extra_services,
                                  stain_removal: {
                                    enabled: true,
                                    price: parseInt(e.target.value) || 0,
                                  },
                                },
                              };
                              setEditItems(newItems);
                            }}
                            className="w-14 px-1 py-0.5 border rounded text-[10px] outline-none"
                            placeholder="تومان"
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
                            const newItems = [...editItems];
                            newItems[idx] = {
                              ...newItems[idx],
                              extra_services: {
                                ...newItems[idx].extra_services,
                                double_wash: {
                                  enabled: e.target.checked,
                                  price:
                                    newItems[idx].extra_services?.double_wash
                                      ?.price || 0,
                                },
                              },
                            };
                            setEditItems(newItems);
                          }}
                          className="w-3 h-3"
                        />
                        دوبار شو
                        {item.extra_services?.double_wash?.enabled && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.extra_services?.double_wash?.price || ""
                            }
                            onChange={(e) => {
                              const newItems = [...editItems];
                              newItems[idx] = {
                                ...newItems[idx],
                                extra_services: {
                                  ...newItems[idx].extra_services,
                                  double_wash: {
                                    enabled: true,
                                    price: parseInt(e.target.value) || 0,
                                  },
                                },
                              };
                              setEditItems(newItems);
                            }}
                            className="w-14 px-1 py-0.5 border rounded text-[10px] outline-none"
                            placeholder="تومان"
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
                            const newItems = [...editItems];
                            newItems[idx] = {
                              ...newItems[idx],
                              extra_services: {
                                ...newItems[idx].extra_services,
                                premium_wash: {
                                  enabled: e.target.checked,
                                  price:
                                    newItems[idx].extra_services?.premium_wash
                                      ?.price || 0,
                                },
                              },
                            };
                            setEditItems(newItems);
                          }}
                          className="w-3 h-3"
                        />
                        اعلا شور
                        {item.extra_services?.premium_wash?.enabled && (
                          <input
                            type="text"
                            inputMode="numeric"
                            value={
                              item.extra_services?.premium_wash?.price || ""
                            }
                            onChange={(e) => {
                              const newItems = [...editItems];
                              newItems[idx] = {
                                ...newItems[idx],
                                extra_services: {
                                  ...newItems[idx].extra_services,
                                  premium_wash: {
                                    enabled: true,
                                    price: parseInt(e.target.value) || 0,
                                  },
                                },
                              };
                              setEditItems(newItems);
                            }}
                            className="w-14 px-1 py-0.5 border rounded text-[10px] outline-none"
                            placeholder="تومان"
                          />
                        )}
                      </label>
                    </div>
                  </Fragment>
                ))}
              </div>

              {/* کرایه و تخفیف */}
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs text-gray-500">کرایه حمل</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editDeliveryPrice === 0 ? "" : editDeliveryPrice}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditDeliveryPrice(val === "" ? 0 : parseInt(val) || 0);
                    }}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500">درصد تخفیف</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={editDiscountPercent === 0 ? "" : editDiscountPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditDiscountPercent(
                        val === "" ? 0 : parseInt(val) || 0
                      );
                    }}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500">مبلغ نهایی</label>
                  <div className="py-2 font-bold text-green-700">
                    {(() => {
                      const sub = editItems.reduce((s, i) => {
                        const sm =
                          i.pricing_mode === "meter" ? i.square_meters || 1 : 1;
                        return s + (i.quantity || 0) * (i.unit_price || 0) * sm;
                      }, 0);
                      const twd = sub + editDeliveryPrice;
                      const da = (twd * editDiscountPercent) / 100;
                      return (twd - da).toLocaleString();
                    })()}{" "}
                    تومان
                  </div>
                </div>
              </div>

              {/* وضعیت‌ها */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500">وضعیت پرداخت</label>
                  <select
                    value={editPaymentStatus}
                    onChange={(e) =>
                      setEditPaymentStatus(
                        e.target.value as
                          | "pending"
                          | "paid"
                          | "cash_on_delivery"
                      )
                    }
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  >
                    <option value="pending">در انتظار</option>
                    <option value="paid">پرداخت شده</option>
                    <option value="cash_on_delivery">پرداخت در محل</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500">وضعیت سفارش</label>
                  <select
                    value={editOrderStatus}
                    onChange={(e) => setEditOrderStatus(e.target.value)}
                    className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                  >
                    {Object.entries(orderStatusLabels).map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500">آدرس</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">یادداشت</label>
                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  rows={2}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
              >
                انصراف
              </button>
              <button
                onClick={saveEdit}
                className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm hover:bg-green-600"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}
      {showExportGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full text-right">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                راهنمای فرمت خروجی
              </h4>
              <button
                onClick={() => setShowExportGuide(false)}
                className="p-1 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="bg-gray-50 rounded-xl p-4 text-sm font-mono text-left"
              dir="ltr"
            >
              <p className="text-gray-700 mb-3">
                نام‌خانوادگی 09xxxxxxxxx | نوع خدمت | آیتم1, تعداد1, قیمت1;
                آیتم2, تعداد2, قیمت2 | کرایه | تخفیف | وضعیت پرداخت | وضعیت
                سفارش | آدرس | یادداشت
              </p>
              <div className="space-y-2 text-xs text-gray-500">
                <p>
                  • نوع خدمت: <code>carpet</code> یا <code>sofa</code>
                </p>
                <p>
                  • آیتم‌ها با <code>;</code> جدا میشن
                </p>
                <p>
                  • وضعیت پرداخت: <code>pending</code> | <code>paid</code> |{" "}
                  <code>cash_on_delivery</code>
                </p>
                <p>
                  • وضعیت سفارش: <code>registered</code> | <code>received</code>{" "}
                  | <code>washing</code> | <code>drying</code> |{" "}
                  <code>ready</code> | <code>delivered</code> |{" "}
                  <code>cancelled</code>
                </p>
                <p>• آدرس و یادداشت اختیاری هستن</p>
              </div>
            </div>
            <button
              onClick={() => setShowExportGuide(false)}
              className="w-full mt-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
            >
              بستن
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
