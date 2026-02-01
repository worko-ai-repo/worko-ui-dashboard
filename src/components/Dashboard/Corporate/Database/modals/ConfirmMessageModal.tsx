import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface ConfirmMessageModalProps {
  onClose: () => void;
  isOpen: boolean;
  onContinue: () => void;
  onCancel: () => void;
}

const ConfirmMessageModal: FC<ConfirmMessageModalProps> = ({
  onClose,
  isOpen,
  onContinue,
  onCancel,
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

	const handleSubmit = () => {
	onContinue();
	};


  return (
	<div
	  className={`fixed inset-0 z-[101] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
		isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
	  } ${visible ? "visible" : "invisible"}`}>
	  <div
		className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
		  isAnimatingIn ? "translate-x-0" : "translate-x-full"
		}`}>
		<button
		  onClick={onCancel}
		  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
		  ×
		</button>
		<h2 className="text-lg font-semibold mb-4">"Details missing!"</h2>
		<p className="text-xs mb-4">
		  Some candidate details are missing and will not be moved to applicant. Are you sure you want to continue?
		</p>

		{/* Submit and cancel Button */}
		<div className="flex justify-center gap-3">
		  <button
			onClick={handleSubmit}
			disabled={isLoading}
			className={`w-30 flex items-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors duration-200 ${
			  isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-300"
			}`}>
			{isLoading ? "Accepting..." : "Continue"}
		  </button>
		  <button
			onClick={onCancel}
			className="w-30 flex items-center gap-2 bg-white text-blue-600 border border-blue-600 text-sm font-medium px-4 py-3 rounded-xl">
			Cancel
		  </button>
		</div>
	  </div>
	</div>
  );
};

export default ConfirmMessageModal;
