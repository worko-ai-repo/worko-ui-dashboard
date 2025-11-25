import React from "react";
import { FileText, Play, Send, Info } from "lucide-react";
import {
  ApplicationDetails,
  CandidateDetails,
  EvaluationDetails,
  EvaluationRequestDetails,
  SocialLinks,
} from "src/types/index";
import { toTitleCase } from "@Utils/Titlecase.utils";
import CognitoServiceObj from "@Utils/Cognito.utils";
import { useEffect, useState } from "react";
import { useParams, useLocation, useSearchParams } from "react-router-dom";
import { evaluationRequest } from "@AssetsFolder/assets";
import { fetchCandidateSocial, fetchEvaluationDetails } from "@Services/EvaluationService.service";
import { jwtDecode } from "jwt-decode";
import { fetchAuthSession } from "@aws-amplify/auth";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";

import { useQuery } from "@tanstack/react-query";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import interviewServiceObj from "@Services/Interview.service";
import { getLatestInterviewData } from "@Components/Dashboard/WorkoAdmin/Applicants/ApplicantsTable";
import { formatObjectForDisplay } from "@Utils/FormatText.utils";
import { useAppContext } from "@Context/App.context";
import jobApplicationServiceObj from "@Utils/ApplicationPage.utils";
import { EvaluatorDetails } from "@Interfaces/CorporateServices.dto";
import InterviewDetailedViewModal from "@Components/Modals/SharedModals/Interview/InterviewDetailedViewModal";
import Modal from "@Components/Shared/Modal";
interface MainContentProps {
  EvaluationRequestDetails: EvaluationRequestDetails;
  companyLogo: string;
  onSubmitFeedback: () => void;
  onViewCV: () => void;
  onViewFeedback: () => void;
  onViewVideo: () => void;
  requests: any[];
  isLoadingData: boolean;
  hasAttemptedLoad: boolean;
  applicationDetails: ApplicationDetails | null;
  evaluatorDetails: EvaluationDetails | null;
  interviewDetailviewModal: {
    isOpen: boolean;
    interviewDetails: InterviewDto;
    userName: string;
  };
  setInterviewDetailviewModal: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      interviewDetails: InterviewDto;
      userName: string;
    }>
  >;
}

const handleLogout = async () => {
  try {
    await CognitoServiceObj.handleSignOut();
    sessionStorage.clear();
    window.location.href = "https://worko.ai/";
  } catch (err) {
    console.error("Logout failed", err);
  }
};

