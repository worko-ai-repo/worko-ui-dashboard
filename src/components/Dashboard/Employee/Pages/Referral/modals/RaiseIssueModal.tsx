import { useAppContext } from "@Context/App.context";
import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react"; 
import { toast } from "react-toastify";

interface RaiseIssueModalProps {
  onClose: () => void;
  isOpen: boolean;
  referralData:any;
  onRefresh: () => void;
  isCandidate:boolean;
}

const RaiseIssueModal: FC<RaiseIssueModalProps> = ({
  onClose,
  isOpen,
  referralData,
  onRefresh,
  isCandidate
}) => {
  let options

  if(isCandidate){
      options = [
      "Referee not responding",
      "Rude Behaviour",
      "Referral has not been done",
      "Others"
    ];
  }else if(!isCandidate){
    options = [
      "Behaviour not good",
      "Fake CV",
      "Not relevant experience",
      "Already applied earlier",
      "Others"
    ];
  }

  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const { user } = useDashboardContext();
  const {userDetails}=useAppContext();

  const handleSubmit = async() =>{
    if(!reason){
      toast.error("Please select a reason", getToastOptions({}))
      return
    }
    if(!comments){
      toast.error("Please provide detailed comment", getToastOptions({}))
      return
    }
    if(!user){
      toast.error("No user found",getToastOptions({}))
      setIsLoading(false);
      return
    }
    const splitedName = userDetails?.fullName.split(" ");
    const firstName = splitedName?.[0];
    const lastName = splitedName?.[splitedName.length-1];
    try {
          const payload = {
              contextId: referralData.id,
              contextType: "REFERRAL",
              userEmail: user.email,
              userFirstName:firstName,
              userLastName:lastName,              
              userMessage: comments,
              userRole: isCandidate ? "CAND" : "EMP",
              userSupportType: reason,
          }
            const url = `/support`
            const {response,error} = await httpServiceObj.post(url,payload,true)
            if(response){
                toast.success("Issue has been Raised", getToastOptions({}));
                setIsError("")          
                onRefresh()
                onClose()
            }
            if(error){
                toast.error("Cannot raise issue not something went wrong", getToastOptions({}));
                console.log(error)
                setIsLoading(false)
            }
        } catch (error: any) {
            console.log(error);
            const errorMsg = error?.message || "Something went wrong";
            setIsError(errorMsg);
            toast.error(errorMsg, getToastOptions({}));
        } finally{
            setIsLoading(false)
        }
  }

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
        } ${visible ? "visible" : "invisible"}`}
        >
        <div
            className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
            isAnimatingIn ? "translate-x-0" : "translate-x-full"
            }`}
        >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">Raise issue here</h2>

        {/* Dropdown */}
        <label className="block text-sm font-medium text-gray-700 mb-1"></label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select issue </option>
          {options.map((opt, idx) => (
            <option key={idx} value={opt}>{opt}</option>
          ))}
        </select>

        {/* Textarea */}
        <label className="block text-sm font-medium text-gray-700 mb-1"></label>
        <textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full border rounded-xl px-3 py-2 mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
          placeholder="Please provide a detailed feedback. It will help us to do a better matching"
        />

        {/* Submit and cancel Button */}
        <div className="flex justify-center gap-3">
            <button
                onClick={handleSubmit}
                disabled={isLoading}
                className={`w-30 flex items-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors duration-200 ${
                    isLoading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-300'
                }`}
                >
                <SendIcon className="w-4 h-4" />
                {isLoading ? 'Accepting...' : 'Accept'}
                </button>
            <button
                onClick={onClose}
                className="w-30 flex items-center gap-2 bg-white text-blue-600 border border-blue-600 text-sm font-medium px-4 py-3 rounded-xl"
                >
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default RaiseIssueModal;
