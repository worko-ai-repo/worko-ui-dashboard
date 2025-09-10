import profileService from "@Components/Dashboard/Employee/Service/ProfileService";
import { useAppContext } from "@Context/App.context";
import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react"; 
import { toast } from "react-toastify";

interface ViewDetailsModalProps {
  show: boolean;
  viewDetailsContent:any;
  onClose: () => void;
}

const ViewDetailsModal: FC<ViewDetailsModalProps> = ({
  show,
  viewDetailsContent,
  onClose,
}) => {

    const [visible, setVisible] = useState(false);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
//   const [comments, setComments] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isError, setIsError] = useState("");
    const { user } = useDashboardContext();
    const {userDetails}=useAppContext();
    const [rating, setRating] = useState(1);
    const [strengths, setStrengths] = useState<string[]>([]);

  useEffect(() => {
        // if (!show) {
        //     setStrengths([]);
        //     return;
        // }
        const raw = viewDetailsContent.scoreDetails;
        console.log(raw)
        if (typeof raw === 'string' && raw.trim() !== '') {
            try {
            const parsed = JSON.parse(raw);
            if (parsed.RecruiterNote) {
            // if (parsed && Array.isArray(parsed.Strengths)) {
                setStrengths(parsed.RecruiterNote);
            } else {
                setStrengths([]);
            }
            } catch (e) {
            console.error('Failed to parse scoreDetails:', e);
            setStrengths([]);
            }
        } else {
            setStrengths([]);
        }
      if (show) {
        setVisible(true);
        const timer = setTimeout(() => setIsAnimatingIn(true), 10);
        return () => clearTimeout(timer);
      } else {
        setIsAnimatingIn(false);
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
      }
    }, [show]);

  return (
       <div
        className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
            isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
        } ${visible ? "visible" : "invisible"}`}
        >
        <div
            className={`bg-white rounded-l-lg p-6 w-full max-w-3xl relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
            isAnimatingIn ? "translate-x-0" : "translate-x-full"
            }`}
        >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">Matching score details</h2>
            
<div className="flex justify-center items-stretch gap-3">
  <div style={{ flexBasis: '70%',minHeight: "180px" }} className="flex-shrink-0">
    <h1 className="text-lg font-semibold mb-4 text-left">
      Feedback summary for :{" "}
      <span className="text-blue-600">{viewDetailsContent?.name || "NA"}</span>
    </h1>
    <p className="border rounded-xl bg-gray-200 text-sm p-4 text-left overflow-y-auto max-h-[180px]">{strengths}</p>
  </div>

    <div style={{ flexBasis: '30%',minHeight: "180px" }} className="border rounded-xl bg-blue-600 text-white p-4 flex flex-col justify-between">
    <h1 className="text-sm font-semibold text-left">Matching Score</h1>

    <div className="w-20 flex flex-col items-center justify-center mx-auto relative">
        <svg className="absolute scale-100%" width="100" height="100" viewBox="0 0 65 65">
        <circle cx="32.5" cy="32.5" r="30" fill="none" stroke="#d0f0f9" strokeWidth="5" />
        <circle
            cx="32.5"
            cy="32.5"
            r="30"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="5"
            strokeDasharray={`${(viewDetailsContent?.matchingScore / 100) * 2 * Math.PI * 30} ${
            2 * Math.PI * 30
            }`}
            transform="rotate(-90 32.5 32.5)"
        />
        </svg>
        <div className="absolute font-semibold text-3xl">{viewDetailsContent?.matchingScore}%</div>
    </div>

    <span className="block text-center font-semibold text-sm">
        {(() => {
        const score = viewDetailsContent?.matchingScore ?? 0;

        if (score <= 40) return "POOR";
        if (score <= 60) return "AVERAGE";
        if (score <= 75) return "GOOD";
        if (score <= 85) return "VERY GOOD";
        return "EXCELLENT";
        })()}
    </span>
    </div>

</div>

      </div>
    </div>
  );
};

export default ViewDetailsModal;
