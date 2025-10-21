import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useDashboardContext } from "@Context/Dashboard.context";
import GuidanceTable from "./GuidanceTable";
import { magnifyingQuestion } from "@Assets";
import httpServiceObj from "@Services/ApiHandler.service";
import profileService from "@Components/Dashboard/Candidate/Service/ProfileService";

interface UserDetails {
  id: string;
  // add any other fields you expect
}

// Define types
export interface GuidanceRequest {
  id: string;
  guidanceRequestType: string;
  companyName: string;
  guidanceRequestDeadline: string;
  jobUrl: string;
  guidanceRequestDescription: string;
  status?: string;
  userDetails?:{
    name?:string;
    about?:string;
  }
  createdAt?:string;
  statusColor?: {
    bg: string;
    text: string;
    label:string;
  };
  dateNeeded?: string;
  mentorName?: string;

  cancelledByDetails?:{
    reason:string;
  }
  
  mentorDetails?: {
    name?: string;
    userId?: string;
    userEmail?: string;
  };

  scheduleMeetingDetails?: {
    date?: string;
    time?: string;
    duration?: string;
  };

  paymentRequestDetails?: {
    totalAmount?: number;
    platformFee?: number;
    guidanceFee?: number;
    currency?: string;
    linkForPayment?: string;
  };
  statusTracker: [
    {
        actionByUserId?: string;
        newStatus?: string;
        actionDate?: string;
        actionByUserType?: string;
    },
  ],
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
  sortOrder: "descending",
  timesQueried: 0,
  queriedCount: 0,
  lastKey: "",
};

const statsItems = [
  { label: "Total Requests", value: 25 },
  { label: "In Progress", value: 12 },
  { label: "Completed", value: 8 },
  { label: "Pending", value: 5 },
];

