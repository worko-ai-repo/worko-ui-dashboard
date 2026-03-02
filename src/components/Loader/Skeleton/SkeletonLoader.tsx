/**
 * Skeleton loader component for the Job Filter Panel.
 * Displays a placeholder UI for filter dropdown buttons.
 *
 * @param {Object} props - Component props.
 * @param {"job" | "referral"} [props.type="job"] - Type of filter panel, determines the number of filters.
 * @returns {JSX.Element} The skeleton loader for the Job Filter Panel.
 */
export const JobFilterPanelSkeleton = ({ type = "job" }) => {
    // Determine number of filters based on type
    const filterCount = type === "job" ? 9 : 3;
    
    return (
      <div className="w-full animate-pulse bg-white">
        
        
        {/* Filter dropdown buttons */}
        <div className="flex flex-col gap-3">
          {Array(filterCount).fill(0).map((_, index) => (
            <div key={index} className="h-12 bg-gray-100 rounded-lg w-full"></div>
          ))}
        </div>
        
      </div>
    );
  };

/**
 * Skeleton loader component for the Job Page Filter Panel.
 * Uses the `JobFilterPanelSkeleton` with type set to "job".
 *
 * @returns {JSX.Element} The skeleton loader for the Job Page Filter Panel.
 */
export const JobPageFilterSkeleton = () => {
    return <JobFilterPanelSkeleton type="job" />;
  };

/**
 * Skeleton loader component for the Referral Page Filter Panel.
 * Uses the `JobFilterPanelSkeleton` with type set to "referral".
 *
 * @returns {JSX.Element} The skeleton loader for the Referral Page Filter Panel.
 */
export const ReferralPageFilterSkeleton = () => {
    return <JobFilterPanelSkeleton type="referral" />;
  };

/**
 * Skeleton loader component for a single Job Card.
 * Displays a placeholder UI for the job card design.
 *
 * @returns {JSX.Element} The skeleton loader for a Job Card.
 */
