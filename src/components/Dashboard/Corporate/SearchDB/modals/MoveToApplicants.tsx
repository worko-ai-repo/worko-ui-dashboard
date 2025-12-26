import { AgencyDatabaseApplicantDetailsDto, AgencyListDetailsDto, } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { JobData } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, Plus, SendIcon, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useSearchParams } from "react-router-dom";
import { toast } from 'react-toastify';

interface MoveToApplicantsProps {
  dashboardType: string;
  textToDisplay:string;
  onClose: () => void;
  isOpen: boolean;
  jobsList: JobData[];
  candidateData:AgencyDatabaseApplicantDetailsDto;
  userDetails:any;
  submitFunction:((row:any,currentText:string,selectedJobId:string)=>void)
  selectedJobId:string;
}

export interface CompanyFormData {
  companyName: string;
  designation: string;
  department: string;
  experienceInMonths: number | string;
  emailId: string;
}

export interface Company {
  aboutCompany:string,
  id: string;
  name: string;
  carrierPage:string;
  industry:string;
  isDeleted:boolean;
  isVerified:boolean;
  teamSize:number;
}

export interface CompanyAPIResponse {
  data: Company[];
  pagination: {
    count: number;
    pageSize: number;
    queriedCount: number;
    sortOrder: string;
    timesQueried: number;
  };
}



const MoveToApplicants: React.FC<MoveToApplicantsProps> = ({ dashboardType, textToDisplay, onClose, isOpen, candidateData, userDetails, submitFunction , jobsList, selectedJobId}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);

  const [input, setInput] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<JobData[]>([]);
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [companyJobs, setCompanyJobs] = useState<JobData[]>([]);
  const [isLoadingCompany, setIsLoadingCompany] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  // Modal open/close animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropDownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setIsDropDownOpen(true);
  };

  // Check if job is selected
  const isJobSelected = (id: string) => {
    return selectedJobs.some(job => job.id === id);
  };

  const selectSingleJob = (job:JobData) => {
  setSelectedJobs([job]); 
  setIsDropDownOpen(false); 
};

  // Submit handler
