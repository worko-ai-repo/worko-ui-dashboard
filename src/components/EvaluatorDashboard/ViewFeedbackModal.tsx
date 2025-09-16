import React from 'react';
import { X } from 'lucide-react';
import { EvaluationResponse } from '@Services/EvaluationService.service';

interface ViewFeedbackModalProps {
    data: EvaluationResponse;
    onClose: () => void;
}

const formatDate = (dateStr:string) => {
  if (!dateStr) return 'NA';
  const [year, month, day] = dateStr.split('-');
  return `${day}-${month}-${year}`;
};


const ViewFeedbackModal: React.FC<ViewFeedbackModalProps> = ({ data, onClose }) => {
    const latestFeedback = data.statusTracker?.[0];
    // console.log(data.scheduledInterviewDetails)
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
                <h3 className="text-sm font-medium text-gray-600 mb-1 text-start">Score</h3>
                <div className="text-3xl font-bold text-indigo-600">
                    {latestFeedback?.score ?? '-'} <span className="text-sm text-gray-500">/ 5</span>
                </div>
            </div>

            {/* Detailed Feedback */}
                <div className="mb-6">
                <h3 className="text-sm font-medium text-modal-text-dark mb-3 text-start">Detailed feedback</h3>
                <div className="bg-gray-100 p-4 rounded-lg">
                    <p className="text-sm text-modal-text-muted leading-relaxed">
                    {latestFeedback?.detailedFeedback ||
                        'No feedback available at this time.'}
                    </p>
                </div>
                </div>

        {data.status === 'INTERVIEW_SCHEDULED' &&
        Array.isArray(data.scheduledInterviewDetails) &&
        data.scheduledInterviewDetails.length > 0 && (
            <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3 text-start">Scheduled Interview Slots</h3>
            <div className="space-y-3">
                {data.scheduledInterviewDetails.map((slot, idx) => (
                <div key={idx} className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-semibold text-gray-800">
                    Slot {slot.availability ?? idx + 1}:
                    </span>
                    <div key={idx} className="flex flex-wrap items-center gap-3 bg-white border border-gray-300 px-2 py-1 rounded-xl shadow-sm"
                >
                    <span className="text-sm text-white font-semibold bg-blue-600 px-4 py-2 rounded-xl">
                    {slot.timeSlot === '1 hour'
                        ? '60 mins :'
                        : slot.timeSlot === '1.30 hour'
                        ? '90 mins :'
                        : slot.timeSlot + " :" || 'NA :'}
                    </span>
                    <span className="text-sm text-black px-2 py-1">
                        <span className="font-semibold text-lg text-blue-500">Date:</span> {formatDate(slot.date)}
                    </span>
                    <span className="text-lg text-black font-semibold  px-2 py-1">
                    {slot.startTime || 'NA'} -  {slot.endTime || 'NA'}
                    </span>
                </div>
                </div>
                ))}
            </div>
            </div>
            )}
            </div>
            );
};

export default ViewFeedbackModal;
