import React, { useState } from "react";
import { Filter, X, Link } from "lucide-react";
import CloseJob from "./CloseJob";
import { JobApiResponse, JobData } from "@Interfaces/CorporateDashboard.dto";
import { Archive, Duplicate, Edit, Repost, View } from "@Assets";
import { toast } from "react-toastify";
import { SelectedRow } from "./AdminJobs";
import { getToastOptions } from "lib-worko-ui";
import { useNavigate } from "react-router-dom";
import { DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";

interface JobsTableProps {
  activeTab: "PUBLISHED" | "CLOSED" | "ARCHIVED";
  data: JobData[];
  selectedRows: SelectedRow[];
  selectRows: (row: JobData) => void;
  selectAllRows: (rows: JobData[]) => void;
  reset: () => void;
  handleJobCreation: (mode: "UPDATE" | "DUPLICATE", row: JobData) => void;
  updateJobStatus: (
    status: "CLOSED" | "PUBLISHED" | "ARCHIVED",
    data: {
      id: string;
      companyId: string;
    }
  ) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
}

const JobTableWrapper: React.FC<JobsTableProps> = ({ activeTab, data, selectedRows, selectRows, selectAllRows, reset, handleJobCreation, updateJobStatus, hasNextPage, hasPrevPage, fetchNextPage, fetchPreviousPage, pageSize, setPageSize }) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isCloseJobModalOpen, setIsCloseJobModalOpen] = useState<{ id: string; companyId: string } | null>(null);

  //hook
  const nav = useNavigate();

  const columns = [
    {
      key: "jobTitle",
      label: "Job Title",
      render: (row: JobData) => (
        <span className="font-bold w-full capitalize truncate block max-w-[99.3%] cursor-pointer" data-tooltip-id="my-tooltip" data-tooltip-content={row.jobTitle} data-tooltip-place="top" data-tooltip-delay-show={500} data-tooltip-delay-hide={500}>
          {row.jobTitle}
        </span>
      ),
    },
    {
      key: "companyName",
      label: "Company",
      render: (row: JobData) => {
        const finalLogoUrl = row?.companyDetails?.logo ? `${import.meta.env.APP_WORKO_BASE_URL}/images/${row?.companyDetails?.logo}` : row?.companyDetails?.logoUrl;
        return (
          <div className="flex items-center gap-2">
            <img src={finalLogoUrl} alt={row.companyName} className="w-8 h-8 object-contain rounded-full" />
            <span className="font-bold">{row.companyName}</span>
          </div>
        );
      },
    },
    {
      key: "location",
      label: "Location",
      render: (row: JobData) => {
        const locations = row.location.fullLocation || row.location.city || row.location.state || row.location.country || ["Not specified"];
        return <span className="capitalize">{locations.join(", ")}</span>;
      }
    },
    { key: "department", label: "Department" },
    { key: "totalApplications", label: "Total Applications" },
    ...(activeTab === "PUBLISHED" ? [{ key: "pending", label: "Pending" }] : [{ key: "archivedBy", label: "Archived By" }]),
    ...(activeTab === "CLOSED" ? [{ key: "status", label: "Status" }] : []),
    {
      key: "actions",
      label: "Actions",
      render: (row: JobData) => {
        const tabButtonConfig: Record<
          string,
          {
            icon: JSX.Element;
            className: string;
            onClick?: () => void;
            tooltip: string;
          }[]
        > = {
          PUBLISHED: [
            { icon: <img src={View} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "View Applicants", onClick: () => nav(`/admin/cApplicants/${row.id}`) },
            { icon: <Filter className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Screen Resumes", onClick: () => nav(`/admin/bulk-cv-check/${row.companyDetails.id}`) },
            { icon: <img src={Duplicate} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Duplicate Job", onClick: () => handleJobCreation("DUPLICATE", row) },
            { icon: <img src={Edit} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Update Job", onClick: () => handleJobCreation("UPDATE", row) },
            { icon: <Link className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "View Job", onClick: () => window.open(`/v0/jobs/${row.companyDetails.name}/${row.id}`, "_blank") },
            { icon: <X className="w-5 h-5" />, className: "btn-blue shrink-0", tooltip: "Close Job", onClick: () => setIsCloseJobModalOpen({ id: row.id, companyId: row.companyDetails.id }) },
            { icon: <img src={Archive} className="w-5 h-5" />, className: "btn-blue shrink-0", tooltip: "Archive Job", onClick: () => updateJobStatus("ARCHIVED", { id: row.id, companyId: row.companyDetails.id }) },
          ],
          ARCHIVED: [
            { icon: <X className="w-5 h-5" />, className: "btn-blue shrink-0", tooltip: "Remove Job", onClick: () => updateJobStatus("CLOSED", { id: row.id, companyId: row.companyDetails.id }) },
            { icon: <img src={Repost} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Repost Job", onClick: () => updateJobStatus("PUBLISHED", { id: row.id, companyId: row.companyDetails.id }) },
            { icon: <img src={Duplicate} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Duplicate", onClick: () => handleJobCreation("DUPLICATE", row) },
          ],
          CLOSED: [{ icon: <img src={Duplicate} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Duplicate Job", onClick: () => handleJobCreation("DUPLICATE", row) }],
        };

        const buttons = tabButtonConfig[activeTab];

        if (!buttons) return null;

        return (
          <div className="p-1 flex gap-2 items-center justify-center">
            {buttons.map((btn, idx) => (
              <button key={idx} className={btn.className} onClick={btn.onClick} title={btn.tooltip}>
                {btn.icon}
              </button>
            ))}
          </div>
        );
      },
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  return (
    <div>
      <button className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${selectedRows.length === 0 ? "hidden" : ""}`} onClick={() => reset}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;</span>
        <span>deselect {selectedRows?.length} rows</span>
      </button>
      <DynamicTable<JobData>
        columns={columns}
        rows={data ?? []}
        selectedRows={selectedRows.map((row) => row.jobId)}
        expandedRows={expandedRows}
        toggleRow={(id) => selectRows(data.find((row) => row.id === id)!)}
        toggleExpand={toggleExpand}
        toggleSelectAll={() => selectAllRows(data)}
        allSelected={selectedRows?.length === data.length && data.length > 0}
        renderExpandedDetails={(row) => (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="col-span-2">
              <div className="text-gray-400">Experience</div>
              {`${row.experienceRange.min} - ${row.experienceRange.max}`}
            </div>
            <div>
              <div className="text-gray-400">Salary bucket</div>
              {`${row.salaryRange.min} - ${row.salaryRange.max}`}
            </div>
            <div>
              <div className="text-gray-400">Created at</div>
              {new Date(row.createdAt).toLocaleDateString("en-GB")}
            </div>
            <div>
              <div className="text-gray-400">Created by</div>
              {row.createdByUserId}
            </div>
          </div>
        )}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        handleNextPage={fetchNextPage}
        handlePreviousPage={fetchPreviousPage}
        pageSize={pageSize} // Default page size
        setPageSize={setPageSize} // Replace with actual handler
      />
      <Modal isOpen={isCloseJobModalOpen != null} onClose={() => setIsCloseJobModalOpen(null)}>
        <CloseJob
          onClose={() => setIsCloseJobModalOpen(null)}
          onSubmit={() => {
            if (isCloseJobModalOpen?.id && isCloseJobModalOpen?.companyId) {
              updateJobStatus("CLOSED", { id: isCloseJobModalOpen.id, companyId: isCloseJobModalOpen.companyId });
            } else {
              toast.error("Failed to perform this operation", getToastOptions({}));
              console.error("Missing id or companyId for closing job.");
            }
          }}
        />
      </Modal>
    </div>
  );
};

export default JobTableWrapper;
