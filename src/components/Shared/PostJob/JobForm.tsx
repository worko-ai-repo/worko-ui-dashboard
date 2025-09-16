// Updated JobForm.tsx
import { Controller, useForm } from "react-hook-form";
import Input from "./Input";
import TagInput from "./TagInput";
import { useEffect, useState } from "react";
import { validationRules } from "@Utils/FormValidator.utils";
import Editor from "./RichTextEditor";
import { JobApiResponse, JobDetails } from "@Interfaces/CorporateDashboard.dto";
import { JobFormSchema } from "@Components/Dashboard/types";
import SimpleSelectInput from "./InputSelect";
import { workModeOptions, employmentTypeOptions, locationAssets } from "@AssetsFolder/jobs.assets";
import MultiSelectInput, { OptionType } from "./MultiInputSelect";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { CorporateUserDetail, useAppContext } from "@Context/App.context";
import { getToastOptions } from "@Utils/Toast.utils";
import { CompanyShortDto, JobDto } from "@Interfaces/JobsAndCompany.dto";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { useQueryClient } from "@tanstack/react-query";
import { NormalizedUser } from "@Utils/NormalizeUser";
import CompanyInput from "../CompanyInput";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import AdminServiceObj from "@Components/Dashboard/WorkoAdmin/Services/Admin.service";

type JobFormMode = "CREATE" | "UPDATE" | "DUPLICATE" | "CREATE_WITH_DATA";

interface JobFormProps {
  onClose: () => void;
  jobDetails: JobDetails | null;
  userDetailsOne: NormalizedUser | null;
  mode: JobFormMode;
  onSuccess?: () => void; // Callback to refresh the jobs list
}

const getFormTitle = (mode: JobFormMode) => {
  switch (mode) {
    case "UPDATE":
      return "Edit Job";
    case "DUPLICATE":
      return "Duplicate Job";
    default:
      return "Create Job";
  }
};

const getSubmitButtonText = (mode: JobFormMode) => {
  switch (mode) {
    case "UPDATE":
      return "Update Job";
    case "DUPLICATE":
      return "Create Duplicate";
    default:
      return "Create Job";
  }
};

