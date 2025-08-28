import { memo, useState, useCallback, useMemo } from 'react';
import { GuidanceApiResponse, GuidanceRequest, GuidancePaginationInfo } from './Guidance';
import { useDashboardContext } from '@Context/Dashboard.context';
import { checkbubble, eyeIcon } from '@Assets';
import MentorDetails from '../../SharedComponents/GuidanceMentorModal';
import { DynamicTable } from "@Components/Shared/DynamicTable";

interface GuidanceTableProps {
  data: GuidanceApiResponse | null;
  pagination: GuidancePaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

const GuidanceTable = memo(({ data, pagination, currentPage, onPageChange, onPageSizeChange, onRefresh}: GuidanceTableProps) => {
  const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    variant: 'join' | 'book';
    selectedRequest: GuidanceRequest | null;
  }>({
    isOpen: false,
    variant: 'book',
    selectedRequest: null
  });
  const { user } = useDashboardContext();
  const [localVisible, setLocalVisible] = useState(false);

  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

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

  const openModal = useCallback((request: GuidanceRequest, variant: 'join' | 'book') => {
    setModalState({
      isOpen: true,
      variant,
      selectedRequest: request
    });
    setLocalVisible(true);
  }, []);

  const closeModal = useCallback(() => {
    setLocalVisible(false);
    setTimeout(() => {
      setModalState({
        isOpen: false,
        variant: 'book',
        selectedRequest: null
      });
    }, 300);
  }, []);

  const handleViewDetails = useCallback((request: GuidanceRequest) => {
    openModal(request, 'join');
  }, [openModal]);

  const handleAcceptAndPay = useCallback(async (request: GuidanceRequest) => {
    if (!user?.email) return;
    openModal(request, 'book');
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
        <div className={`px-4 py-2 rounded-3xl ${row.statusColor?.bg || 'bg-gray-200'} ${row.statusColor?.text || 'text-gray-900'} flex items-center justify-center`}>
          {row.status}
        </div>
      )
    },
    {
      key: "mentorDetails",
      label: 'Mentor Details',
      render: (row: GuidanceRequest) => {
        const isProcessing = processingRequestId === row.id;
        return (
          <div 
            className={`rounded-lg text-xs text-nowrap bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30 py-2 px-6 flex items-center justify-center gap-1 cursor-pointer text-white ${isProcessing ? 'opacity-75' : ''}`}
            onClick={() => !isProcessing && handleViewDetails(row)}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
            ) : (
              <img src={eyeIcon} className='h-6 w-6' alt="View feedback" />
            )}
            <div className="ml-2 tracking-wide leading-6 font-semibold">
              {isProcessing ? 'Loading...' : 'See details'}
            </div>
          </div>
        );
      }
    },
    {
      key: "acceptPay",
      label: 'Accept & pay',
      render: (row: GuidanceRequest) => {
        const isProcessing = processingRequestId === row.id;
        return (
        <div className="flex justify-center">
          <button 
            className={`rounded-lg w-14 h-11 ${isProcessing ? 'bg-blue-300' : 'bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]'} flex items-center justify-center text-white ${isProcessing ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !isProcessing && handleAcceptAndPay(row)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <img src={checkbubble} alt="Ask question" />
            )}
          </button>
          </div>
        );
      }
    }
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
            <MentorDetails
              className={`${localVisible ? 'animate-slide-in' : 'animate-slide-out'}`}
              variant={modalState.variant}
              mentorName={modalState.selectedRequest?.mentorName || 'Sam Das'}
              mentorDetails={modalState.selectedRequest?.guidanceRequestDescription || ''}
              date={modalState.selectedRequest?.dateNeeded || ''}
              time="7:00 pm"
              duration="2 hrs 30 mins"
              charge="₹4,999"
              onAcceptAndPay={() => modalState.selectedRequest && handleModalAcceptAndPay(modalState.selectedRequest)}
            />
          </div>
        </div>
      )}
    </div>
  );
});

GuidanceTable.displayName = 'GuidanceTable';
export default GuidanceTable;
