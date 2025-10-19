import { useRef, useState } from "react";
import { Plus } from "lucide-react";
import secureStorage from "@Utils/SecureStorage.utils";
import httpServiceObj from "@Services/ApiHandler.service";
import { AwsS3FileUploadResponse } from "@Interfaces/Auth.dto";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useAppContext } from "@Context/App.context";

interface UploadImageButtonProps {
    detailsData?:any,
    onUploadSuccess?: (imageUrl: string) => void;
}

const UploadImageButton: React.FC<UploadImageButtonProps> = ({ onUploadSuccess,detailsData }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const {userDetails} = useAppContext()
    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Accept only images
        if (!file.type.startsWith("image/")) {
            setError("Only image files are allowed.");
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
                profileUserFileName: file.name,
                profileFileMimeType: file.type,
            };

            const { response, error } = await httpServiceObj.post<AwsS3FileUploadResponse>("/file/gsu2u/USER_PROFILE_PIC", metadata, true);

            if (error || !response?.awsS3SignedUrl || !response?.cloudFileName) {
                throw new Error("Could not get signed URL");
            }
            // console.log("response to get awssigned url",response)
            const { awsS3SignedUrl, awsS3Tag, cloudFileName } = response;

            const uploadResult = await httpServiceObj.put(
                awsS3SignedUrl,
                file,
                false,
                { awsS3Tag, fileType: file.type },
                true
            );
            // console.log("uploadResult",uploadResult)
            if (uploadResult.error) {
                throw new Error("Upload failed");
            }

            let payload = { ...detailsData };

            const hasCandidateExperience =
            'candidateExperience' in payload &&
            payload.candidateExperience &&
            Object.keys(payload.candidateExperience).length > 0;

            const hasMultipleCandidateExperience =
                'multipleCandidateExperience' in payload &&
                Array.isArray(payload.multipleCandidateExperience) &&
                payload.multipleCandidateExperience.length > 0;

            if (!hasCandidateExperience && !hasMultipleCandidateExperience) {
                payload.isCandidateFresher = true;
            } else if (hasCandidateExperience && hasMultipleCandidateExperience) {
                payload.isCandidateFresher = false;
            } else if (hasMultipleCandidateExperience && !hasCandidateExperience) {
                payload.isCandidateFresher = false;
                payload.candidateExperience = payload.multipleCandidateExperience[0];
            } else if (!hasMultipleCandidateExperience && hasCandidateExperience) {
                payload.isCandidateFresher = false;
            }

            payload.profileImage = cloudFileName;

            //below is code to make responsibility enddate as today cause it will not accept empty enddate or any other string
            // const today = new Date().toISOString().split("T")[0];
            // const updatedResponsibilities = payload.responsibilities.map((responsibility:any) =>{
            //         if (responsibility.date.endDate === "") {
            //         return {
            //             ...responsibility,
            //             date: {
            //                 ...responsibility.date,
            //                 endDate: today
            //             }
            //         };
            //     }
            //     return responsibility;
            // })
            // const updatedPayload = {
            //     ...payload,
            //     responsibilities:updatedResponsibilities
            // }
            // Update user profile image record on backend (adjust endpoint accordingly)
            const patchResult = await httpServiceObj.put(`/user/${email}/details`, payload, true);
            if (patchResult.error) {
                throw new Error("Failed to update user profile image");
            }

            toast.success("Profile image uploaded successfully", getToastOptions());
            if (onUploadSuccess) onUploadSuccess(
                (patchResult.response as { profileImageAwsS3SignedUrl: string })?.profileImageAwsS3SignedUrl
            );
        } catch (err: any) {
            console.error(err);
            setError("Something went wrong while uploading.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <button
                onClick={handleClick}
                className="w-full h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-gradient-to-r from-blue-600 to-blue-500 text-white"
                disabled={uploading}
            >
                <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-xs font-semibold">
                    {uploading ? "Uploading..." : "Upload Pic"}
                </span>
            </button>
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileSelect}
                className="hidden"
            />
            {error && <p className="text-red-500 mt-1 text-xs">{error}</p>}
        </div>
    );
};

export default UploadImageButton;
