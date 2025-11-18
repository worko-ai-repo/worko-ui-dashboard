import { AgencyListDetailsDto, } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import { JobData } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, Plus, SendIcon, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

interface AssignJobModalProps {
  dashboardType: string;
  onClose: () => void;
  isOpen: boolean;
  // jobsList: JobData[];
  agencyData:AgencyListDetailsDto;
  userDetails:any;
}

interface CompanyFormData {
  companyName: string;
  designation: string;
  department: string;
  experienceInMonths: number | string;
  emailId: string;
}

interface Company {
  aboutCompany:string,
  id: string;
  name: string;
  carrierPage:string;
  industry:string;
  isDeleted:boolean;
  isVerified:boolean;
  teamSize:number;
}

interface CompanyAPIResponse {
  data: Company[];
  pagination: {
    count: number;
    pageSize: number;
    queriedCount: number;
    sortOrder: string;
    timesQueried: number;
  };
}



const AssignJobModal: React.FC<AssignJobModalProps> = ({ dashboardType, onClose, isOpen, agencyData, userDetails }) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDropDownOpen, setIsDropDownOpen] = useState(false);

  const [input, setInput] = useState('');
  const [selectedJobs, setSelectedJobs] = useState<JobData[]>([]);
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // states for selecting company 
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectionMade, setSelectionMade] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [companyJobs, setCompanyJobs] = useState<JobData[]>([]);
  const [formData, setFormData] = useState<CompanyFormData>({
  companyName: '',
  designation: '',
  department: '',
  experienceInMonths: '',
  emailId: '',
});

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

    const jobIds = selectedJobs.map((job)=>{
      return job.id
    })

    const payload = {
      companyId: userDetails?.companyId,
      jobsToAssign: jobIds,
      agencyEmail: agencyData.email,
      agencyInviteId: agencyData.id
    }

    try {
      const { response } = await httpServiceObj.post<any>( `${agencyBaseUrl}/agency-job-assignment/bulk`, payload, true, {}, true);

      if (!response) {
        toast.error("Error assigning data, please try again later.", getToastOptions({}));
        return;
      }
      if(response.isSuccess){
        toast.success("Job assigned successfully!", getToastOptions({}));
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
    if (companyJobs.length === 0) {
      toast.error("No jobs found for this company", getToastOptions({}));
      return;
    }
    setSelectedJobs(companyJobs);
  };

  const removeSelectedJob = (id: string) => {
    setSelectedJobs(prev => {
      const filtered = prev.filter(job => job.id !== id);
      console.log("After:", filtered.map(job => job.id));
      return filtered;
    });
  };

  // search companies to assign jobs
  useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (formData.companyName.trim() && !selectionMade) {
      fetchCompanies(formData.companyName);
    } else {
      setSuggestions([]);
    }
  }, 250);
  
    return () => clearTimeout(delayDebounce);
  }, [formData.companyName, selectionMade]);
  
  const fetchCompanies = async (query:string) => {
    try {
      // const {response} = await httpServiceObj.get(`/company?companyName=${query}&isVerified=0`,true,{});
      const {response} = await httpServiceObj.get(`/company?companyName=${query}`,true,{});
      // console.log(response)
      const typedResponse = response as CompanyAPIResponse;
      setSuggestions(typedResponse.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  useEffect(() => {
    // if user changes the typed name after selecting, clear the selection
    if (selectionMade && selectedCompany && formData.companyName !== selectedCompany.name) {
      setSelectionMade(false);
      setSelectedCompany(null);
    }
  }, [formData.companyName, selectionMade, selectedCompany]);


  const handleCompanyChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'companyName') {
      setSelectionMade(false);      
      setShowSuggestions(true);
    }
  };

  const handleSuggestionClick = (company: Company) => {
    setFormData((prev) => ({ ...prev, companyName: company.name }));
    setSelectionMade(true);
    setSelectedCompany(company);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  // call this with selectedCompany.id
  const fetchJobs = async (companyId: string) => {
    const params = {
      pageSize: 200,
      sortOrder: "desc",
      dashboard: "ADMIN",
      // userRole: "ADMIN",
      status: "PUBLISHED",
      companyId,
    };
    try {
      const { response } = await httpServiceObj.get<any>(`/job`, true, params, false, "JOB");
      if (response?.data) {
        setCompanyJobs(response.data);
      } else {
        setCompanyJobs([]);
      }
    } catch (error) {
      console.log(error);
      setCompanyJobs([]);
    }
  };

  useEffect(() => {
    if (selectedCompany?.id && selectionMade) {
      setSelectedJobs([]);
      setInput("");
      fetchJobs(selectedCompany.id);
    } else {
      setCompanyJobs([]);
    }
  }, [selectedCompany?.id, selectionMade]);


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
            setIsSubmitting(false);
            setSelectedJobs([]);
        }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">Assign jobs</h2>

        {/* Deselect button - only show when rows are selected */}
        <div className='flex flex-row gap-3'>
            <button
                className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${selectedJobs.length === companyJobs.length ? "hidden" : ""}`}
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


        {/* Company name typing */}
      <div>
        {/* <label className="text-sm font-medium mb-1 text-left">
          Company Name <span className="text-red-500">*</span>
        </label> */}
        <div className="relative">
          <input
            type="text"
            placeholder="Enter company name"
            className="border px-3 py-2 rounded-xl w-full mb-4"
            value={formData.companyName}
            onChange={(e) => handleCompanyChange('companyName', e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // allow click
            autoComplete="off"
          />

          {formData.companyName?.trim() && !selectionMade && showSuggestions && (
            <ul className="border bg-white rounded shadow-md absolute w-full z-10 max-h-60 overflow-y-auto">
              {suggestions.map((company, idx) => (
                <li
                  key={company.id ?? idx}
                  className="block w-full px-4 py-2 hover:bg-gray-100 cursor-pointer text-left"
                  onMouseDown={() => handleSuggestionClick(company)}
                >
                  {company.name}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      
        {/* Input & dropdown */}
        <div className="relative w-full" ref={dropdownRef}>
          <input
            type="text"
            value={input}
            onChange={handleChange}
            onFocus={() => {
              if (!selectedCompany?.id) return;
              setIsDropDownOpen(true);
            }}
            placeholder={
              selectedCompany?.id ? "Choose the jobs to be assigned" : "Select a company first"
            }
            className="w-full pr-10 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none disabled:bg-gray-100"
            disabled={!selectedCompany?.id}
          />
          <button
            type="button"
            onClick={() => {
              if (!selectedCompany?.id) return;
              setIsDropDownOpen(prev => !prev);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 hover:text-gray-700 bg-blue-600 rounded text-white h-auto w-auto p-1 disabled:opacity-50"
            disabled={!selectedCompany?.id}
          >
            <ChevronDown className="h-5 w-auto" />
          </button>

          {isDropDownOpen && companyJobs.length > 0 && (
            <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-90 overflow-y-auto text-sm">
              {companyJobs
                .filter(job => job?.jobTitle?.toLowerCase().includes(input.toLowerCase()))
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

export default AssignJobModal;
