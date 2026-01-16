import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import secureStorage from "@Utils/SecureStorage.utils";
import { STATUS_COLORS } from "@Components/Shared/FindJobByDropdown";
import { useAppContext } from "@Context/App.context";

export type DropDownSelectedJobData = {
  id: string;
  jobTitle: string;
  status: string;
  jobDescription: string;
};

type JobListDropdownProps = {
  onSelect: (job: DropDownSelectedJobData) => void;
  placeholder?: string;
  dashboard?: "CORPORATE" | "ADMIN";
};

const fetchJobs = async (
  search: string,
  dashboard: "CORPORATE" | "ADMIN" = "CORPORATE",
  userId?: string
): Promise<DropDownSelectedJobData[]> => {
  const userCognitoDetails = secureStorage.getItem<any>(SecureStorageKeyEnum.COGNITOUSERDETAILS);
  const userType = userCognitoDetails?.["cognito:groups"]?.[0];

  const payload = {
    pageSize: 25,
    sortOrder: "desc",
    dashboard: dashboard,
    ...(dashboard !== "ADMIN" && {
      userRole: userType,
      ...(userType === "corporate-recruiter" && { corporateRecruiterUserId: userId }),
      companyId:
        secureStorage.getItem<any>(SecureStorageKeyEnum.CORPORATECOMPANYID)?.companyId ||
        secureStorage.getItem<any>(SecureStorageKeyEnum.LOGINDETAILS)?.companyId,
    }),
    searchText: search.trim(),
  };

  const response = await CorporateServiceObj.fetchJobs(payload);
  return response?.data || [];
};

const JobListDropdown: React.FC<JobListDropdownProps> = ({
  onSelect,
  placeholder = "Search jobs...",
  dashboard = "CORPORATE",
}) => {
  const [searchText, setSearchText] = useState("");
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { userDetails } = useAppContext();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["jobsPopup", searchText],
    queryFn: () => fetchJobs(searchText, dashboard, userDetails?.id),
    enabled: true,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectJob = (job: DropDownSelectedJobData) => {
    setSearchText(job.jobTitle);
    setDropdownVisible(false);
    onSelect(job);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownVisible(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Choose Job description from dropdown
      </label>
      <div className="relative" ref={dropdownRef}>
        <input
          type="text"
          placeholder={placeholder}
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setDropdownVisible(true);
          }}
          onFocus={() => setDropdownVisible(true)}
          className="w-full p-2 pr-10 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <ChevronDown
          className="cursor-pointer absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none"
          size={18}
        />
        {dropdownVisible && (
          <div className="no-scrl no-scrl-web cursor-pointer absolute mt-1 w-full z-10 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded shadow">
            {isLoading && <div className="p-3 text-sm text-gray-500 text-center">Loading...</div>}

            {!isLoading && (!jobs || jobs.length === 0) && (
              <div className="p-3 text-sm text-gray-500 text-center">
                {searchText ? `No jobs found for "${searchText}"` : "No jobs available"}
              </div>
            )}

            {!isLoading && Array.isArray(jobs) && jobs.length > 0 && (
              <>
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    onClick={() => handleSelectJob(job)}
                    className="p-2 px-3 hover:bg-blue-50 border-b-2 rounded-md cursor-pointer capitalize">
                    <div className="text-sm font-medium text-left">{job.jobTitle}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          STATUS_COLORS[job.status] || "bg-gray-300"
                        }`}
                      />
                      <span>{job.status.toLowerCase()}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default JobListDropdown;
