import BulkCvForm from "@Components/Shared/BulkCvPage/BulkCvForm";
import { AgencyDatabaseApplicantDetailsDto, AgencyListDetailsDto, } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { JobData } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, Plus, SendIcon, X } from 'lucide-react';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import CorporateServiceObj from "../../Services/Corporate.service";
import Modal from "@Components/Shared/Modal";

interface SelectJobForBulkMatchProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  // jobsList: JobData[];
  agencyData:AgencyDatabaseApplicantDetailsDto[];
  userDetails:any;
  setLoader:((value:boolean) => void);
  loader:boolean;
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

const SelectJobForBulkMatch: React.FC<SelectJobForBulkMatchProps> = ({ dashboardType, onClose, isOpen, agencyData, userDetails, setLoader, loader }) => {
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
  const [isbulkCvFormOpen, setIsBulkCvFormOpen] = useState(false);
  const [jobdescription, setJobDescription] = useState<string>("");
  const [data, setData] = useState<any>(null);
  // const [loader, setLoader] = useState(false);

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
  const handleSubmit = async() => {
    handleParseJd(jobdescription)
    // setIsSubmitting(true);
    // if(!userDetails){
    //   toast.error("No user details found please login again",getToastOptions({}))
    //   setIsSubmitting(false);
    //   return
    // }

    // if(selectedJobs.length <= 0){
    //   toast.error("Atleast one job needs to be selected",getToastOptions({}))
    //   setIsSubmitting(false);
    //   return
    // }

    // const jobIds = selectedJobs.map((job)=>{
    //   return job.id
    // })

    // const payload = {
    //   jobId: selectedJobs[0]?.id,
    //   companyName: selectedJobs[0]?.companyName,
    //   applicantEmail: agencyData[0]?.emailId
    // }

    // try {
    //   const {response, error} = await httpServiceObj.post<any>(`/job-application/move-to-applicant`,payload,true,{},false,"JOB")

    //   if (error) {
    //     if(error?.message){
    //       toast.error(error.message, getToastOptions({}));
    //       return;
    //     }else{
    //       toast.error("candidate moving to applicant failed. Please try again.", getToastOptions({}));
    //       return;
    //     }
    //   }
    //   if(response){
    //     toast.success("Job moved to applicant successfully", getToastOptions({}));
    //     setSelectedJobs([]);
    //     onClose();
    //   }
    // } catch (err) {
    //   console.error("Assignment error:", err);
    //   toast.error("candidate moving to applicant failed. Please try again.", getToastOptions({}));
    // } finally {
    //   setIsSubmitting(false);
    // }
  };

    async function handleParseJd(jobDescription: string) {
    setLoader(true);
    try {
      if (!jobDescription.trim()) {
        toast.error("Please enter a valid job description.", getToastOptions());
        return;
      }
      const response = await CorporateServiceObj.parseJobDescription(jobDescription);
      if (!response) {
        throw new Error("Failed to parse job description");
      }
      setData(response);
      onSubmit(response)
      // setIsBulkCvFormOpen(true);
      onClose()
    } catch (error) {
      console.error("Error parsing job description:", error);
    } finally {
      setLoader(false);
    }
  }

    async function onSubmit(data: any) {
      // Explicit guards for required fields
      // if (!data.industryPreference || data.industryPreference.trim() === "") {
      //   setError("industryPreference", { type: "required", message: "Industry preference is required" });
      //   toast.error("Industry preference is required", getToastOptions({}));
      //   return;
      // }
      // if (!data.jobLocation || data.jobLocation.trim() === "") {
      //   setError("jobLocation", { type: "required", message: "Job location is required" });
      //   toast.error("Job location is required", getToastOptions({}));
      //   return;
      // }
      // if (uploadedFiles.length === 0) {
      //   setUploadError("Please upload at least one CV");
      //   return;
      // }
  
      // setIsProcessing(true);
      // onClose();
      // toast.info(
      //   "Your request is being processed , you will be notified once done.",
      //   getToastOptions({})
      // );
      // setUploadError("");
      console.log(data)
      try {
        const finalPayload = {
          companyId: userDetails?.companyId,
          jobDescription: jobdescription || "",
          jobTitle: data.jobTitle,
          jobLocation: data.jobLocation,
          mustHaveSkills: data.mustHave,
          mustNotHaveSkills: data.mustNotHaveSkills,
          goodToHaveSkills: data.goodToHave,
          coreSkills: data.coreSkills,
          softSkills: data.softSkills,
          technicalSkills: data.technicalSkills,
          industryPreferences: data.industryPreference ? [data.industryPreference] : [],
          experienceRange: {
            min: data.experienceRange.min,
            max: data.experienceRange.max,
          },
        };
        // Step 1: Create a partition in ddb for the bulk CV check
        const request = await CorporateServiceObj.bulkScreening(finalPayload);
        if (!request || !("id" in request)) {
          throw new Error("Failed to create bulk screening request or missing 'id' property");
        }
        const bulkJdId = request.id;
        // setBulkResumeId(bulkJdId);
        // // Use this id to store the data in ddb
        const filePayload:any = [{
          cvAwsS3BucketName: "worko-app-dev",
          cvAwsS3FileName : "01KAX0CCHREJCRXTRC4H542PCN.pdf",
          cvAwsS3FilePath: "users/a1637d9a-f0e1-7036-1931-bb48d02fc75b/resumes",
          cvAwsS3ResourceType: "USER_RESUME"
        }]
        const response = await CorporateServiceObj.bulkScreeningUpload(filePayload, bulkJdId);
        // await storeDataToS3(filePayload, bulkJdId);
        // setBulkScreenDone(true);
      } catch (error) {
        console.error("Error creating bulk screening request:", error);
        // setUploadError("Failed to create bulk screening request");
        // setIsProcessing(false);
        return;
      }
    }


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
      const params: Record<string, any> = {
        pageSize: 200,
        sortOrder: "desc",
        dashboard: "CORPORATE",
        userRole: userDetails?.userType[0],
        status: "PUBLISHED",
        companyId: userDetails?.companyId,
      }
    if(userDetails?.userType[0] === "corporate-recruiter") params.corporateRecruiterUserId = userDetails?.id
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
    setSelectedJobs([]);
    setInput("");
    if(userDetails?.userType && userDetails?.companyId) fetchJobs()
  }, [userDetails?.userType, userDetails?.companyId]);

  // if (loader) {
  //   return (
  //     <div className="flex justify-center items-center h-screen">
  //       <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
  //       <span className="ml-4 text-gray-700">Loading...</span>
  //     </div>
  //   );
  // }

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

        <h2 className="text-xl font-semibold mb-4 text-left">Select job for bulk cv check</h2>
      
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
                  onMouseDown={() => {
                    selectSingleJob(job)
                    setJobDescription(job.jobDescription)
                  }}
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
      {isbulkCvFormOpen && (
        <Modal
          isOpen={isbulkCvFormOpen}
          className={"max-w-[1000px] max-sm:w-[80vw]"}
          onClose={() => setIsBulkCvFormOpen(false)}>
          <Suspense
            fallback={
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2">Loading form...</span>
              </div>
            }>
            <BulkCvForm
              isOpen={isbulkCvFormOpen}
              jobData={data}
              dropDownData={jobdescription}
              onClose={() => setIsBulkCvFormOpen(false)}
            />
          </Suspense>
        </Modal>
      )}{" "}
    </div>
  );
};

export default SelectJobForBulkMatch;
