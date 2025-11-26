import React, { useState } from "react";
import { Filter, X, Link, Building2, Loader2 } from "lucide-react";
import CloseJob from "./CloseJob";
import { JobApiResponse, JobData } from "@Interfaces/CorporateDashboard.dto";
import { Archive, Duplicate, Edit, Repost, View } from "@Assets";
import { toast } from "react-toastify";
import { SelectedRow } from "./AdminJobs";
import { getToastOptions } from "@Utils/Toast.utils";
import { useNavigate } from "react-router-dom";
import { Column, DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";
import { JobStatusType } from "src/types/JobsAndApplication.type";
import CreatedByDisplay from "@Components/Shared/PostJob/CreatedByDisplay";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import CompanyLogoRender from "../Company/CompanyLogoRender";

interface JobsTableProps {
  activeTab: JobStatusType;
  data: JobData[];
  selectedRows: SelectedRow[];
  selectRows: (row: JobData) => void;
  selectAllRows: (rows: JobData[]) => void;
  reset: () => void;
  handleJobCreation: (mode: "UPDATE" | "DUPLICATE", row: JobData) => void;
  updateJobStatus: (
    status: JobStatusType,
    data: {
      id: string;
      companyId: string;
    },
    closeReason?: { reason: string; note: string }
  ) => void;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  fetchNextPage: () => void;
  fetchPreviousPage: () => void;
  pageSize: number;
  setPageSize: any;
  getAllSelected: (item: JobData[]) => boolean;
  isUpdating?: boolean; // New prop to track mutation state
}

export const keyFallbacksforJobs = {
  totalApplicants: ["countCompanyJob.allJobApplicationCounts.total"],
  newApplicants: ["countCompanyJob.allJobApplicationCounts.applied"],
};

const JobTableWrapper: React.FC<JobsTableProps> = ({
  activeTab,
  data,
  selectedRows,
  selectRows,
  selectAllRows,
  reset,
  handleJobCreation,
  updateJobStatus,
  hasNextPage,
  hasPrevPage,
  fetchNextPage,
  fetchPreviousPage,
  pageSize,
  setPageSize,
  getAllSelected,
  isUpdating = false,
}) => {
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isCloseJobModalOpen, setIsCloseJobModalOpen] = useState<{
    id: string;
    companyId: string;
  } | null>(null);
  const [updatingJobId, setUpdatingJobId] = useState<string | null>(null);
  const { sortedData, onSortChange } = useSortableData(data, keyFallbacksforJobs, {
    tableId: "admin-jobs-table",
    persistInUrl: true,
    persistInLocalStorage: false,
    defaultSort: null,
  });
  const nav = useNavigate();

  // Wrapper to track which job is being updated
  const handleUpdateJobStatus = async (
    status: JobStatusType,
    data: { id: string; companyId: string },
    closeReason?: { reason: string; note: string }
  ) => {
    setUpdatingJobId(data.id);
    try {
      await updateJobStatus(status, data, closeReason);
    } finally {
      setUpdatingJobId(null);
    }
  };

  const columns: Column<JobData>[] = [
    {
      key: "jobTitle",
      label: "Job Title",
      sortable: true,
      render: (row: JobData) => (
        <div className="flex items-center gap-2">
          <span
            onClick={() => nav(`/admin/aApplicants/${row.id}`)}
            className="w-full capitalize truncate block max-w-[99.3%] cursor-pointer"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={row.jobTitle}
            data-tooltip-place="top"
            data-tooltip-delay-show={500}
            data-tooltip-delay-hide={500}>
            {row.jobTitle}
          </span>
          {updatingJobId === row.id && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
        </div>
      ),
    },
    {
      key: "companyName",
      label: "Company",
      sortable: true,
      render: (row: JobData) => {
        return (
          <div className="flex flex-row items-center gap-1 min-w-0">
            {row?.companyDetails && row?.companyDetails.id ? (
              <CompanyLogoRender {...row?.companyDetails} key={row?.id} />
            ) : (
              <Building2 className="w-16 p-2 h-12  text-gray-400 rounded-full  border " />
            )}
            <span
              className="capitalize text-center truncate w-full cursor-pointer text-sm"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={row?.companyName || "No company available"}
              data-tooltip-place="top"
              title={row?.companyName || "No company available"}>
              {row?.companyName || "No company available"}
            </span>
          </div>
        );
      },
    },
    {
      key: "location",
      label: "Location",
      sortable: true,
      render: (row: JobData) => {
        const locations = row.location.fullLocation ||
          row.location.city ||
          row.location.state ||
          row.location.country || ["Not specified"];
        return <span className="capitalize">{locations.join(", ")}</span>;
      },
    },
    {
      key: "salaryRange",
      label: "Salary Range",
      render: (row: JobData) => {
        return <div>{`${row.salaryRange.min} - ${row.salaryRange.max} LPA`}</div>;
      },
    },
    { key: "department", label: "Department", sortable: true },
    {
      key: "totalApplicants",
      label: "Total Applicants",
      sortable: true,
      render: (row: JobData) => {
        return <div>{row?.countCompanyJob?.allJobApplicationCounts.total || 0}</div>;
      },
    },
    {
      key: "newApplicants",
      label: "New Applicants",
      sortable: true,
      render: (row: JobData) => {
        return <div>{row?.countCompanyJob?.allJobApplicationCounts.applied || 0}</div>;
      },
    },
    // { key: "pendingApplicants", label: "Pending", sortable: true },
    ...(activeTab === "PUBLISHED"
      ? [
          {
            key: "createdAt",
            label: "Created At",
            sortable: true,
            render: (row: JobData) => (
              <div>{new Date(row.createdAt).toLocaleDateString("en-GB")}</div>
            ),
          },
        ]
      : [
          {
            key: "updatedAt",
            sortable: true,
            label: `${activeTab === "CLOSED" ? "Closed" : "Archived"} At`,
            render: (row: JobData) => new Date(row.updatedAt).toLocaleDateString("en-GB"),
          },
        ]),
    ...(activeTab === "CLOSED"
      ? [
          { key: "status", label: "Status" },
          {
            key: "shortSoftDeleteReason",
            label: "Reason",
            contentWidth: "max-w-none",
            render: (row: JobData) => {
              const ReasonColorMap: Record<string, string> = {
                "Hired from Worko": "bg-green-100 text-green-800 border border-green-200",
                "Hired from Other Platform": "bg-blue-100 text-yellow-800 border border-blue-200",
                "Hired Internally": "bg-blue-100 text-blue-800 border border-blue-200",
                "Position Went on Hold/Dismissed": "bg-red-100 text-red-800 border border-red-200",
              };

              const reason = row.shortSoftDeleteReason;
              const colorClass =
                reason && ReasonColorMap[reason]
                  ? ReasonColorMap[reason]
                  : "bg-gray-100 text-gray-600 border border-gray-200";

              return (
                <div
                  className={`inline-block px-2 py-1 rounded-full text-sm font-medium ${colorClass}`}>
                  {reason || "N/A"}
                </div>
              );
            },
          },
          {
            key: "detailedSoftDeleteReason ",
            label: "Other Reason",
            render: (row: JobData) => row.detailedSoftDeleteReason || "-",
          },
        ]
      : []),

    {
      key: "IsWorko",
      label: "Job Source",
      render: (row: JobData) => (
        <div className="flex items-center justify-center gap-2">
          {!row?.createdByCorporateUserId && row?.createdByUserId ? (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-600">
              Worko
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-600">
              External
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      contentWidth: `max-w-none ${activeTab !== "CLOSED" ? "!min-w-96" : ""} `,
      render: (row: JobData) => {
        const isRowUpdating = updatingJobId === row.id;

        const tabButtonConfig: Record<
          string,
          {
            icon: JSX.Element;
            className: string;
            onClick?: () => void;
            tooltip: string;
            disabled?: boolean;
          }[]
        > = {
          PUBLISHED: [
            {
              icon: <img src={View} className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "View Applicants",
              onClick: () => nav(`/admin/aApplicants/${row.id}`),
              disabled: isRowUpdating,
            },
            {
              icon: <Filter className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "Screen Resumes",
              onClick: () =>
                nav(`/admin/aBulkCVCheck`, {
                  state: { jobDesc: row.jobDescription },
                }),
              disabled: isRowUpdating,
            },
            {
              icon: <img src={Duplicate} className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "Duplicate Job",
              onClick: () => handleJobCreation("DUPLICATE", row),
              disabled: isRowUpdating,
            },
            {
              icon: <img src={Edit} className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "Update Job",
              onClick: () => handleJobCreation("UPDATE", row),
              disabled: isRowUpdating,
            },
            {
              icon: <Link className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "View Job",
              onClick: () =>
                window.open(
                  `${import.meta.env.APP_PROXY_BASE}jobs/${row.companyDetails.name}/${row.id}`,
                  "_blank"
                ),
              disabled: isRowUpdating,
            },
            {
              icon: isRowUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              ),
              className: "btn-blue shrink-0",
              tooltip: "Close Job",
              onClick: () =>
                setIsCloseJobModalOpen({ id: row.id, companyId: row?.companyDetails?.id }),
              disabled: isRowUpdating,
            },
            {
              icon: isRowUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <img src={Archive} className="w-5 h-5" />
              ),
              className: "btn-blue shrink-0",
              tooltip: "Archive Job",
              onClick: () =>
                handleUpdateJobStatus("ARCHIVED", {
                  id: row.id,
                  companyId: row?.companyDetails?.id,
                }),
              disabled: isRowUpdating,
            },
          ],
          ARCHIVED: [
            {
              icon: isRowUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <X className="w-5 h-5" />
              ),
              className: "btn-blue shrink-0",
              tooltip: "Close Job",
              onClick: () =>
                setIsCloseJobModalOpen({ id: row.id, companyId: row?.companyDetails?.id }),
              disabled: isRowUpdating,
            },
            {
              icon: isRowUpdating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <img src={Repost} className="w-5 h-5" />
              ),
              className: "btn-sky shrink-0",
              tooltip: "Repost Job",
              onClick: () =>
                handleUpdateJobStatus("PUBLISHED", {
                  id: row.id,
                  companyId: row?.companyDetails?.id,
                }),
              disabled: isRowUpdating,
            },
            {
              icon: <img src={Duplicate} className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "Duplicate",
              onClick: () => handleJobCreation("DUPLICATE", row),
              disabled: isRowUpdating,
            },
          ],
          CLOSED: [
            {
              icon: <img src={Duplicate} className="w-5 h-5" />,
              className: "btn-sky shrink-0",
              tooltip: "Duplicate Job",
              onClick: () => handleJobCreation("DUPLICATE", row),
              disabled: isRowUpdating,
            },
          ],
        };

        const buttons = tabButtonConfig[activeTab];

        if (!buttons) return null;

        return (
          <div className="p-1 flex gap-2 items-center justify-center">
            {buttons.map((btn, idx) => (
              <button
                key={idx}
                className={`${btn.className} ${
                  btn.disabled ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={btn.onClick}
                title={btn.tooltip}
                disabled={btn.disabled}>
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
      <button
        className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${
          selectedRows.length === 0 ? "hidden" : ""
        }`}
        onClick={() => reset()}>
        <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">
          &minus;
        </span>
        <span>deselect {selectedRows?.length} rows</span>
      </button>
      <DynamicTable<JobData>
        columns={columns}
        rows={sortedData ?? []}
        selectedRows={selectedRows.map((row) => row.jobId)}
        expandedRows={expandedRows}
        onSortChange={onSortChange}
        toggleRow={(id) => selectRows(data.find((row) => row.id === id)!)}
        toggleExpand={toggleExpand}
        toggleSelectAll={() => selectAllRows(data)}
        allSelected={getAllSelected(data)}
        renderExpandedDetails={(row) => (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            <div className="col-span-2">
              <div className="text-gray-400">Experience</div>
              {`${row.experienceRange.min} - ${row.experienceRange.max}`}
            </div>

            <div>
              <div className="text-gray-400">Created by</div>
              <CreatedByDisplay row={row} mode="created" />
            </div>
            {activeTab === "PUBLISHED" && (
              <>
                <div>
                  <div className="text-gray-400">Update At</div>
                  {new Date(row.updatedAt).toLocaleDateString("en-GB")}
                </div>
                <div>
                  <div className="text-gray-400">Update By</div>
                  <CreatedByDisplay row={row} mode="updated" />
                </div>
              </>
            )}
            {activeTab !== "PUBLISHED" && (
              <div>
                <div className="text-gray-400">
                  {activeTab === "CLOSED" ? "Closed" : "Archived"} by
                </div>
                <CreatedByDisplay row={row} mode="updated" />
              </div>
            )}
            {activeTab !== "PUBLISHED" && (
              <div>
                <div>
                  <div className="text-gray-400">Created at</div>
                  <div>{new Date(row.createdAt).toLocaleDateString("en-GB")}</div>
                </div>
              </div>
            )}
          </div>
        )}
        hasNextPage={hasNextPage}
        hasPrevPage={hasPrevPage}
        handleNextPage={fetchNextPage}
        handlePreviousPage={fetchPreviousPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
      />
      <Modal isOpen={isCloseJobModalOpen != null} onClose={() => setIsCloseJobModalOpen(null)}>
        <CloseJob
          onClose={() => setIsCloseJobModalOpen(null)}
          onSubmit={(data: { note: string; reason: string }) => {
            if (isCloseJobModalOpen?.id && isCloseJobModalOpen?.companyId) {
              handleUpdateJobStatus(
                "CLOSED",
                {
                  id: isCloseJobModalOpen.id,
                  companyId: isCloseJobModalOpen.companyId,
                },
                data
              );
              setIsCloseJobModalOpen(null);
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