export const JobCardSkeleton = () => {
    return (
      <div className="w-full bg-white rounded-[20px] md:rounded-[15px] border border-black/5 shadow-[0px_4px_16px_rgba(0,0,0,0.05)] md:shadow-[0px_3px_12px_rgba(0,0,0,0.05)] p-6 md:p-4 animate-pulse">
        <div className="flex flex-col gap-4">
          {/* Header Section */}
          <div className="flex flex-col md:flex-row items-start justify-between gap-4">
            {/* Left section with image, title, and tags */}
            <div className="flex flex-col w-full md:max-w-[70%] gap-2">
              {/* Top row with image, title, department, and salary */}
              <div className="flex w-full gap-4">
                {/* Image column */}
                <div className="flex-shrink-0 w-[70px] h-[70px] rounded-[6.75px] sm:rounded-[9px] flex items-center justify-center border overflow-hidden bg-gray-200"></div>
  
                {/* Content column */}
                <div className="flex flex-col flex-1 min-w-0">
                  <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-1"></div>
                  <div className="h-4 bg-gray-200 rounded-md w-1/2 mb-1"></div>
                  <div className="h-5 bg-gray-200 rounded-md w-1/4"></div>
                </div>
              </div>
  
              {/* Mobile layout: Arrange tags and gauge on same row */}
              <div className="flex flex-row justify-between mt-2 md:mt-1">
                {/* Tags - Flex-wrap on mobile */}
                <div className="flex flex-wrap gap-1 overflow-hidden">
                  <div className="px-3 py-1 max-h-[25px] bg-gray-200 rounded-full w-24"></div>
                  <div className="px-3 py-1 max-h-[25px] bg-gray-200 rounded-full w-36"></div>
                  <div className="px-3 py-1 max-h-[25px] bg-gray-200 rounded-full w-32"></div>
                </div>
  
                {/* Gauge on mobile only */}
                <div className="md:hidden flex flex-col items-center justify-center flex-shrink-0 rounded-xl w-[90px] h-[90px] sm:w-[122px] sm:h-[120px] bg-gray-200 overflow-hidden p-3 sm:p-5">
                  <div className="w-[75%] h-[75%] sm:w-[85%] sm:h-[85%] flex items-center justify-center rounded-full bg-gray-300"></div>
                  <div className="h-4 bg-gray-300 rounded-md w-full mt-1"></div>
                </div>
              </div>
            </div>
  
            {/* Match Score - desktop only */}
            <div className="hidden md:flex py-4 box-content ml-auto rounded-xl w-[91.5px] h-[75px] sm:w-[122px] sm:h-[100px] flex-shrink-0 bg-gray-200 overflow-hidden p-3 sm:p-5 flex-col items-center justify-center scale-90">
              <div className="w-full pt-2 h-full flex items-center justify-center sm:scale-90">
                <div className="h-16 w-16 rounded-full bg-gray-300"></div>
              </div>
              <div className="h-4 bg-gray-300 rounded-md w-3/4 mt-1"></div>
            </div>
          </div>
  
          {/* Location, Job Type, and Buttons */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Location and Job Type */}
            <div className="flex flex-wrap gap-6 md:gap-4 text-xs md:text-[12px]">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded-md w-24"></div>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 bg-gray-200 rounded-full"></div>
                <div className="h-4 bg-gray-200 rounded-md w-20"></div>
              </div>
            </div>
  
            {/* Action Buttons */}
            <div className="flex gap-2 sm:justify-end">
              <div className="flex-1 md:flex-initial md:w-[140px] h-9 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  };

/**
 * Skeleton loader component for a list of Job Cards.
 * Displays a specified number of `JobCardSkeleton` components.
 *
 * @param {Object} props - Component props.
 * @param {number} [props.count=3] - Number of job card skeletons to display.
 * @returns {JSX.Element} The skeleton loader for a list of Job Cards.
 */
export const JobCardListSkeleton = ({ count = 3 }) => {
    return (
      <div className="w-full space-y-4">
        {Array(count).fill(0).map((_, index) => (
          <JobCardSkeleton key={index} />
        ))}
      </div>
    );
  };

/**
 * Skeleton loader component for a single Company Card.
 * Displays a placeholder UI for the company card design.
 *
 * @returns {JSX.Element} The skeleton loader for a Company Card.
 */
export const CompanyCardSkeleton = () => {
    return (
      <>
        <div className="h-fit bg-white p-4 w-full rounded-2xl border animate-pulse">
          {/* first col with images title and starts */}
          <div className="flex items-start justify-start gap-2 md:gap-5 mb-2">
            {/* Left Section: Company Logo */}
            <div className="relative flex-shrink-0 min-w-[60px] w-[60px] h-[60px] rounded-[6.75px] sm:rounded-[9px] flex items-center justify-center border overflow-hidden bg-gray-200"></div>
  
            {/* Right Section */}
            <div className="flex flex-col items-start justify-between w-[70%]">
              <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-0"></div>
            </div>
          </div>
  
          {/** 2 Social pages and Referral and guidance button */}
          <div className="flex justify-center flex-col gap-1 px-1 text-gray-700">
            <div className="flex justify-between gap-2">
              <div className="flex justify-start items-end gap-2 text-black md:my-1">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded-md w-24"></div>
              </div>
              <div className="scale-90 h-8 bg-gray-200 rounded-md w-[150px]"></div>
            </div>
            <div className="flex justify-between gap-2">
              <div className="flex justify-start items-start gap-2 md:my-1 relative top-2">
                <div className="h-4 w-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded-md w-20"></div>
              </div>
              <div className="scale-90 h-8 bg-gray-200 rounded-md w-[150px]"></div>
            </div>
          </div>
        </div>
      </>
    );
  };

/**
 * Skeleton loader component for a list of Company Cards.
 * Displays a specified number of `CompanyCardSkeleton` components.
 *
 * @param {Object} props - Component props.
 * @param {number} [props.count=12] - Number of company card skeletons to display.
 * @returns {JSX.Element} The skeleton loader for a list of Company Cards.
 */
export const CompanyCardListSkeleton = ({ count = 12 }) => {
    return (
      <>
        {Array(count).fill(0).map((_, index) => (
          <div key={index} className="min-w-[310px] flex justify-center">
            <CompanyCardSkeleton />
          </div>
        ))}
      </>
    );
  };

export const SubscriptionSkeletonLoader = () => {
    return (
      <div className="w-full font-['Poppins'] text-[#000000]">
        {/* Current Plan Skeleton */}
        <div className="bg-white rounded-[19px] p-6 mb-8 shadow-sm">
          <div className="flex justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="animate-pulse bg-gray-200 h-8 w-64 rounded-md"></div>
                <div className="ml-4 animate-pulse bg-gray-200 h-8 w-24 rounded-full"></div>
              </div>
  
              <div className="mt-4 animate-pulse bg-gray-200 h-6 w-32 rounded-md"></div>
              <div className="mt-4 flex gap-16">
                {[0, 1].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="animate-pulse bg-gray-200 h-6 w-28 rounded-md"></div>
                    <div className="animate-pulse bg-gray-200 h-6 w-24 rounded-md"></div>
                  </div>
                ))}
              </div>
  
              <div className="mt-2 flex items-center gap-2">
                <div className="animate-pulse bg-gray-200 h-6 w-36 rounded-md"></div>
                <div className="animate-pulse bg-gray-200 h-6 w-24 rounded-md"></div>
              </div>
            </div>
  
            <div className="w-[250px] h-[120px] animate-pulse bg-gray-200 rounded-[18px]"></div>
          </div>
        </div>
  
        {/* Section title Skeleton */}
        <div className="mt-16 mb-40 text-center">
          <div className="mx-auto animate-pulse bg-gray-200 h-10 w-64 rounded-md"></div>
          <div className="mx-auto mt-2 animate-pulse bg-gray-200 h-6 w-80 rounded-md"></div>
        </div>
  
        {/* Pricing Cards Skeleton */}
        <div className="flex justify-center gap-8 relative">
          {/* Most popular tag skeleton */}
          <div className="absolute -top-[120px] left-1/2 transform -translate-x-1/2 w-[350px] h-[99px] animate-pulse bg-gray-200 rounded-t-[35px]"></div>
  
          {/* Pricing cards skeleton */}
          {[0, 1, 2].map((index) => (
            <div 
              key={index} 
              className={`w-[350px] h-[500px] animate-pulse bg-gray-200 rounded-[25px] ${index === 1 ? '-mt-14' : ''}`}
            ></div>
          ))}
        </div>
  
        {/* Custom CSS for more realistic pulse animation */}
        <style>{`
          @keyframes customPulse {
            0%, 100% {
              opacity: 0.7;
            }
            50% {
              opacity: 0.4;
            }
          }
          .animate-pulse {
            animation: customPulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
        `}</style>
      </div>
    );
  };

