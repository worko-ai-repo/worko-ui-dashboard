import { DynamicTable } from "../../../Shared/DynamicTable";

const rowData = [
  {
    id: "1",
    type: "Avijit Dutta Gupta",
    header: "avijitduttagupta51@gmail.com",
    ticketNo: "98716855741",
    date: "02-12-2025",
    details: "Currently no popular reader. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.",
    status: "Raised",
  },
  {
    id: "2",
    type: "Avijit Dutta Gupta",
    header: "avijitduttagupta51@gmail.com",
    ticketNo: "98316855741",
    date: "02-12-2025",
    details: "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s. It has survived not only five centuries, but also the leap into electronic typesetting.",
    status: "In process",
  },
  {
    id: "3",
    type: "Avijit Dutta Gupta",
    header: "avijitduttagupta51@gmail.com",
    ticketNo: "8283858581",
    date: "02-12-2025",
    details: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature.",
    status: "Resolved",
  },
  {
    id: "4",
    type: "Avijit Dutta Gupta",
    header: "avijitduttagupta51@gmail.com",
    ticketNo: "9820185781",
    date: "02-12-2025",
    details: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
    status: "Resolved",
  },
];

const statusColors: Record<string, string> = {
  Raised: "bg-red-100 text-red-600",
  "In process": "bg-blue-100 text-blue-600",
  Resolved: "bg-green-100 text-green-600",
};

const columns = [
  { key: "type", label: "Type" },
  { key: "header", label: "Header" },
  { key: "ticketNo", label: "Ticket no" },
  { key: "date", label: "Date" },
  {
    key: "details",
    label: "Details",
    render: (row: (typeof rowData)[0]) => (
      <div className="flex justify-center">
        <div className="max-w-xs whitespace-pre-wrap break-words text-sm text-gray-700 text-center">{row.details}</div>
      </div>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (row: (typeof rowData)[0]) => <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[row.status] || "bg-gray-100 text-gray-600"}`}>{row.status}</span>,
  },
];

const SupportTable = () => {
  // return <DynamicTable columns={columns} rows={rowData} enableSelect={false} />;
  return null;
};

export default SupportTable;
