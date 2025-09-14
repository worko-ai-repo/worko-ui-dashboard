import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Modal from '@Components/Shared/Modal'; 
import FeedbackModal from './Feedback Modal/FeedbackModal';
import { EvaluationRequest, EvaluationDetails, CandidateDetails, EvaluationRequestDetails, ApplicationDetails } from 'src/types';
import { fetchEvaluationRequests, fetchEvaluationDetails, fetchCandidateDetails, fetchApplicationDetails, getEvaluationResponse, EvaluationResponse } from '../../../src/services/EvaluationService.service';
import { useSearchParams } from 'react-router-dom';
import ViewFeedbackModal from './ViewFeedbackModal';
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
// This is the inner view rendered for a given jobId + jobApplicationId
const EvaluatorView: React.FC = () => {
  const [searchParams] = useSearchParams();
  // const evaluatorEmail = searchParams.get('evaluatorEmail') || '';
  const jobApplicationId = searchParams.get('jobApplicationId') || '';
  const evaluationRequestId = searchParams.get('evaluationRequestId') || '';
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('1');

  // console.log(jobApplicationId,evaluationRequestId)
  // Modal states

  const [details, setDetails] = useState<EvaluationDetails | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [requests, setRequests] = useState<EvaluationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EvaluationRequest | null>(null);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<CandidateDetails | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  // const [evaluatorEmail, setevaluatorEmail] = useState<string>();

  //View Feedback Modal states
  const [viewFeedbackData, setViewFeedbackData] = useState<EvaluationResponse | null>(null);
  const [isViewFeedbackOpen, setIsViewFeedbackOpen] = useState(false);
  const [isLoadingData,setIsLoadingData] = useState<boolean>(false)
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  //View CV state

  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);

  const getEvaluationDetails = async () => {
      try {
        const details = await fetchEvaluationDetails(jobApplicationId,evaluationRequestId);
        return details.evaluatorDetails.email
      } catch (err) {
        console.error('Error fetching evaluation details:', err);
      } 
    }

  const { data: evaluatorEmail, isLoading, error } = useQuery<any>({
    queryKey: ["evaluations", jobApplicationId, evaluationRequestId],
    queryFn: getEvaluationDetails,
    enabled: !!jobApplicationId && !!evaluationRequestId,
  });

  const handleSubmitFeedback = () => {
    const candidate = requests.find(c => c.id === selectedRequest?.id);
    // setSelectedCandidate({
    //   id: selectedRequest?.id,
    //   name: candidate?.applicantUserEmail || ""
    // });
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    // setSelectedCandidate(null);
  };

  const handleFeedbackComplete = (data: any) => {
    // console.log('Feedback completed:', data);
    refreshRequests(); // Re-fetch updated list
    // Handle the complete feedback data here
    // You can add API calls or state updates here
  };

  const handleViewCV = () => {
    console.log('Viewing CV for candidate:', selectedCandidateId);
    setIsViewCVModalOpen(true);
  };


  const handleViewFeedback = async () => {
    if (!selectedRequest?.evaluationResponseId) return;
    
    try {
      const feedback = await getEvaluationResponse(
        selectedRequest.jobApplicationId,
        selectedRequest.evaluationResponseId
      );
      console.log(feedback.status)
      setViewFeedbackData(feedback);
      setIsViewFeedbackOpen(true);
    } catch (err) {
      toast.error("Failed to fetch feedback");
      console.error(err);
    }
  };


  const handleViewVideo = () => {
    console.log('Viewing video for candidate:', selectedCandidateId);
  };


