import React from 'react';
import { FileText, Play, Send, Info } from 'lucide-react';
import { CandidateDetails, EvaluationRequestDetails, SocialLinks} from 'src/types/index';
import { toTitleCase } from "@Utils/Titlecase.utils";
import CognitoServiceObj from '@Utils/Cognito.utils';
import { useEffect,useState } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { evaluationRequest } from '@AssetsFolder/assets';
import {fetchCandidateSocial} from "@Services/EvaluationService.service"
import { jwtDecode } from 'jwt-decode';
import { fetchAuthSession } from '@aws-amplify/auth';


interface MainContentProps {
  EvaluationRequestDetails: EvaluationRequestDetails;
  companyLogo: string;
  onSubmitFeedback: () => void;
  onViewCV: () => void;
  onViewFeedback: () => void;
  onViewVideo: () => void
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
  onViewVideo
}) => {

  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  const location = useLocation();


  useEffect(() => {
    const fetchSocialLinks = async () => {
    const accessToken = CognitoServiceObj.getAccessToken();

    if (!accessToken) {
      alert("No session found please login using the verified link");
      // window.location.href = 'https://worko.ai/';
      const paramEmail = window.location.search.split("=")[1]
      window.location.href = `${window.location.origin}/v0/auth/evaluator-dashboard/login?evaluatorEmail=${paramEmail}`;
      return;
    }

    if (EvaluationRequestDetails.email) {
      try {
        const data = await fetchCandidateSocial(EvaluationRequestDetails.email);
        const filteredSocialLinks = {};
    Object.entries(data[0]).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        filteredSocialLinks[key] = value;
      }
    });

    setSocialLinks(filteredSocialLinks);
      } catch (error) {
        console.error('Fetch error:', error);
        setSocialLinks({});
      }
    }
  };

  fetchSocialLinks();
}, [location.search,EvaluationRequestDetails]);

  useEffect(()=>{
    const checkSession = async () => {
      try {
        const session = await fetchAuthSession();

        if (session?.tokens?.idToken) {
          const token = session.tokens.idToken.toString();
          const payload = JSON.parse(atob(token.split('.')[1]));
            
          const tokenEmail = encodeURIComponent(payload.email)
          const paramEmail = window.location.search.split("=")[1]

          if(tokenEmail !== paramEmail){
            alert('email does not match with the current session please login again');
                await CognitoServiceObj.handleSignOut();
                sessionStorage.clear();
            //  window.location.href = 'https://worko.ai/';
            window.location.href = `${window.location.origin}/v0/auth/evaluator-dashboard/login?evaluatorEmail=${paramEmail}`;
          }
        }
      } catch (err) {
        console.log(err);
      }
    };

    checkSession();
  },[])
if (!EvaluationRequestDetails?.id || !EvaluationRequestDetails?.email) {
  return (
    <div className="flex items-center justify-center w-full h-screen bg-gray-100">
      <div className="flex flex-col items-center text-center max-w-md w-full p-8 bg-white shadow-lg rounded-xl">
        <FileText className="w-12 h-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">No Data Available</h2>
        <p className="text-base text-gray-600">Looks like there are no candidates to evaluate.</p>
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
          <span>Profile sent on {EvaluationRequestDetails.profileSentDate}</span>
          <span>
            <span className="text-[#316BFF] font-semibold" >Recruiter name: </span>
            <span className="text-slate-800">{toTitleCase(EvaluationRequestDetails.recruiterName)}</span>
          </span>
          {/* <button className='text-red-600' onClick={handleLogout}>Logout</button> */}
        </div>
      </div>

      {/* Content Cards */}
      <div className="space-y-6">
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
              {
                Object.entries(socialLinks).length > 0 ? (
                  Object.entries(socialLinks).map(([key, urls]) =>
                    Array.isArray(urls) && urls.length > 0 && (
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
                    )
                  )
                ) : (
                  <div>N/A</div>
                )
              }
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