/**
 * Skeleton loader component for Analytics Home Page (Corporate & Admin).
 * Displays placeholders for filters, KPI cards, charts, and other sections.
 *
 * @param {Object} props - Component props.
 * @param {boolean} [props.showAdminFilters=false] - Whether to show admin-specific filters (company & recruiter dropdowns).
 * @returns {JSX.Element} The skeleton loader for Analytics Home.
 */
export const AnalyticsHomeSkeleton = ({ showAdminFilters = false }) => {
  return (
    <div className="flex flex-col gap-4 lg:gap-10 justify-between animate-pulse">
      <div className="flex-1 flex flex-col gap-4">
        <div className="flex flex-col w-full gap-4 justify-start">
          {/* Filters Section */}
          <div className="flex flex-wrap items-start justify-between gap-4 bg-white rounded-xl border border-gray-100 px-4 py-3">
            <div className="flex-shrink-0">
              <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-64"></div>
            </div>
            <div className="flex flex-wrap items-end gap-4 text-xs">
              {/* Admin-specific filters (Company & Recruiter) */}
              {showAdminFilters && (
                <>
                  <div className="flex flex-col min-w-[240px]">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1.5"></div>
                    <div className="h-[38px] bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="flex flex-col min-w-[200px]">
                    <div className="h-3 bg-gray-200 rounded w-16 mb-1.5"></div>
                    <div className="h-[38px] bg-gray-200 rounded-lg"></div>
                  </div>
                </>
              )}
              
              {/* Date Range Filter */}
              <div className="flex flex-col">
                <div className="h-3 bg-gray-200 rounded w-20 mb-1.5"></div>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-[30px] w-16 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
              </div>

              {/* Job Status Filter */}
              <div className="flex flex-col">
                <div className="h-3 bg-gray-200 rounded w-20 mb-1.5"></div>
                <div className="flex gap-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-[30px] w-20 bg-gray-200 rounded-full"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-screen">
            <div className="mx-auto space-y-8">
              {/* Top Row - KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-100 p-6">
                    <div className="h-4 bg-gray-200 rounded w-24 mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-32"></div>
                  </div>
                ))}
              </div>

              {/* Middle Row - Hiring Trend & Onboarding Pipeline */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Hiring Trend Chart */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>

                {/* Onboarding Pipeline */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="flex flex-wrap gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className="min-w-[180px] h-16 bg-gray-200 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Row - Critical Drop-offs & Funnel Velocity */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Critical Drop-off Stages */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-6"></div>
                  
                  {/* Summary Stats */}
                  <div className="flex justify-between mb-6 pb-4 border-b border-slate-200">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="text-center">
                        <div className="h-3 bg-gray-200 rounded w-24 mb-2 mx-auto"></div>
                        <div className="h-6 bg-gray-200 rounded w-16 mx-auto"></div>
                      </div>
                    ))}
                  </div>

                  {/* Drop-off Stages */}
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-slate-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-6 bg-gray-200 rounded w-16"></div>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Funnel Velocity */}
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>

              {/* Hiring Intelligence */}
              <div className="grid grid-cols-1 xl:grid-cols-1 gap-6">
                <div className="bg-white rounded-xl border border-gray-100 p-6">
                  <div className="h-5 bg-gray-200 rounded w-40 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-64 mb-4"></div>
                  
                  {/* Position Chips */}
                  <div className="flex gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-8 w-24 bg-gray-200 rounded-full"></div>
                    ))}
                  </div>

                  {/* Table */}
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-100 p-3">
                      <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 p-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="flex gap-4">
                          <div className="h-10 bg-gray-200 rounded w-32"></div>
                          {[1, 2, 3, 4, 5].map((j) => (
                            <div key={j} className="h-10 bg-gray-200 rounded w-20"></div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton loader for Corporate Home Analytics.
 * 
 * @returns {JSX.Element} The skeleton loader for Corporate Home.
 */
export const CorporateAnalyticsHomeSkeleton = () => {
  return <AnalyticsHomeSkeleton showAdminFilters={false} />;
};

/**
 * Skeleton loader for Admin Analytics Home.
 * Includes additional filters for company and recruiter selection.
 * 
 * @returns {JSX.Element} The skeleton loader for Admin Analytics Home.
 */
export const AdminAnalyticsHomeSkeleton = () => {
  return <AnalyticsHomeSkeleton showAdminFilters={true} />;
};
