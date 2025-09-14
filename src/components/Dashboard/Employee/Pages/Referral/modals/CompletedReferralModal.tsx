import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface CompletedReferralModalProps {
  onClose: () => void;
  isOpen: boolean;
  referralData: any;
  onRefresh: () => void;
  isCandidate?: boolean;
}

const CompletedReferralModal: FC<CompletedReferralModalProps> = ({
  onClose,
  isOpen,
  referralData,
  onRefresh,
  isCandidate,
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const { user } = useDashboardContext();

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

  const handleSubmit = async () => {
    setIsLoading(true);
    if (!referralData) {
      toast.error("No company id found", getToastOptions({}));
      setIsLoading(false);
      return;
    }
    if (!user) {
      toast.error("No user found", getToastOptions({}));
      setIsLoading(false);
      return;
    }
    if (!isCandidate) {
      try {
        const payload = {
          action: "DONE",
          emailId: user.email,
          userId: user.sub,
        };
        console.log(referralData, payload);
        const url = `/emp/referral/${referralData.id}/action`;
        const { response } = await httpServiceObj.put(url, payload, true);
        console.log(response);
        if (response) {
          toast.success("Referral request marked as done", getToastOptions({}));
          setIsError("");
          onRefresh();
          onClose();
        }
      } catch (error: any) {
        console.log(error);
        const errorMsg = error?.message || "Something went wrong";
        setIsError(errorMsg);
        toast.error(errorMsg, getToastOptions({}));
      } finally {
        setIsLoading(false);
      }
    } else {
      try {
        console.log(referralData);
        const url = `/user/${user.email}/referral/${referralData.id}/DONE`;
        const { response } = await httpServiceObj.put(url, {}, true);
        console.log(response);
        if (response) {
          toast.success("Referral request marked as done", getToastOptions({}));
          setIsError("");
          onRefresh();
          onClose();
        }
      } catch (error: any) {
        console.log(error);
        const errorMsg = error?.message || "Something went wrong";
        setIsError(errorMsg);
        toast.error(errorMsg, getToastOptions({}));
      } finally {
        setIsLoading(false);
      }
    }
  };
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

        <p className="text-lg font-semibold mb-4">
          Are you sure you want to mark this referral as done?
        </p>

        {/* Submit and cancel Button */}
        <div className="flex justify-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`w-30 flex items-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors duration-200 ${
              isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-300"
            }`}>
            <SendIcon className="w-4 h-4" />
            {isLoading ? "Accepting..." : "Accept"}
          </button>
          <button
            onClick={onClose}
            className="w-30 flex items-center gap-2 bg-white text-blue-600 border border-blue-600 text-sm font-medium px-4 py-3 rounded-xl">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompletedReferralModal;
