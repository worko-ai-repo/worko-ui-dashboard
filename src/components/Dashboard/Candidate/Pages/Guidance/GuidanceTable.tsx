import { memo, useState, useCallback } from 'react';
import Table from "../../SharedComponents/Table";
import { GuidanceApiResponse, GuidanceRequest, GuidancePaginationInfo } from './Guidance';
import { useDashboardContext } from '@Context/Dashboard.context';
import { checkbubble, eyeIcon } from '@Assets';
import MentorDetails from '../../SharedComponents/GuidanceMentorModal';

interface GuidanceTableProps {
  data: GuidanceApiResponse | null;
  pagination: GuidancePaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

const GuidanceTable = memo(({ 
  data, 
  pagination,
  currentPage,
  onPageChange,
  onPageSizeChange,
  onRefresh
}: GuidanceTableProps) => {
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


  // Map guidanceRequestType to more readable format
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

  // Function to open modal
  const openModal = useCallback((request: GuidanceRequest, variant: 'join' | 'book') => {
    setModalState({
      isOpen: true,
      variant,
      selectedRequest: request
    });
    setLocalVisible(true);
  }, []);

  // Function to close modal
  const closeModal = useCallback(() => {
    setLocalVisible(false);
    // delay actual modal unmount
  setTimeout(() => {
    setModalState({
      isOpen: false,
      variant: 'book',
      selectedRequest: null
    });
  }, 300);
  }, []);

  // Function to handle viewing details
  const handleViewDetails = useCallback((request: GuidanceRequest) => {
    openModal(request, 'join');
  }, [openModal]);

  // Function to handle accept and pay
  const handleAcceptAndPay = useCallback(async (request: GuidanceRequest) => {
    if (!user?.email) return;
    
    // Open modal first
    openModal(request, 'book');
  }, [openModal, user?.email]);

  // Function to handle actual acceptance and payment from modal
  const handleModalAcceptAndPay = useCallback(async (request: GuidanceRequest) => {
    setProcessingRequestId(request.id);
    
    try {
      // Implement API call for accepting and paying
      console.log("Accept and pay for request:", request.id);
      // After successful API call, refresh the data
      onRefresh();
      closeModal();
    } catch (error) {
      console.error("Error accepting guidance request:", error);
    } finally {
      setProcessingRequestId(null);
    }
  }, [onRefresh, closeModal]);

  // Define table columns
  const columns = [
    {
      key: "guidanceRequestType",
      header: 'Guidance Type',
      sortable: true,
      className: "tracking-wide leading-6",
      render: (value: string) => <div>{formatGuidanceType(value)}</div>
    },
    {
      key: "companyName",
      header: 'Company',
      sortable: true,
      className: "tracking-wide leading-6 text-center"
    },
    {
      key: "dateNeeded",
      header: 'Date needed by',
      sortable: true,
      className: "tracking-wide leading-6 text-nowrap"
    },
    {
      key: "jobUrl",
      header: 'Job URL',
      sortable: true,
      render: (value: string) => (
        <div className="tracking-wide leading-6 font-semibold text-blue-600 cursor-pointer">
          <a href={value} target="_blank" rel="noopener noreferrer">Link</a>
        </div>
      )
    },
    {
      key: "guidanceRequestDescription",
      header: 'Requirement detail',
      sortable: true,
      className: "tracking-wide truncate leading-6 max-w-xs",
    },
    {
      key: "status",
      header: 'Status',
      sortable: true,
      className: "",
      render: (value: string, item: GuidanceRequest) => (
        <div className={`px-4 py-4 rounded-3xl ${item.statusColor?.bg || 'bg-gray-200'} ${item.statusColor?.text || 'text-gray-900'} flex items-center justify-center`}>
          <div className="tracking-wide leading-6">{value}</div>
        </div>
      )
    },
    {
      key: "",
      header: 'Mentor Details',
      render: (value: any, item: GuidanceRequest) => {
        const isProcessing = processingRequestId === item.id;
        
        return (
          <div 
            className={`rounded-lg text-xs text-nowrap bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30 py-2 px-6 flex items-center justify-center gap-1 cursor-pointer text-white ${isProcessing ? 'opacity-75' : ''}`}
            onClick={() => !isProcessing && handleViewDetails(item)}
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
      key: "",
      header: <div className="flex items-center justify-center"><span>Accept & pay</span></div>,
      render: (value: any, item: GuidanceRequest) => {
        const isProcessing = processingRequestId === item.id;
        
        return (
          <button 
            className={`rounded-lg w-14 h-11 ${isProcessing ? 'bg-blue-300' : 'bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]'} flex items-center justify-center text-white ${isProcessing ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => !isProcessing && handleAcceptAndPay(item)}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <img src={checkbubble} alt="Ask question" />
            )}
          </button>
        );
      }
    }
  ];

  const guidanceRequests = data?.data || [];

  return (
    <div className="w-full font-poppins">
      <Table
        data={guidanceRequests}
        columns={columns}
        keyExtractor={(item) => item.id}
        rowClassName={() => "relative rounded-xl border-b text-sm hover:bg-gray-50"}
        headerClassName='bg-cyan-50 text-nowrap text-sm py-3 px-4 mb-2'
        pagination={pagination}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
        currentPage={currentPage}
        emptyStateComponent={
          <div className="w-full p-12 flex flex-col items-center justify-center">
            <div className="text-gray-400 text-6xl mb-4">📋</div>
            <h3 className="text-lg font-semibold text-gray-700">No guidance requests found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search filters or create a new request</p>
          </div>
        }
      />

      {/* Modal Overlay */}
      {modalState.selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="relative">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="fixed top-0 right-0 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 z-10"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Modal Content */}
            <MentorDetails
              className={`${localVisible ? 'animate-slide-in' : 'animate-slide-out'}`}
              variant={modalState.variant}
              mentorName={modalState.selectedRequest?.mentorName || 'Sam Das'}
              mentorDetails={modalState.selectedRequest?.guidanceRequestDescription || 'Normal feedback can be positive, constructive, or negative, and it can be formal or informal. Effective feedback is respectful, tactful, and non-threatening.'}
              date={modalState.selectedRequest?.dateNeeded || '24-05-2025'}
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