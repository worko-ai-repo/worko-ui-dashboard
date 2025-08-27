import { useNavigate } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import JobListDropdown from "./DropDown/JobListDropdown";

interface JobSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  path : "APPLICATIONS" | "BULKCVCHECK", 
  dashboard?: "CORPORATE" | "ADMIN";
}

export const STATUS_COLORS: Record<string, string> = {
  PUBLISHED: "bg-green-500",
  CLOSED: "bg-red-500",
  DRAFT: "bg-gray-400",
  ARCHIVED: "bg-yellow-500",
};

const JobSelectorModal: React.FC<JobSelectorModalProps> = ({ 
  isOpen, 
  onClose, 
  path = "APPLICATIONS",
  dashboard = "CORPORATE" 
}) => {

const navigate = useNavigate();
const applicationPath = dashboard === "CORPORATE" ? "cApplicants" : "aApplicants";
const onSelect = (jobId: string) => {
  navigate(`/${dashboard.toLocaleLowerCase()}/${applicationPath}/${jobId}`);
  onClose();
};
return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className=" bg-white w-full max-w-lg rounded-xl p-6 shadow-xl relative">
            {/* Title */}
            <h2 className="  text-xl font-semibold text-gray-600 mb-4">
                {path === "APPLICATIONS"
                    ? "Select a job to view applications."
                    : "Select a job to perform bulk CV checks."}
            </h2>
            <div>
                <div className=" flex items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center justify-start gap-2">
                        <AlertCircle className="text-xs w-4 h-4" />
                        <div className="">
                            {path === "APPLICATIONS"
                                ? "You can only view applications for jobs you have created."
                                : "You can only perform bulk CV checks for jobs you have created."}
                        </div>
                    </span>
                </div>
            </div>

        {/* Search */}
        <JobListDropdown onSelect={(job) => onSelect(job.id)} dashboard={dashboard}/>

        {/* Close Button */}
        <div className="mt-6 flex justify-end">
          <button
            onClick={() => { onClose();
              if(dashboard === 'ADMIN') navigate(`/${dashboard.toLocaleLowerCase()}/aJobs`);
              else navigate(`/${dashboard.toLocaleLowerCase()}/Jobs`);
            }}
            className="btn_primary px-4 py-2 text-sm font-medium text-white hover:text-gray-800 transition-colors"
          >
            Back to jobs
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobSelectorModal;