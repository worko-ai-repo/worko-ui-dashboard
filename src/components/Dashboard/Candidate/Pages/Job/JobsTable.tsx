import React, { memo, useState, useCallback, useMemo } from 'react';
import { JobApiResponse, JobTypes, PaginationInfo } from './JobTypes';
import { Check } from 'lucide-react';
import { viewFeedback, iHaveJoined, checkAndAccept, askQuestion } from '@Assets';
import RejectionFeedbackModal from './modals/RejectionFeedbackModal';
import SubmitDocumentModal from './modals/SubmitDocumentModal';
import JobService from '../../Service/JobsService';
import { useDashboardContext } from '@Context/Dashboard.context';
import { DynamicTable } from '@Components/Shared/DynamicTable';
import Stepper from './Stepper';
import { JobApplicationStatusType } from 'src/types/JobsAndApplication.type';
import { JobApplicationDetailsDto } from '@Interfaces/CorporateDashboard.dto';
import CheckAcceptModal from './modals/CheckAcceptModal';
import JoinedModal from './modals/JoinedModal';

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
  const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
  const [showJoinedModal, setShowJoinedModal] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
  const [sortField, setSortField] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const { user } = useDashboardContext();
  const [expandedRows, setExpandedRows] = React.useState<string[]>([]);
  const [requestedDocumentsList, setRequestedDocumentsList] = useState<JobApplicationDetailsDto>();
  const [showCheckAcceptModal, setShowCheckAcceptModal] = useState(false);
  const [currentJobForCheckAccept, setCurrentJobForCheckAccept] = useState<JobApplicationDetailsDto | null>(null);

  // Map the status to action for the specific cases
  const getActionFromStatus = (status: string): string | null => {
    switch (status) {
      // case 'APPLIED':
      //   return null;
      // case 'CV_DOWNLOADED':
      //   return null;
      // case 'UNDER_EVALUATION':
      //   return null;
      case 'REJECTED':
        return 'VIEW_FEEDBACK';
      // case 'PROCESSING_INTERVIEW':
      //   return null;
      // case 'INTERVIEW_DONE':
      //   return null;
      // case 'HIRING_IN_PROCESS':
      //   return null;
      case 'DOCUMENT_REQUESTED':
        return 'SUBMIT_DOCUMENT';
      case 'DOCUMENT_ADDITIONAL_REQUESTED':
        return 'SUBMIT_DOCUMENT';
      case 'DOCUMENT_REVISION_REQUESTED':
        return 'SUBMIT_DOCUMENT';
      // case 'DOCUMENT_VERIFIED':
      //   return null;
      case 'OFFER_SENT':
        return 'CHECK_ACCEPT';
      // case 'OFFER_ISSUE_RAISED':
      //   return null;
      case 'REVISED_OFFER_SENT':
        return 'CHECK_ACCEPT';
      case 'HIRED':
        return 'JOINED';
      // case 'JOINED':
      //   return null;
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

// fake dummy fields for upload
// const requestedDocumentNamesDummy = [
//   "Adhaar Card",
//   "PAN Card",
//   "Birth Certificate",
//   "Graduation Certificate",
// ];

  // Function to handle opening the feedback modal
  const handleViewFeedback = useCallback((job: JobApplicationDetailsDto) => {
    if (job.rejectionFeedbackBySystem) {
      setFeedbackContent(job.rejectionFeedbackBySystem);
      setShowFeedbackModal(true);
    }
  }, []);
  
  const handleSubmitDocs = (submittedFiles: Record<string, File | null>) => {
  console.log("Submitted files:", submittedFiles);
    // TODO: handle file upload
  };
  // Function to handle action button clicks (old function)
  // const handleActionClick = useCallback(async (type: string, job: JobApplicationDetailsDto) => {
  //   if (!user?.email) return;
    
  //   setProcessingJobId(job.id);
    
  //   try {
  //     let result;
      
  //     switch (type) {
  //       case 'VIEW_FEEDBACK':
  //         handleViewFeedback(job);
  //         break;
          
  //       case 'CHECK_ACCEPT':
  //         result = await JobService.acceptOffer(job.id, user.email);
  //         if (result.response) {
  //           onRefresh();
  //         }
  //         break;
          
  //       case 'JOINED':
  //         result = await JobService.markAsJoined(job.id, user.email);
  //         if (result.response) {
  //           onRefresh();
  //         }
  //         break;
          
  //       // Add other action handlers as needed
  //     }
  //   } catch (error) {
  //     console.error(`Error processing action ${type}:`, error);
  //   } finally {
  //     setProcessingJobId(null);
  //   }
  // }, [handleViewFeedback, onRefresh, user?.email]);

  const handleActionClick = useCallback(async (type: string, job: JobApplicationDetailsDto) => {
  if (!user?.email) return;

  setProcessingJobId(job.id);

  try {
    let result;

    switch (type) {
      case 'VIEW_FEEDBACK':
        handleViewFeedback(job);
        console.log(job)
        break;

      case 'CHECK_ACCEPT':
        // result = await JobService.acceptOffer(job.id, user.email);
        // console.log(result)
        // if (result.response) {
        //   onRefresh();
        // }
        setCurrentJobForCheckAccept(job);
        setShowCheckAcceptModal(true);
        break;

      case 'JOINED':
        // result = await JobService.markAsJoined(job.id, user.email);
        // if (result.response) {
        //   onRefresh();
        // }
        setCurrentJobForCheckAccept(job);
        setShowJoinedModal(true);
        break;

      case 'SUBMIT_DOCUMENT':
        setShowDocumentUploadModal(true);
        console.log(`Submit document for job ID: ${job.id}`);
        if (job.requestedDocumentDetails && job.requestedDocumentDetails.length > 0) {
            console.log(job)
            setRequestedDocumentsList(job)
          }
        // TODO: Add actual document submission logic here
        break;

      case 'APPLIED':
        console.log(`Already applied for job: ${job.id}`);
        break;

      case 'CV_DOWNLOADED':
        console.log(`CV downloaded for job: ${job.id}`);
        break;

      case 'UNDER_EVALUATION':
        console.log(`Job under evaluation: ${job.id}`);
        break;

      case 'PROCESSING_INTERVIEW':
        console.log(`Processing interview for job: ${job.id}`);
        break;

      case 'INTERVIEW_DONE':
        console.log(`Interview completed for job: ${job.id}`);
        break;

      case 'HIRING_IN_PROCESS':
        console.log(`Hiring in process for job: ${job.id}`);
        break;

      case 'DOCUMENT_REQUESTED':
        console.log(`Document requested for job: ${job.id}`);
        break;

      case 'DOCUMENT_REVISION_REQUESTED':
          setShowDocumentUploadModal(true);
          console.log(`Submit document for job ID: ${job.id}`);
          if (job.requestedDocumentDetails && job.requestedDocumentDetails.length > 0) {
              console.log(job)
              setRequestedDocumentsList(job)
          }
        break;

      case 'DOCUMENT_ADDITIONAL_REQUESTED':
            setShowDocumentUploadModal(true);
            console.log(`Submit document for job ID: ${job.id}`);
            if (job.requestedDocumentDetails && job.requestedDocumentDetails.length > 0) {
                console.log(job)
                setRequestedDocumentsList(job)
            }
        break;
        
      default:
        console.warn(`Unhandled action type: ${type}`);
        break;
    }
  } catch (error) {
    console.error(`Error processing action ${type}:`, error);
  } 
  finally {
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
    const statusConfigs: Record<JobApplicationStatusType, { bg: string, text: string, label: string }> = {
    APPLIED: { bg: "bg-blue-100", text: "text-blue-500", label: "Applied" },
    CV_DOWNLOADED: { bg: "bg-blue-100", text: "text-blue-500", label: "CV downloaded" },
    UNDER_EVALUATION: { bg: "bg-blue-100", text: "text-blue-500", label: "Under evaluation" },
    PROCESSING_INTERVIEW: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview Process" },
    INTERVIEW_DONE: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview done" },
    HIRING_IN_PROCESS: { bg: "bg-blue-100", text: "text-blue-500", label: "Hiring in process" },
    DOCUMENT_REQUESTED: { bg: "bg-red-100", text: "text-red-500", label: "Document requested" },
    DOCUMENT_ADDITIONAL_REQUESTED: { bg: "bg-red-100", text: "text-red-500", label: "Additional document requested" },
    DOCUMENT_REVISION_REQUESTED: { bg: "bg-red-100", text: "text-red-500", label: "Revision document requested" },
    DOCUMENT_SUBMITTED: { bg: "bg-blue-100", text: "text-blue-500", label: "Document submitted" },
    DOCUMENT_REVISION_REQUEST_SUBMITTED: { bg: "bg-purple-100", text: "text-purple-500", label: "Revision document submission" },
    DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED: { bg: "bg-orange-100", text: "text-orange-500", label: "Revision document requested" },
    OFFER_SENT: {bg: "bg-yellow-100", text: "text-yellow-600", label: "Offer letter received" },
    REVISED_OFFER_SENT:{ bg: "bg-yellow-100", text: "text-yellow-600", label: "Revised letter received" },
    REVISED_LETTER: { bg: "bg-yellow-100", text: "text-yellow-600", label: "Revised letter received" },
    HIRED: { bg: "bg-green-100", text: "text-green-500", label: "Hired" },
    JOINED: { bg: "bg-green-100", text: "text-green-500", label: "Joined" },
    OFFER_ACCEPTED: { bg: "bg-green-100", text: "text-green-500", label: "Offer accepted/Hired" },
    REJECTED: { bg: "bg-red-400", text: "text-white", label: "Rejected" },
    ON_HOLD: { bg: "bg-red-400", text: "text-white", label: "On hold" },
    DOCUMENT_VERIFIED: { bg: "bg-blue-100", text: "text-blue-500", label: "Document verified" },
    OFFER_ISSUE_RAISED: { bg: "bg-blue-100", text: "text-blue-500", label: "Offer issue Raised" },
    };
    
    const config = statusConfigs[status] || statusConfigs.UNDER_EVALUATION;
    
  return (
    <div
      className={`rounded-full ${config.bg} px-3 py-2 flex items-center justify-center ${config.text} text-center whitespace-normal break-words max-w-[160px]`}
    >
      <div className="tracking-wide leading-snug text-sm">{config.label}</div>
    </div>
  );
});

  const ActionButton = memo(({ type, job }: { type: string, job: JobApplicationDetailsDto }) => {
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
      },
      ADDITIONAL_DOCUMENT_REQUESTED: {
        color: "bg-yellow-400",
        icon: null,
        label: "Submit additional document"
      },
      REVISION_DOCUMENT_SUBMISSION: {
        color: "bg-orange-400",
        icon: null,
        label: "Submit revision document"
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
      label: "Job Title",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => (
        <span className="font-semibold capitalize">{row.jobTitle}</span>
      )
    },
    {
      key: "companyName",
      label: "Company",
      sortable: true
    },
    {
      key: "createdAt",
      label: "Apply Date",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      key: "matchingScore",
      label: "Matching Score",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => <MatchingScoreCircle score={row.matchingScore} />
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => <StatusBadge status={row.status} />
    },
    {
      key: "action",
      label: "Action",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => row.action ? 
        <ActionButton type={row.action} job={row} /> : null
    },
    {
      key: "followUp",
      label: "Follow up",
      render: () => (
        <button className="w-14 h-11 rounded-xl bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6] flex items-center justify-center">
          <img src={askQuestion} alt="Ask question" />
        </button>
      )
    },
    {
      key: "jobType",
      label: "Job Type",
      sortable: true,
      render: (row: JobApplicationDetailsDto) => <StatusBadge status={row.jobType} />
    }
  ];

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    onPageSizeChange(newPageSize);
  };

  const sortData = (data: JobApplicationDetailsDto[], field: string): JobApplicationDetailsDto[] => {
    if (!field) return data;
    
    return [...data].sort((a: any, b: any) => {
      let aValue = a[field];
      let bValue = b[field];
      
      // Special handling for dates
      if (field === "createdAt") {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      
      // Special handling for numbers
      if (field === "matchingScore") {
        aValue = Number(aValue);
        bValue = Number(bValue);
      }
      
      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  };

  // Modify your handleSortChange function
  const handleSortChange = (columnKey: string) => {
    if (sortField === columnKey) {
      // Toggle sort order if clicking the same column
      setSortOrder(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(columnKey);
      setSortOrder("asc");
    }
  };

  // Add sorted data calculation
  const sortedData = useMemo(() => {
    return sortData(jobs, sortField);
  }, [jobs, sortField, sortOrder]);

  const renderExpandedDetails = (row: JobApplicationDetailsDto) => {
    if (row.statusTracker && row.statusTracker.length > 0) {
      return <Stepper statusTracker={row.statusTracker[row.statusTracker.length-1]} />;
    }
    return row.applicationSteps ? <Stepper steps={row.applicationSteps} /> : null;
  };

  const toggleExpand = (id: string) => {
  setExpandedRows(prev => 
    prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
  );
};

  return (
    <div className="w-full font-poppins">
      <div className="bg-white shadow-md h-full rounded-xl overflow-hidden">
        <DynamicTable
          columns={columns}
          rows={sortedData}
          pageSize={pageSize}
          setPageSize={handlePageSizeChange}
          handlePreviousPage={() => onPageChange(currentPage - 1)}
          handleNextPage={() => onPageChange(currentPage + 1)}
          hasPrevPage={currentPage > 1}
          hasNextPage={pagination?.count > currentPage * pageSize}
          renderExpandedDetails={renderExpandedDetails}
          enableSelect={false}
          emptyStateMessage="No job applications found"
          emptyStateSubMessage="Try adjusting your search filters"
          onSortChange={handleSortChange}
          sortField={sortField}
          sortOrder={sortOrder}
          expandedRows={expandedRows} 
          toggleExpand={toggleExpand} 
        />
      </div>

      <RejectionFeedbackModal 
        show={showFeedbackModal} 
        feedbackContent={feedbackContent} 
        onClose={() => setShowFeedbackModal(false)} 
      />

      <SubmitDocumentModal
        show={showDocumentUploadModal}
        documents={requestedDocumentsList}
        onClose={() => setShowDocumentUploadModal(false)}
        onSubmit={handleSubmitDocs}
        userID={user?.sub ?? ""}
        jobId={processingJobId ?? ""}
      />

      {showCheckAcceptModal && currentJobForCheckAccept && (
      <CheckAcceptModal
        userDetails={user}
        job={currentJobForCheckAccept}
        onClose={() => setShowCheckAcceptModal(false)}
        onConfirm={async () => {
          if (!user?.email || !currentJobForCheckAccept) return;
          const result = await JobService.acceptOffer(currentJobForCheckAccept.id, user.email);
          if (result.response) {
            onRefresh();
          }
          setShowCheckAcceptModal(false);
        }}
      />
    )}

    <JoinedModal
      userDetails={user}
      job={currentJobForCheckAccept}
      isOpen={showJoinedModal}
      onClose={() => setShowJoinedModal(false)}
      // onSubmit={(data) => {
      //   console.log("Form data:", data);
      //   // call JobService.markAsJoined(job.id, user.email, data)
      // }}
    />
    </div>
  );
});

JobsTable.displayName = 'JobsTable';

export default JobsTable;



// import { memo, useState, useCallback } from 'react';
// import { JobApiResponse, JobApplicationDetailsDto, PaginationInfo } from './JobApplicationDetailsDto';
// import { Check } from 'lucide-react';
// import Table from '../../SharedComponents/Table';
// import Stepper from './Stepper';
// import { viewFeedback, iHaveJoined, checkAndAccept, askQuestion } from '@Assets';
// import RejectionFeedbackModal from './modals/RejectionFeedbackModal';
// import SubmitDocumentModal from './modals/SubmitDocumentModal';
// import JobService from '../../Service/JobsService';
// import { useDashboardContext } from '@Context/Dashboard.context';
// interface JobsTableProps {
//   data: JobApiResponse | null;
//   pagination: PaginationInfo;
//   currentPage: number;
//   onPageChange: (page: number) => void;
//   onPageSizeChange: (pageSize: number) => void;
//   onRefresh: () => void;
// }

// const JobsTable = memo(({ 
//   data, 
//   pagination,
//   currentPage,
//   onPageChange,
//   onPageSizeChange,
//   onRefresh
// }: JobsTableProps) => {
//   const [showFeedbackModal, setShowFeedbackModal] = useState(false);
//   const [feedbackContent, setFeedbackContent] = useState<string>("");
//   const [processingJobId, setProcessingJobId] = useState<string | null>(null);
//   const [showDocumentUploadModal, setShowDocumentUploadModal] = useState(false);
//   // Get user from dashboard context
//   const { user } = useDashboardContext();

//   // Map the status to action for the specific cases
//   const getActionFromStatus = (status: string): string | null => {
//     switch (status) {
//       case 'REJECTED':
//         return 'VIEW_FEEDBACK';
//       case 'PROCESSING_INTERVIEW':
//       case 'UNDER_EVALUATION':
//         return 'HIRED';
//       case 'DOCUMENT_REQUESTED':
//         return 'SUBMIT_DOCUMENT';
//       case 'INTERVIEW_DONE':
//         return 'CHECK_ACCEPT';
//       case 'HIRED':
//         return 'JOINED';
//       default:
//         return null;
//     }
//   };

//   // Process data to add actions based on status
//   const processedJobs = data?.data?.map(job => ({
//     ...job,
//     action: job.action || getActionFromStatus(job.status)
//   }));


// const jobs = processedJobs || [];

// // fake dummy fields for upload
// const requestedDocumentNamesDummy = [
//   "Adhaar Card",
//   "PAN Card",
//   "Birth Certificate",
//   "Graduation Certificate",
// ];

//   // Function to handle opening the feedback modal
//   const handleViewFeedback = useCallback((job: JobApplicationDetailsDto) => {
//     if (job.rejectionFeedbackBySystem) {
//       setFeedbackContent(job.rejectionFeedbackBySystem);
//       setShowFeedbackModal(true);
//     }
//   }, []);
  
//   const handleSubmitDocs = (submittedFiles: Record<string, File | null>) => {
//   console.log("Submitted files:", submittedFiles);
//     // TODO: handle file upload
//   };
//   // Function to handle action button clicks (old function)
//   // const handleActionClick = useCallback(async (type: string, job: JobApplicationDetailsDto) => {
//   //   if (!user?.email) return;
    
//   //   setProcessingJobId(job.id);
    
//   //   try {
//   //     let result;
      
//   //     switch (type) {
//   //       case 'VIEW_FEEDBACK':
//   //         handleViewFeedback(job);
//   //         break;
          
//   //       case 'CHECK_ACCEPT':
//   //         result = await JobService.acceptOffer(job.id, user.email);
//   //         if (result.response) {
//   //           onRefresh();
//   //         }
//   //         break;
          
//   //       case 'JOINED':
//   //         result = await JobService.markAsJoined(job.id, user.email);
//   //         if (result.response) {
//   //           onRefresh();
//   //         }
//   //         break;
          
//   //       // Add other action handlers as needed
//   //     }
//   //   } catch (error) {
//   //     console.error(`Error processing action ${type}:`, error);
//   //   } finally {
//   //     setProcessingJobId(null);
//   //   }
//   // }, [handleViewFeedback, onRefresh, user?.email]);

//   const handleActionClick = useCallback(async (type: string, job: JobApplicationDetailsDto) => {
//   if (!user?.email) return;

//   setProcessingJobId(job.id);

//   try {
//     let result;

//     switch (type) {
//       case 'VIEW_FEEDBACK':
//         handleViewFeedback(job);
//         console.log(job)
//         break;

//       case 'CHECK_ACCEPT':
//         result = await JobService.acceptOffer(job.id, user.email);
//         console.log(result)
//         if (result.response) {
//           onRefresh();
//         }
//         break;

//       case 'JOINED':
//         result = await JobService.markAsJoined(job.id, user.email);
//         if (result.response) {
//           onRefresh();
//         }
//         break;

//       case 'SUBMIT_DOCUMENT':
//         // Assuming you have a modal or a separate flow for document submission
//         // Example: openDocumentSubmissionModal(job.id);
//         setShowDocumentUploadModal(true);
//         console.log(`Submit document for job ID: ${job.id}`);
//         // TODO: Add actual document submission logic here
//         break;

//       case 'APPLIED':
//         // You might not need an action here, but logging for completeness
//         console.log(`Already applied for job: ${job.id}`);
//         break;

//       case 'CV_DOWNLOADED':
//         console.log(`CV downloaded for job: ${job.id}`);
//         break;

//       case 'UNDER_EVALUATION':
//         console.log(`Job under evaluation: ${job.id}`);
//         break;

//       case 'PROCESSING_INTERVIEW':
//         console.log(`Processing interview for job: ${job.id}`);
//         break;

//       case 'INTERVIEW_DONE':
//         console.log(`Interview completed for job: ${job.id}`);
//         break;

//       case 'HIRING_IN_PROCESS':
//         console.log(`Hiring in process for job: ${job.id}`);
//         break;

//       case 'DOCUMENT_REQUESTED':
//         // This is usually mapped to SUBMIT_DOCUMENT already, so could call the same logic
//         console.log(`Document requested for job: ${job.id}`);
//         // Optionally forward to SUBMIT_DOCUMENT
//         break;

//       default:
//         console.warn(`Unhandled action type: ${type}`);
//         break;
//     }
//   } catch (error) {
//     console.error(`Error processing action ${type}:`, error);
//   } finally {
//     setProcessingJobId(null);
//   }
// }, [handleViewFeedback, onRefresh, user?.email]);


//   const MatchingScoreCircle = memo(({ score }: { score: number }) => (
//     <div className="w-20 flex mb-2 flex-col items-center justify-center gap-px text-base text-green-500">
//       <div className="w-16 relative h-16 cursor-pointer flex items-center justify-center">
//         <svg className="absolute scale-[80%]" width="65" height="65" viewBox="0 0 65 65">
//           <circle cx="32.5" cy="32.5" r="30" fill="none" stroke="#eee" strokeWidth="5" />
//           <circle 
//             cx="32.5" 
//             cy="32.5" 
//             r="30" 
//             fill="none" 
//             stroke="#4cbc9a" 
//             strokeWidth="5"
//             strokeDasharray={`${(score / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
//             transform="rotate(-90 32.5 32.5)"
//           />
//         </svg>
//         <div className="absolute font-semibold text-xs">{score}%</div>
//       </div>
//       <span className="absolute top-14 pt-1 text-[9px] font-semibold text-gray-500 text-center">View details</span>
//     </div>
//   ));

//   const StatusBadge = memo(({ status }: { status: string }) => {
//     const statusConfigs: Record<string, { bg: string, text: string, label: string }> = {
//     APPLIED: { bg: "bg-blue-100", text: "text-blue-500", label: "Applied" },
//     CV_DOWNLOADED: { bg: "bg-blue-100", text: "text-blue-500", label: "CV downloaded" },
//     UNDER_EVALUATION: { bg: "bg-blue-100", text: "text-blue-500", label: "Under evaluation" },
//     PROCESSING_INTERVIEW: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview Process" },
//     INTERVIEW_DONE: { bg: "bg-blue-100", text: "text-blue-500", label: "Interview done" },
//     HIRING_IN_PROCESS: { bg: "bg-yellow-100", text: "text-yellow-600", label: "Hiring in process" },
//     DOCUMENT_REQUESTED: { bg: "bg-red-100", text: "text-red-500", label: "Document requested" },
//     ADDITIONAL_DOCUMENT_REQUESTED: { bg: "bg-orange-100", text: "text-orange-500", label: "Additional document requested" },
//     REVISION_DOCUMENT_SUBMISSION: { bg: "bg-purple-100", text: "text-purple-500", label: "Revision document submission" },
//     DOCUMENT_SUBMITTED: { bg: "bg-blue-100", text: "text-blue-500", label: "Document submitted" },
//     OFFER_LETTER: { bg: "bg-blue-100", text: "text-blue-500", label: "Offer letter received" },
//     REVISED_LETTER: { bg: "bg-red-100", text: "text-red-500", label: "Revised letter received" },
//     HIRED: { bg: "bg-green-100", text: "text-green-500", label: "Hired" },
//     JOINED: { bg: "bg-green-100", text: "text-green-500", label: "Joined" },
//     OFFER_ACCEPTED: { bg: "bg-green-100", text: "text-green-500", label: "Offer accepted/Hired" },
//     REJECTED: { bg: "bg-red-400", text: "text-white", label: "Rejected" },
//     };
    
//     const config = statusConfigs[status] || statusConfigs.UNDER_EVALUATION;
    
//     return (
//       <div className={`rounded-full ${config.bg} w-40 h-10 flex items-center justify-center py-2 px-0 ${config.text}`}>
//         <div className="tracking-wide leading-normal">{config.label}</div>
//       </div>
//     );
//   });

//   const ActionButton = memo(({ type, job }: { type: string, job: JobApplicationDetailsDto }) => {
//     const isProcessing = processingJobId === job.id;
    
//     const actionConfigs: Record<string, { color: string, icon: JSX.Element | null, label: string }> = {
//       HIRED: {
//         color: "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]",
//         icon: <Check strokeWidth={3.25} className="w-5 h-5 mr-1" />,
//         label: "I am hired"
//       },
//       JOINED: {
//         color: "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]",
//         icon: <img src={iHaveJoined} alt="I have joined" />,
//         label: "I have joined"
//       },
//       SUBMIT_DOCUMENT: {
//         color: "bg-blue-400",
//         icon: null,
//         label: "Submit document"
//       },
//       CHECK_ACCEPT: {
//         color: "bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30",
//         icon: <img src={checkAndAccept} alt="Check & accept" />,
//         label: "Check & accept"
//       },
//       VIEW_FEEDBACK: {
//         color: "bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30",
//         icon: <img src={viewFeedback} alt="View feedback" />,
//         label: "View feedback"
//       },
//       ADDITIONAL_DOCUMENT_REQUESTED: {
//         color: "bg-yellow-400",
//         icon: null,
//         label: "Submit additional document"
//       },
//       REVISION_DOCUMENT_SUBMISSION: {
//         color: "bg-orange-400",
//         icon: null,
//         label: "Submit revision document"
//       }
//     };
    
//     const config = actionConfigs[type];
//     if (!config) return null;
    
//     return (
//       <button 
//         className={`w-36 rounded-xl ${config.color} h-11 flex items-center justify-center py-2 px-4 gap-0.5 text-white ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
//         onClick={() => !isProcessing && handleActionClick(type, job)}
//         disabled={isProcessing}
//       >
//         {isProcessing ? (
//           <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
//         ) : config.icon}
//         <div className="leading-normal font-semibold">{isProcessing ? 'Processing...' : config.label}</div>
//       </button>
//     );
//   });
  
//   // Define columns for the table
//   const columns = [
//     {
//       key: "jobTitle",
//       header: "Job Title",
//       sortable: true,
//       className: "font-semibold capitalize"
//     },
//     {
//       key: "companyName",
//       sortable: true,
//       header: "Company",
//     },
//     {
//       key: "createdAt",
//       header: "Apply Date",
//       sortable: true,
//       render: (value: string) => new Date(value).toLocaleDateString()
//     },
//     {
//       key: "matchingScore",
//       header: "Matching Score",
//       sortable: true,
//       render: (value: any) => <MatchingScoreCircle score={value} />
//     },
//     {
//       key: "status",
//       header: "Status",
//       sortable: true,
//       render: (value: any) => <StatusBadge status={value} />
//     },
//     {
//       key: "action",
//       header: "Action",
//       sortable: true,
//       render: (value: any, item: JobApplicationDetailsDto) => value ? <ActionButton type={value} job={item} /> : null
//     },
//     {
//       key: "followUp",
//       header: "Follow up",
//       render: () => (
//         <button className="w-14 h-11 rounded-xl bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6] flex items-center justify-center">
//           <img src={askQuestion} alt="Ask question" />
//         </button>
//       )
//     },    
//     {
//       key: "jobType",
//       header: "Job Type",
//       sortable: true,
//       render: (value: any) => <StatusBadge status={value} />
//     },
//   ];

//   return (
//     <div className="w-full font-poppins">
//       <div className="bg-white shadow-md h-full rounded-xl p-4 overflow-hidden">
//         <Table
//           data={jobs}
//           columns={columns}
//           keyExtractor={(item) => item.id}
//           rowClassName={() => "relative rounded-xl border-b text-sm hover:bg-gray-50"}
//           headerClassName="bg-cyan-50 text-nowrap text-sm px-4 mb-2"
//           expandableContent={item => {
//             if (item.statusTracker && item.statusTracker.length > 0) {
//               return <Stepper statusTracker={item.statusTracker[item.statusTracker.length-1]} />;
//             }
//             return item.applicationSteps ? <Stepper steps={item.applicationSteps} /> : null;
//           }}
//           pagination={pagination}
//           onPageChange={onPageChange}
//           onPageSizeChange={onPageSizeChange}
//           currentPage={currentPage}
//           emptyStateComponent={
//             <div className="w-full p-12 flex flex-col items-center justify-center">
//               <div className="text-gray-400 text-6xl mb-4">📋</div>
//               <h3 className="text-lg font-semibold text-gray-700">No job applications found</h3>
//               <p className="text-gray-500 mt-2">Try adjusting your search filters</p>
//             </div>
//           }
//         />
//       </div>
//       <RejectionFeedbackModal 
//         show={showFeedbackModal} 
//         feedbackContent={feedbackContent} 
//         onClose={() => setShowFeedbackModal(false)} 
//       />
//       <SubmitDocumentModal
//       show={showDocumentUploadModal}
//       documents={requestedDocumentNamesDummy}
//       onClose={() => setShowDocumentUploadModal(false)}
//       onSubmit={handleSubmitDocs}
//     />
//     </div>
//   );
// });

// JobsTable.displayName = 'JobsTable';

// export default JobsTable;