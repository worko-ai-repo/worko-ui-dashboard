import React from 'react';
import { FileText, Play, Send, Info } from 'lucide-react';
import { CandidateDetails, EvaluationRequestDetails, SocialLinks} from 'src/types/index';
import { toTitleCase } from "@Utils/Titlecase.utils";
import CognitoServiceObj from '@Utils/Cognito.utils';
import { useEffect,useState } from 'react';
import { useParams, useLocation,useSearchParams } from 'react-router-dom';
import { evaluationRequest } from '@AssetsFolder/assets';
import {fetchCandidateSocial, fetchEvaluationDetails} from "@Services/EvaluationService.service"
import { jwtDecode } from 'jwt-decode';
import { fetchAuthSession } from '@aws-amplify/auth';
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import { useAppContext } from 'lib-worko-ui';

interface MainContentProps {
  EvaluationRequestDetails: EvaluationRequestDetails;
  companyLogo: string;
  onSubmitFeedback: () => void;
  onViewCV: () => void;
  onViewFeedback: () => void;
  onViewVideo: () => void
  requests:any[]
}
  
  const handleLogout = async () => {
  try {
    await CognitoServiceObj.handleSignOut();
    sessionStorage.clear();
    window.location.href = 'https://worko.ai/';
  } catch (err) {
    console.error('Logout failed', err);
  }
};

const MainContent: React.FC<MainContentProps> = ({
  EvaluationRequestDetails,
  companyLogo,
  onSubmitFeedback,
  onViewCV,
  onViewFeedback,
  onViewVideo,
  requests
}) => {

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const [evaluatorEmail, setEvaluatorEmail] = useState<string>('');
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const jobApplicationId = searchParams.get('jobApplicationId') || '';
  const evaluationRequestId = searchParams.get('evaluationRequestId') || '';

  useEffect(() => {
    const fetchSocialLinks = async () => {
    // const {isLoggedIn} = useAppContext()
    
    const accessToken = CognitoServiceObj.getAccessToken()
    if (!accessToken) {
      toast.error("No session found please login using the verified link",getToastOptions({}));
      // window.location.href = 'https://worko.ai/';
      // const paramEmail = window.location.search.split("=")[1]
      //@TODO remove v0
      // window.location.href = `${window.location.origin}/auth/evaluator-dashboard/login?evaluatorEmail=${paramEmail}`;
      window.location.href = `${window.location.origin}${import.meta.env.APP_PROXY_BASE}auth/evaluator-dashboard/login?jobApplicationId=${jobApplicationId}&evaluationRequestId=${evaluationRequestId}`;
      return;
    }

    if (EvaluationRequestDetails.email) {
      try {
        const data = await fetchCandidateSocial(EvaluationRequestDetails.email);
        const filteredSocialLinks:any = {};
        Object.entries(data?.[0] ?? {}).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            filteredSocialLinks[key] = value;
          }
        });
    console.log(filteredSocialLinks)
    setSocialLinks(filteredSocialLinks);
      } catch (error) {
        console.error('Fetch error:', error);
        setSocialLinks({});
      }
    }
  };

  fetchSocialLinks();
}, [location.search,EvaluationRequestDetails.email]);

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
        const payload = JSON.parse(atob(token.split('.')[1]));

        const tokenEmail = encodeURIComponent(payload.email.trim().toLowerCase());

        // console.log("Token Email:", tokenEmail);
        // console.log("Evaluator Email:", evaluatorEmail);

        if (tokenEmail !== evaluatorEmail) {
          toast.error(
            'Email does not match the current session. Please login again.',
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
      console.log(err);
    }
  };

  checkSession();
}, [evaluatorEmail, jobApplicationId, evaluationRequestId]);

