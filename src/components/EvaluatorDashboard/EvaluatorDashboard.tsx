import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Routes, Route, useParams, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import MainContent from "./MainContent";
import Modal from "@Components/Shared/Modal";
import FeedbackModal from "./Feedback Modal/FeedbackModal";
import {
  EvaluationRequest,
  EvaluationDetails,
  CandidateDetails,
  EvaluationRequestDetails,
  ApplicationDetails,
} from "src/types";
import {
  fetchEvaluationRequests,
  fetchEvaluationDetails,
  fetchCandidateDetails,
  fetchApplicationDetails,
  getEvaluationResponse,
  EvaluationResponse,
  fetchCandidateSocial,
} from "../../../src/services/EvaluationService.service";
import { useSearchParams } from "react-router-dom";
import ViewFeedbackModal from "./ViewFeedbackModal";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import InterviewDetailedViewModal from "@Components/Modals/SharedModals/Interview/InterviewDetailedViewModal";
import httpServiceObj from "@Services/ApiHandler.service";
import interviewServiceObj from "@Services/Interview.service";
import { getLatestInterviewData } from "@Components/Dashboard/WorkoAdmin/Applicants/ApplicantsTable";
import { request } from "http";
import GoogleIntegration from "@Components/Dashboard/WorkoAdmin/GoogleIntegration/GoogleIntegration";
// This is the inner view rendered for a given jobId + jobApplicationId
const EvaluatorView: React.FC = () => {
  const [searchParams] = useSearchParams();
  // const evaluatorEmail = searchParams.get('evaluatorEmail') || '';
  const jobApplicationId = searchParams.get("jobApplicationId") || "";
  const evaluationRequestId = searchParams.get("evaluationRequestId") || "";
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("1");

  // console.log(jobApplicationId,evaluationRequestId)
  // Modal states

  const [details, setDetails] = useState<EvaluationDetails | null>(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const [requests, setRequests] = useState<EvaluationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<EvaluationRequest | null>(null);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<CandidateDetails | null>(
    null
  );
  const [applicationDetails, setApplicationDetails] = useState<ApplicationDetails | null>(null);
  // const [evaluatorEmail, setevaluatorEmail] = useState<string>();

  //View Feedback Modal states
  const [viewFeedbackData, setViewFeedbackData] = useState<EvaluationResponse | null>(null);
  const [isViewFeedbackOpen, setIsViewFeedbackOpen] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [interviewDetailviewModal, setInterviewDetailviewModal] = useState<{
    isOpen: boolean;
    interviewDetails: InterviewDto;
    userName: string;
  }>({
    isOpen: false,
    interviewDetails: {} as InterviewDto,
    userName: "",
  });
  //View CV state

  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [cvLink, setCVLink] = useState<string>("");
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>("");
  const [companyCandidates, setCompanyCandidates] = useState<any[]>([]);
  const selectedRequestRef = useRef<any>(null);
  const selectedCandidateDetailsRef = useRef<any>(null);
  const isHydratingFromGroupRef = useRef(false);
  const [idToFetchInterviews, setidToFetchInterviews] = useState<string[]>([]);
  const [jobApplicationIdFromChild, setJobApplicationIdFromChild] = useState("");

  const [interviewModal, setInterviewModal] = useState<{
    isOpen: boolean;
    data: any;
    candidateName: string;
  }>({
    isOpen: false,
    data: null,
    candidateName: "",
  });
  const [activeSection, setActiveSection] = useState<"roles" | "interviews" | "calendar">("roles");

  const getEvaluationDetails = async () => {
    try {
      const details = await fetchEvaluationDetails(jobApplicationId, evaluationRequestId);
      return details.evaluatorDetails.email;
    } catch (err) {
      console.error("Error fetching evaluation details:", err);
    }
  };

  const {
    data: evaluatorEmail,
    isLoading,
    error,
  } = useQuery<any>({
    queryKey: ["evaluations", jobApplicationId, evaluationRequestId],
    queryFn: getEvaluationDetails,
    enabled: !!jobApplicationId && !!evaluationRequestId,
    refetchOnWindowFocus: false,
  });

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
    // setSelectedCandidate(null);
  };

  const handleFeedbackComplete = (data: any) => {
    // Only remove request for REJECT or ON_HOLD
    // For INTERVIEW_SCHEDULED, keep it in the list (it's just scheduled, not complete)
    const shouldRemove = data.status === "reject" || data.status === "hold";

    if (!shouldRemove) {
      // For INTERVIEW_SCHEDULED, just close modal and keep evaluation in list
      // (the onLocalUpdate in FeedbackModal already updated the status)
      return;
    }

    // Remove the submitted request from the list (for REJECT/ON_HOLD only)
    const updatedRequests = requests.filter((req) => req.id !== selectedRequest?.id);
    setRequests(updatedRequests);

    // Update companyCandidates to reflect the removal
    setCompanyCandidates((prev) => prev.filter((item) => item.request.id !== selectedRequest?.id));

    // Check if current group is now empty
    const remainingInGroup = updatedRequests.filter((r) => r.companyId === selectedCompanyId);

    if (remainingInGroup.length === 0) {
      // Group is empty, switch to another group
      const remainingCompanies = Array.from(new Set(updatedRequests.map((r) => r.companyId)));

      if (remainingCompanies.length > 0) {
        // Find next available group: prefer next, fallback to previous
        const currentIndex = remainingCompanies.indexOf(selectedCompanyId);
        const nextCompanyId =
          remainingCompanies[currentIndex + 1] || remainingCompanies[currentIndex - 1];

        if (nextCompanyId) {
          handleCompanySelect(nextCompanyId);
        } else {
          // No other group available
          setSelectedCompanyId("");
          setCompanyCandidates([]);
        }
      } else {
        // No more groups at all, clear everything
        setSelectedCompanyId("");
        setCompanyCandidates([]);
      }
    }
  };

  // const handleSubmitFeedback = () => {
  //   const candidate = requests.find((c) => c.id === selectedRequest?.id);
  //   // setSelectedCandidate({
  //   //   id: selectedRequest?.id,
  //   //   name: candidate?.applicantUserEmail || ""
  //   // });
  //   setIsFeedbackModalOpen(true);
  // };

  // const handleViewCV = async() => {
  //   // console.log(selectedCandidateDetails?.cvAwsS3ResourceType);
  //   if(selectedCandidateDetails?.cvAwsS3SignedUrl){
  //     setCVLink(selectedCandidateDetails?.cvAwsS3SignedUrl)
  //   }else if(selectedCandidateDetails?.cvAwsS3ResourceType){
  //     if(selectedCandidateDetails?.cvAwsS3ResourceType === "USER_RESUME"){
  //       if(!selectedCandidateDetails?.userDetailId
  //         || !selectedCandidateDetails?.cvAwsS3FileName
  //       ){
  //         toast.error("Missing details",getToastOptions({}))
  //         return
  //       }
  //       try {
  //         const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(`/file/${selectedCandidateDetails?.id}/${selectedCandidateDetails?.cvAwsS3FileName}/USER_RESUME`, true, {}, false, "BASE")

  //         if(error){
  //           toast.error(error.message,getToastOptions({}))
  //           return
  //         }
  //         setCVLink(response?.objectUrl ?? "")
  //       } catch (error) {
  //         console.log(error)
  //       }
  //     }else if(selectedCandidateDetails?.cvAwsS3ResourceType === "BULK_CVS"){
  //           if(!selectedCandidateDetails?.companyId
  //             || !selectedCandidateDetails?.cvAwsS3FileName
  //             || !selectedCandidateDetails?.corporateBulkJdId
  //           ){
  //             toast.error("Missing details",getToastOptions({}))
  //             return
  //           }
  //           try {
  //             const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(`/file/${selectedCandidateDetails?.companyId}/${selectedCandidateDetails?.cvAwsS3FileName}/BULK_CVS`, true, { corporateBulkJdId:selectedCandidateDetails?.corporateBulkJdId }, false, "BASE")

  //             if(error){
  //               toast.error(error.message,getToastOptions({}))
  //               return
  //             }
  //             setCVLink(response?.objectUrl ?? "")
  //           } catch (error) {
  //             console.log(error)
  //           }
  //     }else if (selectedCandidateDetails?.cvAwsS3ResourceType === "CORP_CAND_BULK_CV_UPLOAD") {
  //           if (
  //             !selectedCandidateDetails?.cvAwsS3FilePath ||
  //             !selectedCandidateDetails?.cvAwsS3FileName
  //           ) {
  //             toast.error("Missing details", getToastOptions({}));
  //             return;
  //           }
  //           const splittedID = selectedCandidateDetails?.cvAwsS3FilePath.split("/")
  //           const payload = {
  //             companyId: splittedID[1],
  //             candCvAwsS3FileName: selectedCandidateDetails?.cvAwsS3FileName
  //           }
  //           try {
  //             const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/CORP_CAND_BULK_CV_UPLOAD`, payload, true, {}, true );

  //             if (error) {
  //               toast.error(error.message, getToastOptions({}));
  //               return;
  //             }
  //             setCVLink(response?.objectUrl ?? "")
  //           } catch (error) {
  //             console.log(error)
  //           }
  //         }else if (selectedCandidateDetails?.cvAwsS3ResourceType === "ADMIN_CAND_BULK_CV_UPLOAD") {
  //           if (
  //             !selectedCandidateDetails?.cvAwsS3FileName
  //           ) {
  //             toast.error("Missing details", getToastOptions({}));
  //             return;
  //           }
  //           const payload = {
  //             candCvAwsS3FileName: selectedCandidateDetails?.cvAwsS3FileName
  //           }
  //           try {
  //             const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/ADMIN_CAND_BULK_CV_UPLOAD`, payload, true, {}, true );

  //             if (error) {
  //               toast.error(error.message, getToastOptions({}));
  //               return;
  //             }
  //             setCVLink(response?.objectUrl ?? "")
  //           } catch (error) {
  //             console.log(error)
  //           }
  //         }else if (selectedCandidateDetails?.cvAwsS3ResourceType === "CAND_SUBMIT_CV_JOB") {
  //           if (
  //             !selectedCandidateDetails?.cvAwsS3FilePath ||
  //             !selectedCandidateDetails?.cvAwsS3FileName ||
  //             !selectedCandidateDetails?.jobId
  //           ) {
  //             toast.error("Missing details", getToastOptions({}));
  //             return;
  //           }
  //           const splittedID = selectedCandidateDetails?.cvAwsS3FilePath.split("/")
  //           const payload = {
  //             companyId: splittedID[2],
  //             candCvAwsS3FileName: selectedCandidateDetails?.cvAwsS3FileName,
  //             jobId:selectedCandidateDetails?.jobId
  //           }
  //           try {
  //             const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/CAND_SUBMIT_CV_JOB`, payload, true, {}, true );

  //             if (error) {
  //               toast.error(error.message, getToastOptions({}));
  //               return;
  //             }
  //             setCVLink(response?.objectUrl ?? "")
  //           } catch (error) {
  //             console.log(error)
  //           }
  //         }else if (selectedCandidateDetails?.cvAwsS3ResourceType === "CORP_CAND_REFERRAL_CV") {
  //           if (
  //             !selectedCandidateDetails?.cvAwsS3FilePath ||
  //             !selectedCandidateDetails?.cvAwsS3FileName
  //           ) {
  //             toast.error("Missing details", getToastOptions({}));
  //             return;
  //           }
  //           const splittedID = selectedCandidateDetails?.cvAwsS3FilePath.split("/")
  //           const payload = {
  //             companyId: splittedID[1],
  //             candCvAwsS3FileName: selectedCandidateDetails?.cvAwsS3FileName
  //           }
  //           try {
  //             const { response, error } = await httpServiceObj.post<{ objectUrl: string }>( `${agencyBaseUrl}/file/gsu2v/CORP_CAND_REFERRAL_CV`, payload, true, {}, true );

  //             if (error) {
  //               toast.error(error.message, getToastOptions({}));
  //               return;
  //             }
  //             setCVLink(response?.objectUrl ?? "")
  //           } catch (error) {
  //             console.log(error)
  //           }
  //         }else{
  //       if(!selectedCandidateDetails?.companyId
  //         || !selectedCandidateDetails?.jobId
  //         || !selectedCandidateDetails?.agencyUserId
  //         || !selectedCandidateDetails?.cvAwsS3FileName
  //         || !selectedCandidateDetails?.cvAwsS3FilePath
  //       ){
  //         toast.error("Missing details",getToastOptions({}))
  //         return
  //       }
  //       const splittedCvAwsS3FilePath = selectedCandidateDetails?.cvAwsS3FilePath.split("/")
  //       const jobIdFromCvAwsS3FilePath = splittedCvAwsS3FilePath[splittedCvAwsS3FilePath.length-2]

  //       const payload = {
  //         companyId: selectedCandidateDetails?.companyId,
  //         jobId:jobIdFromCvAwsS3FilePath,
  //         agencyUserId: selectedCandidateDetails?.agencyUserId,
  //         candidateCvAwsS3FileName: selectedCandidateDetails?.cvAwsS3FileName,
  //       }
  //       try {
  //         const {response,error} = await httpServiceObj.post<any>(`${agencyBaseUrl}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,payload,true,{},true,)

  //         if(error){
  //           toast.error(error.message,getToastOptions({}))
  //           return
  //         }
  //         setCVLink(response.objectUrl)
  //       } catch (error) {
  //         console.log(error)
  //       }
  //     }
  //   }
  //   setIsViewCVModalOpen(true);
  // };

  // const handleViewFeedback = async () => {
  //   if (!selectedRequest?.evaluationResponseId) return;

  //   try {
  //     const feedback = await getEvaluationResponse(
  //       selectedRequest.jobApplicationId,
  //       selectedRequest.evaluationResponseId
  //     );
  //     // console.log(feedback.status)
  //     setViewFeedbackData(feedback);
  //     setIsViewFeedbackOpen(true);
  //   } catch (err) {
  //     toast.error("Failed to fetch feedback");
  //     console.error(err);
  //   }
  // };

  const handleViewCV = async () => {
    const req = selectedRequestRef.current || selectedRequest;
    const cand = selectedCandidateDetailsRef.current || selectedCandidateDetails;

    if (!cand) {
      toast.error("Candidate details missing", getToastOptions({}));
      return;
    }

    // Direct signed URL
    if (cand.cvAwsS3SignedUrl) {
      setCVLink(cand.cvAwsS3SignedUrl);
      setIsViewCVModalOpen(true);
      return;
    }

    // Resource type-based handling
    const type = cand.cvAwsS3ResourceType;

    try {
      // --- USER RESUME ---
      if (type === "USER_RESUME") {
        if (!cand.userDetailId || !cand.cvAwsS3FileName) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(
          `/file/${cand.id}/${cand.cvAwsS3FileName}/USER_RESUME`,
          true,
          {},
          false,
          "BASE"
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response?.objectUrl ?? "");
      }

      // --- BULK_CVS ---
      else if (type === "BULK_CVS") {
        if (!cand.companyId || !cand.cvAwsS3FileName || !cand.corporateBulkJdId) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(
          `/file/${cand.companyId}/${cand.cvAwsS3FileName}/BULK_CVS`,
          true,
          { corporateBulkJdId: cand.corporateBulkJdId },
          false,
          "BASE"
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response?.objectUrl ?? "");
      }

      // --- CORPORATE BULK UPLOAD ---
      else if (type === "CORP_CAND_BULK_CV_UPLOAD") {
        if (!cand.cvAwsS3FilePath || !cand.cvAwsS3FileName) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const companyId = cand.cvAwsS3FilePath.split("/")[1];

        const payload = {
          companyId,
          candCvAwsS3FileName: cand.cvAwsS3FileName,
        };

        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>(
          `${agencyBaseUrl}/file/gsu2v/CORP_CAND_BULK_CV_UPLOAD`,
          payload,
          true,
          {},
          true
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response?.objectUrl ?? "");
      }

      // --- ADMIN BULK UPLOAD ---
      else if (type === "ADMIN_CAND_BULK_CV_UPLOAD") {
        if (!cand.cvAwsS3FileName) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const payload = {
          candCvAwsS3FileName: cand.cvAwsS3FileName,
        };

        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>(
          `${agencyBaseUrl}/file/gsu2v/ADMIN_CAND_BULK_CV_UPLOAD`,
          payload,
          true,
          {},
          true
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response?.objectUrl ?? "");
      }

      // --- CAND SUBMIT CV JOB ---
      else if (type === "CAND_SUBMIT_CV_JOB") {
        if (!cand.cvAwsS3FilePath || !cand.cvAwsS3FileName || !cand.jobId) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const companyId = cand.cvAwsS3FilePath.split("/")[2];

        const payload = {
          companyId,
          candCvAwsS3FileName: cand.cvAwsS3FileName,
          jobId: cand.jobId,
        };

        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>(
          `${agencyBaseUrl}/file/gsu2v/CAND_SUBMIT_CV_JOB`,
          payload,
          true,
          {},
          true
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response?.objectUrl ?? "");
      }

      // --- CORP REFERRAL CV ---
      else if (type === "CORP_CAND_REFERRAL_CV") {
        if (!cand.cvAwsS3FilePath || !cand.cvAwsS3FileName) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const companyId = cand.cvAwsS3FilePath.split("/")[1];

        const payload = {
          companyId,
          candCvAwsS3FileName: cand.cvAwsS3FileName,
        };

        const { response, error } = await httpServiceObj.post<{ objectUrl: string }>(
          `${agencyBaseUrl}/file/gsu2v/CORP_CAND_REFERRAL_CV`,
          payload,
          true,
          {},
          true
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response?.objectUrl ?? "");
      }

      // --- AGENCY SUBMIT USER CV ---
      else {
        if (
          !cand.companyId ||
          !cand.jobId ||
          !cand.agencyUserId ||
          !cand.cvAwsS3FileName ||
          !cand.cvAwsS3FilePath
        ) {
          toast.error("Missing details", getToastOptions({}));
          return;
        }

        const split = cand.cvAwsS3FilePath.split("/");
        const jobIdFromPath = split[split.length - 2];

        const payload = {
          companyId: cand.companyId,
          jobId: jobIdFromPath,
          agencyUserId: cand.agencyUserId,
          candidateCvAwsS3FileName: cand.cvAwsS3FileName,
        };

        const { response, error } = await httpServiceObj.post<any>(
          `${agencyBaseUrl}/file/gsu2v/AGENCY_SUBMIT_USER_CV`,
          payload,
          true,
          {},
          true
        );

        if (error) return toast.error(error.message, getToastOptions({}));

        setCVLink(response.objectUrl);
      }

      setIsViewCVModalOpen(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load CV");
    }
  };

  const handleViewFeedback = async () => {
    const req = selectedRequestRef.current || selectedRequest;
    if (!req?.evaluationResponseId) return;

    try {
      const feedback = await getEvaluationResponse(req.jobApplicationId, req.evaluationResponseId);

      setViewFeedbackData(feedback);
      setIsViewFeedbackOpen(true);
    } catch (err) {
      toast.error("Failed to fetch feedback");
      console.error(err);
    }
  };

  const handleSubmitFeedback = () => {
    const req = selectedRequestRef.current || selectedRequest;

    if (!req) {
      toast.error("Missing request data");
      return;
    }
    // console.log(req.applicantName)
    setIsFeedbackModalOpen(true);
  };

  const handleViewVideo = () => {
    // console.log('Viewing video for candidate:', selectedCandidateId);
  };

  const refreshRequests = useCallback(async () => {
    setIsLoadingData(true);
    try {
      if (!evaluatorEmail) return;
      const rawData = await fetchEvaluationRequests(evaluatorEmail);

      const onlyIds = rawData.map((data) => {
        return data.jobApplicationId;
      });
      setidToFetchInterviews(onlyIds);
      const filteredRequests: typeof rawData = [];
      // for (const request of rawData) {
      //   if (!request.evaluationResponseId || !request.jobApplicationId) {
      //     filteredRequests.push(request);
      //     continue;
      //   }
      //   try {
      //     const feedback = await getEvaluationResponse(
      //       request.jobApplicationId,
      //       request.evaluationResponseId
      //     );
      //     const status = feedback?.status;
      //     // Exclude only ON_HOLD or REJECTED
      //     if (status !== "ON_HOLD" && status !== "REJECTED") {
      //       filteredRequests.push(request);
      //     }
      //   } catch (err) {
      //     console.error(`Failed to fetch feedback for request ID ${request.id}`, err);
      //     filteredRequests.push(request);
      //   }
      // }

      // setRequests(filteredRequests);
      setRequests(rawData);

      if (filteredRequests.length > 0) {
        setSelectedRequest(filteredRequests[0]);
      }
      setIsLoadingData(false);
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

    // Skip expensive fetch if we just hydrated from grouped data
    // (we already have all the data in companyCandidates)
    if (isHydratingFromGroupRef.current) {
      isHydratingFromGroupRef.current = false;
      return;
    }

    const fetchDetailsData = async () => {
      setIsLoadingData(true);
      try {
        // 1. Fetch Evaluation Details
        const details = await fetchEvaluationDetails(
          selectedRequest.jobApplicationId,
          selectedRequest.id
        );
        setDetails(details);

        // 2. Fetch Candidate Details
        const candidateEmail = selectedRequest.applicantUserEmail;
        const candidateParsedCvId = selectedRequest.candidateParsedCvId;
        const applicantUserId = selectedRequest.applicantUserId;

        if (candidateEmail && candidateParsedCvId) {
          const { response } = await httpServiceObj.get<any>(
            `${agencyBaseUrl}/candidate-parsed-cv/${candidateParsedCvId}`,
            true,
            {},
            true
          );
          if (response) {
            setSelectedCandidateDetails(response);
            setApplicationDetails(response);
          }
        }

        if (candidateEmail && applicantUserId) {
          const candidate = await fetchCandidateDetails(candidateEmail);
          // console.log(candidate)
          if (candidate.length > 0) {
            setSelectedCandidateDetails(candidate[0]);
          }
        }
        // 3. Fetch Application Details
        const applicationDetails = await fetchApplicationDetails(selectedRequest.jobApplicationId);
        setApplicationDetails(applicationDetails);
      } catch (err) {
        console.error("Failed to fetch details or candidate detail or application detail:", err);
        setDetails(null);
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchDetailsData();
  }, [selectedRequest]);

  const handleCandidateSelect = (id: string) => {
    setSelectedCandidateDetails(null);
    setApplicationDetails(null);
    setDetails(null);
    const request = requests.find((r) => r.id === id);
    if (request) setSelectedRequest(request);
  };

  const handleLocalUpdate = (requestId: string, updatedFields: Partial<EvaluationRequest>) => {
    // 1. Update the requests list
    setRequests((prev) =>
      prev.map((req) => (req.id === requestId ? { ...req, ...updatedFields } : req))
    );

    // 2. Update the selected request if it matches
    setSelectedRequest((prev) =>
      prev && prev.id === requestId ? { ...prev, ...updatedFields } : prev
    );
    setCompanyCandidates((prev) =>
      prev.map((c) =>
        c.request.id === requestId
          ? {
              ...c,
              request: { ...c.request, ...updatedFields },
            }
          : c
      )
    );
  };

  const groupedCompanies = useMemo(() => {
    const set = new Set<string>();
    requests.forEach((r) => {
      if (r.companyId) set.add(r.companyId);
    });
    return Array.from(set);
  }, [requests]);

  const numberOfPendingEvaluation = useMemo(() => {
    return requests?.filter((request) => !request.evaluationResponseId);
  }, [requests]);

  const handleCompanySelect = async (companyId: string) => {
    setSelectedCompanyId(companyId);

    // IMPORTANT: clear old candidates immediately so loader shows
    setCompanyCandidates([]);

    // show loading
    setIsLoadingData(true);

    // exit single-candidate mode
    setSelectedRequest(null);

    const filtered = requests.filter((r) => r.companyId === companyId);

    try {
      const results = await Promise.allSettled(
        filtered.map(async (req) => {
          const [detailsRes, candidateRes, applicationRes, socialRes, interviewRes, parsedCvRes] =
            await Promise.allSettled([
              fetchEvaluationDetails(req.jobApplicationId, req.id),
              fetchCandidateDetails(req.applicantUserEmail),
              fetchApplicationDetails(req.jobApplicationId),
              fetchCandidateSocial(req.applicantUserEmail),
              interviewServiceObj.fetchInterviewList(req.applicantUserEmail),
              // Fetch candidate-parsed-cv for CV data (contains cvAwsS3SignedUrl, cvAwsS3ResourceType, etc.)
              req.candidateParsedCvId
                ? httpServiceObj.get<any>(
                    `${agencyBaseUrl}/candidate-parsed-cv/${req.candidateParsedCvId}`,
                    true,
                    {},
                    true
                  )
                : Promise.resolve({ response: null }),
            ]);

          // --- Safe fallback handlers ---
          const safeDetails = detailsRes.status === "fulfilled" ? detailsRes.value : {};
          const safeCandidate =
            candidateRes.status === "fulfilled"
              ? candidateRes.value?.[0] ?? {}
              : { name: "Candidate", about: "", social: {} };

          const safeApplication =
            applicationRes.status === "fulfilled"
              ? applicationRes.value
              : { matchingScore: 0, scoreDetails: [] };

          // const attendees = safeApplication?.attendees || [];

          // const isEvaluatorAllowed = attendees
          //   .filter((a: any) => a.type === "EVALUATOR") // remove EXTERNAL automatically
          //   .some((a: any) =>
          //     a.email?.toLowerCase() === userDetails?.email?.toLowerCase()
          //   );
          const isEvaluatorAllowed =
            Boolean(safeApplication?.latestInterviewRoundId) ||
            safeApplication?.interviewRoundCount > 0;

          const safeSocial = socialRes.status === "fulfilled" ? socialRes.value?.[0] ?? {} : {};

          // Merge parsed CV data (which has cvAwsS3SignedUrl, cvAwsS3ResourceType, etc.)
          let parsedCvData = null;
          if (parsedCvRes.status === "fulfilled" && parsedCvRes.value?.response) {
            parsedCvData = parsedCvRes.value.response;
          }

          // -------- Video Interview Logic (copy from MainContent) --------
          let interviewDetails = null;
          let isAlreadyRequested = false;

          if (interviewRes.status === "fulfilled" && interviewRes.value?.response) {
            const list = interviewRes.value.response; // <-- real array
            const latest = getLatestInterviewData(list || [], "");

            interviewDetails = latest?.interviewDetails || null;
            isAlreadyRequested = interviewDetails && !interviewDetails?.score ? true : false;
          }

          return {
            request: req,
            details: safeDetails,
            candidate: {
              ...safeCandidate,
              social: safeSocial,
              // Merge CV data from parsed-cv endpoint
              ...(parsedCvData || {}),
            },
            application: safeApplication || parsedCvData, // Use parsed CV data for application if needed

            // important additions:
            interviewDetails,
            isAlreadyRequested,
            interviewScoreBreakdown: interviewDetails?.scoreBreakdown ?? {},
            canViewInterview: isEvaluatorAllowed,
          };
        })
      );

      const final = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

      setCompanyCandidates(final);
      // KEEP EVERYTHING — no skipping
      const finalPayload = results.filter((r) => r.status === "fulfilled").map((r) => r.value);

      setCompanyCandidates(finalPayload);
    } catch (e) {
      console.error("Error loading grouped candidates:", e);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Helper function to hydrate single-candidate state from grouped data
  // WITHOUT triggering expensive API fetches via the useEffect
  const hydrateSingleCandidateFromGroup = (item: any) => {
    if (!item) return;
    // Set flag BEFORE state updates so useEffect knows to skip the fetch
    isHydratingFromGroupRef.current = true;
    setSelectedRequest(item.request);
    setSelectedCandidateDetails(item.candidate);
    setApplicationDetails(item.application);
    setDetails(item.details);
  };

  const handleViewCVCompany = (req: any) => {
    const match = companyCandidates.find((c) => c.request.id === req.id);

    if (match) {
      hydrateSingleCandidateFromGroup(match);
    }

    selectedRequestRef.current = req;
    selectedCandidateDetailsRef.current = match?.candidate || null;

    handleViewCV();
  };

  const handleSubmitFeedbackCompany = (req: any) => {
    const match = companyCandidates.find((c) => c.request.id === req.id);

    if (match) {
      hydrateSingleCandidateFromGroup(match);
    }

    selectedRequestRef.current = req;
    selectedCandidateDetailsRef.current = match?.candidate || null;

    handleSubmitFeedback();
  };

  const handleViewFeedbackCompany = (req: any) => {
    const match = companyCandidates.find((c) => c.request.id === req.id);

    if (match) {
      hydrateSingleCandidateFromGroup(match);
    }

    selectedRequestRef.current = req;
    selectedCandidateDetailsRef.current = match?.candidate || null;

    handleViewFeedback();
  };

  const handleViewInterviewCompany = (interviewDetails: any, name: string) => {
    setInterviewDetailviewModal({
      isOpen: true,
      interviewDetails,
      userName: name,
    });
  };

  const [groupedCompaniesWithCompanyName, setGroupedCompaniesWithCompanyName] = useState<
    { companyId: string; companyName: string }[]
  >([]);

  useEffect(() => {
    if (!requests.length) return;

    const uniqueIds = Array.from(new Set(requests.map((r) => r.companyId)));

    const loadNames = async () => {
      const results = await Promise.allSettled(
        uniqueIds.map(async (id) => {
          const req = requests.find((r) => r.companyId === id);
          if (!req) return null;

          const app = await fetchApplicationDetails(req.jobApplicationId);

          return {
            companyId: id,
            companyName: app?.companyName || id,
          };
        })
      );

      const final = results
        .filter(
          (r): r is PromiseFulfilledResult<{ companyId: string; companyName: string } | null> =>
            r.status === "fulfilled" && r.value !== null
        )
        .map((r) => r.value!);

      setGroupedCompaniesWithCompanyName(final);
    };

    loadNames();
  }, [requests]);

  return (
    <div className="h-screen bg-gray-100 flex">
      <Sidebar
        candidates={
          Array.isArray(requests)
            ? requests.map((r) => ({
                id: r.id,
                name: r.applicantUserEmail,
                email: r.applicantUserEmail,
                sentTime: new Date(r.createdAt).toLocaleString(),
                isNew: false,
                applicantName: r.applicantName,
              }))
            : []
        }
        selectedCandidateId={selectedRequest?.id || ""}
        onCandidateSelect={handleCandidateSelect}
        // userName={selectedRequest?.evaluatorDetails.name || "Evaluator Dashboard"}
        userName={"Evaluator Dashboard"}
        companyLogo=""
        isLoadingData={isLoadingData}
        setIsLoadingData={setIsLoadingData}
        groupedCompanies={groupedCompanies}
        selectedCompanyId={selectedCompanyId}
        onCompanySelect={handleCompanySelect}
        requests={requests}
        groupedCompaniesWithCompanyName={groupedCompaniesWithCompanyName}
        idToFetchInterviews={idToFetchInterviews}
        setJobApplicationIdFromChild={setJobApplicationIdFromChild}
        interviewModal={interviewModal}
        setInterviewModal={setInterviewModal}
        numberOfPendingEvaluation={numberOfPendingEvaluation.length}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      {activeSection === "calendar" ? (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <GoogleIntegration />
        </div>
      ) : (
        <MainContent
          // key={selectedRequest?.id || "no-selection"}
          EvaluationRequestDetails={
            details && selectedCandidateDetails && applicationDetails
              ? {
                  id: details.id,
                  name: selectedCandidateDetails.name,
                  aboutCandidate: selectedCandidateDetails.about,
                  role: details.jobTitle,
                  recruiterFeedback: details.hrDetailedFeedback,
                  overallScore: 0, // Placeholder for now
                  workoFeedback: "",
                  videoInterview: {
                    confidence: 0,
                    attitude: 0,
                    domainKnowledge: 0,
                    commSkills: 0,
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
                      const parsed = JSON.parse(scoreOrRejection || "[]");
                      return Array.isArray(parsed) ? parsed : scoreOrRejection;
                    } catch (err) {
                      return scoreOrRejection;
                    }
                  })(),
                  evaluationResponseId: selectedRequest?.evaluationResponseId,
                  email: selectedRequest?.applicantUserEmail ?? "",
                  applicantUserId: details?.applicantUserId,
                }
              : {
                  id: "",
                  name: "",
                  aboutCandidate: "",
                  role: "",
                  recruiterFeedback: "",
                  overallScore: 0,
                  workoFeedback: "",
                  videoInterview: {
                    confidence: 0,
                    attitude: 0,
                    domainKnowledge: 0,
                    commSkills: 0,
                  },
                  profileSentDate: "",
                  recruiterName: "",

                  matchingScore: 0,
                  scoreDetails: [],
                  email: "",
                }
          }
          companyLogo=""
          onSubmitFeedback={handleSubmitFeedback}
          onViewFeedback={handleViewFeedback}
          onViewCV={handleViewCV}
          onViewVideo={handleViewVideo}
          requests={requests}
          isLoadingData={isLoadingData}
          hasAttemptedLoad={hasAttemptedLoad}
          evaluatorDetails={details}
          applicationDetails={applicationDetails}
          interviewDetailviewModal={interviewDetailviewModal}
          setInterviewDetailviewModal={setInterviewDetailviewModal}
          companyCandidates={companyCandidates}
          onViewCVCompany={handleViewCVCompany}
          onSubmitFeedbackCompany={handleSubmitFeedbackCompany}
          onViewFeedbackCompany={handleViewFeedbackCompany}
          onViewInterview={handleViewInterviewCompany}
          setJobApplicationIdFromChild={setJobApplicationIdFromChild}
          jobApplicationIdFromChild={jobApplicationIdFromChild}
          interviewModal={interviewModal}
          setInterviewModal={setInterviewModal}
        />
      )}

      {/*Feedback Modal*/}
      <Modal
        isOpen={isFeedbackModalOpen}
        onClose={handleCloseFeedbackModal}
        className="max-w-3xl w-full">
        <FeedbackModal
          onClose={handleCloseFeedbackModal}
          candidateId={selectedCandidateId}
          candidateName={
            selectedCandidateDetailsRef.current?.name ||
            selectedRequestRef.current?.applicantName ||
            selectedCandidateDetails?.name ||
            "Candidate"
          }
          onSubmitComplete={handleFeedbackComplete}
          selectedRequest={selectedRequest}
          selectedCandidateDetails={selectedCandidateDetails}
          applicationDetails={applicationDetails}
          onLocalUpdate={handleLocalUpdate}
        />
      </Modal>

      <Modal
        isOpen={isViewFeedbackOpen}
        onClose={() => setIsViewFeedbackOpen(false)}
        className="max-w-3xl w-full">
        {viewFeedbackData && (
          <ViewFeedbackModal
            candidateName={
              selectedCandidateDetails?.name ||
              selectedRequestRef.current.applicantName ||
              "Candidate"
            }
            onClose={() => setIsViewFeedbackOpen(false)}
            data={viewFeedbackData}
          />
        )}
      </Modal>

      <Modal
        isOpen={isViewCVModalOpen}
        onClose={() => setIsViewCVModalOpen(false)}
        className="w-[90vw] sm:max-w-4xl h-full">
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
              onClick={() => window.open(cvLink, "_blank")}
              aria-label="Open CV in new tab"
              title="Open CV in new tab"
              disabled={!cvLink}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
              <ExternalLink size={30} className="text-blue-600" />
            </button>
          </div>

          {/* CV Viewer */}
          <div className="flex-1 border-2 border-gray-300 rounded-xl overflow-hidden">
            <iframe
              src={cvLink}
              title="CV Preview"
              className="w-full h-[calc(100vh-100px)]"
              style={{ border: "none" }}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={interviewDetailviewModal.isOpen}
        onClose={() =>
          setInterviewDetailviewModal({
            isOpen: false,
            interviewDetails: {} as InterviewDto,
            userName: "",
          })
        }>
        <InterviewDetailedViewModal
          userName={interviewDetailviewModal.userName}
          interviewDetails={interviewDetailviewModal.interviewDetails}
        />
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
