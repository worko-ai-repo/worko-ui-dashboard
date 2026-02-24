import { AwsS3FileUploadResponse } from '@Interfaces/Auth.dto';
import { JobApplicationDetailsDto } from '@Interfaces/CorporateDashboard.dto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { JobTypes } from '../JobTypes';
import { Download, Maximize, SendIcon } from 'lucide-react';

type CheckAcceptModalProps = {
  userDetails: any;
  job: JobApplicationDetailsDto;
  onClose: () => void;
  // onConfirm: () => Promise<void>;
  onSuccess: () => void;
  onLocalUpdate:((jobId: string, updatedData: Partial<JobTypes>)=>void);
};

const CheckAcceptModal: React.FC<CheckAcceptModalProps> = ({
  job,
  onClose,
  // onConfirm,
  userDetails,
  onSuccess,
  onLocalUpdate,
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
          "JOB"
        );

        if (error) {
          setError('Failed to accept the offer. Please try again.');
          return;
        }
        onLocalUpdate(job.id,{status:"HIRED"})
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
          "JOB"
        );

        if (error) {
          setError('Failed to raise the issue. Please try again.');
          return;
        }
        onLocalUpdate(job.id,{status:"OFFER_ISSUE_RAISED"})
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

  const handleDownload = () => {
    console.log(userDetails,job,"sad")
    fetch(pdfUrl)
      .then((response) => response.blob())
      .then((blob) => {
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.href = url;
        
        // Use candidateFullDetails if available (new logic), otherwise fall back to props (old logic)
        let fileName;
        if (userDetails && job) {
          const name = userDetails?.name?.replace(/\s+/g, "_")          
          const company = job?.companyName.replace(/\s+/g, "_");
          const date = new Date().toISOString().split("T")[0];
          fileName = `${name}_${"Offer_letter"}_${company}_${date}.pdf`;
        } else {
          // Fallback to original props-based logic
          const name = userDetails?.name?.replace(/\s+/g, "_") || "Candidate";
          const company = (job?.companyName || "Company").replace(/\s+/g, "_");
          const date = new Date().toISOString().split("T")[0];
          fileName = `${name}_${"Offer_letter"}_${company}_${date}.pdf`;
        }
        
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      })
      .catch((error) => console.error("Error downloading the file:", error));
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
          "JOB"
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


        {/* <button
            onClick={handleDownload}
            className="absolute bottom-32 right-28 border bg-blue-200 px-3 py-2 rounded-md shadow text-blue-600 mx-2"
          >
            <Download className="w-4 h-4" />
          </button>

        <button
          onClick={() => window.open(pdfUrl, "_blank")}
          className="absolute bottom-32 right-16 bg-white text-blue px-4 py-2 rounded shadow hover:text-blue-600"
        >
          <Maximize className="w-4 h-4" />
        </button> */}
        <div className="relative flex-1 overflow-hidden border rounded-md mb-4 mt-4">
        <div className="absolute bottom-4 right-4 z-50 flex gap-2">
          <button
            onClick={handleDownload}
            className="border bg-blue-200 px-3 py-2 rounded-md shadow text-blue-600"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => window.open(pdfUrl, "_blank")}
            className="bg-white px-3 py-2 rounded shadow hover:text-blue-600"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
        {/* PDF Preview */}
        {/* <div className="flex-1 overflow-hidden border rounded-md mb-4 mt-4"> */}
          <iframe
            src={pdfUrl}
            title="Job Offer Letter"
            className="w-full h-full"
          />
        {/* </div> */}
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
                ? 'bg-blue-600 text-white'
                : 'bg-white text-blue-600 border-blue-600'} 
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
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-xs flex justify-center items-center gap-1"
                disabled={!issueDetail.trim() || loadingRaise}
              >
                <SendIcon className="w-4 h-4" />
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
