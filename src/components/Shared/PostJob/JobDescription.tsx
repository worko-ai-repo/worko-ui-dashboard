import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Upload, SendIcon, FileText, AlertCircle, X, ExternalLink } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { JobDetails } from "@Interfaces/CorporateDashboard.dto";
import { extractTextFromPDF } from "@Utils/PdfFileValidator.util";
import { validationRules } from "@Utils/FormValidator.utils";
import { JobTypeofEmploymentType } from "@TypesAndConstants/JobsAndApplication.type";

interface FormData {
  description: string;
  file: FileList | null;
}

interface JobDescriptionProps {
  onClose: () => void;
  setIsJobFormModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setJobDetails: React.Dispatch<React.SetStateAction<JobDetails | null>>;
  setJobMode: React.Dispatch<React.SetStateAction<"CREATE" | "UPDATE" | "DUPLICATE" | "CREATE_WITH_DATA">>;
}

interface JdParsedResponse {
  jobTitle: string;
  department: string;
  location: string;
  typeOfEmployment: string;
  workMode: string;
  noticePeriod: string;
  numberOfOpenings: string; // can change to number if you want strictly numeric
  salaryRange: {
    min: string | number; // depends on how you want to store
    max: string | number;
  };
  experienceRange: {
    min: string | number;
    max: string | number;
  };

  mustHaveSkills: string[];
  goodToHaveSkills: string[];
  softSkills: string[];
  technicalSkills: string[];
  coreSkills: string[];

  mandatoryRequirements: string[];
  preferredRequirements: string[];

  formattedHTML: string; // pre-rendered HTML description
}

const mapParsedToJobDetails = (parsed: JdParsedResponse): JobDetails => {
  return {
    id: undefined, // new job, so no ID yet
    jobTitle: parsed.jobTitle || "",
    company: "", // to be set separately
    companyDetails: {
      aboutCompany: "",
      carrierPage: "",
      id: "",
      industry: "",
      logo: "",
      logoUrl: "",
      name: "",
      website: "",
      linkedIn: "",
      isVerified: false,
      teamSize: 0,
      createdAt: "",
      updatedAt: "",
      isDeleted: false,
      PK: "",
      SK: "",
      GSI1PK: "",
      GSI1SK: "",
    }, // default value since not in parsed response
    offerings: "", // default value since not in parsed response
    gradeLevel: "", // default value since not in parsed response
    department: parsed.department || "",
    workMode: parsed.workMode as "WFO" | "WFH" | "HYBRID" | undefined,
    location: {
      city: parsed.location ? [parsed.location] : [],
      fullLocation: parsed.location ? [parsed.location] : [],
    },
    experienceRange: {
      min: parsed.experienceRange?.min ? Number(parsed.experienceRange.min) : undefined,
      max: parsed.experienceRange?.max ? Number(parsed.experienceRange.max) : undefined,
    },
    salaryRange: {
      min: parsed.salaryRange?.min ? Number(parsed.salaryRange.min) : undefined,
      max: parsed.salaryRange?.max ? Number(parsed.salaryRange.max) : undefined,
    },
    creatorName: "", // default value since not in parsed response
    coreSkills: parsed.coreSkills || [],
    technicalSkills: parsed.technicalSkills || [],
    softSkills: parsed.softSkills || [],
    goodSkills: parsed.goodToHaveSkills || [],
    otherRequirements:"",
    typeofEmployment: parsed.typeOfEmployment as JobTypeofEmploymentType,
    status: "PUBLISHED", // default until set
    noticePeriod: parsed.noticePeriod ? Number(parsed.noticePeriod) : 0,
    displaySalaryRange: !!parsed.salaryRange?.min || !!parsed.salaryRange?.max,
    miscellaneousSkills: null,
    jobDescription: parsed.formattedHTML || "",
    htmlJobDescription: parsed.formattedHTML || "",
    fixedComponent: undefined,
    variableComponent: undefined,
  };
};

