import { AgencyListDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, SendIcon, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface Joblist {
  id: string;
  jobName: string;
  location: string;
  CTC: number;
}

interface RemoveJobModalProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  jobsList: Joblist[];
  agencyData:AgencyListDetailsDto;
  userDetails:any;
}

const RemoveJobModal: React.FC<RemoveJobModalProps> = ({ dashboardType, onClose, isOpen, jobsList, agencyData, userDetails }) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);
  const [isReasonDropDownOpen, setIsReasonDropDownOpen] = useState(false);

  const [input, setInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<Joblist[]>([]);
  const [selectedReason, setSelectedReason] = useState('');
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const dropdownRef = useRef<HTMLDivElement>(null);
  const reasondropdownRef = useRef<HTMLDivElement>(null);


  const reasons = [
    "Not getting good applicants",
    "Role closed",
    "Position is in hold"
  ]
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

  // Close dropdown when clicking outside for jobs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropDownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Close dropdown when clicking outside for jobs for reason
  useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (reasondropdownRef.current && !reasondropdownRef.current.contains(event.target as Node)) {
      setIsReasonDropDownOpen(false);
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

  // Reason Input handler 
  const handleReasonChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setReasonInput(e.target.value);
    setIsDropDownOpen(true);
  };

  // Toggle job selection
  const toggleJobSelection = (job: Joblist) => {
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

    const payload = selectedJobs.map(jobs=>({
          agencyRegisteredEmail:userDetails.email,
          agencyUserId: agencyData?.id,
          companyId: userDetails.id,
          jobId: jobs.id
    }));

    try {
    const { response } = await httpServiceObj.post( `${agencyBaseUrl}/agency-job-assignment/`, payload, true, {}, true);

    if (!response) {
      toast.error("Error assigning data, please try again later.", getToastOptions({}));
      return;
    }

    toast.success("Job assigned successfully!", getToastOptions({}));
    setSelectedJobs([]);
    onClose();
    // setTimeout(() => {
    //   console.log('Selected Jobs:', selectedJobs,userDetails);
    //   setIsSubmitting(false);
    //   setSelectedJobs([])
    //   onClose();
    // }, 1000);
    } catch (err) {
      console.error("Assignment error:", err);
      toast.error("Unexpected error occurred. Please try again.", getToastOptions({}));
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
    setSelectedReason("");
    };

const removeSelectedJob = (id: string) => {
  setSelectedJobs(prev => {
    const filtered = prev.filter(job => job.id !== id);
    console.log("After:", filtered.map(job => job.id));
    return filtered;
  });
};



  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
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
            setSelectedJobs([]);
            setSelectedReason("");
        }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">Removal jobs</h2>

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
            placeholder="Choose the jobs to be removed"
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
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-90 overflow-y-auto text-sm">
              {jobsList
                .filter(job =>
                  job.jobName.toLowerCase().includes(input.toLowerCase())
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
                      className="form-checkbox"
                    />
                    <span>{`${job.jobName} | ${job.location} | ${job.CTC} LPA`}</span>
                  </li>
                ))}
            </ul>
          )}
        </div>

        {/* Reason & dropdown */}
        <div className="mt-4 relative w-full" ref={reasondropdownRef}>
        <input
            type="text"
            value={selectedReason}
            onFocus={() => setIsReasonDropDownOpen(true)}
            placeholder="Reason for removal"
            readOnly
            className="w-full pr-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none cursor-pointer"
        />
        <button
            type="button"
            onClick={() => setIsReasonDropDownOpen(prev => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-700 bg-blue-600 rounded text-white h-auto w-auto p-1"
        >
            <ChevronDown className="h-5 w-auto" />
        </button>

        {isReasonDropDownOpen && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg text-sm">
            {reasons.map((reason, idx) => (
                <li
                key={idx}
                onClick={() => {
                    setSelectedReason(reason);
                    setIsReasonDropDownOpen(false);
                }}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-start"
                >
                <span>{reason}</span>
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
            <span>{job.jobName}</span>
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
            disabled={isSubmitting || selectedJobs.length === 0 || selectedReason === ""}
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

export default RemoveJobModal;
