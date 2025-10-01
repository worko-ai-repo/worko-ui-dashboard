import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import secureStorage from "@Utils/SecureStorage.utils";
import httpServiceObj from "@Services/ApiHandler.service";
import { AwsS3FileUploadResponse, FileUpload } from "@Interfaces/Auth.dto";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useAppContext } from "@Context/App.context";
import CVParsingPopup from "../Dashboard/Candidate/Pages/Profile/Helper/CVParsingPopup";
import { useQuery } from "@tanstack/react-query";
import profileService from "@Components/Dashboard/Candidate/Service/ProfileService";

interface UploadCVButtonProps {
    onUploadSuccess: () => void;
}

interface ParsingStatus {
  isCvExtracted: boolean;
  // add other keys if needed
}



const UploadCVButton: React.FC<UploadCVButtonProps> = ({ onUploadSuccess }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [CVParsing,setCVParsing] = useState(false)
    const [error, setError] = useState<string | null>(null);
    const [forceComplete,setForceComplete] = useState(false)
    const {userDetails} = useAppContext()
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== "application/pdf") {
            setError("Only PDF files are allowed.");
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            setError("File must be less than 2MB.");
            return;
        }

        try {
            setUploading(true);
            setError(null);

            const userId = userDetails?.id
            const email = userDetails?.email

            const metadata = {
                userId,
                resumeUserFileName: file.name,
                resumeFileMimeType: file.type,
            };

            const { response, error } = await httpServiceObj.post<AwsS3FileUploadResponse>("/file/gsu2u/USER_RESUME", metadata, true);

            if (error || !response?.awsS3SignedUrl || !response?.cloudFileName) {
                throw new Error("Could not get signed URL");
            }

            const { awsS3SignedUrl, awsS3Tag, cloudFileName } = response;

            const uploadResult = await httpServiceObj.put(
                awsS3SignedUrl,
                file,
                false,
                { awsS3Tag, fileType: file.type },
                true
            );

            if (uploadResult.error) {
                throw new Error("Upload failed");
            }

            const patchResult = await httpServiceObj.patch(`/user/${email}/cv`, { 
                userCvFileName:file.name,resume: cloudFileName,isCvExtracted:false }, true);

            if (patchResult.status !== 200) {
                throw new Error("Failed to update user record with CV");
            }
            setCVParsing(true);
            // latestCloudFileNameRef.current = cloudFileName;
        } catch (err: any) {
            console.error(err);
            setError("Something went wrong while uploading.");
        } finally {
            setUploading(false);
        }
    };
    // Note: polling logic moved into CVParsingPopup

    // keep the last uploaded cloud file name for onClose handling
    // const latestCloudFileNameRef = useRef<string | null>(null);

    const handlePopupClose = () => {
        setCVParsing(false);
        onUploadSuccess()
        // const name = latestCloudFileNameRef.current;
        // if (onUploadSuccess && name) onUploadSuccess(name);
    };
    
    return (
        <>
        <div>
            <button
                onClick={handleClick}
                className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer 
                    ${uploading ? 'bg-gray-400 text-gray-100 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-blue-500 text-white'}
                `}
                disabled={uploading}
            >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs font-semibold">
                    {uploading ? "Uploading..." : "Upload CV"}
                </span>
            </button>
            <input
                type="file"
                accept="application/pdf"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />
            {error && <p className="text-red-500 mt-1 text-xs">{error}</p>}
        </div>
        {CVParsing && (
            <CVParsingPopup 
                onClose={handlePopupClose}
            />
        )}
        </>
    );
};

export default UploadCVButton;