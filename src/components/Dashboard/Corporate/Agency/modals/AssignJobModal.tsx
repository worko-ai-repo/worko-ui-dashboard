import SubmitButton from "@Components/ui/SubmitButton";
import { AgencyListDetailsDto, } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { JobData } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, SendIcon, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface AssignJobModalProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  jobsList: JobData[];
  agencyData:AgencyListDetailsDto;
  userDetails:any;
  localUpdate: (id: string, updatedData: Partial<any>) => void;
}

const AssignJobModal: React.FC<AssignJobModalProps> = ({ dashboardType, onClose, isOpen, jobsList, agencyData, userDetails, localUpdate }) => {
  // const [visible, setVisible] = useState(false);
  // const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);

  const [input, setInput] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<JobData[]>([]);
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const dropdownRef = useRef<HTMLDivElement>(null);
  // const modalRef = useRef<HTMLDivElement>(null);
  // Modal open/close animation
  // useEffect(() => {
  //   if (isOpen) {
  //     setVisible(true);
  //     const timer = setTimeout(() => setIsAnimatingIn(true), 10);
  //     return () => clearTimeout(timer);
  //   } else {
  //     setIsAnimatingIn(false);
  //     const timer = setTimeout(() => setVisible(false), 300);
  //     return () => clearTimeout(timer);
  //   }
  // }, [isOpen]);

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

  // Toggle job selection
  const toggleJobSelection = (job: JobData) => {
    setSelectedJobs(prev => {
      const isAlreadySelected = prev.find(j => j.id === job.id);
      if (isAlreadySelected) {
        return prev.filter(j => j.id !== job.id);
      } else {
        return [...prev, job];
      }
    });
  };

  // Check if job is selected
  const isJobSelected = (id: string) => {
    return selectedJobs.some(job => job.id === id);
  };

  // Submit handler
  const handleSubmit = async() => {
    setIsSubmitting(true);
    if(!userDetails){
      toast.error("No user details found please login again",getToastOptions({}))
      setIsSubmitting(false);
      return
    }

    if(selectedJobs.length <= 0){
      toast.error("Atleast one job needs to be selected",getToastOptions({}))
      setIsSubmitting(false);
      return
    }
    if(!agencyData.email || !agencyData.id){
      toast.error("Agency email and id is missing",getToastOptions({}))
      setIsSubmitting(false);
      return
    }
    const jobIds = selectedJobs.map((job)=>{
      return {
        jobId:job.id,
        jobTitle:job.jobTitle
      }
    })

    const payload = {
      companyId: userDetails?.companyId,
      jobsToAssign: jobIds,
      agencyEmail: agencyData.email,
      agencyInviteId: agencyData.id
    }
    try {
      const { response, error } = await httpServiceObj.post<any>( `${agencyBaseUrl}/agency-job-assignment/bulk`, payload, true, {}, true);

      if (!response) {
        if(error?.message == "Few jobs are already assigned to this agency, so check and try again."){
          toast.error(error?.message, getToastOptions({}));
        }else{
          toast.error("Error assigning data, please try again later.", getToastOptions({}));
        }
        return;
      }
      if(response.isSuccess){
        toast.success("Job assigned successfully!", getToastOptions({}));
          if(agencyData?.totalAssignedJobs){
              const updatedData = {...agencyData,totalAssignedJobs:agencyData.totalAssignedJobs + selectedJobs.length}
              localUpdate(agencyData?.id,updatedData)
          }else{
              const updatedData = {...agencyData,totalAssignedJobs:selectedJobs.length}
              localUpdate(agencyData?.id,updatedData)
          }
        setSelectedJobs([]);
        onClose();
      }
    // setTimeout(() => {
    //   console.log('Selected Jobs:', selectedJobs,userDetails);
    //   setIsSubmitting(false);
    //   setSelectedJobs([])
    //   onClose();
    // }, 1000);
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error("assigning job failed. Please try again.", getToastOptions({}));
    } finally {
      setIsSubmitting(false);
    }
  };

    const removeAllJobs = () =>{
      setSelectedJobs([]);
    }

  const addAllJobs = () => {
    if (jobsList.length === 0) {
        toast.error("No jobs found", getToastOptions({}));
        return;
  }
  setSelectedJobs(jobsList);

  };

  const removeSelectedJob = (id: string) => {
    setSelectedJobs(prev => {
      const filtered = prev.filter(job => job.id !== id);
      // console.log("After:", filtered.map(job => job.id));
      return filtered;
    });
  };

  return (
    // <div
    //   onMouseDown={(e) => {
    //     if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
    //       // reset();
    //       onClose();
    //     }
    //   }}
    //   className={`fixed inset-0 z-[80] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
    //     isAnimatingIn ? 'bg-black bg-opacity-50' : 'bg-opacity-0 bg-black'
    //   } ${visible ? 'visible' : 'invisible'}`}
    // >
    // <div
    //   ref={modalRef}
    //   className={`bg-white rounded-l-lg w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto ${
    //     !isAnimatingIn ? "animate-slide-out" : "animate-slide-in"
    //   }`}
    // >
    <div className="py-6">
        {/* <button
          onClick={()=>{
            onClose();
            setIsSubmitting(false);
            setSelectedJobs([]);
        }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button> */}

        <h2 className="text-xl font-semibold mb-4 text-left">Assign jobs</h2>

        {/* Deselect button - only show when rows are selected */}
        <div className='flex flex-row gap-3'>
            <button
                className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${selectedJobs.length === jobsList.length ? "hidden" : ""}`}
                onClick={() => addAllJobs()}
            >
                <span 
                    onClick={()=>addAllJobs()}
                    className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">+
                </span>
                <span>select all jobs</span>
            </button>

            <button
                className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${selectedJobs.length === 0 ? "hidden" : ""}`}
                onClick={removeAllJobs}
            >
                <span 
                    onClick={removeAllJobs}
                    className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">&minus;
                </span>
                <span>deselect all jobs</span>
            </button>
        </div>

        {/* Input & dropdown */}
        <div className="relative w-full" ref={dropdownRef}>
          <input
            type="text"
            value={input}
            onChange={handleChange}
            onFocus={() => setIsDropDownOpen(true)}
            placeholder="Choose the jobs to be assigned"
            className="w-full pr-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setIsDropDownOpen(prev => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-700 bg-blue-600 rounded text-white h-auto w-auto p-1"
          >
            <ChevronDown className="h-5 w-auto" />
          </button>

          {isDropDownOpen && jobsList.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-96 overflow-y-auto text-sm">
              {jobsList
                .filter(job =>
                  job?.jobTitle?.toLowerCase().includes(input.toLowerCase())
                )
                .map(job => (
                  <li
                    key={job.id}
                    onClick={() => toggleJobSelection(job)}
                    className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-start flex items-center gap-2"
                  >
                    <input
                      type="checkbox"
                      checked={isJobSelected(job.id)}
                      readOnly
                      className="form-checkbox text-blue-600"
                    />
                    <span>{`${job?.jobTitle} | ${job?.location?.fullLocation} | ${job?.salaryRange?.min}-${job?.salaryRange?.max} LPA`}</span>
                  </li>
                ))}
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

        {/* <div className="absolute bottom-6 left-6">
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={isSubmitting || selectedJobs.length === 0}
          >
            <SendIcon className="h-4 w-4" />
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
        </div> */}
        <div className="absolute bottom-6 left-6">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedJobs.length === 0}
          >
            <SubmitButton isSubmitting={isSubmitting}/>
          </button>
        </div>
    </div>
    //</div>
    //</div>
  );
};

export default AssignJobModal;
