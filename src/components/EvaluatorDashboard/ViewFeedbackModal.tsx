import React from 'react';
import { X } from 'lucide-react';
import { EvaluationResponse } from '@Services/EvaluationService.service';

interface ViewFeedbackModalProps {
    data: EvaluationResponse;
    onClose: () => void;
}

const ViewFeedbackModal: React.FC<ViewFeedbackModalProps> = ({ data, onClose }) => {
    const latestFeedback = data.statusTracker?.[0];

    return (
        <div className="bg-white rounded-xl p-4 space-y-6 max-h-[80vh] overflow-y-auto">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-semibold text-gray-800">Evaluation Feedback</h2>
                {/* <button onClick={onClose} className="text-gray-500 hover:text-red-600">
                    <X size={20} />
                </button> */}
            </div>

            {/* Score Section */}
            <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Score</h3>
                <div className="text-3xl font-bold text-indigo-600">
                    {latestFeedback?.score ?? '-'} <span className="text-sm text-gray-500">/ 5</span>
                </div>
            </div>

            {/* Detailed Feedback */}
            <div>
                <h3 className="text-sm font-medium text-gray-600 mb-1">Detailed Feedback</h3>
                <div
                    className="text-gray-800 leading-relaxed prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                        __html: latestFeedback?.htmlDetailedFeedback || `<p>${latestFeedback?.detailedFeedback || 'No feedback provided.'}</p>`
                    }}
                />
            </div>

            {/* Scheduled Interview Details */}
            {data.status === 'INTERVIEW_SCHEDULED' && Array.isArray(data.scheduledInterviewDetails) && data.scheduledInterviewDetails.length > 0 && (
                <div>
                    <h3 className="text-sm font-medium text-gray-600 mb-2">Scheduled Interview Slots</h3>
                    <ul className="space-y-3">
                        {data.scheduledInterviewDetails.map((slot, idx) => (
                            <li key={idx} className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 shadow-sm">
                                <div className="text-sm text-gray-800 font-semibold">
                                    Availability {slot.availability}
                                </div>
                                <div className="text-sm text-gray-600">
                                    <span className="block">Date: {slot.date}</span>
                                    <span className="block">Time: {slot.startTime} – {slot.endTime}</span>
                                    <span className="block">Slot: {slot.timeSlot}</span>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

        </div>
    );
};

export default ViewFeedbackModal;
