import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface VerifyCompanymodalProps {
  onClose: () => void;
  isOpen: boolean;
}

const VerifyCompanymodal: FC<VerifyCompanymodalProps> = ({ onClose, isOpen }) => {
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

  const handleSubmit = async () => {
    const baseUrl = window.location.origin;
    const currentPath = window.location.pathname;

    const cleanedPath = currentPath.replace(/\/(referral)\/?$/, "/profile");

    const redirectUrl = `${baseUrl}${cleanedPath}`;
    onClose();
    window.location.href = redirectUrl;
  };
  return (
    <div
      className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-xl relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        {/* <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button> */}
        <h2 className="text-lg font-semibold mb-4 ">Verification Required</h2>
        <p className="text-start">Verify your corporate email now to unlock referral requests!</p>
        &nbsp;
        <p className="text-start">- Confirm your employment with a quick email verification.</p>
        <p className="text-start">- Only one-time verification needed; no further communication.</p>
        <p className="text-start">- Enjoy anonymity and exclusive opportunities</p>
        &nbsp;
        <p className="text-start">Join us in making meaningful connections!</p>
        {/* Submit and cancel Button */}
        &nbsp;
        <div className="flex justify-center gap-3">
          <button
            onClick={handleSubmit}
            className={`w-30 flex items-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors duration-200 bg-blue-500 hover:bg-blue-300`}>
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyCompanymodal;
