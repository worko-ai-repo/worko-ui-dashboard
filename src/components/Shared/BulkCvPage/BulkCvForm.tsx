import React, { useState, useEffect, useCallback } from "react";
import { useForm, Controller } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Send, Upload, X, AlertCircle } from "lucide-react";

import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { useAppContext } from "@Context/App.context";
import { DropDownSelectedJobData } from "@Components/Shared/DropDown/JobListDropdown";

import { CorporateBulkScreenPayload, FileMetadataDto } from "@Interfaces/CorporateServices.dto";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";
import { useNavigate } from "react-router-dom";

interface JobData {
  companyId: string;
  jobDescription: string;
  mustHaveSkills: string[];
  goodToHaveSkills: string[];
  mustNotHaveSkills: string[];
  jobTitle: string;
  experienceRange: {
    min: number;
    max: number;
  };
  jobjobLocation: string;
  id: string;
}

interface BulkCvFormProps {
  isOpen: boolean;
  onClose: () => void;
  jobData: JobData;
  dropDownData: DropDownSelectedJobData | null;
}

const BulkCvForm: React.FC<BulkCvFormProps> = ({ isOpen, onClose, jobData, dropDownData }) => {
  const nav = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [BulkResumeId, setBulkResumeId] = useState<string>("");
  const { userDetails } = useAppContext();
  const companyId =
  RBAC.can("play_admin") ? import.meta.env.APP_WORKO_COMP_ID : userDetails?.companyId || "";
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<CorporateBulkScreenPayload>({
    defaultValues: {
      companyId: companyId,
      jobTitle: "",
      experienceRange: { min: 1, max: 3 },
      coreSkills: [],
      softSkills: [],
      mustHave: [],
      mustNotHaveSkills: [],
      goodToHave: [],
      technicalSkills: [],
      industryPreference: "",
      jobLocation: "",
      files: [],
    },
  });

  const experienceMin = watch("experienceRange.min");
  const experienceMax = watch("experienceRange.max");

  // Prefill form data when jobData is available
  useEffect(() => {
    try {
      if (!jobData) {
        return; //@Todo#TEST
      }
      if (jobData) {
        setValue("jobTitle", jobData.jobTitle || "");
        setValue("experienceRange", {
          min: typeof jobData.experienceRange?.min === "number" ? jobData.experienceRange.min : 0,
          max: typeof jobData.experienceRange?.max === "number" ? jobData.experienceRange.max : 1,
        });
        setValue("mustHave", jobData.mustHaveSkills || []);
        setValue("goodToHave", jobData.goodToHaveSkills || []);
        setValue(
          "jobLocation",
          jobData.jobjobLocation !== "Not Mentioned" ? jobData.jobjobLocation : ""
        );

        // Extract technical skills from job description (basic implementation)
        const techSkillsMatch = jobData.jobDescription?.match(
          /technical[^.]*skills[^.]*:?\s*([^.]*)/i
        );
        if (techSkillsMatch) {
          setValue(
            "technicalSkills",
            techSkillsMatch[1].split(",").map((skill) => skill.trim())
          );
        }
      }
    } catch (error) {
      console.error("Error pre-filling form data:", error);
    }
  }, [jobData, setValue]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setUploadedFiles([]);
      setUploadError("");
    }
  }, [isOpen, reset]);

  const validatePDFFile = (file: File): boolean => {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  };

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      Array.from(files).forEach((file) => {
        if (validatePDFFile(file)) {
          validFiles.push(file);
        } else {
          invalidFiles.push(file.name);
        }
      });

      if (invalidFiles.length > 0) {
        setUploadError(`Invalid files (only PDF allowed): ${invalidFiles.join(", ")}`);
        return;
      }

      if (uploadedFiles.length + validFiles.length > 200) {
        setUploadError("Maximum 200 files allowed");
        return;
      }

      setUploadError("");
      const newFiles = [...uploadedFiles, ...validFiles];
      setUploadedFiles(newFiles);
      setValue("files", newFiles);
    },
    [uploadedFiles, setValue]
  );

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    setValue("files", newFiles);
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const uploadToS3 = async (file: File, signedUrl: string, awsS3Tag: string): Promise<void> => {
    try {
      const res = await fetch(signedUrl, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!res.ok) {
        throw new Error(`S3 responded with status ${res.status}`);
      }
      // console.log(`File ${file.name} uploaded successfully to S3`);
    } catch (err) {
      console.error(" Error uploading file to S3:", err);
      throw new Error(`Failed to upload ${file.name}`);
    }
  };

  const storeDataToS3 = async (filePayload: FileMetadataDto[], bulkJdId: string) => {
    try {
      const response = await CorporateServiceObj.bulkScreeningUpload(filePayload, bulkJdId);
      if (!response || !("bulkCvs" in response)) {
        throw new Error("Failed to upload files or missing 'bulkCvs' property in response");
      }
      // Step 2: Upload files to S3 using signed URLs
      const uploadPromises = uploadedFiles.map((file, index) => {
        const signedUrl = response.bulkCvs[index]?.awsS3SignedUrl;
        if (!signedUrl) {
          throw new Error(`No signed URL for file: ${file.name}`);
        }
        return uploadToS3(file, signedUrl, response.bulkCvs[index]?.awsS3Tag || "");
      });

      await Promise.all(uploadPromises);

      // Success - continue to next step
      toast.success("Files uploaded successfully!", getToastOptions({}));
      // Simulate additional processing time
      setTimeout(() => {
        setIsProcessing(false);
        setIsFormOpen(false); // Close the form after processing
      }, 2000);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files!", getToastOptions({}));
      setIsProcessing(false);
    }
  };

  async function onSubmit(data: CorporateBulkScreenPayload) {
    if (uploadedFiles.length === 0) {
      setUploadError("Please upload at least one CV");
      return;
    }

    setIsProcessing(true);
    setUploadError("");
    try {
      const finalPayload = {
        //@Todo update this payload to match the CorporateBulkScreeningDto interface
        companyId:companyId ,
        jobTitle: data.jobTitle,
        experienceRange: {
          min: data.experienceRange.min,
          max: data.experienceRange.max,
        },
        mustHaveSkills: data.mustHave,
        mustNotHaveSkills: data.mustNotHaveSkills,
        jobDescription: dropDownData?.jobDescription || "",
        goodToHaveSkills: data.goodToHave,
        jobLocation: data.jobLocation,
      };
      // Step 1: Create a partition in ddb for the bulk CV check
      const request = await CorporateServiceObj.bulkScreening(finalPayload);
      if (!request || !("id" in request)) {
        throw new Error("Failed to create bulk screening request or missing 'id' property");
      }
      const bulkJdId = request.id;
      setBulkResumeId(bulkJdId);
      // Use this id to store the data in ddb
      const filePayload = uploadedFiles.map((file) => ({
        fileName: file.name,
        fileMimeType: "application/pdf",
      }));

      await storeDataToS3(filePayload, bulkJdId);

      // Use bulkJdId in subsequent logic
      console.log("Bulk Job Description ID:", bulkJdId);
    } catch (error) {
      console.error("Error creating bulk screening request:", error);
      setUploadError("Failed to create bulk screening request");
      setIsProcessing(false);
      return;
    }
  }
  const handleNavigateToDetailedListing = () => {
    nav(`listing/${BulkResumeId}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className={`  ${
            isFormOpen ? "bg-white " : "bg-gray-50 "
          }  max-sm:min-w-[95vw]  overflow-y-auto max-h-[90vh] `}
          onClick={(e) => e.stopPropagation()}>
          {isProcessing ? (
            <div className="w-full h-full flex  flex-col items-center justify-center text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin mb-2" />
              <p className="text-sm font-medium">Processing...</p>
            </div>
          ) : (
            <div className="m-1 sm:m-2 h-full    overflow-y-auto">
              {isFormOpen ? (
                <div className="m-1 sm:m-5 px-2 h-full   overflow-y-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block font-medium mb-1">Job title <span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="jobTitle"
                        control={control}
                        rules={{ required: "Job title is required" }}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Write job title here"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      />
                      {errors.jobTitle && (
                        <p className="text-red-500 text-sm mt-1">{errors.jobTitle.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Experience (years)</label>
                      <div className="px-2">
                        <div className="relative h-8 flex items-center">
                          {/* Track */}
                          <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>

                          {/* Active range */}
                          <div
                            className="absolute h-2 bg-blue-500 rounded-full"
                            style={{
                              left: `${(experienceMin / 50) * 100}%`,
                              width: `${((experienceMax - experienceMin) / 50) * 100}%`,
                            }}></div>

                          {/* Min handle */}
                          <Controller
                            name="experienceRange.min"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="range"
                                min="0"
                                max="50"
                                className="outline-none focus:outline-none focus:ring-0 absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-min"
                                style={{
                                  background: "transparent",
                                }}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value <= experienceMax) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            )}
                          />

                          {/* Max handle */}
                          <Controller
                            name="experienceRange.max"
                            control={control}
                            render={({ field }) => (
                              <input
                                {...field}
                                type="range"
                                min="0"
                                max="50"
                                className="outline-none focus:outline-none focus:ring-0  border-none absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-max"
                                style={{
                                  background: "transparent",
                                }}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value);
                                  if (value >= experienceMin) {
                                    field.onChange(value);
                                  }
                                }}
                              />
                            )}
                          />
                        </div>

                        {/* Labels */}
                        <div className="flex justify-between  items-center focus:ring-0 mt-2">
                          <span className="text-xs text-gray-500">0</span>
                          <div className="flex gap-4 text-sm font-medium">
                            <span className="text-blue-600">Min: {experienceMin}</span>
                            <span className="text-blue-600">Max: {experienceMax}</span>
                          </div>
                          <span className="text-xs text-gray-500">50</span>
                        </div>
                      </div>
                      <style>{`
                      .slider-min::-webkit-slider-thumb,
                      .slider-max::-webkit-slider-thumb {
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #3b82f6;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        cursor: pointer;
                        position: relative;
                        z-index: 2;
                      }

                      .slider-max::-webkit-slider-thumb {
                        z-index: 3; /* ensure this is above min thumb */
                      }

                      /* Same for Firefox */
                      .slider-min::-moz-range-thumb,
                      .slider-max::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #3b82f6;
                        border: 2px solid white;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
                        cursor: pointer;
                        position: relative;
                        z-index: 2;
                      }
                      .slider-max::-moz-range-thumb {
                        z-index: 3;
                      }

                      /* Optional: remove default track background */
                      .slider-min::-webkit-slider-track,
                      .slider-max::-webkit-slider-track {
                        background: transparent;
                      }
                      .slider-min::-moz-range-track,
                      .slider-max::-moz-range-track {
                        background: transparent;
                      }
                    `}</style>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {/* Core Skills */}
                    <div>
                      <label className="block font-medium mb-1">Core skills<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="coreSkills"
                        control={control}
                        rules={{ required: "Core skills are required" }}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="Write core skills here (comma separated)"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={field.value.join(", ")}
                            onChange={(e) => {
                              const values = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(values);
                            }}
                          />
                        )}
                      />
                      {errors.coreSkills && (
                        <p className="text-red-500 text-sm mt-1">{errors.coreSkills.message}</p>
                      )}
                    </div>

                    {/* Soft Skills */}
                    <div>
                      <label className="block font-medium mb-1">Soft skills<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="softSkills"
                        control={control}
                        rules={{ required: "Soft skills are required" }}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="Write soft skills here (comma separated)"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={field.value.join(", ")}
                            onChange={(e) => {
                              const values = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(values);
                            }}
                          />
                        )}
                      />
                      {errors.softSkills && (
                        <p className="text-red-500 text-sm mt-1">{errors.softSkills.message}</p>
                      )}
                    </div>

                    {/* Must Have */}
                    <div>
                      <label className="block font-medium mb-1">Must have<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="mustHave"
                        control={control}
                        rules={{ required: "Must have skills are required" }}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="Write must have skills or degrees (comma separated)"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={field.value.join(", ")}
                            onChange={(e) => {
                              const values = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(values);
                            }}
                          />
                        )}
                      />
                      {errors.mustHave && (
                        <p className="text-red-500 text-sm mt-1">{errors.mustHave.message}</p>
                      )}
                    </div>

                    {/* Good To Have */}
                    <div>
                      <label className="block font-medium mb-1">Good to have<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="goodToHave"
                        control={control}
                        rules={{ required: "Good to have skills are required" }}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="Write good to have skills or degrees (comma separated)"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={field.value.join(", ")}
                            onChange={(e) => {
                              const values = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(values);
                            }}
                          />
                        )}
                      />
                      {errors.goodToHave && (
                        <p className="text-red-500 text-sm mt-1">{errors.goodToHave.message}</p>
                      )}
                    </div>

                    {/* Technical Skills */}
                    <div>
                      <label className="block font-medium mb-1">Technical skills<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="technicalSkills"
                        control={control}
                        rules={{ required: "Technical skills are required" }}
                        render={({ field }) => (
                          <input
                            type="text"
                            placeholder="Write technical skills here (comma separated)"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={field.value.join(", ")}
                            onChange={(e) => {
                              const values = e.target.value
                                .split(",")
                                .map((s) => s.trim())
                                .filter(Boolean);
                              field.onChange(values);
                            }}
                          />
                        )}
                      />
                      {errors.technicalSkills && (
                        <p className="text-red-500 text-sm mt-1">
                          {errors.technicalSkills.message}
                        </p>
                      )}
                    </div>

                    {/* Industry Preference (not array) */}
                    <div>
                      <label className="block font-medium mb-1">Industry preference<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="industryPreference"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Write industry here"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                    {/* Upload area */}
                    <div className="mb-6">
                      <label className="block font-medium mb-1">Upload CVs (up to 200 PDFs) <span className="text-red-500 ml-1">*</span></label>
                      <div
                        className={`w-full h-36 flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                          dragActive
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-400 bg-gray-100 hover:bg-gray-50"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => document.getElementById("file-input")?.click()}>
                        <Upload className="w-8 h-8 text-gray-500 mb-2" />
                        <p className="text-gray-500 text-center">Upload / drag & drop PDF files</p>
                        <p className="text-xs text-gray-400 mt-1">PDF files only, max 200 files</p>
                      </div>
                      <input
                        id="file-input"
                        type="file"
                        multiple
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files)}
                      />
                      {uploadedFiles.length > 0 && (
                        <p className="text-xs mt-2 text-gray-600">
                          {uploadedFiles.length} CVs uploaded
                        </p>
                      )}
                      {uploadError && (
                        <div className="flex items-center gap-2 mt-2 text-red-500 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>{uploadError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-medium mb-1">Job Location<span className="text-red-500 ml-1">*</span></label>
                      <Controller
                        name="jobLocation"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="text"
                            placeholder="Write Job Location here"
                            className="w-full px-4 py-3 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="  flex w-full flex-wrap justify-between items-center relative">
                    <button
                      type="button"
                      onClick={handleSubmit(onSubmit)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                      <Send className="w-4 h-4" />
                      <span className="font-semibold">Screen resumes</span>
                    </button>
                    {/* Uploaded Files List */}
                    {uploadedFiles.length > 0 && (
                      <div className="flex items-center justify-between  gap-4 overflow-auto ">
                        <h4 className="font-medium ">Uploaded Files:</h4>
                        <div className="h-16 overflow-auto">
                          {uploadedFiles.map((file, index) => (
                            <div
                              key={index}
                              className="   border flex items-center justify-between bg-gray-50 p-2 rounded mb-1">
                              <span className="text-sm truncate flex-1">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-red-500 hover:text-red-700 ml-2">
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                (handleNavigateToDetailedListing(), null)
              )}
            </div>
          )}
        </div>
      )}
    </AnimatePresence>
  );
};

export default BulkCvForm;
