// src/components/Jobs/Jobs.tsx
import { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import { useDashboardContext } from '@Context/CandidateDashboard.context';
import JobsTable from './JobsTable';
import FilterToggle from '../../Filters';
import JobService from '../../Service/JobsService';
import { JobApiResponse, PaginationInfo, JobFilters } from './JobTypes';
import { debounce } from 'lodash';

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
  
  // Store pagination keys for each page
  const paginationKeysRef = useRef<Record<number, string>>({
    1: '' // First page always has empty lastKey
  });

  const { user } = useDashboardContext();

  // Memoize the fetch function to prevent unnecessary re-renders
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
  }, [user, pageSize, searchBarText, filters]);

  // Search handling with proper debounce
  const searchInputRef = useRef<NodeJS.Timeout | null>(null);
  
  // This is a controlled function for handling input changes that doesn't trigger API calls
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchBarText(e.target.value);
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

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters: JobFilters) => {
    setFilters(prev => ({...prev, ...newFilters}));
    setCurrentPage(1);
    setPaginationInfo(prev => ({...prev, lastKey: ''}));
    paginationKeysRef.current = { 1: '' }; // Reset pagination keys
    fetchJobs(1, pageSize, '', {...filters, ...newFilters}, true);
  }, [fetchJobs, filters, pageSize]);

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
            {/* <FilterToggle onFilterChange={handleFilterChange} /> */}
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