const MainContent: React.FC<MainContentProps> = ({
  EvaluationRequestDetails,
  companyLogo,
  onSubmitFeedback,
  onViewCV,
  onViewFeedback,
  onViewVideo,
  requests,
  isLoadingData,
  hasAttemptedLoad,
  applicationDetails,
  evaluatorDetails,
  interviewDetailviewModal,
  setInterviewDetailviewModal,
}) => {
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [evaluatorEmail, setEvaluatorEmail] = useState<string>("");
  const [interviewDetails, setInterviewDetails] = useState<InterviewDto | undefined>(undefined);
  const [isAlreadyRequested, setIsAlreadyRequested] = useState<boolean>(false);

  const location = useLocation();
  const [searchParams] = useSearchParams();
  const jobApplicationId = searchParams.get("jobApplicationId") || "";
  const evaluationRequestId = searchParams.get("evaluationRequestId") || "";
  const { userDetails } = useAppContext();

  useEffect(() => {
    const fetchSocialLinks = async () => {
      // const {isLoggedIn} = useAppContext()

      const accessToken = CognitoServiceObj.getAccessToken();
      if (!accessToken) {
        toast.error("No session found please login using the verified link", getToastOptions({}));
        // window.location.href = 'https://worko.ai/';
        // const paramEmail = window.location.search.split("=")[1]
        //@TODO remove v0
        // window.location.href = `${window.location.origin}/auth/evaluator-dashboard/login?evaluatorEmail=${paramEmail}`;
        window.location.href = `${window.location.origin}${
          import.meta.env.APP_PROXY_BASE
        }auth/evaluator-dashboard/login?jobApplicationId=${jobApplicationId}&evaluationRequestId=${evaluationRequestId}`;
        return;
      }

      if (EvaluationRequestDetails.email) {
        try {
          const data = await fetchCandidateSocial(EvaluationRequestDetails.email);
          const filteredSocialLinks: any = {};
          Object.entries(data?.[0] ?? {}).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
              filteredSocialLinks[key] = value;
            }
          });
          // console.log(filteredSocialLinks)
          setSocialLinks(filteredSocialLinks);
        } catch (error) {
          console.error("Fetch error:", error);
          setSocialLinks({});
        }
      }
    };

    fetchSocialLinks();
  }, [location.search, EvaluationRequestDetails.email]);

  // useEffect(() => {
  //   const getEvaluationDetails = async () => {
  //     try {
  //       const details = await fetchEvaluationDetails(jobApplicationId, evaluationRequestId);
  //       if (details?.evaluatorDetails?.email) {
  //         setEvaluatorEmail(encodeURIComponent(details.evaluatorDetails.email.trim().toLowerCase()));
  //       }
  //     } catch (err) {
  //       console.error('Error fetching evaluation details:', err);
  //       console.log("no email found")
  //       await CognitoServiceObj.handleSignOut();
  //           sessionStorage.clear();
  //           // window.location.href = `${window.location.origin}${import.meta.env.APP_PROXY_BASE}/auth/evaluator-dashboard/login?jobApplicationId=${jobApplicationId}&evaluationRequestId=${evaluationRequestId}`;
  //           //while deploying use the below
  //           window.location.href = `${window.location.origin}/auth/evaluator-dashboard/login?jobApplicationId=${jobApplicationId}&evaluationRequestId=${evaluationRequestId}`;
  //     }
  //   };
  //   getEvaluationDetails();
  // }, [jobApplicationId, evaluationRequestId]);

  useEffect(() => {
    const checkSession = async () => {
      if (!evaluatorEmail) return;

      try {
        const session = await fetchAuthSession();
        if (session?.tokens?.idToken) {
          const token = session.tokens.idToken.toString();
          const payload = JSON.parse(atob(token.split(".")[1]));

          const tokenEmail = encodeURIComponent(payload.email.trim().toLowerCase());

          // console.log("Token Email:", tokenEmail);
          // console.log("Evaluator Email:", evaluatorEmail);

          if (tokenEmail !== evaluatorEmail) {
            toast.error(
              "Email does not match the current session. Please login again.",
              getToastOptions({})
            );
            await CognitoServiceObj.handleSignOut();
            sessionStorage.clear();
            // window.location.href = `${window.location.origin}${import.meta.env.APP_PROXY_BASE}/auth/evaluator-dashboard/login?jobApplicationId=${jobApplicationId}&evaluationRequestId=${evaluationRequestId}`;
            //while deploying use the below
            window.location.href = `${window.location.origin}/auth/evaluator-dashboard/login?jobApplicationId=${jobApplicationId}&evaluationRequestId=${evaluationRequestId}`;
          }
        }
      } catch (err) {
        // console.log(err);
      }
    };

    checkSession();
  }, [evaluatorEmail, jobApplicationId, evaluationRequestId]);

  const fetchInterviews = async (): Promise<InterviewDto[]> => {
    if (!evaluatorDetails?.applicantUserEmail) throw new Error("User email not found");

    const { response, error } = await interviewServiceObj.fetchInterviewList(
      evaluatorDetails?.applicantUserEmail
    );

    if (error) throw error;
    return response || [];
  };

  const {
    data: userInterviews = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["interviews", evaluatorDetails?.applicantUserEmail],
    queryFn: fetchInterviews,
    enabled: !!evaluatorDetails?.applicantUserEmail,
  });

  useEffect(() => {
    if (userInterviews && userInterviews.length > 0 && userDetails?.id) {
      const data = getLatestInterviewData(userInterviews || [], userDetails?.id);
      setInterviewDetails(data?.interviewDetails);
      setIsAlreadyRequested(data?.isAlreadyRequested || false);
    }
  }, [userInterviews, userDetails?.id]);

  if (isLoadingData) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-[200px] text-slate-600 text-base sm:text-lg font-semibold">
        <span className="mb-3">Please wait, loading data</span>
        <span className="flex space-x-1 text-xl sm:text-2xl">
          <span className="animate-bounce">.</span>
          <span className="animate-bounce delay-200">.</span>
          <span className="animate-bounce delay-400">.</span>
        </span>
      </div>
    );
  }

  if (requests.length > 0 && !isLoadingData) {
    return (
      <div className="flex-1 bg-gray-50 p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-end mb-6">
          {/* <img
          src="https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=80&fit=crop"
          alt="Company Logo"
          className="h-10 rounded-lg object-cover"
        /> */}
          <div className="flex items-center gap-8 text-sm text-slate-500">
            <span>
              Profile sent on{" "}
              {new Date(EvaluationRequestDetails.profileSentDate).toLocaleString(undefined, {
                year: "numeric",
                month: "numeric",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
                hour12: true,
              })}
            </span>

            <span
              className="flex items-center gap-1 max-w-[250px] truncate"
              title={toTitleCase(EvaluationRequestDetails.recruiterName)}>
              <span className="text-[#316BFF] font-semibold whitespace-nowrap">
                Recruiter name:
              </span>
              <span className="text-slate-800 truncate font-bold">
                {toTitleCase(EvaluationRequestDetails.recruiterName)}
              </span>
            </span>
          </div>
        </div>

        {/* Content Cards */}
        <div className="space-y-2">
          {/* Role Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">Role being interviewed for</h3>
              <span className="text-slate-600 font-medium">
                {toTitleCase(EvaluationRequestDetails.role)}
              </span>
            </div>
          </div>

          {/* About Candidate Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">About Candidate</h3>
              <button
                onClick={onViewCV}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r bg-[#316BFF] text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-semibold">View CV</span>
              </button>
            </div>

            <div className="space-y-4 text-left">
              <div>
                <span className="font-semibold text-slate-700">Name - </span>
                <span className="text-slate-600">{toTitleCase(EvaluationRequestDetails.name)}</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {EvaluationRequestDetails.aboutCandidate}
              </p>
            </div>
          </div>

          {/* Social Links Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-800 text-start">Social Links</h3>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-slate-700">
              {Object.values(socialLinks).some((urls: string[]) => urls.length > 0) ? (
                Object.entries(socialLinks).map(([key, urls]: [string, string[]]) =>
                  urls.length > 0 ? (
                    // if want to show all links of all keys
                    // <div className="flex items-center gap-1" key={key} style={{ marginBottom: '1rem' }}>
                    //   {urls.map((url, idx) => (
                    //     <a
                    //       key={idx}
                    //       href={url}
                    //       target="_blank"
                    //       rel="noopener noreferrer"
                    //       className="text-blue-600 hover:underline"
                    //     >
                    //       {toTitleCase(key)}{urls.length > 1 ? ` #${idx + 1}` : ''}
                    //     </a>
                    //   ))}
                    // </div>
                    <div
                      className="flex items-center gap-1"
                      key={key}
                      style={{ marginBottom: "1rem" }}>
                      <a
                        href={urls[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline">
                        {toTitleCase(key)}
                      </a>
                    </div>
                  ) : null
                )
              ) : (
                <div className="text-gray-500 text-sm">N/A</div>
              )}
            </div>
          </div>

          {/* Worko Feedback Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Worko Feedback</h3>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <span className="text-xs font-semibold text-slate-600">Overall Score</span>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <div className="text-2xl font-bold text-[#316BFF]">
                  {EvaluationRequestDetails.matchingScore}%
                </div>
              </div>
            </div>

            {/* 
           //text-indigo-600 */}

            <div className="mt-4 text-left">
              {Array.isArray(EvaluationRequestDetails.scoreDetails) ? (
                <div className="space-y-4">
                  {EvaluationRequestDetails.scoreDetails.map((score, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div
                        className="mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: "#316BFF" }}></div>
                      <div>
                        <div className="text-base font-semibold text-slate-800">
                          {score.heading}
                        </div>
                        <div className="text-base text-slate-700">{score.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-base text-slate-700 whitespace-pre-line">
                  {EvaluationRequestDetails.scoreDetails || "No feedback provided."}
                </p>
              )}
            </div>
          </div>

          {/* Recruiter Feedback Card */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-slate-800">Recruiter Feedback</h3>
            </div>

            <div className="space-y-4 text-left">
              <p className="text-slate-600 leading-relaxed">
                {EvaluationRequestDetails.recruiterFeedback || "No feedback provided."}
              </p>
            </div>
          </div>

          {/* Video Interview Card (disabled style) */}
          <div className="bg-white border rounded-lg p-6 shadow-sm ">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-500">Video Interview</h3>
             {checkValidInterview() && !isAlreadyRequested && <button
                onClick={() => {
                  setInterviewDetailviewModal({
                    isOpen: true,
                    interviewDetails: interviewDetails || ({} as InterviewDto),
                    userName: evaluatorDetails?.applicantName || "",
                  });
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
                  interviewDetails && !isAlreadyRequested
                    ? "bg-green-600 text-white hover:bg-green-700 transform hover:scale-105 cursor-pointer"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Play className="w-4 h-4" />
                <span className="text-sm font-semibold">
                  {interviewDetails && !isAlreadyRequested ? "View Interview" : "View"}
                </span>
              </button>}
            </div>

            {checkValidInterview() && !isAlreadyRequested ? (
              <div className="flex items-center  rounded-lg  p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-700 ">Scores: &nbsp;</h3>
                <div className="flex justify-evenly p-3 rounded-lg gap-6 bg-cyan-100 flex-1  ">
                  {formatObjectForDisplay(interviewDetails?.scoreBreakdown || {}).map(
                    ({ label, value }, index) => (
                      <div key={index}>
                        <span className="text-md font-semibold text-gray-400 mr-2">{label}</span>
                        <span className={`text-sm text-blue-500 font-semibold`}>{value}%</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            ) : (
              <>
                <p className="text-slate-500 leading-relaxed">
                  Video interview data not available.
                </p>

                {/*  <button
                  onClick={async () => {
                    if (!userDetails?.email || !applicationDetails) {
                      toast.error(
                        "Error requesting interview. Please try again later.[EC-404]",
                        getToastOptions({})
                      );
                      return;
                    }

                    if (
                      !EvaluationRequestDetails?.email ||
                      !EvaluationRequestDetails?.name ||
                      !EvaluationRequestDetails?.role
                    ) {
                      toast.error(
                        "Missing candidate information. Cannot request interview.",
                        getToastOptions({})
                      );
                      return;
                    }

                    if (
                      !jobApplicationId ||
                      !applicationDetails?.companyId ||
                      !applicationDetails?.companyName
                    ) {
                      toast.error(
                        "Missing application details. Cannot request interview.",
                        getToastOptions({})
                      );
                      return;
                    }

                    if (!userDetails?.fullName && !evaluatorDetails) {
                      toast.error(
                        "Missing user information. Cannot request interview.",
                        getToastOptions({})
                      );
                      return;
                    }

                    if (!evaluatorDetails?.applicantUserEmail) {
                      toast.error(
                        "Missing evaluator email. Cannot request interview.",
                        getToastOptions({})
                      );
                      return;
                    }

                    try {
                      const payload = jobApplicationServiceObj.generateInterviewRequestPayload({
                        candidateEmail: evaluatorDetails.applicantUserEmail,
                        jobId: jobApplicationId,
                        candidateFullName: evaluatorDetails.applicantName,
                        companyId: applicationDetails.companyId,
                        companyName: applicationDetails.companyName,
                        position: EvaluationRequestDetails.role,
                        requesterUserName: userDetails.fullName,
                      });
                      await interviewServiceObj.requestInterview(payload);
                      toast.success(
                        "Interview request submitted successfully!",
                        getToastOptions({})
                      );
                    } catch (error) {
                      toast.error(
                        "Failed to request interview. Please try again.",
                        getToastOptions({})
                      );
                      console.error("Interview request error:", error);
                    }
                  }}
                  className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105">
                  Request Video Interview
                </button> */}
              </>
            )}
          </div>

          {/* Submit or View Feedback Button */}
          <div className="flex justify-center pt-4">
            {EvaluationRequestDetails.evaluationResponseId ? (
              <button
                onClick={onViewFeedback}
                className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                <FileText className="w-5 h-5" />
                <span className="font-semibold">View Feedback</span>
              </button>
            ) : (
              <button
                onClick={onSubmitFeedback}
                className="flex items-center gap-3 px-6 py-3 bg-[#316BFF] text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                <Send className="w-5 h-5" />
                <span className="font-semibold">Submit Feedback</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  function checkValidInterview() {
    if (!interviewDetails) return false;
    if (interviewDetails && !interviewDetails?.interviewHistory) return false;
    if (interviewDetails.interviewHistory && interviewDetails.interviewHistory.length === 0)
      return false;
    return true;
  }

  if (!isLoadingData && hasAttemptedLoad && requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-12 bg-gradient-to-br from-white-50 to-indigo-100 rounded-2xl relative overflow-hidden w-full h-screen bg-gray-100">
        {/* Main Message */}
        <div className="flex flex-col justify-center items-center text-center w-full max-w-3xl min-h-[600px] p-8 bg-white shadow-lg rounded-xl">
          <div className="text-center max-w-sm sm:max-w-lg mb-8 sm:mb-12">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
              You're all caught up!
            </h2>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              Right now you have no CVs to evaluate, or you've already evaluated all pending
              applications.
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full max-w-xs sm:max-w-lg">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">All Evaluated</p>
                  <p className="text-xs text-gray-500">Great job!</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-800">Queue Empty</p>
                  <p className="text-xs text-gray-500">No pending CV to review</p>
                </div>
              </div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 text-gray-500 mb-3 sm:mb-4">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
              <span className="text-xs sm:text-sm">Perfect time for a coffee break!</span>
            </div>

            <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
              New applications will appear here automatically when they're ready for review.
            </p>
          </div>
        </div>
        <Modal
          isOpen={true}
          onClose={() =>
            setInterviewDetailviewModal({
              isOpen: false,
              interviewDetails: {} as InterviewDto,
              userName: "",
            })
          }
          className="w-[300px] h-[400px] bc">
          <InterviewDetailedViewModal
            userName={interviewDetailviewModal.userName}
            interviewDetails={interviewDetailviewModal.interviewDetails}
          />
        </Modal>
      </div>
    );
  }
};

export default MainContent;
