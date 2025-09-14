import { FunctionComponent, useState, useCallback } from "react";
import Table from "../../SharedComponents/Table";
import { customer_support } from "@Assets";
import { Button } from "@headlessui/react";


const Support = () => {
  const [isHelpOpen, setHelpOpen] = useState(false);

  const openHelp = useCallback(() => {
    setHelpOpen(true);
  }, []);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
  }, []);

  const serviceData = [
    {
      id: 1,
      Type: "Vaibhav Rohaan",
      Header: "vaibhavrohaan3@gmail.com",
      Ticketno: "805338742",
      Date: "01-12-25",
      Details: "Contrary to popular belief, Lorem Ipsum is not simply random text. It has roots in a piece of classical Latin literature from 45 BC",
      status: "Raised",
      statusColor: { bg: "bg-red-100", text: "text-red-800" },
    },
    {
      id: 2,
      Type: "Mock interview/preparation",
      Header: "Amazon",
      Ticketno: "24-08-2025",
      Date: "24-08-2025",
      Details: "Mentor assigned",
      status: "In Progress",
      statusColor: { bg: "bg-blue-100", text: "text-blue-800" },
    },
    {
      id: 3,
      Type: "Mock interview/preparation",
      Header: "Amazon",
      Ticketno: "24-08-2025",
      Date: "24-08-2025",
      Details: "Mentor assigned",
      status: "Escalated",
      statusColor: { bg: "bg-yellow-100", text: "text-yellow-800" },
    },
    {
      id: 4,
      Type: "Mock interview/preparation",
      Header: "Amazon",
      Ticketno: "24-08-2025",
      Date: "24-08-2025",
      Details: "Mentor assigned",
      status: "Resolved",
      statusColor: { bg: "bg-green-100", text: "text-green-800" },
    },
    // ... other service data
  ];

  const columns = [
    {
      key: "Type",
      header: "Type",
      width: "1/6",
      className: "tracking-wide leading-6 text-center",
      sortable: true,
    },
    {
      key: "Header",
      header: "Header",
      width: "1/12",
      sortable: true,
      className: "tracking-wide leading-6 text-center",
    },
    {
      key: "Ticketno",
      header: "Ticket No",
      width: "1/12",
      sortable: true,
      className: "tracking-wide leading-6 text-center text-nowrap",
    },
    {
      key: "Date",
      header: "Date",
      sortable: true,
      width: "1/12",
      className: "tracking-wide leading-6 text-center text-nowrap",
    },
    {
      key: "Details",
      header: "Details",
      width: "1/6",
      sortable: true,
      className: "tracking-wide leading-6",
    },
    {
      key: "status",
      header: "Status",
      width: "1/6",
      sortable: true,
      className: "flex justify-center",
      render: (value: any, item: any) => (
        <div className={`px-4 py-4 rounded-3xl ${item.statusColor.bg} ${item.statusColor.text} flex items-center justify-center`}>
          <div className="tracking-wide leading-6">{value}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="w-full relative rounded-3xl overflow-hidden text-base text-slate-900 font-poppins">
      {/* Help button container at top with right alignment */}
      <div className="w-full flex justify-end p-2">
        <div className="relative rounded-lg bg-[#316bff] h-11 flex flex-row items-center justify-center p-4 px-8 box-border gap-1.5 cursor-pointer text-center text-xs text-white font-poppins" onClick={openHelp}>
          <img className="w-5 h-5" alt="" src={customer_support} />
          <div className="relative tracking-[0.2px] leading-[114%] font-semibold">Help</div>
        </div>
        <Button onClick={() => alert("hi")}>TEXTINMIDDLE</Button>
      </div>
      <div className="bg-white p-4 rounded-3xl shadow-md">
        {/* Table positioned below the help button */}
        <Table data={serviceData} columns={columns} keyExtractor={(item) => item.id.toString()} className="w-full" headerClassName="bg-cyan-50 text-nowrap py-3 px-4 mb-2" rowClassName={() => "w-full mb-2 bg-white text-sm border-b"} />
      </div>
    </div>
  );
};

export default Support;