export default function JobForm({
  onClose,
  jobDetails,
  userDetailsOne,
  mode,
  onSuccess,
}: JobFormProps) {
  const queryClient = useQueryClient();
  // if corporate present in the pathname then fetch the companyID form the
  const pathname = window.location.pathname;
  const isCorporatePath = pathname.includes("corporate");
  let companyIdFromPath = "";
  if (isCorporatePath && userDetailsOne) {
    companyIdFromPath = userDetailsOne?.companyId || "";
  }

  const [selectedLocations, setSelectedLocations] = useState<OptionType[]>([]);
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [initialFormData, setInitialFormData] = useState<string>("");
  const [companyDetails, setCompanyDetails] = useState<CompanyShortDto>();
  const isSubmitDisabled = mode === "DUPLICATE" && !hasFormChanged;
  const userRole =
    secureStorage.getItem<UserRole[]>(SecureStorageKeyEnum.USERTYPE) || UserRole.GENERAL_USER;
  // debugger;
  // Define default values as a constant to avoid repetition
  const getDefaultFormValues = (): JobFormSchema => ({
    jobTitle: "",
    status: "PUBLISHED",
    companyId: "",
    numOfOpenings: 1,
    department: "",
    workMode: "WFH",
    noticePeriod: 0,
    location: {
      city: [],
      country: [],
      fullLocation: [],
      state: [],
    },
    experienceRange: { min: 0, max: 0 },
    salaryRange: { min: 0, max: 0, fixedComponentPercentage: 0, variableComponentPercentage: 0 },
    displaySalaryRange: false,
    coreSkills: [],
    technicalSkills: [],
    softSkills: [],
    miscellaneousSkills: [],
    otherRequirements: "",
    typeofEmployment: "FULL_TIME",
    jobDescription: "",
    htmlJobDescription: "",

    flexibleNotice: false,
  });

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    watch,
    trigger,
    clearErrors,
    control,
    reset,
  } = useForm<JobFormSchema>({
    defaultValues: getDefaultFormValues(),
    mode: "onChange",
  });

  // Effect to reset form when mode changes or component unmounts
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      setSelectedLocations([]);
      setHasFormChanged(false);
      setInitialFormData("");
      setCompanyDetails(undefined);
    };
  }, []);

  const invalidateJobs = () => {
    const queryKey = userRole.includes(UserRole.ADMIN)
      ? ["AdminJobsQuery"]
      : ["CorporateJobsQuery"];
    queryClient.invalidateQueries({
      queryKey: queryKey, // You can use partial key
    });
  };

  const [companyName, setCompanyName] = useState<string>("");

  // Add this useEffect to fetch and set company name when in duplicate/update mode
  useEffect(() => {
    const fetchCompanyName = async () => {
      if ((mode === "DUPLICATE" || mode === "UPDATE") && jobDetails?.companyDetails) {
        try {
          setCompanyName(jobDetails?.companyDetails?.name);
          setValue("companyId", jobDetails?.companyDetails?.id);
        } catch (error) {
          console.error("Error fetching company details:", error);
        }
      }
    };

    fetchCompanyName();
  }, [jobDetails, mode, setValue]);

  // Detect form changes for duplicate mode
  useEffect(() => {
    if (mode !== "DUPLICATE") return;

    const subscription = watch(() => {
      const currentData = JSON.stringify(getValues());
      if (initialFormData && currentData !== initialFormData) {
        setHasFormChanged(true);
      } else {
        setHasFormChanged(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [watch, mode, initialFormData, getValues]);

  // Effect to handle form initialization based on mode and jobDetails
  useEffect(() => {
    // Always start with clean defaults
    const defaultValues = getDefaultFormValues();

    if ((mode === "UPDATE" || mode === "DUPLICATE" || mode === "CREATE_WITH_DATA") && jobDetails) {
      // Populate with job details
      const formData = {
        ...defaultValues,
        jobTitle: jobDetails?.jobTitle ?? "",
        status: jobDetails?.status || "PUBLISHED",
        companyId: jobDetails?.companyDetails?.id,
        department: jobDetails?.department || "",
        workMode: jobDetails?.workMode || "WFH",
        noticePeriod: jobDetails?.noticePeriod || 0,
        experienceRange: jobDetails?.experienceRange || { min: 0, max: 0 },
        salaryRange: jobDetails?.salaryRange || { min: 0, max: 0 },
        displaySalaryRange: jobDetails?.displaySalaryRange ?? true,
        coreSkills: jobDetails?.coreSkills || [],
        technicalSkills: jobDetails?.technicalSkills || [],
        softSkills: jobDetails?.softSkills || [],
        miscellaneousSkills: jobDetails?.miscellaneousSkills || [],
        otherRequirements: jobDetails?.otherRequirements || "",
        typeofEmployment: jobDetails?.typeofEmployment || "FULL_TIME",
        jobDescription: jobDetails?.htmlJobDescription || "",
        htmlJobDescription: jobDetails?.htmlJobDescription || "",
        flexibleNotice: false,
      };

      reset(formData);

      // Handle locations
      if (jobDetails?.location?.city) {
        const cities = Array.isArray(jobDetails.location.city)
          ? jobDetails.location.city
          : [jobDetails.location.city];

        const locations = cities.map((city: string) => {
          const match = locationAssets.find(
            (loc) => loc.value.city[0].toLowerCase() === city.toLowerCase()
          );

          if (match) return match;

          const capitalized = city.charAt(0).toUpperCase() + city.slice(1);
          return {
            label: capitalized,
            value: {
              city: [capitalized],
              fullLocation: [capitalized],
            },
          };
        });

        setSelectedLocations(locations);
      }

      // For duplicate mode, set initial form data after a brief delay
      if (mode === "DUPLICATE") {
        setTimeout(() => {
          const initial = JSON.stringify(getValues());
          setInitialFormData(initial);
          setHasFormChanged(false);
        }, 100);
      }
    } else {
      // CREATE mode - reset to defaults
      reset(defaultValues);
      setSelectedLocations([]);
      setCompanyDetails(undefined);
      setHasFormChanged(false);
      setInitialFormData("");
    }
  }, [jobDetails, mode, reset]);

  /*   useEffect(() => {
    console.log("JobDetails htmlJobDescription:", jobDetails?.htmlJobDescription);
    console.log("Form htmlJobDescription value:", watch("htmlJobDescription"));
  }, [jobDetails, watch]); */

  /**
   * onSubmit- Function to submit the job posting updating
   *
   * @param {JobFormSchema} data
   * @returns
   */
  const onSubmit = async (data: JobFormSchema) => {
    if (isCorporatePath) {
      data.companyId = companyIdFromPath; // Ensure companyId is set from path for corporate users
    }
    // Check if form has changed for duplicate mode
    if (mode === "DUPLICATE" && !hasFormChanged) {
      toast.error("Please make some changes before creating a duplicate job", getToastOptions());
      return;
    }

    if (!watch("companyId")) {
      const userDetails = secureStorage.getItem<CorporateUserDetail>(
        SecureStorageKeyEnum.SIGNINDETAILS
      );
      setValue("companyId", userDetails?.companyId!);
    }

    if (!selectedLocations.length) {
      toast.error("Please select at least one location", getToastOptions());
      return;
    }

    const jobData = { ...data };

    try {
      for (const location of selectedLocations) {
        const payload = {
          ...jobData,
          location: location.value,
        };

        let response;
        if (mode !== "UPDATE") {
          response = await CorporateServiceObj.postJobs(payload, {});
        } else {
          response = await CorporateServiceObj.updateJob(payload, {}, jobDetails?.id!);
        }

        if (!response || Array.isArray(response)) {
          console.error("Job operation failed for:", location.label);
          toast.error(
            `Job operation failed for: ${location.label}`,
            getToastOptions({ autoClose: false })
          );
          continue;
        }

        const successMessage =
          mode === "DUPLICATE"
            ? "Job duplicated successfully"
            : mode === "UPDATE"
            ? "Job updated successfully"
            : "Job created successfully";

        toast.success(successMessage, getToastOptions());
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("An unexpected error occurred", getToastOptions({ autoClose: false }));
    } finally {
      invalidateJobs();
    }
  };

  // Rest of your existing useEffects and functions remain the same...
  useEffect(() => {
    register("jobDescription", validationRules.jobDescription);
  }, [register]);

  const coreSkills = watch("coreSkills");
  const technicalSkills = watch("technicalSkills");
  const softSkills = watch("softSkills");
  const miscellaneousSkills = watch("miscellaneousSkills");

  const addTag = (field: keyof JobFormSchema, tag: string) => {
    const currentTags = getValues(field) as string[];
    setValue(field, [...currentTags, tag], { shouldValidate: true });
  };

  useEffect(() => {
    register("coreSkills", validationRules.skills);
    register("technicalSkills", validationRules.skills);
    register("softSkills", validationRules.skills);
  });

  const removeTag = (field: keyof JobFormSchema, tag: string) => {
    const currentTags = getValues(field) as string[];
    setValue(
      field,
      currentTags.filter((t) => t !== tag)
    );
  };

  useEffect(() => {
    const subscription = watch((value, { name }) => {
      switch (name) {
        case "experienceRange.min":
          trigger("experienceRange.max");
          break;
        case "experienceRange.max":
          trigger("experienceRange.min");
          break;
        case "salaryRange.min":
          trigger("salaryRange.max");
          break;
        case "salaryRange.max":
          trigger("salaryRange.min");
          break;
        default:
          break;
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, trigger]);

  const handleCompanySelect = (company: CompanyShortDto) => {
    setCompanyDetails(company);
    setValue("companyId", company.id || company.SK.split("ID#")[1]); // Remove "ID#" prefix if present
    clearErrors("companyId");
  };
  return (
    <div className="overflow-auto p-2 sm:p-4 lg:p-6 text-start">
      <h2 className="text-xl font-semibold mb-4">{getFormTitle(mode)}</h2>

      {mode === "DUPLICATE" && !hasFormChanged && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Please make some changes to the form before creating a duplicate job.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Job Description */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {mode === "UPDATE" ? "Edit Job Description" : "Job Description"}
            <span className="text-red-500">*</span>
          </label>
          <Controller
            name="htmlJobDescription"
            control={control}
            rules={validationRules.jobDescription}
            render={({ field }) => (
              <Editor
                value={field.value || jobDetails?.htmlJobDescription || ""} //  Now controlled by form state
                onChange={(val: string, plainVal: string) => {
                  setValue("jobDescription", plainVal);
                  field.onChange(val); //  Update form state
                  trigger("jobDescription");
                }}
              />
            )}
          />
          {errors.jobDescription && (
            <p className="text-sm text-red-500 mt-1">{errors.jobDescription.message}</p>
          )}
        </div>

        {/* Rest of your existing form fields remain the same... */}
        <div className="max-sm:flex max-sm:flex-col sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Company Name */}
          {userRole.includes(UserRole.ADMIN) && (
            <div className="col-span-1 sm:col-span-3 lg:col-span-3 xl:col-span-3">
              {mode === "DUPLICATE" || mode === "UPDATE" ? (
                // Show disabled input with company name for duplicate/update mode
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={companyName}
                    disabled
                    className="w-full rounded-xl bg-gray-200 p-2 sm:p-3 text-sm text-gray-600 cursor-not-allowed border border-gray-300"
                    placeholder="Company name"
                  />
                  {/* <input type="hidden" {...register("companyId", validationRules.name)} /> */}
                </div>
              ) : (
                // Show company selection for create mode
                <>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Company<span className="text-red-500">*</span>
                  </label>
                  <CompanyInput
                    errors={errors}
                    clearErrors={clearErrors}
                    setCompanyName={handleCompanySelect}
                  />
                  {errors.companyId && (
                    <p className="text-sm text-left text-red-500">
                      {errors.companyId.message?.toString()}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Job Title */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <Controller
              name="jobTitle"
              control={control}
              rules={validationRules.jobTitle}
              render={({ field }) => (
                <Input
                  label="Job Title*"
                  required={true}
                  {...field}
                  error={errors.jobTitle?.message}
                />
              )}
            />
          </div>

          {/* Department */}
          <div className="">
            <Controller
              name="department"
              control={control}
              rules={validationRules.department}
              render={({ field }) => <Input label="Department" required={true} {...field} />}
            />
            {errors.department && (
              <span className="block text-sm text-red-500">{errors.department.message}</span>
            )}
          </div>

          {/* Number of Openings */}
          <div className="col-span-1">
            <Controller
              name="numOfOpenings"
              control={control}
              rules={validationRules.defaultNumberPositive}
              render={({ field }) => (
                <Input
                  label="Number of opening"
                  required={true}
                  {...field}
                  error={errors.numOfOpenings?.message}
                />
              )}
            />
          </div>

          {/* Salary Range and Fixed / Variable */}
          <div className="border col-span-4 grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl">
            {/* Salary Range */}
            <div className="col-span-1 sm:col-span-2 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">
                    Salary<span className="text-red-500">*</span>
                  </label>
                  <select className="appearance-none border-2 rounded-full px-2 sm:px-3 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <label className="flex items-center text-xs font-medium text-gray-700">
                  <input
                    required={false}
                    type="checkbox"
                    {...register("displaySalaryRange")}
                    className="form-checkbox text-blue-600 w-3 h-3 focus:ring-0 mr-1 accent-blue-600"
                  />
                  <span className="text-gray-700 whitespace-nowrap">Don't show to candidate</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="From"
                  {...register("salaryRange.min", {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                    ...validationRules.rangeInput(watch, "salary"),
                  })}
                  className="flex-1 rounded-xl w-full bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">to</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="To"
                  {...register("salaryRange.max", {
                    valueAsNumber: true,
                    setValueAs: (v) => (v === "" ? undefined : parseFloat(v)),
                    ...validationRules.rangeInput(watch, "salary"),
                  })}
                  className="flex-1 rounded-xl w-full bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {errors.salaryRange?.min && (
                <span className="block text-sm text-red-500">{errors.salaryRange.min.message}</span>
              )}
            </div>

            {/* Fixed & Variable Components */}
            <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Controller
                  name="salaryRange.fixedComponentPercentage"
                  control={control}
                  rules={validationRules.fixedAndVariableRangeInput(watch, "salaryRange")}
                  render={({ field }) => (
                    <Input
                      required={true}
                      label="Fixed Component (In %)"
                      customClass="my-3.5"
                      {...field}
                      error={errors.salaryRange?.fixedComponentPercentage?.message}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                      }
                    />
                  )}
                />
              </div>
              <div>
                <Controller
                  name="salaryRange.variableComponentPercentage"
                  control={control}
                  rules={validationRules.fixedAndVariableRangeInput(watch, "salaryRange")}
                  render={({ field }) => (
                    <Input
                      required={true}
                      label="Variable Component (In %)"
                      customClass="my-3.5"
                      {...field}
                      error={errors.salaryRange?.variableComponentPercentage?.message}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : Number(e.target.value))
                      }
                    />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Work Mode */}
          <Controller
            name="workMode"
            control={control}
            rules={{ required: "Work mode is required" }}
            render={({ field }) => (
              <SimpleSelectInput
                label="Work Mode"
                {...field}
                error={errors.workMode?.message}
                options={workModeOptions}
                required
              />
            )}
          />

          {/* Employment Type */}
          <Controller
            name="typeofEmployment"
            control={control}
            rules={{ required: "Type of employment is required" }}
            render={({ field }) => (
              <SimpleSelectInput
                label="Employment Type"
                {...field}
                error={errors.typeofEmployment?.message}
                options={employmentTypeOptions}
                required
              />
            )}
          />
          {/* Experience Range */}
          <div className="col-span-1  space-y-1">
            <label className="block text-sm m-1  font-medium text-gray-700">
              Experience (in years)<span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap items-center gap-2  overflow-hidden">
              <input
                type="number"
                placeholder="From"
                {...register("experienceRange.min", {
                  valueAsNumber: true,
                  ...validationRules.rangeInput(watch, "experience"),
                })}
                className="flex-1 min-w-0 rounded-xl bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-500 px-1">to</span>
              <input
                type="number"
                placeholder="To"
                {...register("experienceRange.max", {
                  valueAsNumber: true,
                  ...validationRules.rangeInput(watch, "experience"),
                })}
                className="flex-1 min-w-0 rounded-xl bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {(errors.experienceRange?.min || errors.experienceRange?.max) && (
              <span className="block text-sm text-red-500">
                {errors.experienceRange?.min?.message || errors.experienceRange?.max?.message}
              </span>
            )}
          </div>

          {/* Notice Period */}
          <div className="col-span-1  sm:col-span-1 space-y-2">
            <label className="block !mb-0  text-sm font-medium text-gray-700">
              Notice Period<span className="text-red-500">*</span>
            </label>

            <select
              {...register("noticePeriod", { required: "Please select a notice period" })}
              className="w-full rounded-xl !mt-1 bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select notice period</option>
              <option value="0">Immediate Joiner</option>
              <option value="15">15 Days</option>
              <option value="30">1 Month</option>
              <option value="60">2 Months</option>
              <option value="90">3 Months</option>
            </select>

            {errors.noticePeriod && (
              <p className="text-sm text-red-500">{errors.noticePeriod.message}</p>
            )}

            {/* Flexible Checkbox */}
            <label className="flex items-center text-sm text-gray-700">
              <input
                type="checkbox"
                {...register("flexibleNotice")}
                className="form-checkbox text-blue-600 w-4 h-4 focus:ring-0 mr-2 accent-blue-600"
              />
              Flexible with Notice Period
            </label>
          </div>
          {/* Location */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <MultiSelectInput
              label="Location"
              options={locationAssets}
              selected={selectedLocations}
              onChange={setSelectedLocations}
              maxSelections={mode === "UPDATE" ? 1 : 10}
            />
            {selectedLocations.length === 0 && (
              <span className="text-sm text-red-500">
                Select at-least one location before proceeding.
              </span>
            )}
          </div>

          {/* Skills Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <TagInput
              required={true}
              label="Core Skills"
              tags={coreSkills}
              onAddTag={(tag) => addTag("coreSkills", tag)}
              onRemoveTag={(tag) => removeTag("coreSkills", tag)}
            />
            {errors.coreSkills && (
              <span className="text-sm text-red-500">{errors.coreSkills.message}</span>
            )}
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <TagInput
              required={true}
              label="Technical Skills"
              tags={technicalSkills}
              onAddTag={(tag) => addTag("technicalSkills", tag)}
              onRemoveTag={(tag) => removeTag("technicalSkills", tag)}
            />
            {errors.technicalSkills && (
              <span className="text-sm text-red-500">{errors.technicalSkills.message}</span>
            )}
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <TagInput
              required={true}
              label="Soft Skills"
              tags={softSkills}
              onAddTag={(tag) => addTag("softSkills", tag)}
              onRemoveTag={(tag) => removeTag("softSkills", tag)}
            />
            {errors.softSkills && (
              <span className="text-sm text-red-500">{errors.softSkills.message}</span>
            )}
          </div>

          <div className="col-span-1 sm:col-span-1 lg:col-span-1 xl:col-span-1">
            <TagInput
              label="Good to Have Skills"
              tags={miscellaneousSkills}
              onAddTag={(tag) => addTag("miscellaneousSkills", tag)}
              onRemoveTag={(tag) => removeTag("miscellaneousSkills", tag)}
            />
            {errors.miscellaneousSkills && (
              <span className="text-sm text-red-500">{errors.miscellaneousSkills.message}</span>
            )}
          </div>

          {/* Other Requirements */}
          <div className="col-span-1 sm:col-span-3 lg:col-span-3 xl:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Other mandatory requirements<span className="text-red-500">*</span> (Will not be
              visible to candidates)
            </label>
            <textarea
              {...register("otherRequirements", validationRules.defaultTextarea)}
              className="mt-1 w-full min-h-[120px] sm:min-h-[133px] rounded-xl bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
              placeholder="Write here"
              rows={3}
            />
            {errors.otherRequirements && (
              <span className="text-sm text-red-500">{errors.otherRequirements.message}</span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`px-4 py-2 sm:px-6 sm:py-3 rounded-[10px] font-medium text-sm sm:text-base transition-colors duration-200 flex items-center gap-2 ${
              isSubmitDisabled
                ? "bg-gray-400 cursor-not-allowed text-gray-600"
                : "bg-[#316BFF] hover:bg-[#2557e6] text-white"
            }`}>
            <span className="text-lg">+</span>
            {getSubmitButtonText(mode)}
          </button>
        </div>
      </form>
    </div>
  );
}
