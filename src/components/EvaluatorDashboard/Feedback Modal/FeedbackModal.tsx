import React, { useState } from 'react';
import { Send, Calendar, X, Clock } from 'lucide-react';
import { useFeedbackForm } from './hooks/useFeedbackForm';
import ScheduleInterviewSection from './components/ScheduleInterviewSection';
import RejectionSection from './components/RejectionSection';
import OnHoldSection from './components/OnHoldSection';
import { ApplicationDetails, CandidateDetails, EvaluationRequest } from 'src/types';
import { SubmitEvaluationPayload, submitEvaluationResponse } from '@Services/EvaluationService.service';

interface FeedbackModalProps {
    onClose: () => void;
    candidateId?: string;
    candidateName?: string;
    onSubmitComplete?: (data: any) => void;

    selectedRequest: EvaluationRequest | null;
    selectedCandidateDetails: CandidateDetails | null;
    applicationDetails: ApplicationDetails | null;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({
    onClose,
    candidateId,
    candidateName = "Candidate",
    onSubmitComplete,

    selectedRequest,
    selectedCandidateDetails,
    applicationDetails
}) => {
    const {
        // Basic form state
        score,
        setScore,
        feedback,
        setFeedback,
        nextStep,
        showNextStepDetails,
        setShowNextStepDetails,


        // Comment fields
        comment,
        setComment,
        htmlComment,
        setHtmlComment,


        // Schedule states
        scheduledSlots,
        availabilityIndex,
        setAvailabilityIndex,
        updateScheduledSlot,


        // Rejection states
        selectedRejectionReason,
        setSelectedRejectionReason,
        isRejectionDropdownOpen,
        setIsRejectionDropdownOpen,

        // Hold states
        selectedHoldReason,
        setSelectedHoldReason,
        isHoldDropdownOpen,
        setIsHoldDropdownOpen,

        // Helper functions
        formatTime,
        getDateSuffix,
        handleNextStepClick,
        isInitialFormValid,
        isNextStepValid
    } = useFeedbackForm();

    const getScoreColor = (score: number) => {
        if (score <= 2) return 'bg-red-500';
        if (score <= 3.5) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const handleInitialSubmit = () => {
        if (!isInitialFormValid) {
            return;
        }

        setShowNextStepDetails(true);

        // Auto-generate time slot for schedule
        if (nextStep === 'schedule') {
            // const timeSlot = `From ${formatTime(startTime)} to ${formatTime(endTime)}`;
            // // This will be handled by the time slider change
        }
    };

    // const handleFinalSubmit = () => {
    //     if (!isNextStepValid()) {
    //         alert('Please fill all required fields');
    //         return;
    //     }

    //     let submitData: any = {
    //         candidateId,
    //         score,
    //         feedback,
    //         nextStep,
    //         timestamp: new Date().toISOString()
    //     };

    //     if (nextStep === 'schedule') {
    //         submitData = {
    //             ...submitData,
    //             scheduleDetails: {
    //                 duration: selectedDuration,
    //                 date: `${selectedDate}${getDateSuffix(selectedDate)} March`,
    //                 timeSlot: selectedTimeSlot,
    //                 startTime: formatTime(startTime),
    //                 endTime: formatTime(endTime)
    //             }
    //         };
    //     } else if (nextStep === 'reject') {
    //         submitData = {
    //             ...submitData,
    //             rejectionDetails: {
    //                 reason: selectedRejectionReason,
    //                 detailedFeedback: rejectionFeedback
    //             }
    //         };
    //     } else if (nextStep === 'hold') {
    //         submitData = {
    //             ...submitData,
    //             holdDetails: {
    //                 reason: selectedHoldReason,
    //                 detailedFeedback: holdFeedback
    //             }
    //         };
    //     }

    //     console.log('Final submission:', submitData);

    //     if (onSubmitComplete) {
    //         onSubmitComplete(submitData);
    //     }

    //     alert(`${nextStep === 'schedule' ? 'Interview scheduled' : nextStep === 'reject' ? 'Rejection submitted' : 'Candidate put on hold'} successfully!`);
    //     onClose();
    // };

    const handleFinalSubmit = async () => {
        if (!isNextStepValid()) {
            alert('Please fill all required fields');
            return;
        }

        if (!selectedRequest || !selectedCandidateDetails || !applicationDetails) {
            alert('Missing data to submit feedback');
            return;
        }

        // Payload based on REJECTED or ON_HOLD or INTERVIEW_SCHEDULED
        const basePayload: Partial<SubmitEvaluationPayload> = {
            createdByUserEmail: selectedRequest.evaluatorDetails.email,
            evaluationRequestId: selectedRequest.id,
            evaluatorName: selectedRequest.evaluatorDetails.name,
            jobApplicationId: selectedRequest.jobApplicationId,
            jobId: selectedRequest.jobId,
            companyId: selectedRequest.companyId,
            applicantUserId: selectedRequest.applicantUserId,
            score,
            detailedFeedback: feedback,
            htmlDetailedFeedback: `<p>${feedback.replace(/\n/g, '<br />')}</p>`,
            applicantUserEmail: selectedRequest.applicantUserEmail
        };

        // Conditionally adding requester ID here
        if (selectedRequest.createdByCorporateUserId) {
            basePayload.evaluationRequesterCorporateUserId = selectedRequest.createdByCorporateUserId;
        } else if (selectedRequest.createdByUserId) {
            basePayload.evaluationRequesterUserId = selectedRequest.createdByUserId;
        }

        try {
            if (nextStep === 'reject') {
                await submitEvaluationResponse({
                    ...basePayload,
                    status: 'REJECTED',
                    reason: selectedRejectionReason,
                    comment,
                    htmlComment,
                } as SubmitEvaluationPayload);
                alert('Rejection submitted successfully!');
            } else if (nextStep === 'hold') {
                await submitEvaluationResponse({
                    ...basePayload,
                    status: 'ON_HOLD',
                    reason: selectedHoldReason,
                    comment,
                    htmlComment,
                } as SubmitEvaluationPayload);
                alert('Candidate put on hold successfully!');
            }
            else if (nextStep === 'schedule') {
                const scheduledInterviewDetails = scheduledSlots
                    .filter(slot => slot.date && slot.timeSlot)
                    .map(slot => ({
                        timeSlot: slot.duration,
                        availability: slot.availability,
                        date: slot.date,
                        startTime: formatTime(slot.startTime),
                        endTime: formatTime(slot.endTime),
                        actionDate: new Date().toISOString(),
                    }));

                await submitEvaluationResponse({
                    ...basePayload,
                    status: 'INTERVIEW_SCHEDULED',
                    scheduledInterviewDetails,
                } as SubmitEvaluationPayload);

                alert('Interview scheduled successfully!');
            }

            if (onSubmitComplete) {
                onSubmitComplete({
                    status: nextStep,
                    score,
                    reason:
                        nextStep === 'reject'
                            ? selectedRejectionReason
                            : nextStep === 'hold'
                                ? selectedHoldReason
                                : undefined,
                    feedback,
                });
            }

            onClose();
        } catch (error) {
            alert('Failed to submit feedback. Please try again.');
            console.error('Submission error:', error);
        }
    };


    return (
        <div className="h-full flex flex-col max-h-[95vh] w-full">
            {/* Header */}
            <div className="border-b border-gray-200 px-8 py-6 flex-shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-semibold text-gray-900">Give Feedback</h2>
                        <p className="text-sm text-gray-500 mt-1">for {candidateName}</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 py-6">
                <div className="space-y-8 max-w-none">
                    {/* Score Section */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                Give score (out of 5)
                            </label>
                            <div className="relative">
                                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                                    <span>0</span>
                                    <span className="font-medium text-white bg-indigo-600 px-3 py-1 rounded-md">
                                        {score}
                                    </span>
                                    <span>5</span>
                                </div>
                                <div className="relative">
                                    <div className="w-full h-3 bg-gray-200 rounded-full">
                                        <div
                                            className={`h-3 rounded-full transition-all duration-300 ${getScoreColor(score)}`}
                                            style={{ width: `${(score / 5) * 100}%` }}
                                        />
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="5"
                                        step="0.1"
                                        value={score}
                                        onChange={(e) => setScore(parseFloat(e.target.value))}
                                        className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
                                        disabled={showNextStepDetails}
                                    />
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-indigo-600 rounded-full border-2 border-white shadow-lg transition-all duration-300"
                                        style={{ left: `calc(${(score / 5) * 100}% - 10px)` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Feedback Section */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Write detailed feedback
                        </label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Write a detailed feedback here"
                            className="w-full h-36 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none text-sm"
                            disabled={showNextStepDetails}
                        />
                    </div>

                    {/* Next Step Section */}
                    <div className="space-y-4">
                        <label className="block text-sm font-medium text-gray-700">
                            Next step
                        </label>
                        {showNextStepDetails && nextStep ? (
                            <div className="flex items-center gap-2 px-4 py-3 rounded-lg border w-fit opacity-50">
                                {nextStep === 'schedule' && <Calendar size={18} className="text-indigo-600" />}
                                {nextStep === 'reject' && <X size={18} className="text-red-600" />}
                                {nextStep === 'hold' && <Clock size={18} className="text-yellow-600" />}
                                <span className="text-sm font-medium">
                                    {nextStep === 'schedule' ? 'Schedule interview' :
                                        nextStep === 'reject' ? 'Reject' : 'On hold'}
                                </span>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => handleNextStepClick('schedule')}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-colors ${nextStep === 'schedule'
                                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                                        : 'bg-white border-indigo-500 text-indigo-600 hover:bg-indigo-50'
                                        }`}
                                >
                                    <Calendar size={16} />
                                    <span className="text-sm font-medium">Schedule interview</span>
                                </button>

                                <button
                                    onClick={() => handleNextStepClick('reject')}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-colors ${nextStep === 'reject'
                                        ? 'bg-red-50 border-red-500 text-red-700'
                                        : 'bg-white border-red-500 text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    <X size={16} />
                                    <span className="text-sm font-medium">Reject</span>
                                </button>

                                <button
                                    onClick={() => handleNextStepClick('hold')}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-lg border transition-colors ${nextStep === 'hold'
                                        ? 'bg-yellow-50 border-yellow-500 text-yellow-700'
                                        : 'bg-white border-yellow-500 text-yellow-600 hover:bg-yellow-50'
                                        }`}
                                >
                                    <Clock size={16} />
                                    <span className="text-sm font-medium">On hold</span>
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Expanded Sections */}
                    {showNextStepDetails && (
                        <div className="border-t border-gray-200 pt-6">
                            {/* Schedule Interview Details */}
                            {nextStep === 'schedule' && (
                                <ScheduleInterviewSection
                                    availabilityIndex={availabilityIndex}
                                    setAvailabilityIndex={setAvailabilityIndex}
                                    scheduledSlots={scheduledSlots}
                                    onScheduledSlotChange={updateScheduledSlot}
                                />
                            )}

                            {/* Rejection Details */}
                            {nextStep === 'reject' && (
                                <RejectionSection
                                    selectedReason={selectedRejectionReason}
                                    onReasonChange={setSelectedRejectionReason}
                                    comment={comment}
                                    onCommentChange={(raw, html) => {
                                        setComment(raw);
                                        setHtmlComment(html);
                                    }}
                                    isDropdownOpen={isRejectionDropdownOpen}
                                    onDropdownToggle={setIsRejectionDropdownOpen}
                                />
                            )}

                            {/* On Hold Details */}
                            {nextStep === 'hold' && (
                                <OnHoldSection
                                    selectedReason={selectedHoldReason}
                                    onReasonChange={setSelectedHoldReason}
                                    comment={comment}
                                    onCommentChange={(raw, html) => {
                                        setComment(raw);
                                        setHtmlComment(html);
                                    }}
                                    isDropdownOpen={isHoldDropdownOpen}
                                    onDropdownToggle={setIsHoldDropdownOpen}
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-8 py-6 flex-shrink-0">
                <div className="flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                        Cancel
                    </button>

                    {!showNextStepDetails ? (
                        <button
                            onClick={handleInitialSubmit}
                            disabled={!isInitialFormValid}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Send size={16} />
                            <span className="text-sm font-medium">Submit Feedback</span>
                        </button>
                    ) : (
                        <button
                            onClick={handleFinalSubmit}
                            className={`flex items-center gap-2 px-8 py-3 text-white rounded-lg hover:opacity-90 transition-colors ${nextStep === 'schedule' ? 'bg-indigo-600' :
                                nextStep === 'reject' ? 'bg-red-600' :
                                    'bg-yellow-600'
                                }`}
                        >
                            <Send size={16} />
                            <span className="text-sm font-medium">Submit</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeedbackModal;