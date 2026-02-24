import React, { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Send, Download, Eye, FileText, X, Undo2, Plus, Verified } from "lucide-react";
import {
  JobApplicationDetailsDto,
  JobApplicationDocumentStatusType,
} from "@Interfaces/CorporateDashboard.dto";
import secureStorage from "@Utils/SecureStorage.utils";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import NoDataPresent from "../NoDataPresent";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import { useQueryClient } from "@tanstack/react-query";
import { handleViewDocumentClick } from "./ReSendOfferLetter";
import { useAppContext } from "@Context/App.context";

export interface RequestDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobApplication: JobApplicationDetailsDto;
  mode: "REQUEST" | "VIEW" | "READ_ONLY";
  onViewDocument?: (documentName: string, cloudFileName: string) => void;
  onRequestMore?: () => void;
  isCandidateViewingDocuments? : boolean
}

interface RequestDocumentPayload {
  userId: string;
  emailId: string;
  userType: string;
  status: JobApplicationDocumentStatusType;
  requestedDocumentNames: string[];
  applicantName: string;
}

interface FormData {
  documents: Array<{ name: string }>;
}

interface DocumentInfo {
  name: string;
  status: string;
  requestedOn: string;
  submittedOn: string | null;
  cloudFileName: string | null;
  isRerequested: boolean;
}

const MAX_DOCUMENTS = 12;

const hasOfferLetterSent = (app: JobApplicationDetailsDto): boolean =>
  Boolean(
    app?.statusTracker?.some((entry) =>
      ["OFFER_SENT"].includes(entry.newStatus as JobApplicationStatusType)
    )
  );

const RequestDocumentModal: React.FC<
  RequestDocModalProps & {
    handleStatusUpdate: (
      status: JobApplicationStatusType,
      row: JobApplicationDetailsDto,
      notify?: boolean
    ) => void;
    refetch: () => void;
  }