const Guidance = () => {
  const [searchBarText, setSearchBarText] = useState<string>("");
  const [data, setData] = useState<GuidanceApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<GuidanceFilters>({});
  const [paginationInfo, setPaginationInfo] = useState<GuidancePaginationInfo>(initialPaginationState);
  const [userID,setUserID] = useState("")
  const APP_API_URI= import.meta.env.APP_API_URI
  const currentUser = profileService.getCurrentUser();
  
  const paginationKeysRef = useRef<Record<number, string>>({
    1: "", // First page always has empty lastKey
  });

  const { user } = useDashboardContext();

  // Memoize the fetch function to prevent unnecessary re-renders
  const fetchGuidanceRequests = useCallback( 
  async (
    page = 1,
    pageSize = 25,
    lastKey = "",
    searchFilters = filters,
    isSearch = false
  ) => {
      if (!user?.email) return;
      setIsLoading(true);

        const url = `${APP_API_URI}/user/${currentUser?.email}/details`;
        let localUserId = "";
        try {
          const { response } = await httpServiceObj.get(url, true, {}, true);
          const data = response as UserDetails[]; 
          if (Array.isArray(data) && data[0]?.id) {
            localUserId = data[0].id;
            setUserID(localUserId);
          } else {
            console.warn("User details array is empty or invalid.");
            return; 
          }
        } catch (error) {
          console.error("Cannot fetch user details:", error);
        }

      try {
        const uri = `${APP_API_URI}/user/guidance-request?mentorId=${localUserId}&actionByUserType=EMP&pageSize=${pageSize}&lastKey=${lastKey}`;
        const { response, error }: { response: GuidanceApiResponse | null; error: Error | null } = await httpServiceObj.get(uri,true,{},true);
        // console.log(response)
        if (response) {
          // Process the data to include status formatting
          if (Array.isArray(response.data)) {
            const processedData = response.data.map((item: GuidanceRequest) => {
              // Determine status colors based on status
            const statusColors = {
              "PENDING": { bg: "bg-gray-200", text: "text-gray-900", label: "Pending" },
              "MENTOR_ASSIGNED": { bg: "bg-blue-100", text: "text-blue-600", label: "Mentor Assigned" },
              "CANCELLED": { bg: "bg-red-100", text: "text-red-600", label: "Cancelled" },
              "PAYMENT_CONFIRMATION_PENDING": { bg: "bg-yellow-100", text: "text-yellow-600", label: "Payment Confirmation Pending" },
              "PAYMENT_CONFIRMATION_DONE": { bg: "bg-green-100", text: "text-green-600", label: "Payment Done" },
              "MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE": { bg: "bg-orange-100", text: "text-orange-600", label: "Reschedule Requested by Candidate" },
              "MEETING_RESCHEDULE_REQUESTED_BY_MENTOR": { bg: "bg-orange-100", text: "text-orange-600", label: "Reschedule Requested by Mentor" },
              "MEETING_CONFIRMED": { bg: "bg-orange-200", text: "text-orange-600", label: "Meeting Confirmed" },
              "MEETING_RESCHEDULE_CONFIRMED": { bg: "bg-teal-100", text: "text-teal-600", label: "Meeting Re-scheduled Confirmed" },
              "PROJECT_COMPLETED": { bg: "bg-teal-400", text: "text-teal-800", label: "Project Completed" }, 
            };

              // Format date from ISO to DD-MM-YYYY
              const date = new Date(item.guidanceRequestDeadline);
              const formattedDate = `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;

              return {
                ...item,
                dateNeeded: formattedDate,
                statusColor: statusColors[(item.status as keyof typeof statusColors) || "Mentor to be assigned"],
              };
            });

            setData({
              data: processedData,
              pagination: response.pagination || initialPaginationState,
            });
          } else {
            setData(response as GuidanceApiResponse);
          }

          if (response.pagination) {
            setPaginationInfo(response.pagination);

            // For searches or first page load, reset pagination keys
            if (isSearch || page === 1) {
              paginationKeysRef.current = { 1: "" };
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
          console.error("Error fetching guidance requests:", error);
        }
      } catch (err) {
        console.error("Exception in fetchGuidanceRequests:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [user, pageSize, filters]
  );

  // Handle page change from table
  
  const handlePageChange = useCallback(
    (page: number) => {
      // Don't do anything if trying to go to same page
      if (page === currentPage) return;

      setCurrentPage(page);

      // Use the stored lastKey for this page if available
      const lastKey = paginationKeysRef.current[page] || "";
      fetchGuidanceRequests(page, pageSize, lastKey);
    },
    [currentPage, fetchGuidanceRequests, pageSize]
  );

  // Handle page size change
  const handlePageSizeChange = useCallback(
    (size: number) => {
      setPageSize(size);
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" }; // Reset pagination keys
      fetchGuidanceRequests(1, size, "");
    },
    [fetchGuidanceRequests]
  );

  // navigating to guidance page
  const handleRedirect = ()=>{
    window.location.href = `${import.meta.env.APP_PROXY_BASE}guidance`;
  }
  // Initial data load
  useEffect(() => {
    if (user?.email) {
      setCurrentPage(1);
      setPaginationInfo((prev) => ({ ...prev, lastKey: "" }));
      paginationKeysRef.current = { 1: "" }; // Reset pagination keys
      fetchGuidanceRequests(1, pageSize, "");
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
    <div className="w-full relative rounded-xl overflow-hidden text-base text-slate-900 font-poppins mt-5">
      {/* Help button container at top with right alignment */}
      {/* <div className="w-full flex justify-end p-2">
        <button 
        onClick={handleRedirect}
        className="relative rounded-lg bg-[#316bff] h-11 flex flex-row items-center justify-center p-4 px-4 box-border gap-1.5 cursor-pointer text-center text-xs text-white font-poppins">
          <img className="w-5 h-5 mr-1" alt="" src={magnifyingQuestion} />
          <div className="relative tracking-[0.2px] leading-[114%] font-semibold">Request new guidance</div>
        </button>
      </div> */}

      <div className="w-full space-y-[35px] px-0">
        {/* <div className="bg-white p-4 rounded-xl shadow-md"> */}
          {isLoading ? (
            <div className="w-full py-12 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                <p className="mt-3 text-gray-500">Loading guidance requests...</p>
              </div>
            </div>
          ) : (
            <GuidanceTable
              mentorID={userID}
              data={data}
              pagination={paginationInfo}
              currentPage={currentPage}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRefresh={() => {
                const lastKey = currentPage > 1 ? paginationKeysRef.current[currentPage] || "" : "";
                fetchGuidanceRequests(currentPage, pageSize, lastKey);
              }}
            />
          )}
        {/* </div> */}
      </div>
    </div>
  );
};

export default Guidance;
