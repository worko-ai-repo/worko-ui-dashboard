import React, { useState } from "react";
import { DynamicTable } from "../../../Shared/DynamicTable";
import { Eye } from "lucide-react";

type InvoiceStatus = "To be validated" | "Validated" | "Invoice raised" | "Invoice resend" | "Paid";

interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  invoiceMonth: string;
  invoiceDate: string;
  totalAmount: string;
  hiredCount: number;
  hiredCTC: string;
  commission: string;
  status: InvoiceStatus;
}

const staticData: InvoiceRow[] = [
  {
    id: "1",
    invoiceNumber: "As4545499876832",
    invoiceMonth: "March, 2025",
    invoiceDate: "24-08-2025",
    totalAmount: "₹ 25,000",
    hiredCount: 50,
    hiredCTC: "4LPA",
    commission: "₹ 5,000",
    status: "To be validated",
  },
  {
    id: "2",
    invoiceNumber: "As4545499876833",
    invoiceMonth: "March, 2025",
    invoiceDate: "24-08-2025",
    totalAmount: "₹ 25,000",
    hiredCount: 50,
    hiredCTC: "4LPA",
    commission: "₹ 5,000",
    status: "Validated",
  },
  {
    id: "3",
    invoiceNumber: "As4545499876834",
    invoiceMonth: "March, 2025",
    invoiceDate: "24-08-2025",
    totalAmount: "₹ 25,000",
    hiredCount: 50,
    hiredCTC: "4LPA",
    commission: "₹ 5,000",
    status: "Invoice raised",
  },
  {
    id: "4",
    invoiceNumber: "As4545499876835",
    invoiceMonth: "March, 2025",
    invoiceDate: "24-08-2025",
    totalAmount: "₹ 25,000",
    hiredCount: 50,
    hiredCTC: "4LPA",
    commission: "₹ 5,000",
    status: "Invoice resend",
  },
  {
    id: "5",
    invoiceNumber: "As4545499876836",
    invoiceMonth: "March, 2025",
    invoiceDate: "24-08-2025",
    totalAmount: "₹ 25,000",
    hiredCount: 50,
    hiredCTC: "4LPA",
    commission: "₹ 5,000",
    status: "Paid",
  },
];

const statusColors: Record<InvoiceStatus, string> = {
  "To be validated": "bg-gray-200 text-gray-600",
  Validated: "bg-blue-100 text-blue-700",
  "Invoice raised": "bg-yellow-100 text-yellow-700",
  "Invoice resend": "bg-red-100 text-red-700",
  Paid: "bg-green-100 text-green-700",
};

export default function PaymentAndInvoice() {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const columns = [
    { key: "invoiceNumber", label: "Invoice number" },
    { key: "invoiceMonth", label: "Invoice month" },
    { key: "invoiceDate", label: "Invoice date" },
    { key: "totalAmount", label: "Total invoice amount" },
    { key: "hiredCount", label: "Hired count" },
    { key: "hiredCTC", label: "Hired CTC" },
    { key: "commission", label: "Hiring commission" },
    {
      key: "status",
      label: "Status",
      render: (row: InvoiceRow) => <span className={`px-3 py-1 text-xs font-semibold rounded-full ${statusColors[row.status]}`}>{row.status}</span>,
    },
    {
      key: "actions",
      label: "Action",
      render: () => (
        <div className="flex gap-2 justify-center">
          <button className="flex gap-1 items-center btn-sky">
            <Eye size={16} />
            View Invoice
          </button>
          <button className="flex gap-1 items-center px-3 py-[10px] text-white text-sm bg-[#316BFF] rounded-[10px] ">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25" fill="none">
              <path d="M2.99609 12.9004C2.99609 7.93039 7.02609 3.90039 11.9961 3.90039C16.9661 3.90039 20.9961 7.93039 20.9961 12.9004C20.9961 17.8704 16.9661 21.9004 11.9961 21.9004C7.02609 21.9004 2.99609 17.8704 2.99609 12.9004Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              <path d="M7.99609 12.9004L10.9961 15.9004L15.9961 10.9004" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
            Confirm Payment
          </button>
        </div>
      ),
    },
  ];

  // return <DynamicTable columns={columns} rows={staticData} expandedRows={expandedRows} toggleExpand={toggleExpand} enableSelect={false} />;
}
