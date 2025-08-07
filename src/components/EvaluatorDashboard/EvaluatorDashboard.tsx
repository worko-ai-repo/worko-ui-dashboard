import React, { useState, useEffect } from 'react';
import { Routes, Route, useParams, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import Modal from '@Components/Dashboard/Corporate/Modal';
import FeedbackModal from './Feedback Modal/FeedbackModal';
import { EvaluationRequest, EvaluationDetails, CandidateDetails, EvaluationRequestDetails, ApplicationDetails } from 'src/types';
import { fetchEvaluationRequests, fetchEvaluationDetails, fetchCandidateDetails, fetchApplicationDetails, getEvaluationResponse, EvaluationResponse } from '../../../src/services/EvaluationService.service';
import { useSearchParams } from 'react-router-dom';
import ViewFeedbackModal from './ViewFeedbackModal';

// This is the inner view rendered for a given jobId + jobApplicationId
const EvaluatorView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const evaluatorEmail = searchParams.get('evaluatorEmail') || '';
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('1');

  // Modal states

  const [details, setDetails] = useState<EvaluationDetails | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [requests, setRequests] = useState<EvaluationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EvaluationRequest | null>(null);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<CandidateDetails | null>(null);
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);

  //View Feedback Modal states
  const [viewFeedbackData, setViewFeedbackData] = useState<EvaluationResponse | null>(null);
  const [isViewFeedbackOpen, setIsViewFeedbackOpen] = useState(false);

  //View CV state

  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);



  // Dummy candidate list
  // const candidates: Candidate[] = [
  //   {
  //     id: '1',
  //     name: 'Avijit Dutta Gupta',
  //     fileName: 'Avijitduttagupta cv.pdf',
  //     sentTime: 'Sent about 24 mins ago',
  //     isNew: true
  //   },
  //   {
  //     id: '2',
  //     name: 'John Smith',
  //     fileName: 'JohnSmith cv.pdf',
  //     sentTime: 'Sent about 1 hour ago',
  //     isNew: false
  //   },
  //   {
  //     id: '3',
  //     name: 'Sarah Johnson',
  //     fileName: 'SarahJohnson cv.pdf',
  //     sentTime: 'Sent about 2 hours ago',
  //     isNew: false
  //   }
  // ];

  // const candidateDetails: CandidateDetails = {
  //   id: selectedCandidateId,
  //   name: 'Avijit Dutta Gupta',
  //   role: 'Associate UX Designer',
  //   description:
  //     'Experienced UX designer with a passion for creating intuitive and user-centered digital experiences...',
  //   overallScore: 85,
  //   workoFeedback: 'Strong candidate with excellent design thinking skills...',
  //   videoInterview: {
  //     confidence: 71,
  //     attitude: 60,
  //     domainKnowledge: 86,
  //     commSkills: 70
  //   },
  //   profileSentDate: '12/02/2025 at 7:30AM',
  //   recruiterName: 'Avijit Dutta Gupta'
  // };

  // const handleCandidateSelect = (candidateId: string) => {
  //   setSelectedCandidateId(candidateId);
  // };

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
      setViewFeedbackData(feedback);
      setIsViewFeedbackOpen(true);
    } catch (err) {
      alert("Failed to fetch feedback");
      console.error(err);
    }
  };


  const handleViewVideo = () => {
    console.log('Viewing video for candidate:', selectedCandidateId);
  };

  // 1. Declare once
  const refreshRequests = async () => {
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

  // 2. Initial fetch on email load
  useEffect(() => {
    if (!evaluatorEmail) return;
    refreshRequests();
  }, [evaluatorEmail]);

  // useEffect(() => {
  //   if (!evaluatorEmail) return;

  //   const init = async () => {
  //     try {
  //       const data = await fetchEvaluationRequests(evaluatorEmail);
  //       setRequests(data);
  //       if (data.length > 0) {
  //         setSelectedRequest(data[0]);
  //       }
  //     } catch (err) {
  //       console.error('Failed to fetch requests:', err);
  //     }
  //   };

  //   init();
  // }, [evaluatorEmail]);

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
          console.log(candidate)
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
        fullHeight
      >
        <div className="w-full h-full flex flex-col gap-4 p-4">
          {/* CV Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-800">CV</h2>
            <button
              onClick={() => setIsViewCVModalOpen(false)}
              className="text-sm font-medium text-red-500 hover:underline"
            >
              Close
            </button>
          </div>

          {/* CV Viewer */}
          <div className="flex-1 border-2 border-gray-300 rounded-xl overflow-hidden">
            <iframe
              src={selectedCandidateDetails?.cvAwsS3SignedUrl}
              title="CV Preview"
              className="w-full h-full"
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