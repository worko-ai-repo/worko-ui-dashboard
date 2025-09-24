import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { getToastOptions } from "@Utils/Toast.utils";
import { X, Send, Upload, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { AwsS3FileUploadResponse } from "@Interfaces/Auth.dto";
import { JobApplicationDetailsDto, JobApplicationDocumentStatusType,} from "@Interfaces/CorporateDashboard.dto";
import { newDate } from "react-datepicker/dist/date_utils";

interface SubmitDocumentModalProps {
  userDetails: any;
  show: boolean;
  documents?: JobApplicationDetailsDto;
  onClose: () => void;
  onSubmit: (submittedDocs: Record<string, File | null>) => void;
  onSuccess: () => void;
  userID: string;
  jobId: string;
}

interface DocumentItem {
  name: string;
  currentStatus: JobApplicationDocumentStatusType;
  targetStatus: JobApplicationDocumentStatusType;
  isSubmittable: boolean;
  isSubmitted: boolean;
  displayStatus: string;
  statusColor: string;
  statusIcon: React.ReactNode;
}

interface FormData {
  [documentName: string]: File | null;
}

const SubmitDocumentModal = ({
  show,
  documents,
  onClose,
  onSubmit,
  userID,
  jobId,
  onSuccess,
  userDetails,
}: SubmitDocumentModalProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [allDocuments, setAllDocuments] = useState<DocumentItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI;

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {},
  });

  const watchedFiles = watch();

  // Helper function to determine target status based on current status
  const getTargetStatus = (
    currentStatus: JobApplicationDocumentStatusType
  ): JobApplicationDocumentStatusType => {
    switch (currentStatus) {
      case "DOCUMENT_REQUESTED":
        return "DOCUMENT_SUBMITTED";
      case "DOCUMENT_REVISION_REQUESTED":
        return "DOCUMENT_REVISION_REQUEST_SUBMITTED";
      case "DOCUMENT_ADDITIONAL_REQUESTED":
        return "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED";
      default:
        return "DOCUMENT_SUBMITTED";
    }
  };

  // Helper function to check if document can be submitted
  const isDocumentSubmittable = (status: JobApplicationDocumentStatusType): boolean => {
    const submittableStatuses = [
      "DOCUMENT_REQUESTED",
      "DOCUMENT_REVISION_REQUESTED",
      "DOCUMENT_ADDITIONAL_REQUESTED",
    ];
    return submittableStatuses.includes(status);
  };

  // Helper function to check if document is already submitted
  const isDocumentSubmitted = (status: JobApplicationDocumentStatusType): boolean => {
    const submittedStatuses = [
      "DOCUMENT_SUBMITTED",
      "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED",
      "DOCUMENT_REVISION_REQUEST_SUBMITTED",
    ];
    return submittedStatuses.includes(status);
  };

  // Helper function to get display status and styling
  const getDocumentDisplayInfo = (status: JobApplicationDocumentStatusType) => {
    switch (status) {
      case "DOCUMENT_REQUESTED":
        return {
          displayStatus: "Required",
          statusColor: "text-red-600 bg-red-50",
          statusIcon: <AlertCircle size={16} className="text-red-600" />,
        };
      case "DOCUMENT_REVISION_REQUESTED":
        return {
          displayStatus: "Needs Revision",
          statusColor: "text-orange-600 bg-orange-50",
          statusIcon: <AlertCircle size={16} className="text-orange-600" />,
        };
      case "DOCUMENT_ADDITIONAL_REQUESTED":
        return {
          displayStatus: "Additional Required",
          statusColor: "text-blue-600 bg-blue-50",
          statusIcon: <Clock size={16} className="text-blue-600" />,
        };
      case "DOCUMENT_SUBMITTED":
        return {
          displayStatus: "Submitted",
          statusColor: "text-green-600 bg-green-50",
          statusIcon: <CheckCircle size={16} className="text-green-600" />,
        };
      case "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED":
        return {
          displayStatus: "Additional Submitted",
          statusColor: "text-green-600 bg-green-50",
          statusIcon: <CheckCircle size={16} className="text-green-600" />,
        };
      case "DOCUMENT_REVISION_REQUEST_SUBMITTED":
        return {
          displayStatus: "Revision Submitted",
          statusColor: "text-green-600 bg-green-50",
          statusIcon: <CheckCircle size={16} className="text-green-600" />,
        };
      default:
        return {
          displayStatus: "Unknown",
          statusColor: "text-gray-600 bg-gray-50",
          statusIcon: <Clock size={16} className="text-gray-600" />,
        };
    }
  };

  // Get all unique documents from the application data
  const getAllDocuments = (): DocumentItem[] => {
    if (!documents?.requestedDocumentDetails) {
      return [];
    }

    const allDocNames = new Set<string>();

    // Collect all document names from all requests
    documents.requestedDocumentDetails.forEach((request) => {
      request.requestedDocumentNames.forEach((docName) => {
        allDocNames.add(docName);
      });
    });

    // Convert to DocumentItem array with current status
    return Array.from(allDocNames)
      .map((docName) => {
        const currentStatus = documents.documentCurrentStatusMap?.[docName] || "DOCUMENT_REQUESTED";
        const isSubmittable = isDocumentSubmittable(currentStatus);
        const isSubmitted = isDocumentSubmitted(currentStatus);
        const displayInfo = getDocumentDisplayInfo(currentStatus);

        return {
          name: docName,
          currentStatus,
          targetStatus: getTargetStatus(currentStatus),
          isSubmittable,
          isSubmitted,
          ...displayInfo,
        };
      })
      .sort((a, b) => {
        // Sort by: submittable first, then by status priority
        if (a.isSubmittable && !b.isSubmittable) return -1;
        if (!a.isSubmittable && b.isSubmittable) return 1;
        return a.name.localeCompare(b.name);
      });
  };

  // Modal visibility effects
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

  // Initialize documents and form when modal opens
  useEffect(() => {
    if (show && documents) {
      const allDocs = getAllDocuments();
      setAllDocuments(allDocs);

      // Initialize form with null values for submittable documents only
      const initialFormData: FormData = {};
      allDocs.forEach((doc) => {
        initialFormData[doc.name] = null;
      });
      reset(initialFormData);
    } else {
      setAllDocuments([]);
      reset({});
    }
  }, [documents, show, reset]);

  if (!isVisible && !show) return null;

  // File validation
  const validateFile = (file: File | null): string | true => {
    if (!file) return true; // Optional files are allowed

    if (file.type !== "application/pdf") {
      return "Only PDF files are allowed.";
    }

    if (file.size > 2 * 1024 * 1024) {
      return "File must be less than 2MB.";
    }

    return true;
  };

  // Handle file change with validation
  const handleFileChange = (docName: string, file: File | null) => {
    const validation = validateFile(file);
    if (validation !== true) {
      toast.error(validation, getToastOptions({}));
      return null;
    }
    return file;
  };

  // Form submission handler
  const onFormSubmit = async (formData: FormData) => {
    setIsUploading(true);

    try {
      const userId = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERID);
      const email = secureStorage.getItem(SecureStorageKeyEnum.USEREMAIL);

      // Filter out null files and only include submittable documents
      const submittableDocuments = allDocuments.filter((doc) => doc.isSubmittable);
      const fileDetails = Object.entries(formData)
        .filter(([docName, file]) => {
          const doc = submittableDocuments.find((d) => d.name === docName);
          return file !== null && doc;
        })
        .map(([docName, file]) => ({
          corporateRequestedFileName: docName,
          fileName: file!.name,
          fileMimeType: file!.type,
        }));

      if (fileDetails.length === 0) {
        toast.error("Please select at least one document to upload.", getToastOptions({}));
        setIsUploading(false);
        return;
      }

      const payload = {
        jobApplicationId: jobId,
        userId: userId,
        fileDetails,
      };

      // console.log("Upload Payload:", payload);

      // Step 1: Get signed URLs
      const { response, error } = await httpServiceObj.post<AwsS3FileUploadResponse>(
        `${APP_JOBS_API_URI}/file/gsu2u/USER_JOB_APPL_DOC`,
        payload,
        true,
        {},
        true
      );

      if (error || !Array.isArray(response)) {
        throw new Error("Failed to get upload URLs");
      }

      // Step 2: Upload files to S3
      const uploadPromises = response.map(async (uploadInfo) => {
        const { awsS3SignedUrl, fileMimeType, awsS3Tag, corporateRequestedFileName } = uploadInfo;
        const file = formData[corporateRequestedFileName];

        if (!file) {
          console.warn(`File not found for ${corporateRequestedFileName}`);
          return null;
        }

        const uploadResult = await httpServiceObj.put(
          awsS3SignedUrl,
          file,
          false,
          { awsS3Tag, fileType: fileMimeType },
          true
        );

        if (uploadResult.error) {
          throw new Error(`Upload failed for ${corporateRequestedFileName}`);
        }

        return uploadInfo;
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter((result) => result !== null);

      // Step 3: Group documents by their target status for separate API calls
      const statusGroups: Record<string, typeof successfulUploads> = {};

      successfulUploads.forEach((uploadInfo) => {
        if (!uploadInfo) return;

        const docName = uploadInfo.corporateRequestedFileName;
        const document = allDocuments.find((doc) => doc.name === docName);

        if (document) {
          const targetStatus = document.targetStatus;
          if (!statusGroups[targetStatus]) {
            statusGroups[targetStatus] = [];
          }
          statusGroups[targetStatus].push(uploadInfo);
        }
      });

      // Step 4: Update application status for each group
      const updatePromises = Object.entries(statusGroups).map(async ([status, uploads]) => {
        const documentMapping = uploads.map((upload) => ({
          documentName: upload!.corporateRequestedFileName,
          cloudFileName: upload!.cloudFileName,
        }));

        const updatePayload = {
          applicantName: userDetails.name,
          userId: userId,
          emailId: email,
          userType: "CAND",
          status: status,
          documentMapping,
        };

        const patchResult = await httpServiceObj.patch(
          `${APP_JOBS_API_URI}/job-application/${jobId}/applicant-action`,
          updatePayload,
          true,
          {},
          true
        );

        if (patchResult.status !== 200) {
          throw new Error(`Failed to update application status for ${status}`);
        }

        return { status, documentMapping };
      });

      await Promise.all(updatePromises);

      toast.success("Documents uploaded successfully!", getToastOptions({}));
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload documents",
        getToastOptions({})
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Check if any submittable files are selected
  const submittableDocuments = allDocuments.filter((doc) => doc.isSubmittable);
  const hasSelectedFiles = submittableDocuments.some((doc) => watchedFiles[doc.name] !== null);
  const uploadedFilesCount = Object.values(watchedFiles).filter((file) => file !== null).length;
  const isFileCountMatching = uploadedFilesCount === submittableDocuments.length;

  return (
    <div
      className={`fixed inset-0 flex justify-end z-50 transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${isVisible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white h-full max-h-screen w-full max-w-2xl flex flex-col transform transition-transform duration-300 ease-in-out ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-lg font-semibold">Upload document</h3>
          <h3 className="text-xs text-gray-400">document requested on 23-08-2025</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            disabled={isUploading}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Document upload form */}
        <form onSubmit={handleSubmit(onFormSubmit)} className="flex flex-col flex-1 ">
          <div className="p-6 overflow-y-auto flex-1">
            {allDocuments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No documents found for this application
              </div>
            ) : (
              <div className="space-y-4">
                {allDocuments.map((document) => (
                  <div key={document.name} className="border rounded-lg p-4 bg-gray-50">
                    {/* Document header with status */}
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-md font-medium text-gray-800 capitalize">
                        {document.name}
                      </h4>
                      <div
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${document.statusColor}`}>
                        {document.statusIcon}
                        {document.displayStatus}
                      </div>
                    </div>

                    {/* File upload section */}
                    {document.isSubmittable ? (
                      <Controller
                        name={document.name}
                        control={control}
                        rules={{
                          validate: validateFile,
                        }}
                        render={({ field: { onChange, value } }) => (
                          <div>
                            <label className="flex items-center gap-4 w-full">
                              <div className="relative flex-1">
                                <input
                                  type="file"
                                  accept="application/pdf"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0] || null;
                                    const validatedFile = handleFileChange(document.name, file);
                                    onChange(validatedFile);
                                  }}
                                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
                                  disabled={isUploading}
                                />
                                <div
                                  className={`border rounded-lg px-4 py-3 w-full bg-white text-gray-600 text-sm ${
                                    errors[document.name]
                                      ? "border-red-300 bg-red-50"
                                      : "border-gray-300"
                                  }`}>
                                  {value?.name || `Upload ${document.name} (PDF, max 2MB)`}
                                </div>
                              </div>
                              <div
                                className={`flex items-center text-white cursor-pointer p-3 rounded-lg ${
                                  isUploading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-600"
                                }`}>
                                <Upload size={20} />
                              </div>
                            </label>
                            {errors[document.name] && (
                              <p className="text-red-500 text-sm mt-2">
                                {errors[document.name]?.message}
                              </p>
                            )}
                          </div>
                        )}
                      />
                    ) : (
                      <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 px-4 py-3 bg-gray-200 border border-gray-300 rounded-lg text-gray-500 text-sm">
                          Document already submitted - no action required
                        </div>
                        <div className="flex items-center text-gray-400 p-3 rounded-lg bg-gray-200">
                          <CheckCircle size={20} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 flex justify-between items-center gap-4 flex-shrink-0 border-t">
            <div className="flex items-center gap-4">
              {hasSelectedFiles && (
                <div className="text-sm text-gray-600">
                  {Object.values(watchedFiles).filter((file) => file !== null).length} file(s) ready
                  to upload
                </div>
              )}

              <button
                type="submit"
                disabled={
                  !hasSelectedFiles ||
                  isUploading ||
                  submittableDocuments.length === 0 ||
                  !isFileCountMatching
                }
                className={`flex items-center gap-2 px-6 py-3 text-white rounded-lg transition-colors ${
                  hasSelectedFiles &&
                  !isUploading &&
                  submittableDocuments.length > 0 &&
                  isFileCountMatching
                    ? "bg-blue-500 hover:bg-blue-600"
                    : "bg-gray-400 cursor-not-allowed"
                }`}>
                <Send size={16} />
                <span className="text-sm font-medium">
                  {isUploading ? "Uploading..." : "Submit"}
                </span>
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <div>Total documents: {allDocuments.length}</div>
              <div>
                Pending: {submittableDocuments.length} | Submitted:{" "}
                {allDocuments.filter((d) => d.isSubmitted).length}
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitDocumentModal;
