import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import JobsTable from './JobsTable';
import JobService from '../../Service/JobsService';
import { JobApiResponse, PaginationInfo, JobFilters, JobTypes } from './JobTypes';
import { debounce, last } from 'lodash';
import { useDashboardContext } from '@Context/Dashboard.context';
import { ChevronDown, X } from 'lucide-react';
import GenericDropdown from '@Components/Shared/DropDown/GenericDropdown';
import { JobApplicationStatusType } from '@TypesAndConstants/JobsAndApplication.type';
import { useAppContext } from '@Context/App.context';
import httpServiceObj from '@Services/ApiHandler.service';

interface CountsProps{
  PK: string,
  SK: string,
  userJobApplicationCounts: {
    total: number,
    applied: number,
    underEvaluation: number,
    hired:number,
    rejected:number,
  },
}
interface Stat {
  label:string;
  value:number|null;
}


const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 25,
  sortOrder: 'descending',
  timesQueried: 0,
  queriedCount: 0,
  lastKey: ''
};

const Jobs = () => {
  const [searchBarText, setSearchBarText] = useState<string>('');
  const [data, setData] = useState<JobApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<JobFilters>({});
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>(initialPaginationState);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI
  const [stats,setStats] = useState<Stat[]>([
    { label: 'Total Applicants', value:null },
    { label: 'Applied', value:null },
    { label: 'Under evaluation', value:null },
    { label: 'Hired', value:null },
    { label: 'Rejected', value:null },
])
  
const StatusFilterDropdown = [
  { label: "All", onClick: () => { setStatusFilter("")}},
  { label: "Applied", onClick: () => { setStatusFilter("APPLIED")}},
  { label: "Accepted", onClick: () => { setStatusFilter("ACCEPTED")}},
  { label: "Under Evaluation", onClick: () => { setStatusFilter("UNDER_EVALUATION")} },
  { label: "Processing Interview", onClick: () => { setStatusFilter("PROCESSING_INTERVIEW")} },
  { label: "Interview Done", onClick: () => { setStatusFilter("INTERVIEW_DONE")}},
  { label: "Hiring In Process", onClick: () => { setStatusFilter("HIRING_IN_PROCESS")}},
  { label: "Hired", onClick: () => { setStatusFilter("HIRED")}},
  { label: "Joined", onClick: () => { setStatusFilter("JOINED")}},
  { label: "Rejected", onClick: () => { setStatusFilter("REJECTED")}},
];
  
  // Store pagination keys for each page
  const paginationKeysRef = useRef<Record<number, string>>({
    1: '' // First page always has empty lastKey
  });

  // Get user from dashboard context
  const { user, isLoadingUser } = useDashboardContext();
  const { userDetails } = useAppContext();

  // Memoize the fetch function to prevent unnecessary re-renders

  // below is the original function without dummy data

  const fetchJobs = useCallback(async (
    page = currentPage, 
    size = pageSize, 
    lastKey = '',
    searchFilters = filters,
    isSearch = false
  ) => {
    if (!user?.email) return;
    
    setIsLoading(true);
    
    try {
      const { response, error } = await JobService.fetchJobs(
        user.email,
        size,
        lastKey,
        {
          ...searchFilters,
          searchText: searchFilters.searchText
        }
      );

      if (response) {
        console.log(response)
        setData(response);
        if (response.pagination) {
          setPaginationInfo(response.pagination);
          
          // FIXED: Only reset pagination keys for searches
          if (isSearch) {
            paginationKeysRef.current = { 1: '' };
            if (response.pagination.lastKey) {
              paginationKeysRef.current[2] = response.pagination.lastKey;
            }
          } 
          // For normal pagination, preserve existing keys and add new one
          else if (response.pagination.lastKey) {
            paginationKeysRef.current = {
              ...paginationKeysRef.current,
              [page + 1]: response.pagination.lastKey
            };
          }
        }
      } else if (error) {
        console.error('Error fetching jobs:', error);
      }
    } catch (err) {
      console.error('Exception in fetchJobs:', err);
    } finally {
      setIsLoading(false);
    }
}, [user, pageSize, searchBarText, filters, currentPage]);


  // Search handling with proper debounce
  const searchInputRef = useRef<NodeJS.Timeout | null>(null);
  
  // This is a controlled function for handling input changes that doesn't trigger API calls
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
    // console.log(e.target.value)
  };
  
  // Debounced search - will be triggered by onBlur or Enter key
  const handleSearch = useCallback((searchValue: string = searchBarText) => {
    // Clear any pending debounce
    if (searchInputRef.current) {
      clearTimeout(searchInputRef.current);
    }
    
    setCurrentPage(1);
    setPaginationInfo(prev => ({...prev, lastKey: ''}));
    paginationKeysRef.current = { 1: '' }; // Reset pagination keys
    fetchJobs(1, pageSize, '', { ...filters, searchText: searchValue }, true);
  }, [fetchJobs, filters, pageSize, searchBarText]);
  
  // Debounced search with delay for onBlur events
  const debouncedSearch = useMemo(
    () => debounce(handleSearch, 500),
    [handleSearch]
  );

  // Handle page change from table
  const handlePageChange = useCallback((page: number) => {
    // Don't do anything if trying to go to same page
    if (page === currentPage) return;
    
    setCurrentPage(page);
    
    // Use the stored lastKey for this page if available
    const lastKey = paginationKeysRef.current[page] || '';
    fetchJobs(page, pageSize, lastKey);
  }, [currentPage, fetchJobs, pageSize]);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setPaginationInfo(prev => ({...prev, lastKey: ''}));
    paginationKeysRef.current = { 1: '' }; // Reset pagination keys
    fetchJobs(1, size, '');
  }, [fetchJobs]);

  //filer data
    const filteredData = useMemo(() => {
    if (!data) return null;
    if (!statusFilter) return data;

    return {
      ...data,
      data: data.data.filter(item => item.status === statusFilter)
    };
  }, [data, statusFilter]);

  // Fetch counts

    const fetchCounts = async () => {
      if(!userDetails?.email) {
        return
      }
        const { response } = await httpServiceObj.get<CountsProps>(`/counts/${user?.email}/JOB_APPLICATION/user`, true, {}, false,"JOB");
        // console.log(response?.userJobApplicationCounts)
        setStats([
          { label: 'Total Applicants', value: response?.userJobApplicationCounts?.total ?? null },
          { label: 'Applied', value:  response?.userJobApplicationCounts?.applied ?? null },
          { label: 'Under evaluation', value:  response?.userJobApplicationCounts?.underEvaluation ?? null },
          { label: 'Hired', value:  response?.userJobApplicationCounts?.hired ?? null },
          { label: 'Rejected', value:  response?.userJobApplicationCounts?.rejected ?? null },
        ])
    };

  // Initial data load
  useEffect(() => {
    if (user?.email && !data) {   // only run once, on first load
      setCurrentPage(1);
      setPaginationInfo(prev => ({ ...prev, lastKey: '' }));
      paginationKeysRef.current = { 1: '' };
      fetchCounts()
      fetchJobs(1, pageSize, '');
    }
  }, [user, fetchJobs, pageSize, data]);

  useEffect(() => {
    console.log(data)
  }, [data])
  
  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      if (searchInputRef.current) {
        clearTimeout(searchInputRef.current);
      }
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  const handleLocalUpdate = useCallback((jobId: string, updatedData: Partial<JobTypes>) => {
    setData(prevData => {
      if (!prevData) return prevData;
      
      return {
        ...prevData,
        data: prevData.data.map(job => 
          job.id === jobId 
            ? { ...job, ...updatedData }
            : job
        )
      };
    });
  }, []);

