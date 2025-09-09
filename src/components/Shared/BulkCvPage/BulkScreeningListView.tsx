import { FunctionComponent, useState, useCallback, useMemo, useEffect } from "react";
import { Column, DynamicTable } from "../DynamicTable";
import { eyeIcon } from "@AssetsFolder/assets";
import { BulkScreeningListItemDto } from "src/types/interface/CorporateServices.dto";
import { useAppContext } from "@Context/App.context";

import SkeletonLoader from "../SkeletonLoader";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationAdminBulkScreenedJobsParams } from "@Interfaces/AdminServices.dto";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import ApplicantScreeningTable from "@Components/Shared/BulkCvPage/BulkCvApplicants";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import { useNavigate } from "react-router-dom";

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
  const nav = useNavigate();
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [BulkResumeId, setBulkResumeId] = useState<string>("");
  const [isBulkResumesOpen, setBulkResumesOpen] = useState<boolean>(false);
  const { userDetails } = useAppContext();
  const companyId = RBAC.can("play_admin")
    ? import.meta.env.APP_WORKO_COMP_ID
    : userDetails?.companyId || "";
  const [pageSize, setPageSize] = useState<number>(10);

  const params: Omit<CursorPaginationAdminBulkScreenedJobsParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    ...(userDetails?.companyId ? { companyId: userDetails.companyId } : {}),
  };
  const { data, isLoading, hasNextPage, hasPreviousPage, goToNextPage, goToPreviousPage, reset } =
    useCursorPagination<BulkScreeningListItemDto, CursorPaginationAdminBulkScreenedJobsParams>({
      queryKey: ["CorporateJobsApplicationQuery", params],
      queryFn: CorporateServiceObj.fetchBulkScreenedJobs,
      baseParams: params,
       enabled: !!companyId, // only run if companyId exists
    });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
  }, [pageSize]);

  // Use useMemo to memoize the transformed data and prevent unnecessary recalculations
  const transformedData = useMemo(() => {
    // console.log("Data from API:", data);

    if (data && Array.isArray(data)) {
      return data.map((item) => ({
        id: item.id,
        jobTitle: item.jobTitle || "Not mentioned",
        location: item.jobLocation || "Not mentioned",
        experienceRange: item.experienceRange
          ? `${item.experienceRange.min} - ${item.experienceRange.max}`
          : "Not mentioned",
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
      <div className="flex  items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            nav(`listing/${row.id}`);
          }}
          data-tooltip-id="my-tooltip"
          data-tooltip-content="View details"
          className="flex mx-auto items-center justify-center rounded-lg w-10 h-8 bg-gradient-to-t from-[#57E1E1] to-[#57E1E1] relative">
          <img
            className="w-4 h-4 rounded-md bg-[#57E1E1] absolute top-[30%]"
            src={eyeIcon}
            alt="View Details"
          />
        </button>
      </div>
    ),
    []
  );

  // Define columns for the table
  const columns: Column<ScreeningRecord>[] = [
    {
      key: "jobTitle",
      label: "Job title",
      render: (row: ScreeningRecord) => (
        <span className="w-full capitalize text-center font-bold ">{row.jobTitle}</span>
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

  return isLoading ? (
    <SkeletonLoader showTableHeader={true} showTableRows={true} tableColumns={5} rowCount={5} />
  ) : (

      <div className="p-6">
        <div className="max-w-full mx-auto">
          <DynamicTable
            columns={columns}
            rows={transformedData ?? []}
            enableSelect={false}
            pageSize={pageSize}
            setPageSize={setPageSize}
            handlePreviousPage={goToPreviousPage}
            handleNextPage={goToNextPage}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPreviousPage}
          />
        </div>
      </div>

  );
};

export default ScreeningListView;