const handleSubmit = async () => {
  setIsSubmitting(true);

  try {
    await submitFunction(
      candidateData,
      textToDisplay,
      selectedJobs[0]?.id,
    );

    setSelectedJobs([]);
    onClose();
  } catch (error) {
    console.error(error);
  } finally {
    setIsSubmitting(false);
  }
};


  // const handleSubmit = async() => {
  //   setIsSubmitting(true);
  //   if(!userDetails){
  //     toast.error("No user details found please login again",getToastOptions({}))
  //     setIsSubmitting(false);
  //     return
  //   }

  //   if(selectedJobs.length <= 0){
  //     toast.error("Atleast one job needs to be selected",getToastOptions({}))
  //     setIsSubmitting(false);
  //     return
  //   }

  //   const jobIds = selectedJobs.map((job)=>{
  //     return job.id
  //   })

  //   let payload:any = {
  //     jobId: selectedJobs[0]?.id,
  //     candidateParsedCvId: candidateData.id,
  //   }

  //   if(text === "Move to applicants"){
  //     payload = {
  //       ...payload,
  //       companyName: selectedJobs[0].companyName,
  //       jobTitle: selectedJobs[0].jobTitle,
  //     }
  //   }
  //   try {
  //     let url = text === "Find matching score"
  //     ? `${agencyBaseUrl}/candidate-parsed-cv/find-matching-score`
  //     : `${agencyBaseUrl}/candidate-parsed-cv/move-to-applicant`;

  //     const {response, error} = await httpServiceObj.post<any>(url,payload,true,{},true)

  //     if (error) {
  //       if(error?.message){
  //         toast.error(error.message, getToastOptions({}));
  //         return;
  //       }else{
  //         if(text === "Find matching score") toast.error("Find matching score failed. Please try again.", getToastOptions({}));
  //         if(text === "Move to applicants") toast.error("Candidate moving to applicant failed. Please try again.", getToastOptions({}));
  //         return;
  //       }
  //     }
  //     if(response){
  //       if(text === "Find matching score") {
  //         toast.success("Find Score initiated please wait", getToastOptions({}));
  //         return
  //       }
  //       if(text === "Move to applicants") {
  //         toast.success("Candidate moved to applicant successfully", getToastOptions({}));
  //         return
  //       } 
  //       setSelectedJobs([]);
  //       onClose();
  //     }
  //   } catch (err) {
  //     console.error("Assignment error:", err);
  //     toast.error("candidate moving to applicant failed. Please try again.", getToastOptions({}));
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const removeSelectedJob = (id: string) => {
    setSelectedJobs(prev => {
      const filtered = prev.filter(job => job.id !== id);
      // console.log("After:", filtered.map(job => job.id));
      return filtered;
    });
  };

    // call this with selectedCompany.id
  const fetchJobs = async () => {
    setIsLoadingJobs(true)
      const params = {
        pageSize: 200,
        sortOrder: "desc",
        dashboard: "CORPORATE",
        userRole: "corporate-recruiter",
        status: "PUBLISHED",
        companyId: userDetails?.companyId,
        corporateRecruiterUserId: userDetails?.id,
      }
    try {
      const {response} = await httpServiceObj.get<any>(`/job`,true,params,false,"JOB")
      if (response?.data) {
        setCompanyJobs(response.data);
      } else {
        setCompanyJobs([]);
      }
    } catch (error) {
      console.log(error);
      setCompanyJobs([]);
    } finally{
      setIsLoadingJobs(false)
    }
  };

  useEffect(() => {
    fetchJobs();
    setSelectedJobs([]);
    setInput("");
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? 'bg-black bg-opacity-50' : 'bg-opacity-0 bg-black'
      } ${visible ? 'visible' : 'invisible'}`}
    >
    <div
      className={`bg-white rounded-l-lg w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto ${
        isAnimatingIn ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
    <div className="p-6 min-h-[100vh] overflow-y-auto">
        <button
          onClick={()=>{
            onClose();
            setIsSubmitting(false);
            setSelectedJobs([]);
        }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">{textToDisplay}</h2>
      
        {/* Input & dropdown */}
        <div className="relative w-full" ref={dropdownRef}>
          <input
            type="text"
            value={input}
            onChange={handleChange}
            onFocus={() => {
              setIsDropDownOpen(true);
            }}
            placeholder={"Choose the jobs to be assigned"}
            className="w-full pr-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none disabled:bg-gray-100"
          />
          <button
            type="button"
            onClick={() => {
              setIsDropDownOpen(prev => !prev);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-700 bg-blue-600 rounded text-white h-auto w-auto p-1 disabled:opacity-50"
          >
            <ChevronDown className="h-5 w-auto" />
          </button>

        {isDropDownOpen && (
          <ul
            className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto text-sm"
            aria-live="polite"
          >
            {/* loading jobs */}
            {isLoadingJobs && (
              <li className="block w-full px-4 py-2 text-gray-500 text-left">
                Loading jobs...
              </li>
            )}

            {/* when jobs is not loading */}
            {!isLoadingJobs && (() => {

              // Compute filtered list one time
              const filtered = companyJobs.filter(job =>
                job?.jobTitle?.toLowerCase().includes(input.toLowerCase())
              );

              // company has no jobs
              if (companyJobs.length === 0) {
                return (
                  <li className="block w-full px-4 py-2 text-gray-500 text-left">
                    No jobs posted for this company
                  </li>
                );
              }

              // company has jobs but filtered list is empty
              if (filtered.length === 0) {
                return (
                  <li className="block w-full px-4 py-2 text-gray-500 text-left">
                    No matching jobs
                  </li>
                );
              }

              // render filtered jobs successfully
              return filtered.map(job => (
                <li
                  key={job.id}
                  onMouseDown={() => selectSingleJob(job)}
                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-start flex items-center gap-2"
                >
                  {/* <input
                    type="checkbox"
                    checked={isJobSelected(job.id)}
                    readOnly
                    className="form-checkbox text-blue-600"
                  /> */}
                  <span>
                    {`${job?.jobTitle} | ${job?.location?.fullLocation || "N/A"} | ${
                      job?.salaryRange?.min ?? "—"
                    }-${job?.salaryRange?.max ?? "—"} LPA`}
                  </span>
                </li>
              ));
            })()}
          </ul>
        )}

        </div>

        {/* display selected in UI */}
        <div className="flex flex-wrap gap-2 mt-3 max-h-[60vh] overflow-y-auto pr-2">
        {selectedJobs.map(job => (
            <div
            key={job.id}
            className="flex items-center bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full"
            >
            <span>{job.jobTitle}</span>
            <button
                onClick={() => removeSelectedJob(job.id)}
                className="ml-1 hover:text-red-500"
            >
                <X className="w-3 h-3" />
            </button>
            </div>
        ))}
        </div>


        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting || selectedJobs.length === 0}
          >
            <SendIcon className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div>
    </div>
    </div>
    </div>
  );
};

export default MoveToApplicants;