> = ({
  isOpen,
  onClose,
  jobApplication,
  mode = "REQUEST",
  onViewDocument,
  onRequestMore,
  handleStatusUpdate,
  isCandidateViewingDocuments=false,
  refetch, // Properly destructure refetch here
}) => {
  const { userDetails } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [DocumentSubmissionMode, setDocumentSubmissionMode] =
    useState<JobApplicationDocumentStatusType>("DOCUMENT_REQUESTED");
  const [reRequestingDoc, setReRequestingDoc] = useState<string | null>(null);
  const [offerLetterSent, setOfferLetterSent] = useState(false);
  const [currentRequestedCount, setCurrentRequestedCount] = useState(0);
  const [currentMode, setCurrentMode] = useState<"REQUEST" | "VIEW" | "READ_ONLY">(mode);
  const queryClient = useQueryClient();
  const userType = window.location.href.includes("corporate")
    ? secureStorage.getItem<UserRole>(SecureStorageKeyEnum.CORPORATEUSERTYPE)
    : "ADMIN";
  const { control, handleSubmit, reset, watch } = useForm<FormData>({
    defaultValues: {
      documents: [{ name: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "documents",
  });

  const watchedFields = watch("documents");
  useEffect(() => {
    setOfferLetterSent(hasOfferLetterSent(jobApplication));
  }, [jobApplication]);
  useEffect(() => {
    if (isOpen) {
      reset({ documents: [{ name: "" }] });
      // Calculate current requested document count
      const requestedDocs = isCandidateViewingDocuments ? getRequestedDocumentsForCandidate() : getRequestedDocuments();
      setCurrentRequestedCount(requestedDocs.length);

      // Set mode based on whether this is additional request
      setCurrentMode(mode);
      if (mode === "REQUEST" && requestedDocs.length > 0) {
        setDocumentSubmissionMode("DOCUMENT_ADDITIONAL_REQUESTED");
      } else {
        setDocumentSubmissionMode("DOCUMENT_REQUESTED");
      }
    }
  }, [isOpen, reset, mode]);

  const invalidateJobApplication = () => {
    RBAC.can("play_admin")
      ? queryClient.invalidateQueries({
          queryKey: ["AdminJobsApplicationQuery"],
        })
      : queryClient.invalidateQueries({
          queryKey: ["CorporateJobsApplicationQuery"],
        });
  };

  const getDocumentStatus = (docName: string): { color: string; tooltip: string } => {
    const status = jobApplication.documentCurrentStatusMap?.[docName];

    switch (status) {
      case "DOCUMENT_REQUESTED":
      case "DOCUMENT_ADDITIONAL_REQUESTED":
        return { color: "bg-red-500", tooltip: "Awaiting" };
      case "DOCUMENT_REVISION_REQUESTED":
        return { color: "bg-orange-500", tooltip: "Rerequested" };
      case "DOCUMENT_SUBMITTED":
      case "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED":
      case "DOCUMENT_REVISION_REQUEST_SUBMITTED":
        return { color: "bg-green-500", tooltip: "Submitted" };
      default:
        return { color: "bg-gray-400", tooltip: "Unknown" };
    }
  };

  const isDocumentRerequested = (docName: string): boolean => {
    return jobApplication.documentCurrentStatusMap?.[docName] === "DOCUMENT_REVISION_REQUESTED";
  };

  /**
   * Generate pre-signed URLs and open document in new tab
   */
  const handleViewDocumentClickForViewDocument = async (docName: string) => {
    const cloudFileName = getCloudFileName(docName);
    if (!cloudFileName) {
      toast.error("Document file not found", getToastOptions({}));
      return;
    }
    try {
      setIsLoading(true);
      const payload = {
        jobApplicationId: jobApplication.id,
        userId: jobApplication?.applicantDetails?.id || userDetails?.id,
        cloudFileNames: [cloudFileName],
      };

      const { response, error } = await httpServiceObj.post(
        `/file/gsu2v/USER_JOB_APPL_DOC`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error || !response || !Array.isArray(response) || response.length === 0) {
        throw new Error("Failed to generate document URL");
      }

      // Open document in new tab
      const documentUrl = response[0].objectUrl;
      window.open(documentUrl, "_blank");
    } catch (error) {
      console.error("Error viewing document:", error);
      toast.error("Failed to view document", getToastOptions({}));
    } finally {
      refetch();
      setIsLoading(false);
    }
  };

  /**
   * Handle re-requesting specific document
   */
  const handleReRequestDocument = async (docName: string) => {
    setReRequestingDoc(docName);
    setIsLoading(true);

    try {
      if (!userType || !userDetails) {
        throw new Error("User type or user details not found in secure storage");
      }
      const payload: RequestDocumentPayload = {
        userId: userDetails?.id,
        emailId: jobApplication.applicantDetails.email,
        userType: userType,
        status: "DOCUMENT_REVISION_REQUESTED",
        requestedDocumentNames: [docName],
        applicantName: jobApplication.applicantDetails.name,
      };

      const { response, error } = await httpServiceObj.patch(
        `/job-application/${jobApplication.id}/corp-action`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error || !response) {
        throw new Error(
          (error instanceof Error ? error.message : error) || "Failed to re-request document"
        );
      }

      toast.success(`Document "${docName}" re-requested successfully!`, getToastOptions({}));
      // handleStatusUpdate("DOCUMENT_REVISION_REQUESTED", jobApplication);
    } catch (error) {
      console.error("Error re-requesting document:", error);
      toast.error("Failed to re-request document", getToastOptions({}));
    } finally {
      refetch();
      setIsLoading(false);
      setReRequestingDoc(null);
    }
  };

  /**
   * Handle document verification
   */
  const handleVerifyAndApprove = async () => {
    setIsVerifying(true);

    try {
      if (!userType) {
        throw new Error("User type not found in secure storage");
      }

      const payload = {
        userId: userDetails?.id,
        emailId: jobApplication.applicantDetails.email,
        userType: userType,
        status: "DOCUMENT_VERIFIED",
        applicantName: jobApplication.applicantDetails.name,
      };

      const { response, error } = await httpServiceObj.patch(
        `/job-application/${jobApplication.id}/corp-action`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error || !response) {
        throw new Error(
          (error instanceof Error ? error.message : error) || "Failed to verify documents"
        );
      }

      toast.success("Documents verified and approved successfully!", getToastOptions({}));
      // handleStatusUpdate("DOCUMENT_VERIFIED", jobApplication);
    } catch (error) {
      console.error("Error verifying documents:", error);
      toast.error("Failed to verify documents", getToastOptions({}));
    } finally {
      refetch();
      setIsVerifying(false);
      invalidateJobApplication();
      onClose();
    }
  };

  /**
   * onFormSubmit - Handles the form submission for requesting documents.
   */
  const onFormSubmit = async (data: FormData) => {
    const documentNames = data.documents
      .map((doc) => doc.name.trim())
      .filter((name) => name !== "");

    if (documentNames.length === 0) {
      toast.info("Please enter at least one document name", getToastOptions());
      return;
    }

    // Check max documents limit
    if (currentRequestedCount + documentNames.length > MAX_DOCUMENTS) {
      toast.info(
        `Cannot request more than ${MAX_DOCUMENTS} documents total. You can request ${
          MAX_DOCUMENTS - currentRequestedCount
        } more documents.`,
        getToastOptions()
      );
      return;
    }

    setIsLoading(true);
    try {
      const isCorporate = window.location.href.includes("corporate");

      if (!userType || !userDetails) {
        throw new Error("User type or user details not found in secure storage");
      }

      const payload: RequestDocumentPayload = {
        userId: userDetails?.id,
        emailId: jobApplication.applicantDetails.email,
        userType: userType,
        status: DocumentSubmissionMode,
        requestedDocumentNames: documentNames,
        applicantName: jobApplication.applicantDetails.name,
      };

      const { response, error } = await httpServiceObj.patch(
        `/job-application/${jobApplication.id}/corp-action`,
        payload,
        true,
        {},
        false,
        "JOB"
      );

      if (error || !response) {
        throw new Error(
          (error instanceof Error ? error.message : error) || "Failed to submit documents"
        );
      }

      const successMessage =
        DocumentSubmissionMode === "DOCUMENT_ADDITIONAL_REQUESTED"
          ? "Additional documents requested successfully!"
          : "Documents requested successfully!";

      toast.success(successMessage, getToastOptions({}));

      /*  const statusUpdate = DocumentSubmissionMode === "DOCUMENT_ADDITIONAL_REQUESTED" 
        ? "DOCUMENT_ADDITIONAL_REQUESTED" as JobApplicationStatusType
        : "DOCUMENT_REQUESTED" as JobApplicationStatusType;
        
      handleStatusUpdate(statusUpdate, jobApplication); */
      onClose();
    } catch (error) {
      console.error("Error submitting documents:", error);
      toast.error("Failed to request documents", getToastOptions({}));
    } finally {
      refetch();
      setIsLoading(false);
      reset({ documents: [{ name: "" }] });
    }
  };

  const handleAddDocument = () => {
    if (currentRequestedCount + fields.length >= MAX_DOCUMENTS) {
      toast.info(
        `Cannot add more documents. Maximum ${MAX_DOCUMENTS} documents allowed.`,
        getToastOptions()
      );
      return;
    }
    append({ name: "" });
  };

  const handleRemoveDocument = (index: number) => {
    if (fields.length > 1) {
      remove(index);
    }
  };

  const getRequestedDocuments = (): DocumentInfo[] => {
    if (!jobApplication.requestedDocumentDetails) return [];

    const docMap = new Map<string, DocumentInfo>();

  jobApplication.requestedDocumentDetails.forEach((detail) => {
      detail.requestedDocumentNames.forEach((name) => {
        docMap.set(name, {
          name,
          status: jobApplication.documentCurrentStatusMap?.[name] || detail.documentStatus,
          requestedOn: new Date(detail.actionDate).toLocaleDateString("en-GB"),
          submittedOn: getSubmittedDate(name),
          cloudFileName: getCloudFileName(name),
          isRerequested: isDocumentRerequested(name),
        });
      });
    });
    return Array.from(docMap.values());
  };

  const getRequestedDocumentsForCandidate = (): DocumentInfo[] => {
    if (!jobApplication.responseDocumentDetails) return [];
    const docMap = new Map<string, DocumentInfo>();

    jobApplication.responseDocumentDetails.forEach((detail) => {
      detail.documentMapping.forEach((mapping) => {
        docMap.set(mapping.documentName, {
          name: mapping.documentName,
          status: detail.documentStatus,
          requestedOn: new Date(detail.actionDate).toLocaleDateString("en-GB"),
          submittedOn: new Date(detail.actionDate).toLocaleDateString("en-GB"),
          cloudFileName: mapping.cloudFileName,
          isRerequested: false,
        });
      });
    });
    return Array.from(docMap.values());
  };


  const getSubmittedDate = (documentName: string) => {
    if (!jobApplication.responseDocumentDetails) return null;

    for (const response of jobApplication.responseDocumentDetails) {
      const mapping = response.documentMapping.find((m) => m.documentName === documentName);
      if (mapping) {
        return new Date(response.actionDate).toLocaleDateString("en-GB");
      }
    }
    return null;
  };

  const getCloudFileName = (documentName: string) => {
    return jobApplication.documentCurrentMapping?.[documentName] || null;
  };

  const canReRequestDocument = (docName: string): boolean => {
    // Can only re-request if document has been submitted at least once
    return !!getSubmittedDate(docName);
  };

  const handleRequestMoreDocuments = () => {
    setCurrentMode("REQUEST");
    setDocumentSubmissionMode("DOCUMENT_ADDITIONAL_REQUESTED");
    reset({ documents: [{ name: "" }] });
  };

  const getRemainingDocumentSlots = () => {
    return MAX_DOCUMENTS - currentRequestedCount;
  };

  if (!isOpen) return null;

  if (currentMode === "VIEW" || currentMode === "READ_ONLY") {
    const documents = isCandidateViewingDocuments ? getRequestedDocumentsForCandidate() : getRequestedDocuments();
    if (documents.length === 0 && !offerLetterSent) {
      return <NoDataPresent />;
    }

    return (
      <div className="bg-white rounded-xl h-[500px] pt-4 flex flex-col">
        {/* Header */}
        <h1 className="text-black text-base text-left font-semibold font-['Poppins'] leading-tight">
          View document {mode !== "READ_ONLY" && `(${documents.length}/${MAX_DOCUMENTS})`}
        </h1>

        {/* Request Date */}
        <div className="absolute right-3 top-[26px] text-right">
          <span className="text-neutral-400 text-[10px] font-normal font-['Poppins'] leading-none">
            Document requested on :
          </span>
          <span className="text-black text-[10px] font-normal font-['Poppins'] leading-none">
            {" "}
            {documents[0]?.requestedOn || "N/A"}
          </span>
        </div>

        {/* Documents List */}
        <div className="mt-4 w-full flex flex-col gap-3 h-[400px] overflow-y-auto">
          {documents.map((doc, index) => {
            const statusInfo = getDocumentStatus(doc.name);
            return (
              <div key={index} className="w-full flex flex-col gap-3.5">
                <div className="flex justify-start items-center gap-3.5">
                  <div
                    className={`w-full h-11 bg-gray-50 rounded-xl border border-gray-200 flex items-center px-4 ${
                      doc.submittedOn && doc.cloudFileName
                        ? "cursor-pointer hover:bg-gray-100"
                        : "cursor-default"
                    }`}
                    onClick={() =>
                      doc.submittedOn &&
                      doc.cloudFileName &&
                      handleViewDocumentClickForViewDocument(doc.name)
                    }>
                    <FileText className="w-4 h-4 text-gray-400 mr-2" />
                    <span
                      className={`text-sm truncate flex-1 capitalize text-left ${
                        doc.isRerequested ? "text-red-600" : "text-gray-700"
                      }`}>
                      {doc.name}
                    </span>

                    {/* Status Dot with Tooltip */}
                    <div
                      className={`w-3 h-3 rounded-full ${statusInfo.color} cursor-help`}
                      title={statusInfo.tooltip}
                    />
                  </div>

                  {/* Re-request Document Button */}
                  {mode !== "READ_ONLY" && (
                    <button
                      className={`w-12 h-11 p-3 rounded-[10px] flex justify-center items-center ${
                        canReRequestDocument(doc.name)
                          ? "bg-[#57E1E1] hover:bg-[#4dd1d1] cursor-pointer"
                          : "bg-gray-300 cursor-not-allowed"
                      }`}
                      onClick={() =>
                        canReRequestDocument(doc.name) && handleReRequestDocument(doc.name)
                      }
                      disabled={
                        isLoading || reRequestingDoc === doc.name || !canReRequestDocument(doc.name)
                      }
                      title={
                        canReRequestDocument(doc.name)
                          ? "Re-request document"
                          : "Document must be submitted first"
                      }>
                      {reRequestingDoc === doc.name ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Undo2
                          className={`scale-y-[-1] -rotate-180 w-12 h-12 ${
                            canReRequestDocument(doc.name) ? "text-white" : "text-gray-500"
                          }`}
                        />
                      )}
                    </button>
                  )}
                </div>
                <div className="text-xs text-left text-gray-600">
                  Status:{" "}
                  {doc.status
                    .replace(/_/g, " ")
                    .toLowerCase()
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </div>
              </div>
            );
          })}

          {offerLetterSent && isCandidateViewingDocuments &&(
            <div className="w-full flex flex-col gap-3.5">
              <div className="flex justify-start items-center gap-3.5">
                <div
                  className={`w-full h-11 bg-gray-50 rounded-xl border border-gray-200 flex items-center px-4 cursor-pointer hover:bg-gray-100`}
                  onClick={async () => {
                    await handleViewDocumentClick(jobApplication, "LETTER",isCandidateViewingDocuments,userDetails);
                  }}
                  >
                  <FileText className="w-4 h-4 text-gray-400 mr-2" />
                  <span className={`text-sm truncate flex-1 capitalize text-left text-gray-700`}>
                    Offer Letter
                  </span>

                  {/* Status Dot with Tooltip */}
                  <div className={`w-3 h-3 rounded-full bg-green-500 cursor-help`} title={"Sent"} />
                </div>
              </div>
              <div className="text-xs text-left text-gray-600">Status: Sent</div>
            </div>
          )}

          {/* List OfferLetter also if present */}
          {offerLetterSent && !isCandidateViewingDocuments &&(
            <div className="w-full flex flex-col gap-3.5">
              <div className="flex justify-start items-center gap-3.5">
                <div
                  className={`w-full h-11 bg-gray-50 rounded-xl border border-gray-200 flex items-center px-4 cursor-pointer hover:bg-gray-100`}
                  onClick={async () => {
                    await handleViewDocumentClick(jobApplication, "LETTER");
                  }}>
                  <FileText className="w-4 h-4 text-gray-400 mr-2" />
                  <span className={`text-sm truncate flex-1 capitalize text-left text-gray-700`}>
                    Offer Letter
                  </span>

                  {/* Status Dot with Tooltip */}
                  <div className={`w-3 h-3 rounded-full bg-green-500 cursor-help`} title={"Sent"} />
                </div>
              </div>
              <div className="text-xs text-left text-gray-600">Status: Sent</div>
            </div>
          )}
        </div>

        {/* Submit Date */}
        <div className="right-3 bottom-[26px] text-right">
          <span className="text-neutral-400 text-[10px] font-normal font-['Poppins'] leading-3">
            Document submitted on :
          </span>
          <span className="text-black text-[10px] font-normal font-['Poppins'] leading-3">
            {" "}
            {documents[0]?.submittedOn || "--/--/----"}
          </span>
        </div>

        {/* Request More Button */}
        {getRemainingDocumentSlots() > 0 && mode !== "READ_ONLY" && (
          <button
            onClick={handleRequestMoreDocuments}
            className="flex gap-2 mb-1 w-fit justify-center items-center text-xs hover:text-blue-700">
            <Plus className="w-6 h-auto shadow-2xl border bg-white text-blue-600 rounded-full p-1" />
            Request more documents ({getRemainingDocumentSlots()} remaining)
          </button>
        )}

        {/* Verified & Approve Button */}
        {mode !== "READ_ONLY" && (
          <button
            onClick={handleVerifyAndApprove}
            disabled={
              isVerifying ||
              documents.some((doc) => !doc.submittedOn) ||
              jobApplication.statusTracker.some((entry) => entry.newStatus === "DOCUMENT_VERIFIED")
            }
            className="w-48 h-11 pl-px pr-2.5 py-2.5 text-sm leading-3 tracking-tight font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-[10px] flex justify-center items-center gap-1">
            {isVerifying ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Verified className="w-4 h-4" />
            )}
            {isVerifying
              ? "Verifying..."
              : jobApplication.statusTracker.some(
                  (entry) => entry.newStatus === "DOCUMENT_VERIFIED"
                )
              ? "Verified & approve"
              : documents.some((doc) => !doc.submittedOn)
              ? "Verify & approve"
              : "Verify & approve"}
          </button>
        )}
      </div>
    );
  }

  // REQUEST MODE
  const remainingSlots = getRemainingDocumentSlots();
  const canAddMore = remainingSlots > fields.length;

  return (
    <div className="bg-white rounded-xl h-[500px] pt-4 flex flex-col">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">
          {DocumentSubmissionMode === "DOCUMENT_ADDITIONAL_REQUESTED"
            ? `Request additional documents (${remainingSlots} remaining)`
            : "Request for document"}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"></button>
      </div>

      <div className="flex-1 flex h-full px-1 flex-col justify-between mt-1 overflow-y-auto">
        <div className="space-y-4 flex-grow">
          {fields.map((field, index) => (
            <div key={field.id} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <span className="text-red-500 mr-1">*</span>
                Document {index + 1}
              </label>
              <div className="flex gap-2">
                <input
                  {...control.register(`documents.${index}.name` as const, {
                    required: "Document name is required",
                  })}
                  type="text"
                  placeholder={`Enter Document ${index + 1} name`}
                  className="flex-1 px-4 py-2 rounded-md bg-gray-100 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDocument(index)}
                    className="px-3 py-2 text-red-600 hover:text-red-700 rounded-md border border-gray-200 hover:bg-gray-50">
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {canAddMore && (
            <button
              type="button"
              onClick={handleAddDocument}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <span className="text-xl leading-none">+</span> Add document
            </button>
          )}

          {!canAddMore && remainingSlots === 0 && (
            <p className="text-sm text-gray-500">
              Maximum document limit reached ({MAX_DOCUMENTS}/{MAX_DOCUMENTS})
            </p>
          )}
        </div>

        <div className="flex justify-start gap-3 pt-6 mt-4">
          <button
            type="button"
            onClick={() => handleSubmit(onFormSubmit)()}
            disabled={isLoading || watchedFields.every((doc) => !doc.name.trim())}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2">
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send size={16} />
            )}
            {isLoading ? "Requesting..." : "Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestDocumentModal;
