import React, { useState } from "react";
import { Star, MessageSquare, Send, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "react-toastify";
import interviewServiceObj from "@Services/Interview.service";
import { useAppContext } from "@Context/App.context";
import { getToastOptions } from "@Utils/Toast.utils";

interface InterviewCompletionFeedbackProps {
  interviewId: string;
  onComplete?: () => void;
}

const InterviewCompletionFeedback: React.FC<InterviewCompletionFeedbackProps> = ({
  interviewId,
  onComplete,
}) => {
  const { userDetails } = useAppContext();
  const [rating, setRating] = useState<number>(0);
  const [hoveredRating, setHoveredRating] = useState<number>(0);
  const [comments, setComments] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ rating?: string; comments?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: { rating?: string; comments?: string } = {};

    if (rating < 1 || rating > 5) {
      newErrors.rating = "Please provide a rating between 1 and 5 stars";
    }

    if (comments && comments.length > 500) {
      newErrors.comments = "Comments cannot exceed 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting",getToastOptions({autoClose: 4000}));
      return;
    }

    if (!userDetails?.email) {
      toast.error("User email not found. Please log in again.",getToastOptions({autoClose: 4000}));
      return;
    }

    setIsSubmitting(true);

    try {
      const { response, error } = await interviewServiceObj.completeInterview(interviewId, {
        candidateEmail: userDetails.email,
        status: "COMPLETED",
        userFeedback: {
          rating,
          comments: comments.trim() || undefined,
        },
      });

      if (error) {
        toast.error(error,getToastOptions({autoClose: 4000}));
        setIsSubmitting(false);
        return;
      }

      if (response) {
        setIsSubmitted(true);
        toast.success("Thank you for your feedback!",getToastOptions({autoClose: 4000}));
        setTimeout(() => {
          onComplete?.();
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("An unexpected error occurred. Please try again.",getToastOptions({autoClose: 4000}));
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number): string => {
    switch (rating) {
      case 1:
        return "Poor";
      case 2:
        return "Fair";
      case 3:
        return "Good";
      case 4:
        return "Very Good";
      case 5:
        return "Excellent";
      default:
        return "Rate your experience";
    }
  };

  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-green-100">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
            <p className="text-gray-600">
              Your feedback has been submitted successfully. We appreciate your time and input.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-8 border border-blue-100">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Interview Complete! 🎉</h2>
          <p className="text-gray-600">
            We'd love to hear about your experience. Your feedback helps us improve.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label className="block text-lg font-semibold text-gray-900 mb-4">
              How would you rate your interview experience?
              <span className="text-red-500 ml-1">*</span>
            </label>

            <div className="flex flex-col items-center space-y-4">
              {/* Star Rating */}
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full p-1"
                    aria-label={`Rate ${star} stars`}>
                    <Star
                      className={`w-10 h-10 transition-colors ${
                        star <= (hoveredRating || rating)
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  </button>
                ))}
              </div>

              {/* Rating Label */}
              <div className="text-center">
                <span
                  className={`text-lg font-medium ${
                    rating > 0 ? "text-blue-600" : "text-gray-500"
                  }`}>
                  {getRatingLabel(hoveredRating || rating)}
                </span>
                {rating > 0 && (
                  <p className="text-sm text-gray-500 mt-1">You rated {rating} out of 5 stars</p>
                )}
              </div>
            </div>

            {errors.rating && (
              <div className="mt-3 flex items-center text-red-600 text-sm">
                <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
                <span>{errors.rating}</span>
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <label htmlFor="comments" className="block text-lg font-semibold text-gray-900 mb-2">
              Additional Comments
              <span className="text-gray-400 text-sm font-normal ml-2">(Optional)</span>
            </label>
            <p className="text-sm text-gray-600 mb-4">
              Share any thoughts, suggestions, or concerns about your interview experience.
            </p>

            <div className="relative">
              <MessageSquare className="absolute top-3 left-3 w-5 h-5 text-gray-400" />
              <textarea
                id="comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us about your experience..."
                rows={5}
                maxLength={500}
                className={`w-full pl-11 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                  errors.comments
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300"
                }`}
              />
            </div>

            <div className="flex items-center justify-between mt-2">
              <span
                className={`text-sm ${
                  comments.length > 450 ? "text-orange-600" : "text-gray-500"
                }`}>
                {comments.length}/500 characters
              </span>
              {errors.comments && (
                <span className="text-red-600 text-sm flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.comments}
                </span>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || rating === 0}
              className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-4 focus:ring-blue-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                  Submitting Feedback...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5 mr-2" />
                  Submit Feedback
                </>
              )}
            </button>
          </div>

          {/* Privacy Note */}
          <p className="text-center text-xs text-gray-500 mt-4">
            Your feedback is confidential and will be used to improve our interview process.
          </p>
        </form>
      </div>
    </div>
  );
};

export default InterviewCompletionFeedback;
