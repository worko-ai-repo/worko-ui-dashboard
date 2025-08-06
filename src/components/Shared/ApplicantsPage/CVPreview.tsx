import React from "react";
import { X, Check, Send, ClipboardCheck } from "lucide-react";
import { JobApplicationStatusType, JobApplicationUpdatePayloadDto, handleJobApplicationStatusUpdate } from "@Components/Dashboard/Corporate/Applicants/Applicants";//@TODO:Make it generic
import { useQueryClient } from "@tanstack/react-query";

const sampleCV = "https://www.africau.edu/images/default/sample.pdf";

interface CVPreviewProps {
  onClose: () => void;
  onSubmit: () => void;
  setIsAddEvaluatorModal?: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRejectModalOpen?: React.Dispatch<React.SetStateAction<{ payload: { [key: string]: any }; jobId: string } | null>>;
  setIsHireNowModalOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  pdfuri: string;
  mode: JobApplicationStatusType;
  misData: {
    payload: JobApplicationUpdatePayloadDto;
    jobId: string;
  };
}

const CVPreview = ({ onClose, onSubmit, setIsAddEvaluatorModal, setIsRejectModalOpen, setIsHireNowModalOpen, pdfuri = sampleCV, mode = "APPLIED", misData }: CVPreviewProps) => {
  const queryClient = useQueryClient(); 
  const invalidateJobs = () => {
    queryClient.invalidateQueries({
      queryKey: ['CorporateJobsApplicationQuery'], // You can use partial key
    });
  };

  // Visibility config based on mode
  /**
   * Button visibility matrix for each application mode.
   * 1 = button is visible, 0 = hidden.
   *
   * | Application Mode      | Reject | Hire | Evaluation | Interview | On Hold |
   * |------------------------|--------|------|------------|-----------|---------|
   * | ALL                   |   0    |  0   |     0      |     0     |    0    |
   * | APPLIED               |   1    |  1   |     1      |     1     |    1    |
   * | CV_DOWNLOADED         |   1    |  0   |     1      |     1     |    1    |
   * | UNDER_EVALUATION      |   1    |  1   |     0      |     1     |    1    |
   * | PROCESSING_INTERVIEW  |   1    |  1   |     0      |     0     |    1    |
   * | INTERVIEW_DONE        |   1    |  1   |     0      |     0     |    1    |
   * | HIRED                 |   1    |  0   |     0      |     0     |    1    |
   * | REJECTED              |   0    |  0   |     0      |     0     |    0    |
   * | ON_HOLD               |   1    |  0   |     0      |     0     |    0    |
   * | JOINED                |   0    |  0   |     0      |     0     |    0    |
   */
  const visibilityConfig: Record<JobApplicationStatusType, Record<string, boolean>> = {
    ALL: { reject: false, hire: false, evaluation: false, interview: false, onHold: false },
    APPLIED: { reject: true, hire: true, evaluation: true, interview: true, onHold: true },
    CV_DOWNLOADED: { reject: true, hire: false, evaluation: true, interview: true, onHold: true },
    UNDER_EVALUATION: { reject: true, hire: true, evaluation: false, interview: true, onHold: true },
    PROCESSING_INTERVIEW: { reject: true, hire: true, evaluation: false, interview: false, onHold: true },
    INTERVIEW_DONE: { reject: true, hire: true, evaluation: false, interview: false, onHold: true },
    HIRED: { reject: true, hire: false, evaluation: false, interview: false, onHold: true },
    REJECTED: { reject: false, hire: false, evaluation: false, interview: false, onHold: false },
    ON_HOLD: { reject: true, hire: false, evaluation: false, interview: false, onHold: false },
    JOINED: { reject: false, hire: false, evaluation: false, interview: false, onHold: false },
  };

  const visibility = visibilityConfig[mode];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex gap-4 justify-between">
        <h2 className="text-lg font-semibold">CV</h2>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex-1 border-2 border-gray-400 w-full min-h-[82vh] object-fit rounded-xl overflow-hidden">
            <iframe src={pdfuri} title="CV Preview" className="w-full h-full object-fit" />
          </div>

          <div className="flex flex-wrap gap-4">
            {visibility.reject && (
              <button
                onClick={() => {
                  onClose();
                  setIsRejectModalOpen?.(misData);
                }}
                className="flex items-center gap-2 border border-red-600 text-red-600 font-medium px-4 py-2 rounded-lg transition">
                <X className="w-4 h-4" />
                Reject
              </button>
            )}

            {visibility.hire && (
              <button
                onClick={() => {
                  onClose();
                  setIsHireNowModalOpen?.(true);
                }}
                className="flex items-center gap-2 border border-green-600 text-green-600 font-medium px-4 py-2 rounded-lg transition">
                <Check className="w-4 h-4" />
                Hire
              </button>
            )}

            {visibility.evaluation && (
              <button
                onClick={() => {
                  onClose();
                  setIsAddEvaluatorModal?.(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <Send className="w-4 h-4" />
                Send for evaluation
              </button>
            )}

            {visibility.interview && (
              <button 
              onClick={()=> {onClose();{misData.payload.status = "PROCESSING_INTERVIEW"; handleJobApplicationStatusUpdate?.(misData.payload, misData.jobId, invalidateJobs); }}}
              className="flex items-center gap-2 bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition">
                <ClipboardCheck className="w-4 h-4" />
                Process interview
              </button>
            )}

            {visibility.onHold && <button className="text-blue-700 font-medium transition" onClick={()=> {misData.payload.status = "ON_HOLD"; handleJobApplicationStatusUpdate?.(misData.payload, misData.jobId, invalidateJobs); }}>On Hold</button>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVPreview;
