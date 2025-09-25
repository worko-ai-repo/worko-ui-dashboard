import { AwsS3FileUploadResponse } from '@Interfaces/Auth.dto';
import { JobApplicationDetailsDto } from '@Interfaces/CorporateDashboard.dto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

type CheckAcceptModalProps = {
  userDetails: any;
  job: JobApplicationDetailsDto;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  onSuccess: () => void;
};

const CheckAcceptModal: React.FC<CheckAcceptModalProps> = ({
  job,
  onClose,
  onConfirm,
  userDetails,
  onSuccess,
}) => {
  const [loadingAccept, setLoadingAccept] = useState(false);
  const [loadingRaise, setLoadingRaise] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState<'accept' | 'raise' | null>(null);
  const [issueDetail, setIssueDetail] = useState('');
  const [pdfUrl, setPdfUrl] = useState('');
  const [visible, setVisible] = useState(false);

  const handleConfirm = async (nextAction: 'accept' | 'raise') => {
    setError(null);

    try {
      if (nextAction === 'accept') {
        setLoadingAccept(true);
        // console.log("Attempting to accept...");
        const payload = {
          applicantName:userDetails.name,
          userId: userDetails?.sub,
          emailId: userDetails?.email,
          "userType": "CAND",
          status: "HIRED",
        };

        const { response, error } = await httpServiceObj.patch(
          `/job-application/${job.id}/applicant-action`,
          payload,
          true,
          {},
          false,
          'JOB'
        );

        if (error) {
          setError('Failed to accept the offer. Please try again.');
          return;
        }
        toast.success("Offer Accepted Successfully",getToastOptions({}))
        // console.log('Accepted successfully:', response);
      } else if (nextAction === 'raise') {
        if (!issueDetail.trim()) {
          setError('Please provide a valid issue before submitting.');
          return;
        }
        setLoadingRaise(true);
        const payload = {
          applicantName:userDetails.name,
          userId: userDetails?.sub,
          emailId: userDetails?.email,
          userType: "CAND",
          status: "OFFER_ISSUE_RAISED",
          offerLetterIssueRemarks: issueDetail.trim(),
          offerLetterCloudFileName: job?.offerLetterDetails?.[0]?.cloudFileName,
        };

        const { response, error } = await httpServiceObj.patch(
          `/job-application/${job.id}/applicant-action`,
          payload,
          true,
          {},
          false,
          'JOB'
        );

        if (error) {
          setError('Failed to raise the issue. Please try again.');
          return;
        }
        toast.success("Issue Raised Successfully",getToastOptions({}))
        // console.log('Issue raised successfully:', response);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError('Something went wrong. Please try again.');
    }finally{
      setLoadingAccept(false);
      setLoadingRaise(false);
    }
  };

  useEffect(() => {
    if (
      !job ||
      !job.offerLetterDetails ||
      job.offerLetterDetails.length === 0 ||
      !userDetails?.sub
    ) {
      // console.log('Missing job or user details');
      return;
    }
    

    const postData = async () => {
      const payload = {
        jobApplicationId: job.id,
        userId: userDetails.sub,
        cloudFileName: job.offerLetterDetails?.[0]?.cloudFileName,
      };

      try {
        const { response, error } = await httpServiceObj.post<AwsS3FileUploadResponse>(
          `/file/gsu2v/HR_OFFER_LETTER_SENT`,
          payload,
          true,
          {},
          false,
          'JOB'
        );

        if (error) {
          console.error('POST error:', error);
          return;
        }

        if (response && 'objectUrl' in response) {
          setPdfUrl((response as any).objectUrl); // or update interface
          // console.log('POST response:', response);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      }
    };

    postData();
  }, [job]);

  useEffect(() => {
  const timer = setTimeout(() => setVisible(true), 10);
  return () => clearTimeout(timer);
}, []);

  return (
        <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
      visible ? "bg-black bg-opacity-50" : "bg-black bg-opacity-0"
    }`}>

    <div className={`bg-white rounded-l-xl p-6 max-w-3xl w-full shadow-lg flex flex-col h-[100vh] relative transform transition-transform duration-300 ease-in-out ${
      visible ? "translate-x-0" : "translate-x-full"
    }`}>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-900 hover:text-gray-800"
        >
          ✕
        </button>

        {/* PDF Preview */}
        <div className="flex-1 overflow-hidden border rounded-md mb-4 mt-4">
          <iframe
            src={pdfUrl}
            title="Job Offer Letter"
            className="w-full h-full"
          />
        </div>

        {/* Error */}
        {error && <p className="text-red-600 mb-2">{error}</p>}

        {/* Action Buttons */}
        <div className="flex justify-center space-x-6 mt-4">
          <button
            onClick={() => {
              setAction('accept');
              handleConfirm('accept');
            }}
            disabled={loadingAccept}
            className={`px-6 py-3 rounded-xl border 
              ${action === 'accept'
                ? 'bg-white text-blue-600 border-blue-600'
                : 'bg-blue-600 text-white'} 
              disabled:opacity-50`}
          >
            {loadingAccept  ? 'Accepting...' : 'Accept'}
          </button>

          <button
            onClick={() => setAction('raise')}
            className={`px-6 py-3 rounded-xl border 
              ${action === 'raise'
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-blue-600 border-blue-600'}`}
          >
            Raise Issue
          </button>
        </div>

        {/* Raise Issue Textarea */}
        {action === 'raise' && (
          <div className="mt-4">
            <p className="text-left mb-2">Explain your issue in detail</p>
            <textarea
              value={issueDetail}
              onChange={(e) => setIssueDetail(e.target.value)}
              className="w-full border rounded-md p-2 mb-3"
              placeholder="Write in Detail"
              rows={3}
            />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => handleConfirm('raise')}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
                disabled={!issueDetail.trim() || loadingRaise}
              >
                {loadingRaise ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckAcceptModal;
