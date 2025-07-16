import { useEffect, useState } from "react";
import { Eye, FileText, ArrowLeft } from "lucide-react";
import { DynamicTable, Column } from "../DynamicTable";
import ProgressCircle from "@Components/Shared/CircularBar";
import { useQuery } from "@tanstack/react-query";
import { CursorPaginationResumeScreeningRecordsParams, ResumeScreeningRecordDto } from "src/types/interface/CorporateServices.dto";
import { useAppContext } from "@Context/App.context";
import CorporateServiceObj from "../Services/Corporate.service";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import SkeletonLoader from "../SkeletonLoader";

interface ApplicantScreeningRecord {
  id: string;
  name: string;
  company: string;
  designation: string;
  yoe: number;
  location: string;
  matchingScore: number;
  status: string;
  rejectedDate: string | null;
  viewedDate: string | null;
}
export default function ApplicantScreeningTable({ BulkResumeId, onClose }: { BulkResumeId: string; onClose: () => void }) {
  const { userDetails } = useAppContext();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [applicantsData, setApplicantsData] = useState<ApplicantScreeningRecord[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);

  const params: Omit<CursorPaginationResumeScreeningRecordsParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    companyId: userDetails.companyId ?? "", // Now guaranteed to be string
    corporateBulkJdId: BulkResumeId, // Use the BulkResumeId prop to filter records
  };

  const {
    data,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
  } = useCursorPagination<ResumeScreeningRecordDto, CursorPaginationResumeScreeningRecordsParams>({
    queryKey: ["ApplicantScreeningBulkQuery", !!userDetails.companyId, params],
    queryFn: CorporateServiceObj.getBulkScreeningResumes,
    baseParams: params,
    enabled: !!userDetails.companyId, // only run if companyId exists
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
  }, [pageSize]);

  // useEffect to transform and set data when API call is successful
  useEffect(() => {
    // console.log("Data from API:", data);

    if (data && Array.isArray(data)) {
      const transformedData: ApplicantScreeningRecord[] = data
        .filter((item) => !!item.cvExtractedParsed) // skip undefined parsed data
        .map((item) => ({
          id: item.id,
          name: item.cvExtractedParsed!.candidateName,
          company: item.cvExtractedParsed!.candidateCurrentCompany,
          designation: item.cvExtractedParsed!.candidateCurrentDesignation,
          yoe: Number(item.cvExtractedParsed!.candidateExperience),
          location: item.cvExtractedParsed!.candidateLocation,
          matchingScore: item.matchingScore,
          status: item.processingStatus,
          rejectedDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : null,
          viewedDate: item.updatedAt ? new Date(item.updatedAt).toLocaleDateString() : null,
        }));

      setApplicantsData(transformedData);
    } else {
      setApplicantsData([]);
    }
  }, [data]);

  const toggleSelectAll = () => {
    if (selectedRows.length === applicantsData.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(applicantsData.map((row) => row.id));
    }
  };

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  };

  const columns: Column<(typeof applicantsData)[0]>[] = [
    {
      key: "name",
      label: "Applicants name",
      render: (row: (typeof applicantsData)[0]) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {row.name
                .split(" ")
                .map((n: string) => n[0])
                .slice(0, 3) // limit to max 3 initials
                .join("")}
            </span>
          </div>
          <span className="font-semibold text-gray-800">{row.name}</span>
        </div>
      ),
    },
    {
      key: "company",
      label: "Company",
      render: (row: (typeof applicantsData)[0]) => <span className="text-gray-700">{row.company}</span>,
    },
    {
      key: "designation",
      label: "Designation",
      render: (row: (typeof applicantsData)[0]) => <span className="text-gray-700">{row.designation}</span>,
    },
    {
      key: "yoe",
      label: "YOE",
      render: (row: (typeof applicantsData)[0]) => <span className="font-semibold text-gray-800">{row.yoe}</span>,
    },
    {
      key: "location",
      label: "Location",
      render: (row: (typeof applicantsData)[0]) => <span className="text-gray-700">{row.location}</span>,
    },
    {
      key: "matchingScore",
      label: "Matching Score",
      render: (row: (typeof applicantsData)[0]) => (
        <ProgressCircle
          onClick={() => {
            /*  setFeedbackModalOpen(true);

        setScorePointsModal({
          title: row.matchingScore ?? 0 >= 70 ? "Matching Score Details" : "Rejected Reason",
          data: row.matchingScore ?? 0 >= 70 ? row.scoreDetails : row.rejectionFeedbackBySystem, // Assuming matchingScore is an object with details
          matchingScore: row.matchingScore ?? 0,
          details: true,
          showCloseButton: true,
          onClose: () => setFeedbackModalOpen(false),
        }); */
          }}
          value={row.matchingScore}
        />
      ),
    },
    {
      key: "actions",
      label: "Actions",
      render: (row: (typeof applicantsData)[0]) => (
        <div className="flex gap-2">
          <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <Eye className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
            <FileText className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      ),
    },
  ];

  const renderExpandedDetails = (row: (typeof applicantsData)[0]) => (
    <div className="flex justify-between items-center py-2">
      <div className="text-sm text-gray-600">
        <strong>Status:</strong>
        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${row.status === "accepted" ? "bg-green-100 text-green-800" : row.status === "rejected" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>{row.status.charAt(0).toUpperCase() + row.status.slice(1)}</span>
      </div>

      <div className="flex gap-4 text-sm text-gray-600">
        {row.rejectedDate && (
          <div>
            <span className="font-medium">Rejected on:</span>
            <span className="ml-2">{row.rejectedDate}</span>
          </div>
        )}
        {row.viewedDate && (
          <div>
            <span className="font-medium">Viewed on:</span>
            <span className="ml-2">{row.viewedDate}</span>
          </div>
        )}
      </div>
    </div>
  );
  if (queryIsJobsLoading) {
    return (
      <div className="max-h-screen bg-gray-50 min-w-[60vw] ">
        <SkeletonLoader showButtons={true} buttonCount={1} showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />
      </div>
    );
  }
  return (
    <div className="max-h-screen bg-gray-50 ">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-6">
          <button className="w-16 h-16 bg-white rounded-full shadow-md flex items-center justify-center hover:shadow-lg transition-shadow">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>

          <div className="flex gap-4">
            {/* Job Profile Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 w-80">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Job profile</div>
                <div className="text-lg font-bold text-blue-600">Marketing Manager</div>
              </div>
            </div>

            {/* Screened Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 w-40">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Screened</div>
                <div className="text-2xl font-bold text-gray-800">20</div>
              </div>
            </div>

            {/* Screening Done By Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 w-56">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Screening done by</div>
                <div className="text-lg font-semibold text-gray-800">Avijit Dutta Gupta</div>
              </div>
            </div>

            {/* Screening Time Card */}
            <div className="bg-white rounded-xl shadow-sm p-4 w-72">
              <div className="text-center">
                <div className="text-sm text-gray-500 mb-1">Screening time</div>
                <div className="text-lg font-semibold text-gray-800">15-04-2025, 7:30 AM</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <DynamicTable columns={columns} rows={applicantsData} selectedRows={selectedRows} enableSelect={false} allSelected={selectedRows.length === applicantsData.length} pageSize={pageSize} setPageSize={setPageSize} hasNextPage={hasNextPage} hasPrevPage={hasPreviousPage} handleNextPage={goToNextPage} handlePreviousPage={goToPreviousPage} />
    </div>
  );
}
