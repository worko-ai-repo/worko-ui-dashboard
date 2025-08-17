import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import JobsTable from './JobsTable';
import JobService from '../../Service/JobsService';
import { JobApiResponse, PaginationInfo, JobFilters } from './JobTypes';
import { debounce } from 'lodash';
import { useDashboardContext } from '@Context/Dashboard.context';
import httpServiceObj from '@Services/ApiHandler.service';
import secureStorage from '@Utils/SecureStorage.utils';
import { SecureStorageKeyEnum } from '@Enums/SecureStorage.enum';
import { toTitleCase } from '@Utils/Titlecase.utils';

const initialPaginationState: PaginationInfo = {
  count: 0,
  pageSize: 25,
  sortOrder: 'descending',
  timesQueried: 0,
  queriedCount: 0,
  lastKey: ''
};

const statsItems = [
  { label: 'Total Applicants', value: 106 },
  { label: 'Rejected', value: 90 },
  { label: 'Reviewed', value: 20 },
  { label: 'New Applicants', value: 10 },
  { label: 'Hired', value: 90 },
];

const Jobs = () => {
  const [searchBarText, setSearchBarText] = useState<string>('');
  const [data, setData] = useState<JobApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<JobFilters>({});
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>(initialPaginationState);
  
const dummyJobs = [
  { id: "dummy1", jobTitle: "DevOps Engineer", companyName: "InfraTech", createdAt: new Date().toISOString(), matchingScore: 88, status: "DOCUMENT_REQUESTED", action: "SUBMIT_DOCUMENT" },
  { id: "dummy2", jobTitle: "Backend Engineer", companyName: "DataCloud", createdAt: new Date().toISOString(), matchingScore: 85, status: "HIRED", action: "JOINED" },
  { id: "dummy3", jobTitle: "UI/UX Designer", companyName: "Designify", createdAt: new Date().toISOString(), matchingScore: 78, status: "REJECTED", action: "VIEW_FEEDBACK", rejectionFeedbackBySystem: "Portfolio didn't match the project style" },
  { id: "dummy4", jobTitle: "Frontend Developer", companyName: "PixelSoft", createdAt: new Date().toISOString(), matchingScore: 92, status: "INTERVIEW_DONE", action: "CHECK_ACCEPT" },
  { id: "dummy5", jobTitle: "Additional Document Specialist", companyName: "TechFlow", createdAt: new Date().toISOString(), matchingScore: 85, status: "ADDITIONAL_DOCUMENT_REQUESTED", action: "SUBMIT_DOCUMENT" },
  { id: "dummy6", jobTitle: "Revision Document Specialist", companyName: "CodeBase", createdAt: new Date().toISOString(), matchingScore: 90, status: "REVISION_DOCUMENT_SUBMISSION", action: "SUBMIT_DOCUMENT" },
  { id: "dummy7", jobTitle: "Data Analyst", companyName: "InsightsAI", createdAt: new Date().toISOString(), matchingScore: 74, status: "APPLIED", action: null },
  { id: "dummy8", jobTitle: "QA Engineer", companyName: "Testify", createdAt: new Date().toISOString(), matchingScore: 80, status: "CV_DOWNLOADED", action: null },
  { id: "dummy9", jobTitle: "Cloud Architect", companyName: "SkyNet", createdAt: new Date().toISOString(), matchingScore: 90, status: "UNDER_EVALUATION", action: "HIRED" },
  { id: "dummy10", jobTitle: "ML Engineer", companyName: "MLSoft", createdAt: new Date().toISOString(), matchingScore: 89, status: "PROCESSING_INTERVIEW", action: "HIRED" },
  { id: "dummy11", jobTitle: "Product Manager", companyName: "ProdSync", createdAt: new Date().toISOString(), matchingScore: 86, status: "HIRING_IN_PROCESS", action: null },
  { id: "dummy12", jobTitle: "Business Analyst", companyName: "BizLogic", createdAt: new Date().toISOString(), matchingScore: 76, status: "JOINED", action: null },
  { id: "dummy13", jobTitle: "Marketing Manager", companyName: "BrandBoost", createdAt: new Date().toISOString(), matchingScore: 83, status: "INTERVIEW_DONE", action: "CHECK_ACCEPT" },
  { id: "dummy14", jobTitle: "Security Analyst", companyName: "SecureNet", createdAt: new Date().toISOString(), matchingScore: 82, status: "HIRED", action: "JOINED" },
  { id: "dummy15", jobTitle: "Graphic Designer", companyName: "Designify", createdAt: new Date().toISOString(), matchingScore: 68, status: "REJECTED", action: "VIEW_FEEDBACK", rejectionFeedbackBySystem: "Design aesthetics not aligned" },
  { id: "dummy16", jobTitle: "System Admin", companyName: "InfraTech", createdAt: new Date().toISOString(), matchingScore: 79, status: "DOCUMENT_REQUESTED", action: "SUBMIT_DOCUMENT" },
  { id: "dummy17", jobTitle: "SEO Specialist", companyName: "SearchWave", createdAt: new Date().toISOString(), matchingScore: 70, status: "APPLIED", action: null },
  { id: "dummy18", jobTitle: "Network Engineer", companyName: "NetServe", createdAt: new Date().toISOString(), matchingScore: 77, status: "CV_DOWNLOADED", action: null },
  { id: "dummy19", jobTitle: "AI Researcher", companyName: "DeepThink", createdAt: new Date().toISOString(), matchingScore: 93, status: "UNDER_EVALUATION", action: "HIRED" },
  { id: "dummy20", jobTitle: "Data Engineer", companyName: "BigDataCo", createdAt: new Date().toISOString(), matchingScore: 81, status: "PROCESSING_INTERVIEW", action: "HIRED" },
  { id: "dummy21", jobTitle: "IT Support", companyName: "HelpDeskPro", createdAt: new Date().toISOString(), matchingScore: 65, status: "HIRING_IN_PROCESS", action: null },
  { id: "dummy22", jobTitle: "Operations Manager", companyName: "OpsGuru", createdAt: new Date().toISOString(), matchingScore: 75, status: "JOINED", action: null },
  { id: "dummy23", jobTitle: "Copywriter", companyName: "ContentLab", createdAt: new Date().toISOString(), matchingScore: 69, status: "INTERVIEW_DONE", action: "CHECK_ACCEPT" },
  { id: "dummy24", jobTitle: "Accountant", companyName: "LedgerPro", createdAt: new Date().toISOString(), matchingScore: 82, status: "HIRED", action: "JOINED" },
  { id: "dummy25", jobTitle: "Illustrator", companyName: "DrawIt", createdAt: new Date().toISOString(), matchingScore: 72, status: "REJECTED", action: "VIEW_FEEDBACK", rejectionFeedbackBySystem: "Illustration style mismatch" },
  { id: "dummy26", jobTitle: "Cloud Support Engineer", companyName: "SkyNet", createdAt: new Date().toISOString(), matchingScore: 84, status: "DOCUMENT_REQUESTED", action: "SUBMIT_DOCUMENT" },
  { id: "dummy27", jobTitle: "HR Associate", companyName: "PeopleMatter", createdAt: new Date().toISOString(), matchingScore: 73, status: "APPLIED", action: null },
  { id: "dummy28", jobTitle: "Tech Recruiter", companyName: "TalentHunt", createdAt: new Date().toISOString(), matchingScore: 66, status: "CV_DOWNLOADED", action: null },
  { id: "dummy29", jobTitle: "Robotics Engineer", companyName: "RoboCorp", createdAt: new Date().toISOString(), matchingScore: 95, status: "UNDER_EVALUATION", action: "HIRED" },
  { id: "dummy30", jobTitle: "Business Dev", companyName: "SalesMax", createdAt: new Date().toISOString(), matchingScore: 87, status: "PROCESSING_INTERVIEW", action: "HIRED" },
  { id: "dummy31", jobTitle: "IT Auditor", companyName: "SecureNet", createdAt: new Date().toISOString(), matchingScore: 79, status: "HIRING_IN_PROCESS", action: null },
  { id: "dummy32", jobTitle: "Project Manager", companyName: "ManageIt", createdAt: new Date().toISOString(), matchingScore: 91, status: "JOINED", action: null },
];


  // Store pagination keys for each page
  const paginationKeysRef = useRef<Record<number, string>>({
    1: '' // First page always has empty lastKey
  });

  // Get user from dashboard context
  const { user, isLoadingUser } = useDashboardContext();

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
          searchText: searchBarText || undefined
        }
      );

      if (response) {
        setData(response);
        if (response.pagination) {
          setPaginationInfo(response.pagination);
          
          // For searches or first page load, reset pagination keys
          if (isSearch || page === 1) {
            paginationKeysRef.current = { 1: '' };
            if (response.pagination.lastKey) {
              paginationKeysRef.current[2] = response.pagination.lastKey;
            }
          } 
          // For normal pagination, store the next page's key
          else if (response.pagination.lastKey) {
            paginationKeysRef.current[page + 1] = response.pagination.lastKey;
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


// below is for the dummy data check above is the real one
// const fetchJobs = useCallback((
//   page: number = currentPage,
//   size: number = pageSize,
//   lastKey: string = '',
//   searchFilters = filters,
//   isSearch: boolean = false
// ) => {
//   setIsLoading(true);

//   try {
//     // 🔍 Apply search filter if present
//     let filteredJobs = [...dummyJobs];

//     if (searchFilters?.searchText) {
//       const searchText = searchFilters.searchText.toLowerCase();

//       filteredJobs = filteredJobs.filter(job =>
//         job.jobTitle.toLowerCase().includes(searchText) ||
//         job.companyName.toLowerCase().includes(searchText) ||
//         job.status.toLowerCase().includes(searchText)
//       );
//     }

//     const startIndex = (page - 1) * size;
//     const paginatedData = filteredJobs.slice(startIndex, startIndex + size);
//     const hasNext = startIndex + size < filteredJobs.length;

//     setData({
//       data: paginatedData,
//       pagination: {
//         count: filteredJobs.length,
//         pageSize: size,
//         sortOrder: 'desc',
//         timesQueried: 1,
//         queriedCount: paginatedData.length,
//         lastKey: hasNext ? `page-${page + 1}` : undefined,
//       },
//     });

//     setPaginationInfo({
//       count: filteredJobs.length,
//       pageSize: size,
//       sortOrder: 'desc',
//       timesQueried: 1,
//       queriedCount: paginatedData.length,
//       lastKey: hasNext ? `page-${page + 1}` : undefined,
//     });

//     // Update pagination key refs
//     if (page === 1) {
//       paginationKeysRef.current = { 1: '' };
//       if (hasNext) {
//         paginationKeysRef.current[2] = `page-${page + 1}`;
//       }
//     } else if (hasNext) {
//       paginationKeysRef.current[page + 1] = `page-${page + 1}`;
//     }

//   } catch (err) {
//     console.error("Dummy fetch error:", err);
//   } finally {
//     setIsLoading(false);
//   }
// }, [ pageSize, filters]);




  // Search handling with proper debounce
  const searchInputRef = useRef<NodeJS.Timeout | null>(null);
  
  // This is a controlled function for handling input changes that doesn't trigger API calls
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
    // console.log(e.target.value)
  };
  
  // Debounced search - will be triggered by onBlur or Enter key
  const handleSearch = useCallback(() => {
    // Clear any pending debounce
    if (searchInputRef.current) {
      clearTimeout(searchInputRef.current);
    }
    
    setCurrentPage(1);
    setPaginationInfo(prev => ({...prev, lastKey: ''}));
    paginationKeysRef.current = { 1: '' }; // Reset pagination keys
    fetchJobs(1, pageSize, '', { ...filters, searchText: searchBarText }, true);
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

  // Initial data load
  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1);
      setPaginationInfo(prev => ({...prev, lastKey: ''}));
      paginationKeysRef.current = { 1: '' }; // Reset pagination keys
      fetchJobs(1, pageSize, '');
    }
  }, [user, fetchJobs, pageSize]);

  // Clean up debounced function on unmount
  useEffect(() => {
    return () => {
      if (searchInputRef.current) {
        clearTimeout(searchInputRef.current);
      }
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  useEffect(() => {
    const fetchJobs = async () => {
        const userId = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERID);
        const email = secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL);
        console.log(userId,email)
      const url = `https://jobs.dev.worko.work/job-application/?pageSize=25&sortOrder=descending&userEmail=${email}&userType=CAND`;
      try {
        const { response, error } = await httpServiceObj.get(url, true, {}, true);
          console.log("response",response,"error",error)
      } catch (err) {
        console.log(err)
      }
    };

    fetchJobs();
  }, []);
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
    <div className="w-full space-y-[35px] px-0">
      <div className='flex flex-col sm:flex-row gap-4 sm:gap-24 justify-between'>
        <div className="flex-1 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-start overflow-x-auto">
            {statsItems.map((stat) => (
              <div
                key={stat.label}
                className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px]"
              >
                <p className="text-sm text-[#64748B]">{stat.label}</p>
                <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-row w-full bg-white shadow-md rounded-[15px] overflow-hidden">
            <input
              type="text"
              placeholder="Search"
              value={searchBarText}
              onChange={handleSearchChange}
              className="px-4 py-3 w-full outline-none bg-[#FAFAFA] text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              onBlur={() => searchBarText && debouncedSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-gradient-to-t from-[#316BFF] to-[#5FC9FF] text-white px-6 py-0 rounded-[15px] rounded-l-none">
              Search
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 justify-center sm:items-end">
          <div className="max-sm:flex-1 flex items-start justify-between gap-3 font-semibold">
          </div>
        </div>
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
          data={data}
          pagination={paginationInfo}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          onRefresh={() => {
            const lastKey = currentPage > 1 ? paginationKeysRef.current[currentPage] || '' : '';
            fetchJobs(currentPage, pageSize, lastKey);
          }}
        />
      )}
    </div>
  );
};

export default Jobs;