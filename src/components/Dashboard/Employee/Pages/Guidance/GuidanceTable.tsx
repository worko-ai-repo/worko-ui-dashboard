import { memo, useState, useCallback, useMemo, useRef } from 'react';
import { GuidanceApiResponse, GuidanceRequest, GuidancePaginationInfo } from './Guidance';
import { useDashboardContext } from '@Context/Dashboard.context';
import { checkbubble, eyeIcon } from '@Assets';
import { DynamicTable } from "@Components/Shared/DynamicTable";
import MentorDetails from './modals/MentorDetails';
import httpServiceObj from '@Services/ApiHandler.service';

interface GuidanceTableProps {
  mentorID:string;
  data: GuidanceApiResponse | null;
  pagination: GuidancePaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

interface MentorMergedData {
  socialProfile: any | null;
  mentorDetails: any | null;
}

const GuidanceTable = memo(({ mentorID,data, pagination, currentPage, onPageChange, onPageSizeChange, onRefresh}: GuidanceTableProps) => {
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    variant: 'acceptAndPay' | 'mentorDetails';
    selectedRequest: GuidanceRequest | null;
  }>({
    isOpen: false,
    variant: 'mentorDetails',
    selectedRequest: null
  });
  const { user } = useDashboardContext();
  const [localVisible, setLocalVisible] = useState(false);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const mentorDataCache = useRef<Map<string, MentorMergedData>>(new Map());
  const [mentorDataLoading, setMentorDataLoading] = useState<boolean>(false);

  const APP_API_URI= import.meta.env.APP_API_URI

  const formatGuidanceType = (type: string) => {
    const typeMap: {[key: string]: string} = {
      "MOCK_INTERVIEW_PREPARATION": "Mock interview/preparation",
      "CAREER_GUIDANCE": "Career guidance",
      "HELP_WITH_ASSIGNMENT": "Help with assignment",
      "INTERVIEW_HAND_HOLDING": "Interview hand-holding",
      "RESUME_REVIEW": "Resume review",
      "OTHER": "Other"
    };
    return typeMap[type] || type;
  };

  const fetchMentorData = async (email: string): Promise<MentorMergedData> => {
    try {
      const socialProfileUrl = `/user/${encodeURIComponent(email)}/socialprofile`;
      const mentorDetailsUrl = `/user/${encodeURIComponent(email)}/details`;

      const [{ response: socialProfileResponse, error: socialProfileError }, { response: mentorDetailsResponse, error: mentorDetailsError }] = await Promise.all([
        httpServiceObj.get(socialProfileUrl, true, {}),
        httpServiceObj.get(mentorDetailsUrl, true, {}),
      ]);

      if (socialProfileError || mentorDetailsError) {
        console.error('Error fetching mentor data:', socialProfileError || mentorDetailsError);
        return { socialProfile: null, mentorDetails: null };
      }
      // console.log(socialProfileResponse)
      return {
        socialProfile: Array.isArray(socialProfileResponse) && socialProfileResponse.length > 0 ? socialProfileResponse[0] : null,
        mentorDetails: Array.isArray(mentorDetailsResponse) && mentorDetailsResponse.length > 0 ? mentorDetailsResponse[0] : null,
      };
    } catch (error) {
      console.error('Exception in fetchMentorData:', error);
      return { socialProfile: null, mentorDetails: null };
    }
  };


  // Open modal and fetch mentor data if not cached
  const openModal = useCallback(async (request: GuidanceRequest, variant: 'acceptAndPay' | 'mentorDetails') => {
    setModalState({
      isOpen: true,
      variant,
      selectedRequest: request
    });
    setLocalVisible(true);

    if (!request.id) return;

    // If data already cached, do nothing
    if (mentorDataCache.current.has(request.id)) return;

    setMentorDataLoading(true);
    const mentorEmail = request.mentorDetails?.userEmail || user?.email || '';
    if (!mentorEmail) {
      setMentorDataLoading(false);
      return;
    }

    const data = await fetchMentorData(mentorEmail);
    mentorDataCache.current.set(request.id, data);
    setMentorDataLoading(false);
  }, [user?.email]);

  const closeModal = useCallback(() => {
    setLocalVisible(false);
    setTimeout(() => {
      setModalState({
        isOpen: false,
        variant: 'mentorDetails',
        selectedRequest: null
      });
    }, 300);
  }, []);

  const handleViewDetails = useCallback((request: GuidanceRequest) => {
    openModal(request, 'acceptAndPay');
    console.log(request)
  }, [openModal]);

  const handleAcceptAndPay = useCallback(async (request: GuidanceRequest) => {
    if (!user?.email) return;
    openModal(request, 'mentorDetails');
  }, [openModal, user?.email]);

  const handleModalAcceptAndPay = useCallback(async (request: GuidanceRequest) => {
    setProcessingRequestId(request.id);
    try {
      console.log("Accept and pay for request:", request.id);
      onRefresh();
      closeModal();
    } catch (error) {
      console.error("Error accepting guidance request:", error);
    } finally {
      setProcessingRequestId(null);
    }
  }, [onRefresh, closeModal]);

  const columns = [
    {
      key: "guidanceRequestType",
      label: 'Guidance Type',
      sortable: true,
      render: (row: GuidanceRequest) => <div>{formatGuidanceType(row.guidanceRequestType)}</div>
    },
    {
      key: "companyName",
      label: 'Company',
      sortable: true,
      render: (row: GuidanceRequest) => <div className="text-center">{row.companyName}</div>
    },
    {
      key: "dateNeeded",
      label: 'Date needed by',
      sortable: true,
      render: (row: GuidanceRequest) => row.dateNeeded
    },
    {
      key: "jobUrl",
      label: 'Job URL',
      sortable: true,
      render: (row: GuidanceRequest) => (
        <a 
          href={row.jobUrl} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="tracking-wide leading-6 font-semibold text-blue-600 cursor-pointer"
        >
          Link
        </a>
      )
    },
    {
      key: "guidanceRequestDescription",
      label: 'Requirement detail',
      sortable: true,
      render: (row: GuidanceRequest) => (
        <div className="flex justify-center">
          <p className="tracking-wide truncate leading-6 max-w-xs">
            {row.guidanceRequestDescription}
          </p>
        </div>
      )
    },
{
  key: "status",
  label: 'Status',
  sortable: true,
  render: (row: GuidanceRequest) => (
    <div
      className={`w-32 rounded-full px-1 py-3 text-sm font-medium
        inline-flex items-center justify-center
        truncate
        ${row.statusColor?.bg || 'bg-gray-200'}
        ${row.statusColor?.text || 'text-gray-900'}
        max-w-[200px]
        text-xs
      `}
      title={row.statusColor?.label}
    >
        <span className="truncate block max-w-full text-center">
          {row.statusColor?.label || row.status}
        </span>
    </div>

          //     <div className="flex justify-center ">
          // <div
          //     className={`w-32 text-center rounded-full px-1 py-3 text-sm font-medium ${              
          //       row.status === "ACCEPTED"
          //       ? "bg-green-100 text-green-500"
          //       : row.status === "PENDING"
          //       ? "bg-yellow-100 text-yellow-600"
          //       : row.status === "AWAITING"
          //       ? "bg-blue-100 text-blue-500"
          //       : row.status === "DONE"
          //       ? "bg-gray-100 text-gray-600"
          //       : "bg-red-400 text-white"
          //   }`}
          // >
          //   {row.status}
          // </div>
          // </div>
  )
},

    {
      key: "mentorDetails",
      label: "Action",
      render: (row: GuidanceRequest) => {
        if (row.status === "PENDING") return null;

        const isProcessing = processingRequestId === row.id;

        return (
          <div
            className={`rounded-lg text-xs text-nowrap bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30 py-2 px-6 flex items-center justify-center gap-1 cursor-pointer text-white ${isProcessing ? "opacity-75" : ""}`}
            onClick={() => !isProcessing && handleViewDetails(row)}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
            ) : (
              <img src={eyeIcon} className="h-6 w-6" alt="View feedback" />
            )}
            <div className="ml-2 tracking-wide leading-6 font-semibold">
              {isProcessing ? "Loading..." : "See details"}
            </div>
          </div>
        );
      },
    },
  ];

  const guidanceRequests = data?.data || [];

  const sortData = (rows: GuidanceRequest[], field: string): GuidanceRequest[] => {
    if (!field) return rows;
    return [...rows].sort((a, b) => {
      let aValue = (a as any)[field];
      let bValue = (b as any)[field];
      if (field === "dateNeeded") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  const handleSortChange = (columnKey: string) => {
    if (sortField === columnKey) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(columnKey);
      setSortOrder("asc");
    }
  };

  const sortedData = useMemo(
    () => sortData(guidanceRequests, sortField),
    [guidanceRequests, sortField, sortOrder]
  );

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    onPageSizeChange(newPageSize);
  };

  const keyExtractor = (item: GuidanceRequest) => item.id;

  // Get merged mentor data from cache for modal
  const currentMentorData: MentorMergedData | undefined = modalState.selectedRequest
    ? mentorDataCache.current.get(modalState.selectedRequest.id)
    : undefined;

  return (
    <div className="w-full font-poppins">
      <div className="bg-white shadow-md h-full rounded-xl overflow-hidden">
        <DynamicTable<GuidanceRequest>
          columns={columns}
          rows={sortedData}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          handlePreviousPage={() => onPageChange(currentPage - 1)}
          handleNextPage={() => onPageChange(currentPage + 1)}
          hasPrevPage={currentPage > 1}
          hasNextPage={!!pagination?.lastKey}
          emptyStateMessage="No guidance requests found"
          emptyStateSubMessage="Try adjusting your filters"
          onSortChange={handleSortChange}
          sortField={sortField}
          sortOrder={sortOrder}
          enableSelect={false}
          keyExtractor={keyExtractor}
        />
      </div>

      {/* Modal */}
      {modalState.selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            <button
              onClick={closeModal}
              className="fixed top-0 right-0 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {modalState.variant === 'acceptAndPay' ? (
              <MentorDetails
                className={`${localVisible ? 'animate-slide-in' : 'animate-slide-out'}`}
                request={modalState.selectedRequest}
                mentorDetails={mentorDataLoading ? null : currentMentorData || null}
                closeModal={closeModal}
                onRefresh={onRefresh}
                mentorID={mentorID}
              />
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
});

GuidanceTable.displayName = 'GuidanceTable';
export default GuidanceTable;
