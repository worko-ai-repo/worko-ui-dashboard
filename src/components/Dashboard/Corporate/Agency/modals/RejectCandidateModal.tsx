import { useAppContext } from "@Context/App.context";
import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { getToastOptions } from "@Utils/Toast.utils";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";
//@TODO this whole component is copy-pasted so needs full refactor
interface RejectCandidateModalProps {
  onClose: () => void;
  isOpen: boolean;
  data: any;
  // onRefresh: () => void;
  localUpdate: (id: string, updatedData: Partial<any>) => void;
  // rejectCandidate?:() => void;
  setFetchData?:(data:any)=>void;
  type:string;
  setSelectedRows: React.Dispatch<React.SetStateAction<any[]>>;
}

const RejectCandidateModal: FC<RejectCandidateModalProps> = ({
  onClose,
  isOpen,
  data,
  // onRefresh,
  localUpdate,
  // rejectCandidate,
  setFetchData,
  type,
  setSelectedRows,
}) => {
  const options = [
    "Duplicate profile",
    "Profile not suitable",
    "Experience miss-match",
    "Salary miss-match",
    "Education miss-match",
    "Others",
  ];
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const { user } = useDashboardContext();
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE
  const { userDetails } = useAppContext() as { userDetails: NormalizedUser };
  
  const handleSubmit = async () => {
    if (!reason) {
      toast.error("Please select a reason", getToastOptions({}));
      return;
    }
    if (reason === "Others" && !comments.trim()) {
      toast.error("Please provide detailed comment", getToastOptions({}));
      return;
    }
    if (!data || !userDetails) {
      toast.error("No data found", getToastOptions({}));
      return;
    }
    setIsLoading(true);
    try {
      const payload:any = {
        agencyUserSubmissionId: data?.id,
        rejectApplicantReason: reason,
      };
      if(comments.trim()){
        payload.rejectApplicantDetailedReason = comments.trim()
      }
      const url = `${agencyBaseUrl}/agency-user-submission/reject-applicant`;
      const { response, error } = await httpServiceObj.patch(url, payload, true, {}, true);
      if (response) {
        const updatedData = {...data,jobApplicationStatus:"REJECTED"}
        localUpdate(data.id,updatedData)
        toast.success("Referral rejected successfully", getToastOptions({}));
        setIsError("");
        onClose();
      }
      if(error){
        toast.error(error.message,getToastOptions({}))
      }
      } catch (error: any) {
      const errorMsg = error?.message || "Something went wrong";
      setIsError(errorMsg);
      toast.error(errorMsg, getToastOptions({}));
    } finally {
      setIsLoading(false);
      // if(type == "multiple"){
      //   setFetchData((prevData:any) =>
      //       prevData.filter((candidate:any) =>
      //         !data.some((sel:any) => sel.id === candidate.id)
      //       )
      //   );
      //   setSelectedRows(()=>[])
      // }else if(type == "single"){
      //   setFetchData((prev:any) => prev?.filter((item:any) => item.id !== data.id))
      //     setSelectedRows((prev: any[]) =>
      //     prev.filter((row) => row.id !== data.id)
      //   );
      // }
      // onClose()
    }
  };

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

  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button>

        <h2 className="text-sm font-semibold mb-4 text-left">
          Why are you rejecting?
        </h2>

        {/* Dropdown */}
        <label className="block text-xs font-medium text-gray-700 mb-1"></label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Choose your reason for rejection </option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>
              {opt}
            </option>
          ))}
        </select>

        {/* Textarea */}
        <label className="block text-xs font-medium text-gray-700 mb-1"></label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full h-[15em] border rounded-xl px-3 py-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Please provide a detailed feedback. It will help us to do a better matching"
        />

        {/* Submit and cancel Button */}
        <div className="flex justify-start gap-3">
            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-30 flex items-center gap-2 text-white text-xs font-medium px-4 py-3 rounded-xl transition-colors duration-200 ${
                    isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-300'
                }`}
                >
                <SendIcon className="w-4 h-4" />
                {isLoading ? 'Submitting...' : 'Submit'}
                </button>
        </div>
      </div>
    </div>
  );
};

export default RejectCandidateModal;
