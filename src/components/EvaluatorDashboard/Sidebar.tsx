import React, { useEffect, useState } from 'react';
import { Users, FileText, Briefcase, UsersRound, CircleUserRound } from 'lucide-react';
import { Candidate, EvaluationRequest } from 'src/types/index';
import { toTitleCase } from "@Utils/Titlecase.utils";
import { Menu, X, ChevronDown, LogOut } from "lucide-react";
import CognitoServiceObj from '@Utils/Cognito.utils';
import httpServiceObj from '@Services/ApiHandler.service';
import { InterviewHistoryResponse, InterviewItem } from '@Components/Shared/ApplicantsPage/InterviewHistorySidebar';
import { toast } from 'react-toastify';
import { getToastOptions } from '@Utils/Toast.utils';
import secureStorage from '@Utils/SecureStorage.utils';
import { SecureStorageKeyEnum } from '@Enums/SecureStorage.enum';
import { useAppContext } from '@Context/App.context';
interface SidebarProps {
  candidates: Candidate[];
  selectedCandidateId: string;
  onCandidateSelect: (candidateId: string) => void;
  userName: string;
  companyLogo: string;
  isLoadingData:boolean;
  setIsLoadingData:(value:boolean) => void;
  selectedCompanyId?: string;
  onCompanySelect?: (companyId: string) => void;
  groupedCompanies?: string[];
  requests: EvaluationRequest[];
  groupedCompaniesWithCompanyName?:any[]
  idToFetchInterviews:string[];
  setJobApplicationIdFromChild: (id: string) => void;
  interviewModal: {
    isOpen: boolean;
    data: any;
    candidateName: string;
  };

  setInterviewModal: React.Dispatch<
    React.SetStateAction<{
      isOpen: boolean;
      data: any;
      candidateName: string;
    }>
  >;
  numberOfPendingEvaluation:number
}

