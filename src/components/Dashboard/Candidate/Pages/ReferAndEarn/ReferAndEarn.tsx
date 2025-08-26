import { useState, useEffect } from "react";
import { JobApiResponse } from "../Job/JobTypes";
import { JobDetails } from "@Components/Dashboard/types";
import EarningsDropdown from "./EarningsDropdown";
import MainTable from "./ReferAndEarnTable";
import httpServiceObj from "@Services/ApiHandler.service";

const stats = [
    { label: 'Total Applicants', value: 106 },
    { label: 'Rejected', value: 90 },
    { label: 'Reviewed', value: 20 },
    { label: 'New Applicants', value: 10 },
    { label: 'Hired', value: 90 },
  ];
  
  const handleRedirect = () => {
    const baseUrl = window.location.origin;
    window.location.href = `${baseUrl}/v0/jobs?dashboard=USER`;
  };

  const ReferAndEarn = () => {
    const [isJobDescriptionModalOpen, setIsJobDescriptionModalOpen] = useState(false);
    const [isJobFormModalOpen, setIsJobFormModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"PUBLISHED" | "CLOSED" | "ARCHIVED">("PUBLISHED");
    const [searchBarText, setSearchBarText] = useState<string>('');
    const [data, setData] = useState<JobApiResponse | null>(null);
    const [jobDetails, setJobDetails] = useState<JobDetails | null>(null);
  
    return (
      <div className="w-full space-y-[35px] px-0">
        <div className='flex flex-col sm:flex-row gap-4 sm:gap-24 justify-between'>
          <div className=" flex-1 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-start">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white shadow-md rounded-xl px-7 py-4 text-center min-w-[130px]"
                >
                  <p className="text-sm text-[#64748B]">{stat.label}</p>
                  <p className="text-2xl font-extrabold text-gray-900">{stat.value}</p>
                </div>
              ))}
            </div>
              
            <div className="flex flex-row w-full bg-white shadow-md rounded-[15px] overflow-hidden">
              <input
                type="text"
                placeholder="Search"
                value={searchBarText}
                onChange={(e) => setSearchBarText(e.target.value)}
                className="px-4 py-3 w-full outline-none bg-[#FAFAFA] text-sm"
              />
              <button
                
                className="bg-gradient-to-t from-[#316BFF] to-[#5FC9FF] text-white px-6 py-0 rounded-[15px] rounded-l-none">
                Search
              </button>
              
            </div>
          <div className="w-max">
            <button
              onClick={handleRedirect}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white text-sm font-medium shadow hover:bg-blue-700"
            >
              Refer a friend
            </button>
          </div>
          </div>
          <EarningsDropdown />
        </div>
  
  
        <MainTable searchbarText={searchBarText} />
  
      </div>
    );

}
export default ReferAndEarn;
