import { FunctionComponent, useState, useCallback, useMemo, useEffect } from "react";
import { Column, DynamicTable } from "../DynamicTable";
import { eyeIcon } from "@AssetsFolder/assets";
import { BulkScreeningListItemDto, CursorPaginationBulkScreenedJobsParams } from "src/types/corporateServices.types";
import { useAppContext } from "@Context/App.context";
import CorporateServiceObj from "../Services/Corporate.service";
import SkeletonLoader from "../SkeletonLoader";
import ApplicantScreeningTable from "./BulkCvApplicants";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";

// Define the data type for our screening records
interface ScreeningRecord {
  id: string;
  jobTitle: string;
  location: string;
  experienceRange: string;
  totalCandidates: number;
  screenOnDate: string;
  doneBy: string;
}

const ScreeningListView: FunctionComponent = () => {
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [BulkResumeId, setBulkResumeId] = useState<string>("");
  const [isBulkResumesOpen, setBulkResumesOpen] = useState<boolean>(false);
  const { userDetails } = useAppContext();

  const [pageSize, setPageSize] = useState<number>(10);

  const params: Omit<CursorPaginationBulkScreenedJobsParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    companyId: userDetails.companyId ?? "", // Now guaranteed to be string
  };

  const { data, isLoading, hasNextPage, hasPreviousPage, goToNextPage, goToPreviousPage, refetch, reset } = useCursorPagination<BulkScreeningListItemDto, CursorPaginationBulkScreenedJobsParams>({
    queryKey: ["CorporateJobsApplicationQuery", !!userDetails.companyId, params],
    queryFn: CorporateServiceObj.fetchBulkScreenedJobs,
    baseParams: params,
    enabled: !!userDetails.companyId, // only run if companyId exists
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
  }, [pageSize]);

  // Use useMemo to memoize the transformed data and prevent unnecessary recalculations
  const transformedData = useMemo(() => {
    console.log("Data from API:", data);

    if (data && Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id,
        jobTitle: item.jobTitle || "Not mentioned",
        location: item.jobLocation || "Not mentioned",
        experienceRange: item.experienceRange ? `${item.experienceRange.min} - ${item.experienceRange.max}` : "Not mentioned",
        totalCandidates: 0,
        screenOnDate: item.createdAt
          ? new Date(item.createdAt).toLocaleString("en-US", {
              year: "numeric",
              month: "numeric",
              day: "numeric",
            })
          : "Not mentioned",
        doneBy: item.createdByCorporateUserId || "Not mentioned",
      }));
    } else {
      console.warn("Data is not in the expected format or is empty.");
      return [];
    }
  }, [data]); // Only recalculate when data changes

  const renderActions = useCallback(
    (row: ScreeningRecord) => (
      <div className="flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setBulkResumeId(row.id);
            setBulkResumesOpen(true);
          }}
          data-tooltip-id="my-tooltip"
          data-tooltip-content="View details"
          className="flex items-center justify-center rounded-lg w-10 h-8 bg-gradient-to-t from-[#57E1E1] to-[#57E1E1] relative">
          <img className="w-4 h-4 rounded-md bg-[#57E1E1] absolute top-[30%]" src={eyeIcon} alt="View Details" />
        </button>
      </div>
    ),
    []
  );

  // Define columns for the table
  const columns:Column<ScreeningRecord>[] = [
    {
      key: "jobTitle",
      label: "Job title",
      render: (row: ScreeningRecord) => (
        <span className="w-full capitalize font-bold " >
          {row.jobTitle}
        </span>
    ),
    },
    {
      key: "location",
      label: "Location",
    },
    {
      key: "experienceRange",
      label: "Experience range",
    },
    {
      key: "totalCandidates",
      label: "Total candidates",
    },
    {
      key: "screenOnDate",
      label: "Screen on date",
    },
    {
      key: "doneBy",
      label: "Done by",
    },
    
    {
      key: "actions",
      label: "Actions",
      render: renderActions,
    },
  ];

/*   const toggleSelectAll = useCallback(() => {
    if (transformedData && selectedRows.length === transformedData.length) {
      setSelectedRows([]);
    } else if (transformedData) {
      setSelectedRows(transformedData.map((row) => row.id));
    }
  }, [selectedRows.length, transformedData]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => (prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]));
  }, []);
 */

  // Handle popup close
  const handleClosePopup = useCallback(() => {
    setBulkResumesOpen(false);
    setBulkResumeId("");
  }, []);

  return isLoading ? (
    <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />
  ) : (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        <div className="max-w-full mx-auto">
          <DynamicTable columns={columns} rows={transformedData ?? []}  enableSelect={false}    pageSize={pageSize} setPageSize={setPageSize} handlePreviousPage={goToPreviousPage} handleNextPage={goToNextPage} hasNextPage={hasNextPage} hasPrevPage={hasPreviousPage} />
        </div>
      </div>

      {isBulkResumesOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-50 p-10 rounded-lg   w-atuo  shadow-lg relative  max-h-[80vh] overflow-auto">
            <button onClick={handleClosePopup} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 z-10">
              ✕
            </button>
            <ApplicantScreeningTable BulkResumeId={BulkResumeId} onClose={handleClosePopup} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ScreeningListView;
