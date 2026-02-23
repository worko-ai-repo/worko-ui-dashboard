import SkeletonLoader from '@Components/Shared/SkeletonLoader'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import AgencyListTable from './AgencyListTable'
import { Plus } from 'lucide-react'
import AddNewAgencyModal from './modals/AddNewAgencyModal'
import { PaginationInfo } from '@Components/Dashboard/Candidate/Pages/Job/JobTypes'
import { AgencyListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto'
import { CognitoMetaDataDto, useAppContext } from "@Context/App.context";
import { useDashboardContext } from '@Context/Dashboard.context'
import httpServiceObj from '@Services/ApiHandler.service'

  const initialPaginationState: PaginationInfo = {
    count: 0,
    pageSize: 10,
    sortOrder: "descending",
    timesQueried: 0,
    queriedCount: 0,
    lastKey: "",
  };

  export interface AgencyListFilters {
    searchText?: string;
    companyId?: string;
    sortOrder?: "ascending" | "descending";
    userType?: string;
  }

  export interface AgencyListApiResponse {
    data: AgencyListDetailsDto[];
    pagination: PaginationInfo;
    totalReferrals?: number;
    currentPage?: number;
    totalPages?: number;
    matchingScore?: number;
  }

const AgencyList = () => {
  const [searchBarText,setSearchBarText] = useState<string|null>("")
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [isAddAgencyModelOpen,setIsAddAgencyModelOpen] = useState<boolean>(false);
  const [fetchData,setFetchData] = useState<any>(null);
  const [isLoading,setIsLoading] = useState<boolean>(false)
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
  const { userDetails } = useAppContext();
  const { user, isLoadingUser } = useDashboardContext();
  const [pageSize,setPageSize] = useState<number>(10);
  const [paginationInfo, setPaginationInfo] = useState(initialPaginationState);
  const [filters, setFilters] = useState<AgencyListFilters>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const paginationKeysRef = useRef<Record<number, string>>({1: "",});
  const [jobsList,setJobsList] = useState([]);

  const fetchUserData = useCallback(
    async (
      page: number = 1,
      size: number = pageSize,
      lastKey: string = "",
      searchFilters = filters,
      isSearch = false,
      sortOrder = "desc"
    ) => {
      if (!userDetails?.email) return;

      setIsLoading(true);
      try {
        const url = `${agencyBaseUrl}/agency-invite`;
        const params = {
            // companyId:userDetails?.companyId,
            // invitedByCorporateUserId:userDetails?.id,
            pageSize:size,
            lastKey,
            sortOrder,
          }
        const { response } = await httpServiceObj.get<AgencyListApiResponse>(url, true, params, true);

        if (response) {
          setFetchData(response.data);
          // console.log(response)
          if (response.pagination) {
            setPaginationInfo(response.pagination);

            if (isSearch || page === 1) {
              paginationKeysRef.current = { 1: "" };
              if (response.pagination.lastKey) {
                paginationKeysRef.current[2] = response.pagination.lastKey;
              }
            } else if (response.pagination.lastKey) {
              paginationKeysRef.current[page + 1] = response.pagination.lastKey;
            }
          }
        } else {
          console.error("Cannot fetch user details");
        }
      } catch (err) {
        console.error("Exception in fetchReferrals:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [userDetails, pageSize, filters]
  );

  // const fetchJobs = async() =>{
  //   const params = {
  //     pageSize: 200,
  //     sortOrder: "desc",
  //     dashboard: "ADMIN",
  //     userRole: "ADMIN",
  //     status: "PUBLISHED",
  //     // companyId: userDetails?.companyId,
  //     // corporateRecruiterUserId: userDetails?.id,
  //   }

  //   try {
  //     const {response} = await httpServiceObj.get<any>(`/job`,true,params,false,"JOB")
  //     if(response?.data){
  //       setJobsList(response.data)
  //     }
  //   } catch (error) {
  //     console.log(error)
  //   }
  // }

  useEffect(() => {
    if (userDetails?.email) {
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchUserData(1, pageSize, "");
      // fetchJobs()
    }
  }, [userDetails]);
  // }, [userDetails, fetchUserData, pageSize]);

  const searchInputRef = useRef<NodeJS.Timeout | null>(null);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
  };

  const handlePageChange = useCallback((page: number) => {
      const lastKey = paginationKeysRef.current[page] || "";
      
      setCurrentPage(page);
      fetchUserData(page, pageSize, lastKey);
    },
    [fetchUserData, pageSize]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" };
      fetchUserData(1, size, "");
    },
    [fetchUserData]
  );

  const removeAgencyLocally = (id: string) => {
    setFetchData((prev:any) => prev?.filter((item:any) => item.id !== id));
  };

  const toggleRow = (row: any) => {
      setSelectedRows((prev) =>
        prev.some((r) => r.id === row.id)
          ? prev.filter((r) => r.id !== row.id)
          : [...prev, row]
      );
    };

  const toggleSelectAll = (rows: any[]) => {
      if (selectedRows.length === rows.length) setSelectedRows([]);
      else setSelectedRows(rows);
  };

  const getAllSelected = (rows: any[]) => selectedRows.length === rows.length;
  const reset = () => setSelectedRows([]);
  
  const refetch = () => {};
  const handleJobApplicationStatusUpdate = () => {};
  const handleSendToRecruiter = () => {};
  const onBulkUpdate = () => {};

  const ListSelection = {
  selectedRows,
  toggleSelectAll,
  toggleRow,
  getAllSelected,
  reset,
  };

  const handleLocalUpdate = useCallback((jobId: string, updatedData: any) => {
    setFetchData((prevData:any) => {
    if (!prevData || !Array.isArray(prevData)) return prevData;

    return prevData.map(job =>
      job.id === jobId ? { ...job, ...updatedData } : job
    );
  });
  }, []);

  return (
    <div>
     <div className='mt-6 flex flex-row gap-2 justify-center items-center'>
    </div>

      {/*<div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-row justify-end items-center">
          <div className="flex flex-wrap gap-4">
          </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <SearchBar
                searchBarText={searchBarText}
                setSearchBarText={setSearchBarText}
                handleClick={() => console.log("as")}
                />
            </div>
            <div className='flex flex-col mt-4'>         
              <button 
              onClick={()=>setIsAddAgencyModelOpen(!isAddAgencyModelOpen)}
              className='border rounded-lg px-4 py-3 text-xs flex flex-row justify-center items-center gap-1 text-white bg-gradient-to-t from-blue-500 to-cyan-300 font-semibold'>
                <Plus className='h-4 w-auto font-semibold'/>
                Add Agency
              </button>
            </div>
        </div>
      </div>
      <br /> */}
      {isLoading ? (
        <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
        />
        ) : (
        <AgencyListTable
          data={fetchData}
          userType="ADMIN"
          refetch={refetch}
          ListSelection={ListSelection}
          handleUpdate={handleJobApplicationStatusUpdate}
          sendApplicationToRecruiter={handleSendToRecruiter}
          isBulkEvaluation={!!selectedRows.length}
          onBulkUpdate={onBulkUpdate}
          localUpdate={handleLocalUpdate}
          removeAgencyLocally={removeAgencyLocally}
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          // jobsList={jobsList}
        />
      )}
        {/* <AddNewAgencyModal
          dashboardType={"CORPORATE"}
          onClose= {() => setIsAddAgencyModelOpen(false)}
          isOpen= {isAddAgencyModelOpen}
          companyId={userDetails?.companyId}
          setFetchData={setFetchData}
        /> */}
    </div>
  )
}

export default AgencyList
