import { FC, useEffect, useState } from "react";

interface FinalReviewModalProps {
  onClose: () => void;
  isOpen: boolean;
  successfullySentCandidateList:string;
  incompleteSentCandidateList:string;
  repeatedCandidatesList:string;
}

const FinalReviewModal: FC<FinalReviewModalProps> = ({
  onClose,
  isOpen,
  successfullySentCandidateList,
  incompleteSentCandidateList,
  repeatedCandidatesList,
}) => {
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
		  onClick={onClose}
		  className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
		  ×
		</button>
		<h2 className="text-xl font-semibold mb-4 text-left">Final Review List</h2>
		{successfullySentCandidateList.trim() &&		
			<h2 className="text-md font-semibold mb-4 text-left text-green-500">Sent to applicant : 
				<span className="text-sm font-normal text-black"> {successfullySentCandidateList}</span>
			</h2>
		}
		{incompleteSentCandidateList.trim() &&		
		<h2 className="text-md font-semibold mb-4 text-left text-red-500">Not Sent to applicant : 
			<span className="text-sm font-normal text-black"> {incompleteSentCandidateList}</span>
		</h2>
		}
		{repeatedCandidatesList.trim() &&
		<h2 className="text-md font-semibold mb-4 text-left text-blue-500">Already present in applicant : 
			<span className="text-sm font-normal text-black"> {repeatedCandidatesList}</span>
		</h2>
		}
	  </div>
	</div>
  );
};

export default FinalReviewModal;
