"use client";
import { useState } from "react";
import { Users, FilePlus, FileText } from "lucide-react";
import AddCustomerForm from "@/components/AddCustomerForm";
import CustomerTable from "@/components/CustomerTable";
import BulkSmsForm from "@/components/BulkSmsForm";
import CreateInvoiceForm from "@/components/CreateInvoiceForm";
import InvoiceList from "@/components/InvoiceList";
import BulkImportForm from "@/components/BulkImportForm";

export default function DashboardPage() {
  const [refresh, setRefresh] = useState(0);
  const [activeTab, setActiveTab] = useState<
    "customers" | "invoices" | "invoiceList"
  >("customers");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex max-sm:flex-col gap-2 bg-white rounded-2xl p-2 shadow-sm border border-blue-100">
        <button
          onClick={() => setActiveTab("customers")}
          className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "customers"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <Users className="w-5 h-5" />
          مدیریت مشتریان
        </button>
        <button
          onClick={() => setActiveTab("invoices")}
          className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "invoices"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FilePlus className="w-5 h-5" />
          صدور فاکتور
        </button>
        <button
          onClick={() => setActiveTab("invoiceList")}
          className={`flex-1 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "invoiceList"
              ? "bg-blue-600 text-white shadow-md"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-5 h-5" />
          لیست فاکتورها
        </button>
      </div>

      {/* Content */}
      {activeTab === "customers" ? (
        <>
          <BulkImportForm onImported={() => setRefresh((prev) => prev + 1)} />
          <AddCustomerForm
            onCustomerAdded={() => setRefresh((prev) => prev + 1)}
          />
          <CustomerTable refreshTrigger={refresh} />
          <BulkSmsForm />
        </>
      ) : activeTab === "invoices" ? (
        <CreateInvoiceForm />
      ) : (
        <InvoiceList refreshTrigger={refresh} />
      )}
    </div>
  );
}
