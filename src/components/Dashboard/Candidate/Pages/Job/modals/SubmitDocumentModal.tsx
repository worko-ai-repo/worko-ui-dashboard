import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { getToastOptions } from "lib-worko-ui";
import { X,Send,Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { AwsS3FileUploadResponse } from "@Interfaces/Auth.dto";

interface SubmitDocumentModalProps {
  show: boolean;
  documents: string[];          // Document names coming from backend
  onClose: () => void;
  onSubmit: (submittedDocs: Record<string, File | null>) => void;  // Pass selected files back
}

const SubmitDocumentModal = ({ show, documents, onClose, onSubmit }: SubmitDocumentModalProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [fileDetails, setFileDetails] = useState<{ corporateRequestedFileName: string; file: File | null }[]>([]);
    const [error, setError] = useState<string | null>(null);
    const allUploaded = fileDetails.length === documents.length && fileDetails.every(f => f.file !== null);
    
  useEffect(() => {
    if (show) {
      setIsVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  // Reset files when documents change or modal closes
  useEffect(() => {
    if (!show) setFileDetails([]);
    else {
      const initialFiles = documents.map(doc => ({
      corporateRequestedFileName: doc,
      file: null as File | null,
    }));
      setFileDetails(initialFiles);
    }
  }, [documents, show]);

  if (!isVisible && !show) return null;

  const handleFileChange = (docName: string, file: File | null) => {
        if (!file) {
            return;
        }
        if (file.type !== "application/pdf") {
            toast.error("only pdf files are allowed",getToastOptions({}))
            setError("Only PDF files are allowed.");
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            toast.error("file size should be less than 2MB",getToastOptions({}))
            setError("File must be less than 2MB.");
            return;
        }
        setError("");
        setFileDetails(prev => {
        const existingIndex = prev.findIndex(item => item.corporateRequestedFileName === docName);
        if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], file };
        return updated;
        } else {
        return [...prev, { corporateRequestedFileName: docName, file }];
        }
    });
  };

  const handleSubmit = async () => {
    const userId = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERID);
    const email = secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL);

    const payload = {
        jobApplicationId: "01K2KJHXT1BE0NCSG22PX3CJCV", // fetch it from secure storage
        userId: userId || "51d34dda-b0e1-70ae-c852-c195d340db5c", // fetch it from secure storage
        fileDetails: fileDetails
        .filter(item => item.file)
        .map(item => ({
            corporateRequestedFileName: item.corporateRequestedFileName,
            fileName: item.file!.name,
            fileMimeType: item.file!.type,
        }))
    };

    console.log("Final Payload:", payload);
    console.log(userId,email,payload)
    const { response, error } = await httpServiceObj.post<AwsS3FileUploadResponse>("/file/gsu2u/USER_JOB_APPL_DOC", payload, true);

    if (error || !response?.awsS3SignedUrl || !response?.cloudFileName) {
        throw new Error("Could not get signed URL");
    }
    // ill be getting a response after sending the payload that response should have "userFileName","cloudFileName", "fileMimeType", "fileExtension", "awsS3SignedUrl", "corporateRequestedFileName" in an array format
    // ill put or Upload all the documents to `s3` using `Pre-signed urls` like below
    // const uploadResult = await httpServiceObj.put(awsS3SignedUrl,file,
    //     false,
    //     { awsS3Tag, fileType: file.type },
    //     true
    // );

    // after that ill update job application status using below
    // const patchResult = await httpServiceObj.patch(`job-application/:id/applicant-action`);
    //with payload of below
    //        {
    //       "userId": "51d34dda-b0e1-70ae-c852-c195d340db5c",
    //       "emailId": "rohithappala777+candidate3@gmail.com",
    //       "userType": "CAND",
    //       "status": "DOCUMENT_SUBMITTED",
    //       "documentMapping": [
    //          {
    //             "documentName": "resume",
    //             "cloudFileName": "01K2KP3M3N2SDSGSR70GVN34C9.docx",
    //          },
    //          {
    //             "documentName": "internship certificate",
    //             "cloudFileName": "01K2KP3M2JREDFT9JTVV0STD9Q.pdf",
    //          }
    //       ]
    //    }

    // after that ill get response

    // onSubmit(payload);
    // onClose();
  };

  return (
    <div className={`fixed inset-0 flex justify-end z-50 transition-opacity duration-300 ease-in-out ${
      isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
    } ${isVisible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white min-h-screen w-full max-w-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">Upload Documents</h3>
          <h3 className="text-xs text-gray-400">document requested on</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document upload fields */}
        <div className="p-6 overflow-y-auto flex-1">
            {documents.map((doc) => (
                <div key={doc} className="mb-4 w-full">
                <label className="flex items-center gap-4 w-full">
                    <div className="relative w-full">
                    <input
                        type="file"
                        accept="application/pdf"
                        onChange={(e) =>
                        handleFileChange(doc, e.target.files?.[0] || null)
                        }
                        className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                    />
                    <div className="border border-gray-300 rounded-2xl px-6 py-5 w-full bg-white text-gray-500">
            {fileDetails.find(f => f.corporateRequestedFileName === doc)?.file?.name
              || `${doc} (in PDF format max 2 MB)`}
          </div>
        </div>

        <div className="flex items-center text-white bg-blue-500 cursor-pointer p-4 rounded-2xl">
          <Upload size={30} />
        </div>
      </label>
    </div>
  ))}
</div>



        {/* Footer */}
            <div className="px-8 py-6 flex justify-between gap-4 flex-shrink-0">
            <button
                onClick={handleSubmit}
                disabled={!allUploaded}
                className={`flex items-center gap-2 px-8 py-3 text-white rounded-lg hover:opacity-90 transition-colors ${
                    allUploaded ? 'bg-blue-500' : 'bg-gray-400 cursor-not-allowed'
                }`}
            >
                <Send size={16} />
                <span className="text-sm font-medium">Submit</span>
            </button>
            </div>
      </div>
    </div>
  );
};

export default SubmitDocumentModal;
