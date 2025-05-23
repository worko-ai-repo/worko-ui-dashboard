import { memo, useState, useCallback } from 'react';
import { JobApiResponse, JobTypes, PaginationInfo } from './JobTypes';
import { Check } from 'lucide-react';
import Table from '../../SharedComponents/Table';
import Stepper from './Stepper';
import { viewFeedback, iHaveJoined, checkAndAccept, askQuestion } from '@Assets';
import RejectionFeedbackModal from './modals/RejectionFeedbackModal';
import JobService from '../../Service/JobsService';
import { useDashboardContext } from '@Context/Dashboard.context';

interface JobsTableProps {
  data: JobApiResponse | null;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}

const JobsTable = memo(({ 
  data, 
  pagination,
  currentPage,
  onPageChange,
  onPageSizeChange,
  onRefresh
}: JobsTableProps) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState<string>("");
  const [processingJobId, setProcessingJobId] = useState<string | null>(null);
  
  // Get user from dashboard context
  const { user } = useDashboardContext();

  // Map the status to action for the specific cases
  const getActionFromStatus = (status: string): string | null => {
    switch (status) {
      case 'REJECTED':
        return 'VIEW_FEEDBACK';
      case 'PROCESSING_INTERVIEW':
      case 'UNDER_EVALUATION':
        return 'HIRED';
      case 'DOCUMENT_REQUESTED':
        return 'SUBMIT_DOCUMENT';
      case 'INTERVIEW_DONE':
        return 'CHECK_ACCEPT';
      case 'HIRED':
        return 'JOINED';
      default:
        return null;
    }
  };

  // Process data to add actions based on status
  const processedJobs = data?.data?.map(job => ({
    ...job,
    action: job.action || getActionFromStatus(job.status)
  }));

  const jobs = processedJobs || [];
  
  // Function to handle opening the feedback modal
  const handleViewFeedback = useCallback((job: JobTypes) => {
    if (job.rejectionFeedbackBySystem) {
      setFeedbackContent(job.rejectionFeedbackBySystem);
      setShowFeedbackModal(true);
    }
  }, []);
  
  // Function to handle action button clicks
  const handleActionClick = useCallback(async (type: string, job: JobTypes) => {
    if (!user?.email) return;
    
    setProcessingJobId(job.id);
    
    try {
      let result;
      
      switch (type) {
        case 'VIEW_FEEDBACK':
          handleViewFeedback(job);
          break;
          
        case 'CHECK_ACCEPT':
          result = await JobService.acceptOffer(job.id, user.email);
          if (result.response) {
            onRefresh();
          }
          break;
          
        case 'JOINED':
          result = await JobService.markAsJoined(job.id, user.email);
          if (result.response) {
            onRefresh();
          }
          break;
          
        // Add other action handlers as needed
      }
    } catch (error) {
      console.error(`Error processing action ${type}:`, error);
    } finally {
      setProcessingJobId(null);
    }
  }, [handleViewFeedback, onRefresh, user?.email]);

  const MatchingScoreCircle = memo(({ score }: { score: number }) => (
    <div className="w-20 flex mb-2 flex-col items-center justify-center gap-px text-base text-green-500">
      <div className="w-16 relative h-16 cursor-pointer flex items-center justify-center">
        <svg className="absolute scale-[80%]" width="65" height="65" viewBox="0 0 65 65">
          <circle cx="32.5" cy="32.5" r="30" fill="none" stroke="#eee" strokeWidth="5" />
          <circle 
            cx="32.5" 
            cy="32.5" 
            r="30" 
            fill="none" 
            stroke="#4cbc9a" 
            strokeWidth="5"
            strokeDasharray={`${(score / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
            transform="rotate(-90 32.5 32.5)"
          />
        </svg>
        <div className="absolute font-semibold text-xs">{score}%</div>
      </div>
      <span className="absolute top-14 pt-1 text-[9px] font-semibold text-gray-500 text-center">View details</span>
    </div>
  ));

  const StatusBadge = memo(({ status }: { status: string }) => {
    const statusConfigs: Record<string, { bg: string, text: string, label: string }> = {
      CV_DOWNLOADED: { bg: "bg-blue-100", text: "text-blue-500", label: "CV downloaded" },
      UNDER_EVALUATION: { bg: "bg-blue-100", text: "text-blue-500", label: "Under evaluation" },
      PROCESSING_INTERVIEW: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview Process" },
      INTERVIEW_DONE: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview done" },
      DOCUMENT_REQUESTED: { bg: "bg-red-100", text: "text-red-500", label: "Document requested" },
      DOCUMENT_SUBMITTED: { bg: "bg-blue-100", text: "text-blue-500", label: "Document submitted" },
      OFFER_LETTER: { bg: "bg-blue-100", text: "text-blue-500", label: "Offer letter received" },
      REVISED_LETTER: { bg: "bg-red-100", text: "text-red-500", label: "Revised letter received" },
      HIRED: { bg: "bg-green-100", text: "text-green-500", label: "Hired" },
      REJECTED: { bg: "bg-red-400", text: "text-white", label: "Rejected" },
      JOINED: { bg: "bg-green-100", text: "text-green-500", label: "Joined" },
      OFFER_ACCEPTED: { bg: "bg-green-100", text: "text-green-500", label: "Offer accepted/Hired" },
      APPLIED: { bg: "bg-blue-100", text: "text-blue-500", label: "Applied" },
    };
    
    const config = statusConfigs[status] || statusConfigs.UNDER_EVALUATION;
    
    return (
      <div className={`rounded-full ${config.bg} w-40 h-10 flex items-center justify-center py-2 px-0 ${config.text}`}>
        <div className="tracking-wide leading-normal">{config.label}</div>
      </div>
    );
  });

  const ActionButton = memo(({ type, job }: { type: string, job: JobTypes }) => {
    const isProcessing = processingJobId === job.id;
    
    const actionConfigs: Record<string, { color: string, icon: JSX.Element | null, label: string }> = {
      HIRED: {
        color: "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]",
        icon: <Check strokeWidth={3.25} className="w-5 h-5 mr-1" />,
        label: "I am hired"
      },
      JOINED: {
        color: "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]",
        icon: <img src={iHaveJoined} alt="I have joined" />,
        label: "I have joined"
      },
      SUBMIT_DOCUMENT: {
        color: "bg-blue-400",
        icon: null,
        label: "Submit document"
      },
      CHECK_ACCEPT: {
        color: "bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30",
        icon: <img src={checkAndAccept} alt="Check & accept" />,
        label: "Check & accept"
      },
      VIEW_FEEDBACK: {
        color: "bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30",
        icon: <img src={viewFeedback} alt="View feedback" />,
        label: "View feedback"
      }
    };
    
    const config = actionConfigs[type];
    if (!config) return null;
    
    return (
      <button 
        className={`w-36 rounded-xl ${config.color} h-11 flex items-center justify-center py-2 px-4 gap-0.5 text-white ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
        onClick={() => !isProcessing && handleActionClick(type, job)}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
        ) : config.icon}
        <div className="leading-normal font-semibold">{isProcessing ? 'Processing...' : config.label}</div>
      </button>
    );
  });
  
  // Define columns for the table
  const columns = [
    {
      key: "jobTitle",
      header: "Job Title",
      sortable: true,
      className: "font-semibold capitalize"
    },
    {
      key: "companyName",
      sortable: true,
      header: "Company",
    },
    {
      key: "createdAt",
      header: "Apply Date",
      sortable: true,
      render: (value: string) => new Date(value).toLocaleDateString()
    },
    {
      key: "matchingScore",
      header: "Matching Score",
      sortable: true,
      render: (value: any) => <MatchingScoreCircle score={value} />
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (value: any) => <StatusBadge status={value} />
    },
    {
      key: "action",
      header: "Action",
      sortable: true,
      render: (value: any, item: JobTypes) => value ? <ActionButton type={value} job={item} /> : null
    },
    {
      key: "",
      header: "Follow up",
      render: () => (
        <button className="w-14 h-11 rounded-xl bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6] flex items-center justify-center">
          <img src={askQuestion} alt="Ask question" />
        </button>
      )
    }
  ];

  return (
    <div className="w-full font-poppins">
      <div className="bg-white shadow-md h-full rounded-xl p-4 overflow-hidden">
        <Table
          data={jobs}
          columns={columns}
          keyExtractor={(item) => item.id}
          rowClassName={() => "relative rounded-xl border-b text-sm hover:bg-gray-50"}
          headerClassName="bg-cyan-50 text-nowrap text-sm px-4 mb-2"
          expandableContent={item => {
            if (item.statusTracker && item.statusTracker.length > 0) {
              return <Stepper statusTracker={item.statusTracker[item.statusTracker.length-1]} />;
            }
            return item.applicationSteps ? <Stepper steps={item.applicationSteps} /> : null;
          }}
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          currentPage={currentPage}
          emptyStateComponent={
            <div className="w-full p-12 flex flex-col items-center justify-center">
              <div className="text-gray-400 text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-700">No job applications found</h3>
              <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
            </div>
          }
        />
      </div>
      <RejectionFeedbackModal 
        show={showFeedbackModal} 
        feedbackContent={feedbackContent} 
        onClose={() => setShowFeedbackModal(false)} 
      />
    </div>
  );
});

JobsTable.displayName = 'JobsTable';

export default JobsTable;