import profileService from "@Components/Dashboard/Employee/Service/ProfileService";
import { useAppContext } from "@Context/App.context";
import { useDashboardContext } from "@Context/Dashboard.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useState } from "react";
import { toast } from "react-toastify";

interface Feedback {
  GSI1PK: string;
  GSI1SK: string;
  PK: string;
  SK: string;
  createdAt: string;
  createdByUserId: string;
  id: string;
  rating: number;
  ratingByUserId: string;
  ratingForUserId: string;
  ratingForUserType: string;
  referalId: string;
  reviewContext: string;
  reviewText: string;
  updatedAt: string;
}

interface ProvideFeedbackModalProps {
  onClose: () => void;
  isOpen: boolean;
  referralData: any;
  onRefresh: () => void;
  isCandidate?: boolean;
}

interface UserDetails {
  id: string;
}

const ProvideFeedbackModal: FC<ProvideFeedbackModalProps> = ({
  onClose,
  isOpen,
  referralData,
  onRefresh,
  isCandidate,
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [comments, setComments] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const { user } = useDashboardContext();
  const { userDetails } = useAppContext();
  const [rating, setRating] = useState(1);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [feedback, setFeedback] = useState<any>({});
  const [isFetchingFeedback, setIsFetchingFeedback] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user) {
      toast.error("No user found", getToastOptions({}));
      return;
    }
    if (!comments.trim()) {
      toast.error("Please provide your feedback before submitting.", getToastOptions({}));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(true);

    const fullEmail = referralData?.PK.split("#");
    const emailOfCandidate = fullEmail[fullEmail.length - 1];

    let id;

    try {
      const userData = await profileService.fetchUserData(emailOfCandidate, "details");

      if (!userData || !userData[0]?.id) {
        toast.error("Candidate ID not found", getToastOptions({}));
        return;
      }

      id = userData[0].id;
    } catch (error: any) {
      console.error("Error fetching user data:", error);
      setIsError(error?.message || "Failed to fetch user data");
      return;
    }

    try {
      const payload = {
        rating: rating,
        ratingForUserType: isCandidate ? "EMP" : "CAND",
        referalId: referralData.id,
        reviewContext: isCandidate ? "EMP_REFERRAL" : "CAND_USER",
        reviewText: comments,
      };

      const url = `/user/${id}/review`;
      const { response, error } = await httpServiceObj.post(url, payload, true);

      if (response) {
        toast.success("Feedback submitted Successfully", getToastOptions({}));
        setIsError("");
        onRefresh();
        onClose();
      }

      if (error) {
        toast.error("Cannot submit feedback. Something went wrong.", getToastOptions({}));
        console.log(error);
      }
    } catch (error: any) {
      console.log(error);
      const errorMsg = error?.message || "Something went wrong";
      setIsError(errorMsg);
      toast.error(errorMsg, getToastOptions({}));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchFeedback = async () => {
    const fullEmail = referralData?.PK.split("#");
    const emailOfCandidate = fullEmail[fullEmail.length - 1];

    let id;
    setIsFetchingFeedback(true); // ✅ separate loading state
    try {
      const userData = await profileService.fetchUserData(emailOfCandidate, "details");

      if (!userData || !userData[0]?.id) {
        toast.error("Candidate ID not found", getToastOptions({}));
        return;
      }

      id = userData[0].id;

      const url = `/user/${id}/review/received?referalId=${referralData.id}`;
      const { response } = await httpServiceObj.get(url, true);
      const data = response as Feedback[]
      if (data.length > 0) {
        setAlreadySubmitted(true);
        setFeedback(data[0]);
      } else {
        setAlreadySubmitted(false);
      }
    } catch (error: any) {
      console.error(error);
      setIsError(error?.message || "Failed to fetch user data");
    } finally {
      setIsFetchingFeedback(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
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

  if (isFetchingFeedback) {
    return null;
  }

  if (alreadySubmitted) {
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
          <h2 className="text-xl font-semibold mb-4 text-left">Feedback Review</h2>

          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Rating:</span>
            <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-white bg-blue-600 rounded-full">
              {feedback.rating} / 5
            </span>
          </div>

          <div className="bg-gray-100 text-gray-800 text-sm p-4 rounded-md border border-gray-200 leading-relaxed whitespace-pre-line">
            {feedback.reviewText || "No feedback text provided."}
          </div>
        </div>
      </div>
    );
  }
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

        <h2 className="text-xl font-semibold mb-4 text-left">How do you rate this request?</h2>

        <div className="mb-6">
          <input
            type="range"
            min="1"
            max="5"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="text-center mt-2 text-sm text-gray-600">
            Rating: <span className="font-semibold">{rating}</span> / 5
          </div>
        </div>

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
            disabled={isSubmitting}
            className={`w-30 flex items-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors duration-200 ${
              isSubmitting ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-300"
            }`}>
            <SendIcon className="w-4 h-4" />
            {isSubmitting ? "Submitting..." : "Submit"}
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

export default ProvideFeedbackModal;
