import { useEffect, useState } from "react";
import { Submit } from "@AssetsFolder/assets";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { joining_success_img } from "@Assets";

interface JoinedModalProps {
  isOpen: boolean;
  onClose: () => void;
  userDetails: any;
  job: JobApplicationDetailsDto | null;
  onSuccess: () => void;
}

export default function JoinedModal({
  isOpen,
  onClose,
  userDetails,
  job,
  onSuccess,
}: JoinedModalProps) {
  const [joiningDate, setJoiningDate] = useState<string>("");
  const [hrName, setHrName] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!isOpen) return null;

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
    if (!message || !joiningDate || !hrName) {
      toast.error("HR Name, Message, and Date are required", getToastOptions());
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
      const payload = {
        applicantName:userDetails.name,
        userId: userDetails?.sub,
        emailId: userDetails?.email,
        userType: "CAND",
        status: "JOINED",
        joiningDate,
        joiningHrName: hrName,
        joiningApplicantMessage: message,
      };

      const { response, error } = await httpServiceObj.patch(
        `https://jobs.dev.worko.work/job-application/${job.id}/applicant-action`,
        payload,
        true,
        {},
        true
      );

      if (error) {
        setError("Failed to submit. Please try again.");
        return;
      }

      console.log("Submitted successfully:", response);
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-lg">
            {/* Joining Date */}
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">
                Joining date <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center bg-gray-100 rounded-lg px-3">
                <input
                  type={joiningDate ? "date" : "text"}
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  onFocus={(e) => (e.target.type = "date")}
                  placeholder="Select date"
                  className="w-full bg-transparent p-2 focus:outline-none"
                />
              </div>
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
                placeholder="Write email address"
                className="w-full bg-gray-100 rounded-lg p-3 focus:outline-none"
              />
            </div>

            {/* Message */}
            <div className="mb-6">
              <label className="block text-gray-700 mb-2">
                Message <span className="text-red-500">*</span>
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
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full flex flex-col items-center">
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
