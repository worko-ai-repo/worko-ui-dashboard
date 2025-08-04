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
import { CorporateUserDetail } from "@Context/App.context";
import { getToastOptions } from "lib-worko-ui";
import { CompanyShortDto, JobDto } from "@Interfaces/JobsAndCompany.dto";
import CorporateServiceObj from "@Components/Dashboard/Corporate/Services/Corporate.service";
import { useQueryClient } from "@tanstack/react-query";
import { NormalizedUser } from "@Utils/NormalizeUser";
import CompanyInput from "../CompanyInput";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";

type JobFormMode = "CREATE" | "UPDATE" | "DUPLICATE";

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

export default function JobForm({ onClose, jobDetails, userDetailsOne, mode, onSuccess }: JobFormProps) {
  const queryClient = useQueryClient();

  const [selectedLocations, setSelectedLocations] = useState<OptionType[]>([]);
  const [hasFormChanged, setHasFormChanged] = useState(false);
  const [initialFormData, setInitialFormData] = useState<string>("");
  const [companyDetails, setCompanyDetails] = useState<CompanyShortDto>();
  const isSubmitDisabled = mode === "DUPLICATE" && !hasFormChanged;
  const userRole =  secureStorage.getItem<UserRole[]>(SecureStorageKeyEnum.USERTYPE) || UserRole.GENERAL_USER;
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
    defaultValues: {
      jobTitle: jobDetails?.jobTitle ?? "",
      status: jobDetails?.status || "PUBLISHED",
      companyId: userDetailsOne?.companyId,
      numOfOpenings: 1,
      department: jobDetails?.department || "",
      workMode: jobDetails?.workMode || "WFH",
      noticePeriod: jobDetails?.noticePeriod || 0,
      location: {},
      experienceRange: jobDetails?.experienceRange || {
        min: 0,
        max: 0,
      },
      salaryRange: jobDetails?.salaryRange || {
        min: 0,
        max: 0,
      },
      displaySalaryRange: jobDetails?.displaySalaryRange ?? true,
      coreSkills: jobDetails?.coreSkills || [],
      technicalSkills: jobDetails?.technicalSkills || [],
      softSkills: jobDetails?.softSkills || [],
      miscellaneousSkills: jobDetails?.miscellaneousSkills || [],
      otherRequirements: jobDetails?.otherRequirements || "",
      typeofEmployment: jobDetails?.typeofEmployment || "FULL_TIME",
      jobDescription: jobDetails?.htmlJobDescription || "",
      htmlJobDescription: jobDetails?.htmlJobDescription || "",
      fixedComponent: jobDetails?.fixedComponent || 0,
      variableComponent: jobDetails?.variableComponent || 0,
    },
    mode: "onChange",
  });

  const invalidateJobs = () => {
    const queryKey = userRole.includes(UserRole.ADMIN) ? ["AdminJobsQuery"] : ["CorporateJobsQuery"] 
    queryClient.invalidateQueries({
      queryKey: queryKey, // You can use partial key
    });
  };

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

  // Prefill form when editing or duplicating
  useEffect(() => {
    if ((mode === "UPDATE" || mode === "DUPLICATE") && jobDetails) {
      // Pre-fill form
      if (jobDetails.htmlJobDescription) {
        setValue("jobDescription", jobDetails.htmlJobDescription);
      }

      let locations: OptionType[] = [];

      if (jobDetails?.location?.city) {
        const cities = Array.isArray(jobDetails.location.city) ? jobDetails.location.city : [jobDetails.location.city];

        locations = cities.map((city: string) => {
          const match = locationAssets.find((loc) => loc.value.city[0].toLowerCase() === city.toLowerCase());

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

      if (mode === "DUPLICATE") {
        // Wait for the form to be fully initialized before storing the initial state
        setTimeout(() => {
          const initial = JSON.stringify(getValues());
          setInitialFormData(initial);
          setHasFormChanged(false);
        }, 0);
      }
    }
  }, [jobDetails, mode, reset, userDetailsOne?.companyId, setValue]);

  useEffect(() => {
    setValue("companyId", userDetailsOne?.companyId || "");
  }, [userDetailsOne]);

  /**
   * onSubmit- Function to submit the job posting updating
   *
   * @param {JobFormSchema} data
   * @returns
   */
  const onSubmit = async (data: JobFormSchema) => {
    // Check if form has changed for duplicate mode
    if (mode === "DUPLICATE" && !hasFormChanged) {
      toast.error("Please make some changes before creating a duplicate job", getToastOptions());
      return;
    }

    if (!watch("companyId")) {
      const userDetails = secureStorage.getItem<CorporateUserDetail>(SecureStorageKeyEnum.SIGNINDETAILS);
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

        delete payload.variableComponent;
        delete payload.fixedComponent;

        let response;
        if (mode !== "UPDATE") {
          response = await CorporateServiceObj.postJobs(payload, {});
        } else {
          response = await CorporateServiceObj.updateJob(payload, {}, jobDetails?.id!);
        }

        if (!response || Array.isArray(response)) {
          console.error("Job operation failed for:", location.label);
          toast.error(`Job operation failed for: ${location.label}`, getToastOptions({ autoClose: false }));
          continue;
        }

        const successMessage = mode === "DUPLICATE" ? "Job duplicated successfully" : mode === "UPDATE" ? "Job updated successfully" : "Job created successfully";

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
  }
  return (
    <div className="overflow-auto p-2 sm:p-4 lg:p-6 text-start">
      <h2 className="text-xl font-semibold mb-4">{getFormTitle(mode)}</h2>

      {mode === "DUPLICATE" && !hasFormChanged && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">Please make some changes to the form before creating a duplicate job.</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Job Description */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">{mode === "UPDATE" ? "Edit Job Description*" : "Job Description*"}</label>
          <Editor
            value={jobDetails?.htmlJobDescription || ""}
            onChange={(val: string, plainVal: string) => {
              setValue("jobDescription", plainVal);
              setValue("htmlJobDescription", val);
              trigger("jobDescription");
            }}
          />
          {errors.jobDescription && <p className="text-sm text-red-500 mt-1">{errors.jobDescription.message}</p>}
        </div>

        {/* Rest of your existing form fields remain the same... */}
        <div className="max-sm:flex max-sm:flex-col sm:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {/* Company Name */}
          {(userRole.includes(UserRole.ADMIN)) && <div className="col-span-1 sm:col-span-3 lg:col-span-3 xl:col-span-3">
            <CompanyInput errors={errors} clearErrors={clearErrors} setCompanyName={handleCompanySelect} />
            {errors.companyId && <p className="text-sm text-left text-red-500">{errors.companyId.message?.toString()}</p>}
            {/* <Controller name="companyId" control={control} rules={validationRules.name} render={({ field }) => <Input label="Select Company*" {...field} error={errors.jobTitle?.message} />} /> */}
          </div>}

          {/* Job Title */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <Controller name="jobTitle" control={control} rules={validationRules.name} render={({ field }) => <Input label="Job Title*" {...field} error={errors.jobTitle?.message} />} />
          </div>

          {/* Department */}
          <div className="">
            <Controller name="department" control={control} rules={validationRules.department} render={({ field }) => <Input label="Department*" {...field} />} />
            {errors.department && <span className="block text-sm text-red-500">{errors.department.message}</span>}
          </div>

          {/* Number of Openings */}
          <div className="col-span-1">
            <Controller name="numOfOpenings" control={control} rules={validationRules.defaultNumber} render={({ field }) => <Input label="Number of opening" {...field} error={errors.numOfOpenings?.message} />} />
          </div>

          {/* Experience Range */}
          <div className="col-span-2 space-y-3.5">
            <label className="block text-sm font-medium text-gray-700">Experience* (in years)</label>
            <div className="flex items-center max-sm:flex-wrap gap-2">
              <input type="number" placeholder="From" {...register("experienceRange.min", { valueAsNumber: true, ...validationRules.rangeInput(watch, "experience") })} className="flex-1 rounded-xl bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-sm text-gray-500 px-1">to</span>
              <input type="number" placeholder="To" {...register("experienceRange.max", { valueAsNumber: true, ...validationRules.rangeInput(watch, "experience") })} className="flex-1 rounded-xl bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {errors.experienceRange && errors.experienceRange.min && <span className="block text-sm text-red-500">{errors.experienceRange.min.message}</span>}
          </div>

          {/* Salary Range */}
          <div className="col-span-2 space-y-2">
            <div className="flex justify-between sm:flex-row sm:items-center">
              <div className="flex">
                <label className="text-sm font-medium text-gray-700">Salary*</label>
                <select className="appearance-none border-2 rounded-full px-2 sm:px-3 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-fit">
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                </select>
              </div>
              <label className="flex text-xs items-center font-medium text-gray-700 sm:ml-auto">
                <input type="checkbox" {...register("displaySalaryRange")} className="form-checkbox text-blue-600 w-3 h-3 focus:ring-0 mr-1 accent-blue-600" />
                <span className="text-gray-700 whitespace-nowrap">Disclose Salary</span>
              </label>
            </div>
            <div className="flex items-center max-sm:flex-wrap gap-2">
              <input type="number" placeholder="From" {...register("salaryRange.min", { valueAsNumber: true, ...validationRules.rangeInput(watch, "salary") })} className="flex-1 rounded-xl bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <span className="text-sm text-gray-500 px-1">to</span>
              <input type="number" placeholder="To" {...register("salaryRange.max", { valueAsNumber: true, ...validationRules.rangeInput(watch, "salary") })} className="flex-1 rounded-xl bg-gray-100 p-2 sm:p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {errors.salaryRange && errors.salaryRange.min && <span className="block text-sm text-red-500">{errors.salaryRange.min.message}</span>}
          </div>

          {/* Variable and Fixed Components */}
          <Controller name="variableComponent" control={control} render={({ field }) => <Input label="Variable Component" {...field} />} />

          <Controller name="fixedComponent" control={control} render={({ field }) => <Input label="Fixed Component" {...field} />} />

          {/* Work Mode */}
          <Controller name="workMode" control={control} rules={{ required: "Work mode is required" }} render={({ field }) => <SimpleSelectInput label="Work Mode" {...field} error={errors.workMode?.message} options={workModeOptions} required />} />

          {/* Employment Type */}
          <Controller name="typeofEmployment" control={control} rules={{ required: "Type of employment is required" }} render={({ field }) => <SimpleSelectInput label="Employment Type" {...field} error={errors.typeofEmployment?.message} options={employmentTypeOptions} required />} />

          {/* Location */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <MultiSelectInput label="Preferred Locations" options={locationAssets} selected={selectedLocations} onChange={setSelectedLocations} maxSelections={mode === "UPDATE" ? 1 : 10} />
            {selectedLocations.length === 0 && <span className="text-sm text-red-500">Select at-least one location before proceeding.</span>}
          </div>

          {/* Skills Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <TagInput label="Core Skills*" tags={coreSkills} onAddTag={(tag) => addTag("coreSkills", tag)} onRemoveTag={(tag) => removeTag("coreSkills", tag)} />
            {errors.coreSkills && <span className="text-sm text-red-500">{errors.coreSkills.message}</span>}
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <TagInput label="Technical Skills*" tags={technicalSkills} onAddTag={(tag) => addTag("technicalSkills", tag)} onRemoveTag={(tag) => removeTag("technicalSkills", tag)} />
            {errors.technicalSkills && <span className="text-sm text-red-500">{errors.technicalSkills.message}</span>}
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-2 xl:col-span-2">
            <TagInput label="Soft Skills*" tags={softSkills} onAddTag={(tag) => addTag("softSkills", tag)} onRemoveTag={(tag) => removeTag("softSkills", tag)} />
            {errors.softSkills && <span className="text-sm text-red-500">{errors.softSkills.message}</span>}
          </div>

          <div className="col-span-1 sm:col-span-2 lg:col-span-1 xl:col-span-1">
            <TagInput label="Good to Have Skills" tags={miscellaneousSkills} onAddTag={(tag) => addTag("miscellaneousSkills", tag)} onRemoveTag={(tag) => removeTag("miscellaneousSkills", tag)} />
            {errors.miscellaneousSkills && <span className="text-sm text-red-500">{errors.miscellaneousSkills.message}</span>}
          </div>

          {/* Other Requirements */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">Other mandatory requirements*</label>
            <textarea {...register("otherRequirements", validationRules.defaultTextarea)} className="mt-1 w-full min-h-[120px] sm:min-h-[133px] rounded-xl bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical" placeholder="Write here" rows={3} />
            {errors.otherRequirements && <span className="text-sm text-red-500">{errors.otherRequirements.message}</span>}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-start pt-4 sm:pt-6">
          <button type="submit" disabled={isSubmitDisabled} className={`px-4 py-2 sm:px-6 sm:py-3 rounded-[10px] font-medium text-sm sm:text-base transition-colors duration-200 flex items-center gap-2 ${isSubmitDisabled ? "bg-gray-400 cursor-not-allowed text-gray-600" : "bg-[#316BFF] hover:bg-[#2557e6] text-white"}`}>
            <span className="text-lg">+</span>
            {getSubmitButtonText(mode)}
          </button>
        </div>
      </form>
    </div>
  );
}