export default function JobDescription({
  onClose,
  setIsJobFormModalOpen,
  setJobDetails,
  setJobMode,
}: JobDescriptionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [fileError, setFileError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null); // Store PDF URL for viewing
  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI;
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
    trigger,
    clearErrors,
  } = useForm<FormData>({
    defaultValues: {
      description: "",
      file: null,
    },
    mode: "onChange",
  });

  /**
   * Sends job description to API for parsing
   * @param jobDescription - The job description text to parse
   * @returns Promise<boolean> - Success status
   */
  const parseJD = async (jobDescription: string) => {
    try {
      const { response, error } = await httpServiceObj.post<JdParsedResponse | null>(
        `${APP_JOBS_API_URI}/job/parsejd`,
        { jobDescription },
        true,
        {},
        true
      );

      if (error) {
        throw new Error(error.message || "Failed to parse job description");
      }

      if (response) {
        const mappedJob = mapParsedToJobDetails(response);
        setJobDetails(mappedJob);
        setJobMode("CREATE_WITH_DATA");
      }

      return true;
    } catch (error) {
      console.error("Error parsing JD:", error);
      setError("root", {
        type: "manual",
        message: "Failed to parse job description. Please try again.",
      });
      return false;
    }
  };

  /**
   * Validates uploaded file for type, size, and other constraints
   * @param file - The file to validate
   * @returns string | null - Error message or null if valid
   */
  const validateFile = (file: File): string | null => {
    // Check file type - accept only PDF
    if (file.type !== "application/pdf") {
      return "Only PDF files are supported";
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return "File size must be less than 10MB";
    }

    // Check if file name is valid
    if (!file.name || file.name.trim() === "") {
      return "Invalid file name";
    }

    return null;
  };

  /**
   * Creates a blob URL for the uploaded PDF to enable viewing
   * @param file - The PDF file to create URL for
   * @returns string - The blob URL
   */
  const createPdfUrl = (file: File): string => {
    return URL.createObjectURL(file);
  };

  /**
   * Handles file selection and validation
   * Currently only validates and stores the file, no parsing
   * @param event - File input change event
   */
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    // Reset states when no file is selected
    if (!selectedFile) {
      setFileError("");
      setUploadedFile(null);
      setPdfUrl(null);
      clearErrors("file");
      return;
    }

    // Validate the selected file
    const validationError = validateFile(selectedFile);
    if (validationError) {
      setFileError(validationError);
      setUploadedFile(null);
      setPdfUrl(null);
      event.target.value = ""; // Clear the input
      return;
    }

    // File is valid, store it and create preview URL
    setFileError("");
    setUploadedFile(selectedFile);
    try {
      const text = await extractTextFromPDF(selectedFile);

      // If text extraction is successful, set it to form value
      // setValue("description", text);
      // // trigger("description"); // Trigger validation for description field
      onSubmit({ description: text, file: null }); // Submit with extracted text
    } catch (error) {
      // Cleanup: bad PDF or OCR, so remove uploaded file
      setUploadedFile(null); // Assuming you store uploaded file
      setValue("description", ""); // Clear the description field
    }

    const url = createPdfUrl(selectedFile);
    setPdfUrl(url);
    clearErrors(["file"]);
  };

  /**
   * Removes the uploaded file and cleans up associated data
   */
  const removeFile = () => {
    // Clean up blob URL to prevent memory leaks
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setUploadedFile(null);
    setPdfUrl(null);
    setFileError("");
    setValue("description", "");

    // Clear the file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  /**
   * Opens the uploaded PDF in a new tab for viewing
   */
  const viewPdf = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  /**
   * Handles form submission
   * Currently only processes text description, file parsing is commented out
   * @param data - Form data containing description and file
   */
  const onSubmit = async (data: FormData) => {
    // Validate that we have description text
    if (!data.description.trim()) {
      setError("description", {
        type: "required",
        message: "Job description is required",
      });
      return;
    }

    setIsLoading(true);
    clearErrors("root");

    try {
      // Send job description to API for parsing
      const success = await parseJD(data.description.trim());
      if (success) {
        /*         // fuse the jd in setJobDetails
        setJobDetails((prev) =>
          prev ? { ...prev, htmlJobDescription: data..trim() } : prev
        ); */
        setIsJobFormModalOpen(true);
        onClose();
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup blob URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className=" mt-4  max-sm:w-[320px] sm:w-[800px] flex flex-col text-start">
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full justify-between">
        {/* Left Side: Text Area for manual input */}
        <div className="flex-1 w-full lg:w-[60%] min-w-0">
          <h2 className="mb-2 text-sm font-semibold text-black">Write or Paste description here</h2>
          <textarea
            {...register("description", validationRules.jobDescription)}
            className={`w-full h-48 p-4 rounded-xl bg-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm ${
              errors.description ? "border-2 border-red-500" : ""
            }`}
            placeholder="Write or paste here"
          />
          {/* Display validation error for description field */}
          {errors.description && (
            <p className="text-red-500 text-sm mt-1 flex items-start gap-1">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{errors.description.message}</span>
            </p>
          )}
        </div>

        {/* Middle: OR separator */}
        <div className="self-center text-sm font-medium text-gray-600 lg:px-4 lg:py-0 py-2">
          <span className="hidden lg:block">Or</span>
          <div className="lg:hidden w-full h-px bg-gray-300 relative">
            <span className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-gray-600">
              Or
            </span>
          </div>
        </div>

        {/* Right Side: PDF Upload section */}
        <div className="w-full lg:w-1/4 ">
          <h2 className="mb-2 text-sm font-semibold text-black">Upload job description</h2>

          {/* Upload area */}
          <div className="flex flex-col items-center justify-center w-full h-48 border border-gray-300 rounded-xl relative">
            {!uploadedFile ? (
              // Show upload button when no file is selected
              <label className="cursor-pointer p-3 text-white rounded-[10px] bg-[#57E1E1] bg-[linear-gradient(0deg,_rgba(49,_107,_255,_0.3)_0%,_rgba(56,_161,_214,_0.3)_100%)] border-gray-300 flex flex-col items-center justify-center hover:opacity-90 transition-opacity">
                {isLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-white " />
                  </>
                )}
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </label>
            ) : (
              // Show file info when file is uploaded
              <div className="flex flex-col items-center gap-2 p-4 w-full">
                <div className="flex items-center gap-2 text-sm text-gray-700 w-full justify-center">
                  <FileText className="w-4 h-4 flex-shrink-0" />
                  <p className="truncate max-w-[180px] sm:max-w-[220px]" title={uploadedFile.name}>
                    {uploadedFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 flex-shrink-0 p-1"
                    title="Remove file">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {/* File size info */}
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
          </div>

          {/* View PDF link - shows only when PDF is uploaded */}
          {uploadedFile && pdfUrl && (
            <button
              type="button"
              onClick={viewPdf}
              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1 underline justify-center w-full lg:justify-start">
              <ExternalLink className="w-4 h-4" />
              View PDF
            </button>
          )}

          {/* Display file-related errors */}
          {fileError && (
            <p className="text-red-500 text-sm mt-2 flex items-start gap-1 text-center lg:text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{fileError}</span>
            </p>
          )}

          {/* File type info */}
          <p className="text-xs text-gray-500 mt-2 text-center lg:text-left">
            Only PDF files are supported
          </p>
        </div>
      </div>
      {/* Submit Button */}
      <div className="mt-2 flex justify-start gap-2">
        {/* Skip button */}
        <button
          type="button"
          onClick={() => {
            onClose();
            setJobDetails(null);
            setIsJobFormModalOpen(true);
            setJobMode("CREATE");
          }}
          className="border text-gray-500 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition mr-2">
          Skip
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <SendIcon className="w-4 h-4" />
          )}
          {isLoading ? "Processing..." : "Fetch"}
        </button>
      </div>
    </form>
  );
}