const handleFollowUpRequestUpdate = useCallback(
  (jobId: string, followUpRequest: { actionDate: string }[]) => {
    setData(prevData => {
      if (!prevData) return prevData;

      return {
        ...prevData,
        data: prevData.data.map(job => {
          if (job.id !== jobId) return job;

          return {
            ...job,
            followUpRequest: [
              ...(job.followUpRequest ?? []),
              ...followUpRequest,
            ],
          };
        }),
      };
    });
  },
  []
);


  // useEffect(() => {
  //   const fetchJobs = async () => {
  //       const userId = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERID);
  //       const email = secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL);
        
  //     const url = `/job-application/?pageSize=25&sortOrder=descending&userEmail=${email}&userType=CAND`;
  //     try {
  //       const { response, error } = await httpServiceObj.get(url, true, {}, false,"JOB");
  //         console.log("response",response,"error",error)
  //     } catch (err) {
  //       console.log(err)
  //     }
  //   };

  //   fetchJobs();
  // }, []);
  // Loading state when user is not available yet
  if (isLoadingUser || !user) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading user data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-[35px] px-0 mt-5">
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-24 justify-between'>
        <div className="flex-1 flex flex-col gap-4">
          <div className="hidden sm:flex flex-col sm:flex-row gap-4 justify-start overflow-x-auto">
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-xl px-7 py-4 text-center min-w-[130px]"
              >
                <p className="text-sm text-[#64748B]">{stat.label}</p>
                <p className="text-2xl font-extrabold text-gray-900">{stat.value === null ? "-" : stat.value}</p>
              </div>
            ))}
          </div>

          {/* search bar */}
            <div className="flex flex-col sm:flex-row justify-center gap-2">
            {/* Search bar with search button */}
            <div className="flex flex-row w-full bg-white shadow-md rounded-[15px] overflow-hidden">
            <input
              type="text"
              placeholder="Search by company name"
              value={searchBarText}
              onChange={handleSearchChange}
              className="px-4 py-3 w-full outline-none focus:outline-none focus:ring-0 bg-[#FAFAFA] text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onBlur={() => searchBarText && debouncedSearch()}
            />
            {searchBarText && (
              <button
                  onClick={() => {
                    if (searchInputRef.current) {
                      clearTimeout(searchInputRef.current);
                    }
                    debouncedSearch.cancel();
                    setSearchBarText("");
                    handleSearch("");
                  }}
                className="scale-50 active:scale-[45%] right-[5%] h-full w-fit rounded-full">
                <X className="p-1 text-white bg-blue-600 rounded-full w-10 h-auto relative" />
              </button>
            )}
            <button
              onClick={() => handleSearch(searchBarText)}
              className="bg-gradient-to-t from-[#316BFF] to-[#5FC9FF] text-white px-6 py-0 rounded-[15px] rounded-l-none">
              Search
            </button>
          </div>
            <div className="relative">
               {/* <div className="relative w-[140px]">
                <select
                  className="h-full w-[140px] pl-4 pr-10 py-3 bg-white text-sm text-gray-700 border border-gray-300 rounded-xl appearance-none cursor-pointer truncate"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="APPLIED">Applied</option>
                  <option value="CV_DOWNLOADED">CV Downloaded</option>
                  <option value="UNDER_EVALUATION">Under Evaluation</option>
                  <option value="PROCESSING_INTERVIEW">Processing</option>
                  <option value="INTERVIEW_DONE">Interview Done</option>
                  <option value="HIRING_IN_PROCESS">Hiring</option>
                  <option value="DOCUMENT_REQUESTED">Document Requested</option>
                  <option value="DOCUMENT_SUBMITTED">Document Submitted</option>
                  <option value="OFFER_SENT">Offer Recieved</option>
                  <option value="HIRED">Hired</option>
                  <option value="JOINED">Joined</option>
                  <option value="REJECTED">Rejected</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                </div>
              </div> */}
              <div className="flex gap-3 font-semibold w-full sm:w-auto">
              <GenericDropdown
                selectTitle={"Status"}
                tooltipMessage="Select Status to filter applications"
                disabled={false}
                options={StatusFilterDropdown}
              />
              </div>
            </div>
            </div>
        </div>

        {/* <div className="flex flex-col gap-4 justify-center sm:items-end">
          <div className="max-sm:flex-1 flex items-start justify-between gap-3 font-semibold">
          </div>
        </div> */}
      </div>

      {isLoading ? (
        <div className="w-full py-12 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-3 text-gray-500">Loading jobs...</p>
          </div>
        </div>
      ) : (
        <JobsTable
          data={filteredData}
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={() => {
            const lastKey = currentPage > 1 ? paginationKeysRef.current[currentPage] || '' : '';
            fetchJobs(currentPage, pageSize, lastKey);
          }}
          // Add this prop to properly handle cursor pagination
          hasNextPage={!!paginationInfo?.lastKey} // This is the key change
          onLocalUpdate={handleLocalUpdate}
          handleFollowUpRequestUpdate={handleFollowUpRequestUpdate}
          fetchCounts={fetchCounts}
        />
      )}
    </div>
  );
};

export default Jobs;