const refreshRequests = useCallback(async () => {
  setIsLoadingData(true)
  try {
    if (!evaluatorEmail) return;
    const rawData = await fetchEvaluationRequests(evaluatorEmail);
    const filteredRequests: typeof rawData = [];
    for (const request of rawData) {
      if (!request.evaluationResponseId || !request.jobApplicationId) {
        filteredRequests.push(request);
        continue;
      }
      try {
        const feedback = await getEvaluationResponse(
          request.jobApplicationId,
          request.evaluationResponseId
        );
        const status = feedback?.status;
        // Exclude only ON_HOLD or REJECTED
        if (status !== "ON_HOLD" && status !== "REJECTED") {
          filteredRequests.push(request);
        }
      } catch (err) {
        console.error(`Failed to fetch feedback for request ID ${request.id}`, err);
        filteredRequests.push(request);
      }
    }

    setRequests(filteredRequests);

    if (filteredRequests.length > 0) {
      setSelectedRequest(filteredRequests[0]);
    }
    setIsLoadingData(false)
    setHasAttemptedLoad(true);
  } catch (err) {
    console.error("Failed to fetch requests:", err);
  }
}, [evaluatorEmail]);



  // 2. Initial fetch on email load
  useEffect(() => {
    if (!evaluatorEmail) return;
    refreshRequests();
  }, [evaluatorEmail]);

  useEffect(() => {
    if (!evaluatorEmail) return;

    const init = async () => {
      try {
        const data = await fetchEvaluationRequests(evaluatorEmail);
        setRequests(data);
        if (data.length > 0) {
          setSelectedRequest(data[0]);
        }
      } catch (err) {
        console.error('Failed to fetch requests:', err);
      }
    };

    init();
  }, [evaluatorEmail]);

  useEffect(() => {
    if (!selectedRequest) return;

    const fetchDetailsData = async () => {
      try {
        // 1. Fetch Evaluation Details
        const details = await fetchEvaluationDetails(
          selectedRequest.jobApplicationId,
          selectedRequest.id
        );
        setDetails(details);

        // 2. Fetch Candidate Details
        const candidateEmail = selectedRequest.applicantUserEmail;
        if (candidateEmail) {
          const candidate = await fetchCandidateDetails(candidateEmail);
          // console.log(candidate)
          if (candidate.length > 0) {
            setSelectedCandidateDetails(candidate[0]);
          }
        }

        // 3. Fetch Application Details
        const applicationDetails = await fetchApplicationDetails(selectedRequest.jobApplicationId);
        setApplicationDetails(applicationDetails); // <- You'll need this state
      } catch (err) {
        console.error('Failed to fetch details or candidate detail or application detail:', err);
        setDetails(null);
      }
    };

    fetchDetailsData();
  }, [selectedRequest]);



  const handleCandidateSelect = (id: string) => {
    const request = requests.find(r => r.id === id);
    if (request) setSelectedRequest(request);
  };

  return (
    <div className="h-screen bg-gray-100 flex">
      <Sidebar
        candidates={Array.isArray(requests)
          ? requests.map(r => ({
            id: r.id,
            name: r.applicantUserEmail,
            email: r.applicantUserEmail,
            sentTime: new Date(r.createdAt).toLocaleString(),
            isNew: false,
            applicantName: r.applicantName,
          }))
          : []}
        selectedCandidateId={selectedRequest?.id || ''}
        onCandidateSelect={handleCandidateSelect}
        userName={selectedRequest?.evaluatorDetails.name || 'Evaluator'}
        companyLogo=""
      />

      <MainContent
        EvaluationRequestDetails={
          details && selectedCandidateDetails && applicationDetails
            ? {
              id: details.id,
              name: selectedCandidateDetails.name,
              aboutCandidate: selectedCandidateDetails.about,
              role: details.jobTitle,
              recruiterFeedback: details.hrDetailedFeedback,
              overallScore: 0, // Placeholder for now
              workoFeedback: '',
              videoInterview: {
                confidence: 0,
                attitude: 0,
                domainKnowledge: 0,
                commSkills: 0
              },
              profileSentDate: new Date(details.createdAt).toLocaleString(),
              recruiterName: details.hrName,
              matchingScore: applicationDetails.matchingScore ?? 0,
              scoreDetails: (() => {
                const scoreOrRejection =
                  (applicationDetails.matchingScore ?? 0) >= 70
                    ? applicationDetails.scoreDetails
                    : applicationDetails.rejectionFeedbackBySystem;

                try {
                  const parsed = JSON.parse(scoreOrRejection || '[]');
                  return Array.isArray(parsed) ? parsed : scoreOrRejection;
                } catch (err) {
                  return scoreOrRejection;
                }
              })(),
              evaluationResponseId: selectedRequest?.evaluationResponseId,
              email: selectedRequest?.applicantUserEmail ?? '',
            }
            : {
              id: '',
              name: '',
              aboutCandidate: '',
              role: '',
              recruiterFeedback: '',
              overallScore: 0,
              workoFeedback: '',
              videoInterview: {
                confidence: 0,
                attitude: 0,
                domainKnowledge: 0,
                commSkills: 0
              },
              profileSentDate: '',
              recruiterName: '',

              matchingScore: 0,
              scoreDetails: [],
              email: '',
            }
        }
        companyLogo=""
        onSubmitFeedback={handleSubmitFeedback}
        onViewFeedback={handleViewFeedback}
        onViewCV={handleViewCV}
        onViewVideo={handleViewVideo}
        requests = {requests}
        isLoadingData={isLoadingData}
        hasAttemptedLoad={hasAttemptedLoad}
      />

      {/*Feedback Modal*/}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={handleCloseFeedbackModal}
        className="max-w-3xl w-full"
      >
        <FeedbackModal
          onClose={handleCloseFeedbackModal}
          candidateId={selectedCandidateId}
          candidateName={selectedCandidateDetails?.name || 'Candidate'}
          onSubmitComplete={handleFeedbackComplete}
          selectedRequest={selectedRequest}
          selectedCandidateDetails={selectedCandidateDetails}
          applicationDetails={applicationDetails}
        />
      </Modal>

      <Modal isOpen={isViewFeedbackOpen} onClose={() => setIsViewFeedbackOpen(false)} className="max-w-3xl w-full">
        {viewFeedbackData && (
          <ViewFeedbackModal
            onClose={() => setIsViewFeedbackOpen(false)}
            data={viewFeedbackData}
          />
        )}
      </Modal>

      <Modal
        isOpen={isViewCVModalOpen}
        onClose={() => setIsViewCVModalOpen(false)}
        className="w-[90vw] sm:max-w-4xl h-full"
      >
        <div className="w-full h-full flex flex-col gap-4 p-4 bg-white">
    {/* CV Header */}
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-gray-800">CV</h2>
      {/* <button
        onClick={() => setIsViewCVModalOpen(false)}
        className="text-sm font-medium text-red-500 hover:underline"
      >
        Close
      </button> */}
        <button
    onClick={() => window.open(selectedCandidateDetails?.cvAwsS3SignedUrl, '_blank')}
    aria-label="Open CV in new tab"
    title="Open CV in new tab"
    disabled={!selectedCandidateDetails?.cvAwsS3SignedUrl}
    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
  >
          <ExternalLink size={30} className="text-blue-600" />
        </button>
    </div>

    {/* CV Viewer */}
    <div className="flex-1 border-2 border-gray-300 rounded-xl overflow-hidden">
      <iframe
        src={selectedCandidateDetails?.cvAwsS3SignedUrl}
        title="CV Preview"
        className="w-full h-[calc(100vh-100px)]"
        style={{ border: 'none' }}
      />
    </div>
  </div>
</Modal>



    </div>
  );
};

// Main component with routing logic
// const EvaluatorDashboard: React.FC = () => {
//   return (
//     <Routes>
//       {/* Default route: redirect to dummy job and application */}
//       <Route index element={<Navigate to="dummyJob/12345" replace />} />

//       {/* Actual route for jobId and jobApplicationId */}
//       <Route path=":jobId/:jobApplicationId" element={<EvaluatorView />} />

//       {/* Optional: fallback inside this dashboard */}
//       <Route path="*" element={<div className="p-4">Invalid evaluator URL</div>} />
//     </Routes>
//   );
// };

const EvaluatorDashboard: React.FC = () => {
  return <EvaluatorView />;
};

export default EvaluatorDashboard;