"use client";
import { useEffect, useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Trash2,
  X,
  AlertTriangle,
  Users,
  Download,
} from "lucide-react";

interface Customer {
  _id?: string;
  id?: string;
  first_name: string;
  last_name: string;
  phone: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

export default function CustomerTable({
  refreshTrigger,
}: {
  refreshTrigger: number;
}) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null
  );
  const [total, setTotal] = useState(0);

  const fetchCustomers = () => {
    fetch(`/api/customers?page=${currentPage}&limit=${ITEMS_PER_PAGE}`)
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data.customers);
        setTotal(data.total);
      });
  };

  useEffect(() => {
    fetchCustomers();
  }, [refreshTrigger, currentPage]);

  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteModal(true);
  };

  const confirmDelete = () => {
    if (!customerToDelete) return;
    const customerId = customerToDelete._id || customerToDelete.id;
    fetch(`/api/customers?id=${customerId}`, { method: "DELETE" }).then(
      (res) => {
        if (res.ok) {
          setCustomers(customers.filter((c) => (c._id || c.id) !== customerId));
          setTotal((prev) => prev - 1);
          setShowDeleteModal(false);
          setCustomerToDelete(null);
        }
      }
    );
  };

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const exportPhones = () => {
    fetch("/api/customers?page=1&limit=999999")
      .then((res) => res.json())
      .then((data) => {
        const lines = data.customers.map(
          (c: Customer) => `${c.last_name} ${c.phone}`
        );
        const text = lines.join("\n");
        const blob = new Blob([text], { type: "text/plain" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = "customer-phones.txt";
        a.click();
      });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-blue-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg sm:text-xl font-bold text-blue-800 flex items-center gap-2">
          <Users className="w-5 h-5 sm:w-6 sm:h-6" />
          لیست مشتریان
          <span className="text-sm font-normal text-gray-400 mr-2">
            ({total} مشتری)
          </span>
        </h3>
        <button
          onClick={exportPhones}
          className="bg-blue-500 text-white px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl hover:bg-blue-600 transition text-xs sm:text-sm flex items-center gap-1"
        >
          <Download className="w-4 h-4" />
          خروجی شماره‌ها
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right">
          <thead>
            <tr className="border-b-2 border-blue-200 text-blue-800">
              <th className="py-3 px-2 text-sm">#</th>
              <th className="py-3 px-2 text-sm">نام</th>
              <th className="py-3 px-2 text-sm">نام خانوادگی</th>
              <th className="py-3 px-2 text-sm">شماره تماس</th>
              <th className="py-3 px-2 text-sm">تاریخ ثبت</th>
              <th className="py-3 px-2 text-sm">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c, idx) => (
              <tr
                key={c._id || c.id || idx}
                className="border-b border-gray-100 hover:bg-blue-50 transition"
              >
                <td className="py-3 px-2 text-xs text-gray-400">
                  {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                </td>
                <td className="py-3 px-2 text-sm">{c.first_name || "-"}</td>
                <td className="py-3 px-2 text-sm">{c.last_name || "-"}</td>
                <td className="py-3 px-2 font-mono text-blue-700 text-sm">
                  {c.phone}
                </td>
                <td className="py-3 px-2 text-xs sm:text-sm text-gray-500">
                  {new Date(c.created_at).toLocaleDateString("fa-IR")}
                </td>
                <td className="py-3 px-2">
                  <button
                    onClick={() => handleDelete(c)}
                    className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && (
          <p className="text-center text-gray-400 py-8 text-sm">
            هیچ مشتری ثبت نشده
          </p>
        )}
      </div>

      {/* Delete Modal */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h4 className="text-lg font-bold text-gray-800 mb-2">تأیید حذف</h4>
            <p className="text-sm text-gray-600 mb-4">
              آیا از حذف مشتری{" "}
              <span className="font-bold text-blue-700">
                {customerToDelete.first_name} {customerToDelete.last_name}
              </span>{" "}
              با شماره{" "}
              <span className="font-bold">{customerToDelete.phone}</span> مطمئن
              هستید؟
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition flex items-center gap-1"
              >
                <X className="w-4 h-4" /> انصراف
              </button>
              <button
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition flex items-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> حذف
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

          {/* صفحات میانی */}
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
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
