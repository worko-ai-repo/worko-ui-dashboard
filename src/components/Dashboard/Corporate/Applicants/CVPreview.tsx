import React from "react";
import { X, Check, Send, ClipboardCheck } from "lucide-react";

const sampleCV = "https://www.africau.edu/images/default/sample.pdf"; // Replace with real PDF path

const CVPreview = ({
    onClose,
    onSubmit,
    setIsAddEvaluatorModal,
    setIsRejectModalOpen,
    setIsHireNowModalOpen,
}: {
    onClose: () => void;
    onSubmit: () => void;
    setIsAddEvaluatorModal: React.Dispatch<React.SetStateAction<boolean>>;
    setIsRejectModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
    setIsHireNowModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
    return (
        <div className="w-full h-full flex flex-col gap-4 p-4">
            {/* CV Viewer */}
            <div className="flex gap-4 justify-between h-full">
                <h2 className="text-lg font-semibold">CV</h2>
                <div className="flex flex-col gap-4">
                    <div className="flex-1 border-2 border-gray-400 w-full h-full rounded-xl overflow-hidden">
                        <iframe
                            src={sampleCV}
                            title="CV Preview"
                            className="w-full h-full"
                        ></iframe>
                    </div>

                    {/* Buttons */}

                    <div className="flex flex-wrap gap-4">
                        <button
                            onClick={() => {
                                onClose();
                                setIsRejectModalOpen(true);
                            }}
                            className="flex items-center gap-2 border border-red-600 text-red-600 font-medium px-4 py-2 rounded-lg transition"
                        >
                            <X className="w-4 h-4" />
                            Reject
                        </button>

                        <button
                            onClick={() => {
                                onClose();
                                setIsHireNowModalOpen(true);
                            }}
                            className="flex items-center gap-2 border border-green-600 text-green-600 font-medium px-4 py-2 rounded-lg transition"
                        >
                            <Check className="w-4 h-4" />
                            Hire
                        </button>

                        <button
                            onClick={() => {
                                onClose();
                                setIsAddEvaluatorModal(true);
                            }}
                            className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                        >
                            <Send className="w-4 h-4" />
                            Send for evaluation
                        </button>

                        <button className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                            <ClipboardCheck className="w-4 h-4" />
                            Process interview
                        </button>

                        <button className="text-blue-700 font-medium transition">
                            On Hold
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CVPreview;
