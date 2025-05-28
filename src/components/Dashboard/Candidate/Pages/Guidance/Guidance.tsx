import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useDashboardContext } from '@Context/Dashboard.context';
import GuidanceTable from './GuidanceTable';
import { magnifyingQuestion } from '@Assets';
import httpServiceObj from '@Services/ApiHandler.service';
import {Button} from 'lib-worko-ai'

// Define types
export interface GuidanceRequest {
  id: string;
  guidanceRequestType: string;
  companyName: string;
  guidanceRequestDeadline: string;
  jobUrl: string;
  guidanceRequestDescription: string;
  status?: string;
  statusColor?: {
    bg: string;
    text: string;
  };
  dateNeeded?: string;
  mentorName?: string;
}

export interface GuidancePaginationInfo {
  count: number;
  pageSize: number;
  sortOrder: string;
  timesQueried: number;
  queriedCount: number;
  lastKey: string;
}

export interface GuidanceApiResponse {
  data: GuidanceRequest[];
  pagination: GuidancePaginationInfo;
}

export interface GuidanceFilters {
  guidanceRequestType?: string;
  status?: string;
  searchText?: string;
}

const initialPaginationState: GuidancePaginationInfo = {
  count: 0,
  pageSize: 25,
  sortOrder: 'descending',
  timesQueried: 0,
  queriedCount: 0,
  lastKey: ''
};

const statsItems = [
  { label: 'Total Requests', value: 25 },
  { label: 'In Progress', value: 12 },
  { label: 'Completed', value: 8 },
  { label: 'Pending', value: 5 },
];

const Guidance = () => {
  const [searchBarText, setSearchBarText] = useState<string>('');
  const [data, setData] = useState<GuidanceApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<GuidanceFilters>({});
  const [paginationInfo, setPaginationInfo] = useState<GuidancePaginationInfo>(initialPaginationState);
  
  // Store pagination keys for each page
  const paginationKeysRef = useRef<Record<number, string>>({
    1: '' // First page always has empty lastKey
  });

  const { user } = useDashboardContext();

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchGuidanceRequests = useCallback(async (
    page = currentPage, 
    pageSize: number, 
    lastKey = '',
    searchFilters = filters,
    isSearch = false
  ) => {
    if (!user?.email) return;
    
    setIsLoading(true);
    
    try {
      const uri = 'https://api.dev.worko.work/user/guidance-request';
      const { response, error }:{response: GuidanceApiResponse | null, error:Error | null} = await httpServiceObj.get(
        uri, 
        true, 
        {
         
          lastKey,
          pageSize,
          ...searchFilters
        },
        true
      );
      
      if (response) {
        // Process the data to include status formatting
        if (Array.isArray(response.data)) {
          const processedData = response.data.map((item: GuidanceRequest) => {
            // Determine status colors based on status
            const statusColors = {
              "Mentor to be assigned": { bg: "bg-gray-200", text: "text-gray-900" },
              "Mentor assigned": { bg: "bg-blue-100", text: "text-blue-600" },
              "In progress": { bg: "bg-yellow-100", text: "text-yellow-600" },
              "Completed": { bg: "bg-green-100", text: "text-green-600" }
            };
            
            // Format date from ISO to DD-MM-YYYY
            const date = new Date(item.guidanceRequestDeadline);
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
            
            return {
              ...item,
              dateNeeded: formattedDate,
              statusColor: statusColors[item.status as keyof typeof statusColors || "Mentor to be assigned"]
            };
          });
          
          setData({
            data: processedData,
            pagination: response.pagination || initialPaginationState
          });
        } else {
          setData(response as GuidanceApiResponse);
        }
        
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
        console.error('Error fetching guidance requests:', error);
      }
    } catch (err) {
      console.error('Exception in fetchGuidanceRequests:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, pageSize, filters]);

  // Handle page change from table
  const handlePageChange = useCallback((page: number) => {
    // Don't do anything if trying to go to same page
    if (page === currentPage) return;
    
    setCurrentPage(page);
    
    // Use the stored lastKey for this page if available
    const lastKey = paginationKeysRef.current[page] || '';
    fetchGuidanceRequests(page, pageSize, lastKey);
  }, [currentPage, fetchGuidanceRequests, pageSize]);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
    setPaginationInfo(prev => ({...prev, lastKey: ''}));
    paginationKeysRef.current = { 1: '' }; // Reset pagination keys
    fetchGuidanceRequests(1, size, '');
  }, [fetchGuidanceRequests]);

  // Initial data load
  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1);
      setPaginationInfo(prev => ({...prev, lastKey: ''}));
      paginationKeysRef.current = { 1: '' }; // Reset pagination keys
      fetchGuidanceRequests(1, pageSize, '');
    }
  }, [user, fetchGuidanceRequests, pageSize]);


  // Loading state when user is not available yet
  if (!user) {
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
    <div className="w-full relative rounded-xl overflow-hidden text-base text-slate-900 font-poppins">
      {/* Help button container at top with right alignment */}
      <div className="w-full flex justify-end p-2">
        <div 
          className="relative rounded-lg bg-[#316bff] h-11 flex flex-row items-center justify-center p-4 px-4 box-border gap-1.5 cursor-pointer text-center text-xs text-white font-poppins"
        >
          <img 
            className="w-5 h-5 mr-1" 
            alt="" 
            src={magnifyingQuestion}
          />
          <div className="relative tracking-[0.2px] leading-[114%] font-semibold">Request new guidance</div>
        </div>
      </div>

      <div className="w-full space-y-[35px] px-0">

        <div className='bg-white p-4 rounded-xl shadow-md'>
          {isLoading ? (
            <div className="w-full py-12 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-500">Loading guidance requests...</p>
              </div>
            </div>
          ) : (
            <GuidanceTable
              data={data}
              pagination={paginationInfo}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRefresh={() => {
                const lastKey = currentPage > 1 ? paginationKeysRef.current[currentPage] || '' : '';
                fetchGuidanceRequests(currentPage, pageSize, lastKey);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Guidance;