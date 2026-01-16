import React, { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { validationRules } from "@Utils/FormValidator.utils";
import Editor from "@Components/Shared/PostJob/RichTextEditor";
import Input from "@Components/Shared/PostJob/Input";
import SimpleSelectInput from "@Components/Shared/PostJob/InputSelect";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { CompanyDto } from "@Interfaces/JobsAndCompany.dto";
import { industryTypeOptions } from "../../../../types/common.constants";
import httpServiceObj from "@Services/ApiHandler.service";
import { Plus, Upload, X } from "lucide-react";
import { FileUploadResponseMetadataDto } from "@Interfaces/CorporateServices.dto";
import AdminServiceObj from "../Services/Admin.service";
import { CreateCompanyRequestDto } from "@Interfaces/AdminServices.dto";

type CompanyFormMode = "CREATE" | "UPDATE" | "REQUEST";

interface UpdateCompanyProps {
  onClose: () => void;
  fetchCompany: () => void;
  companyData?: CompanyDto | null;
  mode: CompanyFormMode;
  handleCompanyUpdate?: (
    companyId: string,
    updateData: any,
    successMessage?: string
  ) => Promise<void>;
  handleCompanyLogoUpdate?: (companyId: string, logoData: any) => Promise<void>;
}

interface CompanyLogoUploadRequestDto {
  companyLogoFileName: string;
  companyLogoFileMimeType: string;
}

interface CompanyLogoUploadResponseDto {
  awsS3SignedUrl: string;
  cloudFileName: string;
}

// Convert industry options to select format
const industrySelectOptions = industryTypeOptions.map((industry) => ({
  value: industry.value.toLocaleLowerCase(),
  label: industry.name,
}));

// Team size options
const teamSizeOptions = [
  { value: 1, label: "1-10 employees" },
  { value: 50, label: "11-50 employees" },
  { value: 200, label: "51-200 employees" },
  { value: 500, label: "201-500 employees" },
  { value: 1000, label: "501-1000 employees" },
  { value: 5000, label: "1001-5000 employees" },
  { value: 10000, label: "5000+ employees" },
];

const getFormTitle = (mode: CompanyFormMode) => {
  switch (mode) {
    case "CREATE":
      return "Create New Company";
    case "UPDATE":
      return "Update Company Information";
    case "REQUEST":
      return "Create Company on Request";
    default:
      return "Company Form";
  }
};

const getSubmitButtonText = (mode: CompanyFormMode) => {
  switch (mode) {
    case "CREATE":
      return "Add";
    case "UPDATE":
      return "Update Company";
    case "REQUEST":
      return "Add Company";
    default:
      return "Submit";
  }
};

const UpdateCompany: React.FC<UpdateCompanyProps> = ({
  onClose,
  fetchCompany,
  companyData,
  mode,
  handleCompanyUpdate,
  handleCompanyLogoUpdate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [initialFormData, setInitialFormData] = useState<string>("");
  const [logoError, setLogoError] = useState<string>(""); // Add logo error state

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    trigger,
    control,
    watch,
  } = useForm<CompanyDto>({
    defaultValues: {
      name: "",
      website: "",
      linkedIn: "",
      carrierPage: "",
      logoUrl: "",
      industry: "",
      teamSize: 0,
      aboutCompany: "",
      isCompanyRequestPageFlag: false,
    },
    mode: "onChange",
  });

  // Watch all form values to detect changes
  const watchedValues = watch();

  // Pre-fill form when companyData is available (UPDATE mode)
  useEffect(() => {
    if (companyData) {
      setValue("name", companyData.name || "");
      setValue("website", companyData.website || "");
      setValue("linkedIn", companyData.linkedIn || "");
      setValue("carrierPage", companyData.carrierPage || "");
      setValue("logoUrl", companyData.logoUrl || "");
      setValue("industry", companyData.industry || "");
      setValue("teamSize", companyData.teamSize || 0);
      setValue("aboutCompany", companyData.aboutCompany || "");
      setValue("isCompanyRequestPageFlag", companyData.isCompanyRequestPageFlag || false);
      // Set logo preview if exists
      if (companyData.logoUrl) {
        setLogoPreview(companyData.logoUrl);
      }
      // Store initial form data for change detection
      setInitialFormData(
        JSON.stringify({
          name: companyData.name || "",
          website: companyData.website || "",
          linkedIn: companyData.linkedIn || "",
          carrierPage: companyData.carrierPage || "",
          logoUrl: companyData.logoUrl || "",
          industry: companyData.industry || "",
          teamSize: companyData.teamSize || 0,
          aboutCompany: companyData.aboutCompany || "",
          isCompanyRequestPageFlag: companyData.isCompanyRequestPageFlag || false,
        })
      );
    }
  }, [companyData, setValue, mode]);

  // Detect form changes
  useEffect(() => {
    if (mode === "UPDATE" && initialFormData) {
      const currentFormData = JSON.stringify(watchedValues);
      setHasFormChanged(currentFormData !== initialFormData || logoFile !== null);
    } else if (mode === "CREATE") {
      const hasAnyValue = Object.values(watchedValues).some(
        (value) => value !== "" && value !== 0 && value !== false && value !== null
      );
      setHasFormChanged(hasAnyValue || logoFile !== null);
    }
  }, [watchedValues, initialFormData, logoFile, mode]);

  // Register aboutCompany field for validation
  useEffect(() => {
    register("aboutCompany", {
      required: "Company description is required",
      minLength: { value: 50, message: "Minimum 50 characters required" },
    });
  }, [register]);

  // Handle logo file selection with validation
  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Only JPEG, PNG files are allowed.", getToastOptions());
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        toast.error("File size must be less than 5MB.", getToastOptions());
        return;
      }

      setLogoFile(file);
      setLogoError(""); // Clear error when valid file is selected

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo to S3
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return null;

    try {
      // Step 1: Get pre-signed URL
      const payload: CompanyLogoUploadRequestDto = {
        companyLogoFileName: logoFile.name,
        companyLogoFileMimeType: logoFile.type,
      };

      const { response: presignedUrlResponse, error } =
        await httpServiceObj.post<FileUploadResponseMetadataDto>(
          "/file/gsu2u/COMPANY_LOGO",
          payload,
          true,
          {},
          false,
          "BASE"
        );

      if (!presignedUrlResponse) {
        throw new Error("Failed to get pre-signed URL");
      }

      // Step 2: Upload file to S3
      const { awsS3SignedUrl, awsS3Tag, cloudFileName } = presignedUrlResponse;
      const uploadResult = await httpServiceObj.put(
        awsS3SignedUrl,
        logoFile,
        false,
        { awsS3Tag, fileType: logoFile.type },
        true
      );

      if (!uploadResult) {
        throw new Error("Failed to upload file to S3");
      }

      return cloudFileName;
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("Failed to upload logo. Please try again.", getToastOptions());
      return null;
    }
  };

  // Get only changed fields for UPDATE mode
  const getChangedFields = (formData: CompanyDto): Partial<CompanyDto> => {
    if (mode === "CREATE" || !companyData) {
      return formData; // Return all fields for CREATE mode
    }

    const changedFields: Partial<CompanyDto> = {};

    // Compare each field
    Object.keys(formData).forEach((key) => {
      const formValue = formData[key as keyof CompanyDto];
      const originalValue = companyData[key as keyof CompanyDto];

      if (formValue !== originalValue) {
        changedFields[key as keyof CompanyDto] = formValue as any;
      }
    });

    return changedFields;
  };

  // Validate logo requirement
  const validateLogo = (): boolean => {
    // For CREATE mode, logo file is required
    if (mode === "CREATE") {
      if (!logoFile && !getValues("logoUrl")) {
        setLogoError("Company logo is required. Please upload a file or provide a logo URL.");
        return false;
      }
    }

    // For UPDATE mode, check if logo exists or is being updated
    if (mode === "UPDATE") {
      const hasExistingLogo = companyData?.logoUrl || companyData?.logo;
      const hasNewLogo = logoFile || getValues("logoUrl");

      if (!hasExistingLogo && !hasNewLogo) {
        setLogoError("Company logo is required. Please upload a file or provide a logo URL.");
        return false;
      }
    }

    setLogoError("");
    return true;
  };

  const onSubmit = async (data: CompanyDto) => {
    // Validate logo before proceeding
    if (!validateLogo()) {
      toast.error("Please provide a company logo before submitting.", getToastOptions());
      return;
    }

    setIsSubmitting(true);

    try {
      let logoCloudFileName: string | null = null;

      // Upload logo if file is selected
      if (logoFile) {
        logoCloudFileName = await uploadLogo();
        if (!logoCloudFileName) {
          throw new Error("Failed to upload logo");
        }
      }

      // Prepare the payload
      const formPayload = {
        name: data.name.trim(),
        website: data.website.trim(),
        linkedIn: data.linkedIn.trim(),
        carrierPage: data.carrierPage.trim(),
        logoUrl: data.logoUrl?.trim() || (mode === "UPDATE" ? companyData?.logoUrl || "" : ""),
        logo: data.logo?.trim() || "",
        industry: data.industry,
        teamSize: Number(data.teamSize),
        aboutCompany: data.aboutCompany,
        ...(mode === "REQUEST" && { isCompanyRequestPageFlag: true }),
      };

      const createPayload: CreateCompanyRequestDto = {
        name: formPayload.name,
        website: formPayload.website,
        linkedIn: formPayload.linkedIn,
        carrierPage: formPayload.carrierPage,
        logoUrl: formPayload.logoUrl || "",
        industry: formPayload.industry,
        teamSize: formPayload.teamSize,
        aboutCompany: formPayload.aboutCompany,
        logo: logoCloudFileName ?? companyData?.logo ?? "",
        ...(mode !== "CREATE" && { isCompanyRequestPageFlag: mode === "REQUEST" ? true : false }),
      };

      const payload = createPayload;

      // Handle CREATE mode - no optimistic updates needed
      if (mode === "CREATE") {
        const createCompanyResponse = await AdminServiceObj.createCompany(payload);
        if (!createCompanyResponse) {
          toast.error("Failed to create company. Please try again.", getToastOptions({}));
          return;
        }
        toast.success("Company created successfully!", getToastOptions());
      } else {
        // Handle UPDATE and REQUEST modes - use optimistic updates
        const companyId = companyData?.id;
        if (!companyId) {
          throw new Error("Company ID is missing for update");
        }

        // Use the handler function if provided (optimistic update)
        if (handleCompanyUpdate) {
          await handleCompanyUpdate(
            companyId,
            payload,
            `Company ${mode === "REQUEST" ? "created" : "updated"} successfully!`
          );
        } else {
          // Fallback to direct API call
          const response = await AdminServiceObj.putCompanyDetails(companyId, payload);
          if (!response) {
            toast.error(
              `Failed to ${mode === "REQUEST" ? "create" : "update"} company. Please try again.`,
              getToastOptions({})
            );
            return;
          }
          toast.success(
            `Company ${mode === "REQUEST" ? "created" : "updated"} successfully!`,
            getToastOptions()
          );
        }
      }

      // Update logo if uploaded
      if (logoCloudFileName && companyData?.id) {
        const logoPayload = {
          companyLogoCloudFileName: logoCloudFileName,
        };

        // Use the handler function if provided (optimistic update)
        if (handleCompanyLogoUpdate) {
          await handleCompanyLogoUpdate(companyData.id, logoPayload);
        } else {
          // Fallback to direct API call
          const patchResult = await AdminServiceObj.patchCompanyLogo(companyData.id, logoPayload);
          if (!patchResult) {
            toast.error("Failed to update company logo. Please try again.", getToastOptions({}));
            return;
          }
          toast.success("Company logo updated successfully!", getToastOptions());
        }
      }

      // Refresh company data and close modal
      // Using optimistic updates - no refetch needed
      fetchCompany();
      onClose();
    } catch (error) {
      console.error(`Error ${mode.toLowerCase()}ing company:`, error);
      toast.error(`Failed to ${mode.toLowerCase()} company. Please try again.`, getToastOptions());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-auto p-4 sm:p-6 text-start max-h-[90vh] max-w-[800px]">
      <h2 className="text-xl font-semibold mb-6">{getFormTitle(mode)}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <div className="md:col-span-1">
            <Controller
              name="name"
              control={control}
              rules={{
                required: "Company name is required",
                minLength: { value: 2, message: "Company name must be at least 2 characters" },
                maxLength: { value: 100, message: "Company name must not exceed 100 characters" },
              }}
              render={({ field }) => (
                <Input
                  label="Company Name"
                  placeholder="Enter company name"
                  {...field}
                  error={errors.name?.message}
                  required
                />
              )}
            />
          </div>

          {/* Website */}
          <Controller
            name="website"
            control={control}
            rules={{
              required: "Website is required",
              pattern: {
                value: /^https?:\/\/.+\..+/,
                message: "Please enter a valid website URL",
              },
            }}
            render={({ field }) => (
              <Input
                label="Website"
                placeholder="https://company.com"
                {...field}
                error={errors.website?.message}
                required
              />
            )}
          />

          {/* LinkedIn */}
          <Controller
            name="linkedIn"
            control={control}
            rules={{
              required: "LinkedIn page is required",
              pattern: {
                value: /^https:\/\/(www\.)?linkedin\.com\/.+/,
                message: "Please enter a valid LinkedIn URL",
              },
            }}
            render={({ field }) => (
              <Input
                label="LinkedIn Page"
                placeholder="https://www.linkedin.com/company/..."
                {...field}
                error={errors.linkedIn?.message}
                required
              />
            )}
          />

          {/* Career Page */}
          <Controller
            name="carrierPage"
            control={control}
            rules={{
              required: "Career page is required",
              pattern: {
                value: /^https?:\/\/.+\..+/,
                message: "Please enter a valid career page URL",
              },
            }}
            render={({ field }) => (
              <Input
                label="Career Page"
                placeholder="https://company.com/careers"
                {...field}
                error={errors.carrierPage?.message}
                required
              />
            )}
          />

          {/* Upload Logo */}
          <div className="md:col-span-1 space-y-2">
            <label className="block text-sm font-medium mt-0 text-gray-700">
              Company Logo <span className="text-red-500">*</span>
            </label>
            <div className="space-y-1">
              <div className="relative w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  id="logo-upload-input"
                />
                <div
                  className={`w-full rounded-xl p-1.5 text-sm text-gray-500 bg-gray-100 border cursor-pointer ${
                    logoError ? "border-red-300 bg-red-50" : "border-gray-300"
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="truncate max-w-[200px]">
                      {logoFile ? logoFile.name : "Click to upload or drag and drop"}
                    </span>
                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-white shadow-md">
                      <Upload className="w-5 h-5 text-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
              {logoError && <p className="text-sm text-red-500 mt-1">{logoError}</p>}
            </div>
          </div>

          <Controller
            name="logoUrl"
            control={control}
            render={({ field }) => (
              <Input
                label="Or Logo URL"
                placeholder="https://company.com/logo.png"
                {...field}
                error={errors.logoUrl?.message}
                onChange={(e) => {
                  field.onChange(e);
                  // Clear logo error when URL is provided
                  if (e.target.value.trim()) {
                    setLogoError("");
                  }
                }}
              />
            )}
          />

          {/* Team Size */}
          <Controller
            name="teamSize"
            control={control}
            rules={{
              required: "Team size is required",
              min: { value: 1, message: "Team size must be at least 1" },
            }}
            render={({ field }) => (
              <SimpleSelectInput
                label="Team Size"
                {...field}
                error={errors.teamSize?.message}
                options={teamSizeOptions}
                placeholder="Select team size range"
                required
              />
            )}
          />

          {/* Industry */}
          <Controller
            name="industry"
            control={control}
            rules={{ required: "Industry is required" }}
            render={({ field }) => (
              <SimpleSelectInput
                label="Industry"
                {...field}
                error={errors.industry?.message}
                options={industrySelectOptions}
                placeholder="Select industry"
                required
              />
            )}
          />

          {/* About Company - Rich Text Editor */}
          <div className="mb-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              About Company<span className="text-red-500 ml-1">*</span>
            </label>
            <Controller
            name="aboutCompany"
            control={control}
            rules={validationRules.jobDescription}
            render={({ field }) => (
              <Editor
              value={watch("aboutCompany")}
              style={{ height: "200px" }}
              onChange={(htmlVal: string, plainVal: string) => {
                setValue("aboutCompany", plainVal);
                field.onChange(htmlVal);
                trigger("aboutCompany");
              }}
            /> )}
            />
            {errors.aboutCompany && (
              <p className="text-sm text-red-500 mt-1">{errors.aboutCompany.message}</p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start space-x-4 pt-0">
          <button
            type="submit"
            disabled={isSubmitting || (mode === "UPDATE" && !hasFormChanged)}
            className={`px-6 py-3 rounded-lg font-medium text-sm transition-colors duration-200 flex items-center gap-2 ${
              isSubmitting || (mode === "UPDATE" && !hasFormChanged)
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}>
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {mode === "CREATE" ? "Creating..." : "Updating..."}
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                {getSubmitButtonText(mode)}
              </>
            )}
          </button>
        </div>

        {mode === "UPDATE" && !hasFormChanged && (
          <p className="text-sm text-gray-500 mt-2">
            No changes detected. Modify the form to enable submission.
          </p>
        )}
      </form>
    </div>
  );
};

export default UpdateCompany;
