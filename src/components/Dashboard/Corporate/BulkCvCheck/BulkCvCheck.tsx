import JobListDropdown, { DropDownSelectedJobData } from "@Components/Shared/DropDown/JobListDropdown";

import { useState , useEffect} from "react";

import CorporateServiceObj from "../Services/Corporate.service";

import { useLocation, useNavigate } from "react-router-dom";
import ScreeningListView from "@Components/Shared/BulkCvPage/BulkScreeningListView";
import BulkCvForm from "@Components/Shared/BulkCvPage/BulkCvForm";

const BulkCVCheck: React.FC = () => {
  const [isScreeningNew, setisScreeningNew] = useState(true);
  const [data, setData] = useState<any>(null);
  const [loader, setLoader] = useState(false);
  const [dropDownData, setDropDownData] = useState<DropDownSelectedJobData | null>(null);
  const [isbulkCvFormOpen, setIsBulkCvFormOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const tab = queryParams.get("tab");
    setisScreeningNew(tab !== "screening-list");
  }, [location.search]);

  const handleTabChange = (isFormOpen: boolean) => {
    setisScreeningNew(isFormOpen);
    const tab = isFormOpen ? "new-screening" : "screening-list";
    navigate(`?tab=${tab}`);
  };

  async function handleParseJd(jobDescription: string) {
    try {
      setLoader(true);
      const response = await CorporateServiceObj.parseJobDescription(jobDescription);
      if (!response) {
        throw new Error("Failed to parse job description");
      }
      setData(response);
    } catch (error) {
      console.error("Error parsing job description:", error);
    } finally {
      setLoader(false);
      setIsBulkCvFormOpen(true);
    }
  }

  if (loader) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-gray-700">Loading...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex justify-center mb-6 border-gray-200">
        <button className={`px-4 py-2 font-medium ${isScreeningNew ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700"}`} onClick={() => handleTabChange(true)}>
          New screening
        </button>
        <button className={`px-4 py-2 font-medium ml-6 ${!isScreeningNew ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-700"}`} onClick={() => handleTabChange(false)}>
          Screening list
        </button>
      </div>

      {/* Conditional Rendering */}
      {isScreeningNew ? (
        <div className="space-y-6 bg-white rounded-xl p-6">
          <h2 className="text-lg text-start font-semibold text-gray-800">Bulk cv check</h2>

          <div className="px-8">
            <JobListDropdown
              onSelect={(job) => {
                handleParseJd(job.jobDescription);
                setDropDownData(job);
              }}
            />
          </div>

          {/* OR Divider */}
          <div className="text-center text-blue-600 font-medium">Or</div>

          {/* Text Area */}
          <div className="px-8">
            <label className="block text-sm font-medium mb-1">
              <span className="text-red-600">*</span> Paste job description
            </label>
            <div className="relative">
              <textarea onChange={(e) => {handleParseJd(e.target.value); setDropDownData(null)}} className="w-full h-60 p-4 rounded-md bg-[#EBEFF3] text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Write or paste here" />
            </div>
          </div>
        </div>
      ) : (
        <ScreeningListView />
      )}   
      <BulkCvForm isOpen={isbulkCvFormOpen} jobData={data} dropDownData={dropDownData} onClose={() => setIsBulkCvFormOpen(false)} />
    </div>
  );
};

export default BulkCVCheck;