const Sidebar: React.FC<SidebarProps> = ({
  candidates,
  selectedCandidateId,
  onCandidateSelect,
  userName,
  companyLogo,
  isLoadingData,
  setIsLoadingData,
  selectedCompanyId,
  onCompanySelect,
  groupedCompanies,
  requests,
  groupedCompaniesWithCompanyName,
  idToFetchInterviews,
  setJobApplicationIdFromChild,
  interviewModal,
  setInterviewModal,
  numberOfPendingEvaluation
}) => {
  const userEmailAndId = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERDETAILS) as {
    sub: string;
    email: string;
  }
  const { userDetails } = useAppContext();
  const userId = userEmailAndId?.sub
  const userEmail = userEmailAndId?.email
  const [isLoading,setIsLoading] = useState<boolean>(false);
  const [listOfInterviewsData, setListOfInterviewsData] = useState<InterviewItem[]>([]);
  const [isOn, setIsOn] = useState(false);
  
  const fetchAllInterviews = async () => {
    try {
      setIsLoading(true);

      const results = await Promise.allSettled(
        idToFetchInterviews.map((jobId) =>
          httpServiceObj.get<InterviewHistoryResponse>(
            `/user-job-interview/${jobId}/interviews`,
            true,
            {},
            false,
            "JOB"
          )
        )
      );

      // Flatten + filter valid responses
      const allData = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled")
        .flatMap((r) => r.value.response?.data || []);

      // Sort + filter evaluator-specific
      const filteredData = allData
        .sort((a, b) => a.roundNumber - b.roundNumber)
        .filter((round: any) =>
          round?.attendees?.some(
            (att: any) =>
              att.email === userEmail &&
              att.type === "EVALUATOR"
          )
        );
        const now = new Date();
        const finalFilteredData = filteredData.filter((round: any) => {
          if (!round?.scheduledAt) return false;
          const scheduledTime = new Date(round.scheduledAt);
          return scheduledTime > now;
        });
      setListOfInterviewsData(finalFilteredData);
    } catch (error) {
      console.error("error while fetching interviews", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(()=>{
    fetchAllInterviews()
  },[idToFetchInterviews])

  useEffect(() => {
    if (candidates.length === 0) return
    if (selectedCandidateId) return
    setIsLoadingData(true)
    onCandidateSelect(candidates[0].id)
    setIsLoadingData(false)
  }, [candidates, selectedCandidateId])

  useEffect(() => {
  if (!groupedCompanies || groupedCompanies.length === 0) return;
  if (selectedCompanyId) return;

  // auto select first company
  onCompanySelect?.(groupedCompanies[0]);
}, [groupedCompanies, selectedCompanyId]);

  const handleLogout = async () => {
  try {
    await CognitoServiceObj.handleSignOut();
    sessionStorage.clear();
    window.location.href = 'https://worko.ai/';
  } catch (err) {
    console.error('Logout failed', err);
  }
};

  return (
    <div className="w-[212px] bg-[#316BFF] text-white h-full flex flex-col overflow-hidden rounded-tr-3xl rounded-br-3xl">
      <div className="p-4 flex-1 overflow-auto">
        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-3 p-3 rounded-lg bg-indigo-700/50">
          {/* <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center"> */}
            {/* <img
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            /> */}
            {/* <User className="w-6 h-6 text-white cursor-pointer" /> */}
          {/* </div> */}
          <div className='text-left'>
            <div className="font-medium text-sm">Evaluator Dashboard</div>
            {/* <p className='text-[0.625rem]'>Review and assess candidate profiles</p> */}
            <p className='text-[0.7rem]'>{userDetails?.fullName}</p>
          </div>
        </div>

        <div className="flex justify-center mb-3">
          <div className="inline-flex bg-white rounded-2xl p-1 shadow-md border">
          <button
              onClick={() => setIsOn(!isOn)}
              className={`px-4 py-1 rounded-xl text-xs font-semibold transition-all duration-300
              ${!isOn
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-400 hover:text-blue-500"
              }`}
          >
              Roles
          </button>

          <button
              onClick={() => setIsOn(!isOn)}
              className={`px-4 py-1 rounded-xl text-xs font-semibold transition-all duration-300
              ${isOn
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-400 hover:text-blue-500"
              }`}
          >
              Interviews
          </button>
          </div>
        </div> 
        {/* Candidates Section Header */}
        <div className="flex flex-col items-start justify-start mb-4">
          <div className="flex items-center justify-between w-full">
            
            {/* Left side */}
            <div className="flex items-center gap-2">
              {/* <CircleUserRound className="w-4 h-4" /> */}
              <h2 className="text-md font-semibold">
                {!isOn ? "Hiring Roles" : "Interviews"}
              </h2>
            </div>

            {/* Right side toggle */}
            {/* <button
              onClick={() => setIsOn(!isOn)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                isOn ? "bg-green-500" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isOn ? "translate-x-4" : "translate-x-1"
                }`}
              />
            </button> */}
          </div>

        {!isOn 
          ?<p className="text-[10px]">
            {numberOfPendingEvaluation}{" "}
            {numberOfPendingEvaluation > 1
              ? "roles to evaluate"
              : "role to evaluate"}
          </p>
          :<p className="text-[10px]">
            {listOfInterviewsData?.length}{" "}
            {listOfInterviewsData && listOfInterviewsData?.length > 1
              ? "upcoming interviews"
              : "upcoming interview"}
          </p>
        }
        </div>

        {/* Candidates List */}
        {!isOn ? 
        <div className="space-y-2 border-t-2">
          {/* {candidates.map((candidate) => {
            const isSelected = selectedCandidateId === candidate.id;
            return (
              <div
                key={candidate.id}
                onClick={() => onCandidateSelect(candidate.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-white text-slate-800 hover:bg-gray-50'
                    : 'hover:bg-[#3D78FF] text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 text-left">
                    <div
                      className={`text-sm truncate font-semibold w-40 ${
                        isSelected ? 'text-slate-800' : 'text-white'
                      }`}
                      data-tooltip-id="my-tooltip"
                      data-tooltip-content={(candidate.applicantName) || toTitleCase(candidate.email)}
                      data-tooltip-place="top"
                    >
                      {toTitleCase(candidate.applicantName) || toTitleCase(candidate.email)}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        isSelected ? 'text-slate-500' : 'text-indigo-200'
                      }`}
                    >
                      {new Date(candidate.sentTime).toLocaleString('en-GB', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </div>
                  </div>

                  {candidate.isNew && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      New
                    </span>
                  )}
                </div>
              </div>
            );
          })} */}
          {/* ---------------- NEW COMPANY SECTION ---------------- */}
          {groupedCompanies && groupedCompanies.length > 0 && (
            <div className="mt-3">
              {/* <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Companies
              </h3> */}

              <div className="space-y-0">
                {groupedCompanies.map((companyId) => {
                const isSelected = selectedCompanyId === companyId;

                // Lookup name
                const companyObj = groupedCompaniesWithCompanyName?.find(
                  (c) => c.companyId === companyId
                );
                const companyName = companyObj?.companyName || companyId;

                const count = requests.filter((r) => r.companyId === companyId).length;
                  return (
                    <div
                      key={companyId}
                      onClick={() => {
                        if(isSelected) return
                        onCompanySelect && onCompanySelect(companyId)
                      }}
                      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-white text-slate-800 hover:bg-gray-50'
                          : 'hover:bg-[#3D78FF] text-white'
                      }`}
                    >
                      <div>
                        <CircleUserRound className='h-5 w-4'/>
                      </div>
                      <div>                
                        <div                 
                        data-tooltip-id="my-tooltip"
                        data-tooltip-content={companyName}
                        data-tooltip-place="top"
                        className="text-xs text-left font-semibold truncate">
                          <p className='truncate max-w-[150px]'>{companyName}</p>
                        </div>
                        <div className="text-[10px] truncate flex gap-1 justify-start items-center">
                          <CircleUserRound className="w-3 h-3"/>
                          {count} {count > 1 ? "Candidates" : "Candidate"}
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
        // Upcoming Interview List
        : <div className="space-y-2 border-t-2">
          {/* <p className='pt-2'>Upcoming Interviews</p> */}

          {listOfInterviewsData && listOfInterviewsData.length > 0 ? (
            <div className="mt-3">
              <div className="space-y-0">
                {listOfInterviewsData.map((interview, index) => {
                  const scheduledTime = new Date(interview.scheduledAt);

                  return (
                    <div
                      key={interview.id || index}
                      onClick={()=> {
                          setInterviewModal({
                            isOpen: true,
                            data: {},
                            candidateName: interview?.applicantName
                          });
                        setJobApplicationIdFromChild(interview?.applicationId)
                      }}
                      className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[#3D78FF] text-white"
                    >
                      <div>
                        <CircleUserRound className="h-5 w-4" />
                      </div>

                      <div className="flex flex-col text-left">
                        <div
                          className="text-xs font-semibold truncate max-w-[150px]"
                          data-tooltip-id="my-tooltip"
                          data-tooltip-content={interview?.applicantName || "Candidate"}
                          data-tooltip-place="top"
                        >
                          {toTitleCase(interview?.applicantName || "Candidate")}
                        </div>

                        <div className="text-[10px] text-indigo-200">
                          {scheduledTime.toLocaleString("en-GB", {
                            year: "numeric",
                            month: "numeric",
                            day: "numeric",
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-indigo-200 mt-2">
              No upcoming interviews
            </p>
          )}
        </div>}
      </div>
      <div className="border-t border-white/20 pt-4 hover:text-red-600 pb-3">
        <button onClick={handleLogout} className="hover:text-red-500 text-white flex items-center justify-between focus:outline-none w-full text-left hover:bg-white/10 p-2 px-4 rounded text-[13px]"
            aria-label="Logout">
              <p>Logout</p>
            <LogOut className="cursor-pointer self-center" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
