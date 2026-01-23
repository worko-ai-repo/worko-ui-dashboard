import { useEffect, useState } from "react";
import { Submit } from "@AssetsFolder/assets";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";

import { joining_success_img } from "@Assets";
import { getToastOptions } from "@Utils/Toast.utils";
import { JobTypes } from "../JobTypes";

interface JoinedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDetails: any;
  job: JobApplicationDetailsDto | null;
  onSuccess: () => void;
  onLocalUpdate:((jobId: string, updatedData: Partial<JobTypes>)=>void);
}

interface Payload {
  applicantName: string;
  userId: string;
  emailId: string;
  userType: string;
  status: string;
  joiningDate: string;
  joiningHrName: string;
  joiningApplicantMessage?: string; // optional
}

export default function JoinedModal({
  isOpen,
  onClose,
  userDetails,
  job,
  onSuccess,
  onLocalUpdate,
}: JoinedModalProps) {
  const [joiningDate, setJoiningDate] = useState<string>("");
  const [hrName, setHrName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  
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

  if (!isOpen) return null;

  const today = new Date();
  const isoToday = today.toISOString().split("T")[0];

  // Past 3 months
  const past3 = new Date();
  past3.setMonth(past3.getMonth() - 3);
  const isoPast3 = past3.toISOString().split("T")[0];

  // Future 3 months
  const future3 = new Date();
  future3.setMonth(future3.getMonth() + 3);
  const isoFuture3 = future3.toISOString().split("T")[0];

  function showSuccessAndClear() {
    setShowSuccessModal(true);

    // auto-close after 5s
    setTimeout(() => {
      setShowSuccessModal(false);
      onSuccess()
      onClose();
    }, 5000);

    // reset form fields
    setHrName("");
    setMessage("");
    setJoiningDate("");
  }

  /** Close success modal manually */
  function closeSuccess() {
    setShowSuccessModal(false);
    onSuccess()
    onClose();
  }

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    const selectedDate = new Date(joiningDate);      
    const today = new Date();
    today.setHours(0, 0, 0, 0); 
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate > today) {
      toast.error('Date cannot be in the future.',getToastOptions({}));
      return;
    }

    if (!joiningDate || !hrName) {
      toast.error("HR Name, and Date are required", getToastOptions());
      setLoading(false);
      return;
    }

    if(!userDetails){
    toast.error("User Details not found", getToastOptions());
      setLoading(false);
      return;
    }
    if(!job){
    toast.error("Job Id not found", getToastOptions());
      setLoading(false);
      return;
    }

    try {
      let payload: Payload = {
      applicantName: userDetails.name,
      userId: userDetails?.sub,
      emailId: userDetails?.email,
      userType: "CAND",
      status: "JOINED",
      joiningDate,
      joiningHrName: hrName,
    };

    if (message && message.trim() !== "") {
      payload.joiningApplicantMessage = message;
    }

      const { response, error } = await httpServiceObj.patch(
        `/job-application/${job.id}/applicant-action`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error) {
        setError("Failed to submit. Please try again.");
        return;
      }
      onLocalUpdate(job.id,{status:"JOINED"})
      // console.log("Submitted successfully:", response);
      showSuccessAndClear();
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      {/* Main Modal */}
      {isOpen && (
      <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ease-in-out ${
           isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"} ${visible ? "visible" : "invisible"}`}>
      <div className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out h-[75vh] ${
            isAnimatingIn ? "translate-x-0" : "translate-x-full"}`}>
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>
            {/* Joining Date */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Joining date <span className="text-red-500">*</span>
              </label>
              {/* <div className="flex items-center bg-gray-100 rounded-lg px-3"> */}
                <input
                  onKeyDown={(e) => e.preventDefault()}
                  type={joiningDate ? "date" : "text"}
                  value={joiningDate}
                  min={isoPast3}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  onFocus={(e) => (e.target.type = "date")}
                  placeholder="Select date"
                  className="w-full bg-gray-100 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              {/* </div> */}
            </div>

            {/* HR Name */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                HR name <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={hrName}
                onChange={(e) => setHrName(e.target.value)}
                placeholder="Write HR name"
                className="w-full bg-gray-100 rounded-lg p-3 focus:outline-none"
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                Message <span className="text-red-500"></span>
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Any message you want to write"
                className="w-full bg-gray-100 rounded-lg p-3 focus:outline-none h-28 resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex justify-start space-x-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center disabled:opacity-50"
              >
                <img src={Submit} alt="submit" className="w-4 h-4 mr-2" />
                {loading ? "Submitting..." : "Submit"}
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>

            {error && <p className="text-red-500 mt-3">{error}</p>}
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full flex flex-col items-center">
            <img
              src={joining_success_img}
              alt="success"
              className="w-full max-h-[80vh] object-contain mb-6"
            />
            <button
              onClick={closeSuccess}
              className="mt-4 px-6 py-3 rounded-lg bg-blue-600 text-white text-lg hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