if (
  (!EvaluationRequestDetails?.id || !EvaluationRequestDetails?.email) &&
  requests.length > 0
) {
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

if ((!EvaluationRequestDetails?.id || !EvaluationRequestDetails?.email) && requests.length === 0) {
  return (
    <div className="flex flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-12 bg-gradient-to-br from-white-50 to-indigo-100 rounded-2xl relative overflow-hidden w-full h-screen bg-gray-100">
      {/* Main Message */}
<div className="flex flex-col justify-center items-center text-center w-full max-w-3xl min-h-[600px] p-8 bg-white shadow-lg rounded-xl">
      <div className="text-center max-w-sm sm:max-w-lg mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-3 sm:mb-4">
          You're all caught up!
        </h2>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
          Right now you have no CVs to evaluate, or you've already evaluated all pending applications.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full max-w-xs sm:max-w-lg">
        <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
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
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
          <span className="text-xs sm:text-sm">Perfect time for a coffee break!</span>
        </div>
        
        <p className="text-xs sm:text-sm text-gray-500 mb-4 sm:mb-6">
          New applications will appear here automatically when they're ready for review.
        </p>
        
      </div>
    </div>
    </div>
  );
}

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
            Profile sent on {new Date(EvaluationRequestDetails.profileSentDate).toLocaleString(undefined, {
              year: 'numeric',
              month: 'numeric',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
              hour12: true
            })}
          </span>

          <span className="flex items-center gap-1 max-w-[250px] truncate" title={toTitleCase(EvaluationRequestDetails.recruiterName)}>
            <span className="text-[#316BFF] font-semibold whitespace-nowrap">Recruiter name:</span>
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
            <span className="text-slate-600 font-medium">{toTitleCase(EvaluationRequestDetails.role)}</span>
          </div>
        </div>

        {/* About Candidate Card */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">About Candidate</h3>
            <button
              onClick={onViewCV}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r bg-[#316BFF] text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105"
            >
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
                      <div className="flex items-center gap-1" key={key} style={{ marginBottom: '1rem' }}>
                        <a
                          href={urls[0]}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
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
                      style={{ backgroundColor: '#316BFF' }}
                    ></div>
                    <div>
                      <div className="text-base font-semibold text-slate-800">{score.heading}</div>
                      <div className="text-base text-slate-700">{score.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-base text-slate-700 whitespace-pre-line">
                {EvaluationRequestDetails.scoreDetails || 'No feedback provided.'}
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
              {EvaluationRequestDetails.recruiterFeedback || 'No feedback provided.'}
            </p>
          </div>
        </div>


        {/* Video Interview Card */}
        {/* <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-slate-800">Video Interview</h3>
            <button
              onClick={onViewVideo}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-cyan-500 text-white rounded-lg hover:from-indigo-600 hover:to-cyan-600 transition-all duration-200 transform hover:scale-105"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-semibold">View</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-700">Scores:</span>
            <div className="flex items-center gap-6 bg-blue-50 rounded-lg p-4 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Confidence</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {candidateDetails.videoInterview.confidence}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Attitude</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {candidateDetails.videoInterview.attitude}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Domain Knowledge</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {candidateDetails.videoInterview.domainKnowledge}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-600">Comm Skills</span>
                <span className="text-xs font-semibold text-indigo-600">
                  {candidateDetails.videoInterview.commSkills}%
                </span>
              </div>
            </div>
          </div>
        </div> */}

        {/* Video Interview Card (disabled style) */}
        <div className="bg-gray-100 border border-dashed border-gray-300 rounded-lg p-6 shadow-sm opacity-60 cursor-not-allowed">
          <div className="flex items-start justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-500">Video Interview</h3>
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-500 rounded-lg cursor-not-allowed"
              title="Video interview data not available"
            >
              <Play className="w-4 h-4" />
              <span className="text-sm font-semibold">View</span>
            </button>
          </div>

          <p className="text-sm italic text-gray-500">Video interview data is currently not available.</p>
        </div>


        {/* Submit or View Feedback Button */}
        <div className="flex justify-center pt-4">
          {EvaluationRequestDetails.evaluationResponseId ? (
            <button
              onClick={onViewFeedback}
              className="flex items-center gap-3 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <FileText className="w-5 h-5" />
              <span className="font-semibold">View Feedback</span>
            </button>
          ) : (
            <button
              onClick={onSubmitFeedback}
              className="flex items-center gap-3 px-6 py-3 bg-[#316BFF] text-white rounded-lg hover:bg-indigo-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Send className="w-5 h-5" />
              <span className="font-semibold">Submit Feedback</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default MainContent;