import React, { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Send } from "lucide-react";
import { evaluationRequest } from "@Assets";
import ReusableInput from "../../Dashboard/Corporate/ReusableInput";
import { JobEvaluationRequestDto } from "@Interfaces/CorporateServices.dto";
import CorporateServiceObj from "../../Dashboard/Corporate/Services/Corporate.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";
import convertToHtml from "@Utils/ConvertTextToHtml.utils";
import { validationRules } from "@Utils/FormValidator.utils";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import AdminServiceObj from "@Components/Dashboard/WorkoAdmin/Services/Admin.service";
import { JobApplicationStatusType } from "src/types/JobsAndApplication.type";
import { JobApplicationUpdatePayloadDto } from "@Components/Dashboard/Corporate/Applicants/Applicants";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import httpServiceObj from "@Services/ApiHandler.service";
import { useAppContext } from "@Context/App.context";


type FormValues = {
  evaluators: JobEvaluationRequestDto[];
};

interface OldEvaluationDetails {
        "companyId":string,
        "hrDetailedFeedback": string,
        "applicantName": string,
        "jobId": string,
        "createdAt": string,
        "hrCurrentCompanyName": string,
        "applicantUserId": string,
        "applicantUserEmail": string,
        "GSI1PK": string,
        "createdByUserId": string,
        "updatedAt": string,
        "evaluatorDetails": {
            "name": string,
            "email": string
        },
        "SK": string,
        "jobTitle": string,
        "id": string,
        "PK": string,
        "jobApplicationId": string,
        "hrHtmlDetailedFeedback": string,
        "hrName": string,
        "GSI1SK": string
}

export type EvaluatorFormProps = {
  Defaultvalues: {
    jobApplicationId: string[];
    jobId: string;
    jobTitle: string;
    companyId: string;
    applicantUserId: string[];
    applicantUserName: string[];
    applicantUserEmail: string[];
    hrName: string;
    hrCurrentCompanyName: string;
  };
  isBulk: boolean; // Optional mode prop to handle different form behaviors
  onBulkUpdate?: (JobApplicationStatus: JobApplicationStatusType) => void; // Optional prop for bulk update functionality
  onClose: () => void; // Function to close the form/modal
  formLimit: number; // Limit for the number of evaluators
};

const EvaluatorForm: React.FC<EvaluatorFormProps> = ({
  Defaultvalues,
  isBulk,
  onBulkUpdate,
  onClose,
  formLimit = 10,
}) => {
  const isAdmin = secureStorage
    .getItem<UserRole>(SecureStorageKeyEnum.USERTYPE)
    ?.includes(UserRole.ADMIN)
    ? true
    : false;
  const queryClient = useQueryClient();
  const { userDetails } = useAppContext();
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    watch,
    setError,
    setValue,
    clearErrors,
    reset,
  } = useForm<FormValues>({
    defaultValues: {
      evaluators: [
        {
          jobApplicationId: Defaultvalues.jobApplicationId?.join(",") ?? "",
          jobId: Defaultvalues.jobId ?? "",
          jobTitle: Defaultvalues.jobTitle ?? "",
          companyId: Defaultvalues.companyId ?? "",
          applicantName: Defaultvalues.applicantUserName?.join(",") ?? "",
          applicantUserId: Defaultvalues.applicantUserId?.join(",") ?? "",
          applicantUserEmail: Defaultvalues.applicantUserEmail?.join(",") ?? "",
          evaluatorDetails: {
            name: "",
            email: "",
          },
          hrName: Defaultvalues.hrName ?? "",
          hrCurrentCompanyName: Defaultvalues.hrCurrentCompanyName ?? "",
          hrDetailedFeedback: "",
          hrHtmlDetailedFeedback: "",
        },
      ],
    },
    mode: "all", // Validate on change for better UX
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "evaluators",
  });

  const [activeTab, setActiveTab] = useState(0);
  const [submittedTabs, setSubmittedTabs] = useState<number[]>([]);

  const {
    data: evaluationData,
    isLoading: isEvaluationLoading,
    error: evaluationError,
  } = useQuery({
    queryKey: ["evaluationRequest", Defaultvalues.jobApplicationId],
    queryFn: async () => {
      const payload = {
        jobApplicationId: Defaultvalues.jobApplicationId?.[0],
        ...(isAdmin
          ? { evaluationRequesterAdminUserId: userDetails?.id }
          : { evaluationRequesterCorporateUserId: userDetails?.id }),
      };
      const { response, error } = await httpServiceObj.get<{data: OldEvaluationDetails[] | null}>(
        `/request-evaluation`,
        true,
        payload,
        false,
        "JOB"
      );
      if (error) {
        throw new Error("Failed to fetch evaluation data");
      }
      return response;
    },
    enabled: !!Defaultvalues.jobApplicationId?.[0], // Only run if jobApplicationId exists
  });

  // Watch for changes in hrDetailedFeedback and auto-convert to HTML
  React.useEffect(() => {
    const subscription = watch((value, { name }) => {
      if (name && name.includes("hrDetailedFeedback") && !name.includes("Html")) {
        const matches = name.match(/evaluators\.(\d+)\.hrDetailedFeedback/);
        if (matches) {
          const index = parseInt(matches[1]);
          const feedbackText = value.evaluators?.[index]?.hrDetailedFeedback || "";
          const htmlFeedback = convertToHtml(feedbackText);
          setValue(`evaluators.${index}.hrHtmlDetailedFeedback`, htmlFeedback);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [watch, setValue]);

  /**
   * onSubmit function
   *
   * This function collects all evaluator data, merges it with default values,
   * and sends the feedback requests to the server. It also handles success and error notifications.
   */
  const onSubmit = async () => {
    const allEvaluators = getValues("evaluators");
    const historyEmails = new Set(
      (Array.isArray(evaluationData?.data) ? evaluationData!.data! : []).map(
        (h) => (h.evaluatorDetails?.email || "").trim().toLowerCase()
      )
    );
    const validNewEvaluatorsAll = allEvaluators.filter((e) => {
      const email = (e?.evaluatorDetails?.email || "").trim().toLowerCase();
      return email && !historyEmails.has(email);
    });

    const historyCount = (Array.isArray(evaluationData?.data) ? evaluationData!.data! : []).length;
    const activeFieldIndex = activeTab - historyCount;
    if (activeFieldIndex < 0) {
      toast.error("This is a read-only tab.", getToastOptions({}));
      return;
    }
    const applicantIds = Defaultvalues.applicantUserId;
    const jobApplicationIds = Defaultvalues.jobApplicationId;
    const emails = Defaultvalues.applicantUserEmail;
    const applicantName = Defaultvalues.applicantUserName;

    // Safety check
    if (applicantIds.length !== jobApplicationIds.length || applicantIds.length !== emails.length) {
      toast.error("Mismatch in applicant data", getToastOptions({}));
      return;
    }

    const applicationPayloads = applicantIds.map((applicantId, index) => ({
      jobApplicationId: jobApplicationIds[index],
      jobId: Defaultvalues.jobId,
      jobTitle: Defaultvalues.jobTitle,
      applicantName: applicantName[index], // Use empty string if name is not available
      companyId: Defaultvalues.companyId,
      applicantUserId: applicantId,
      applicantUserEmail: emails[index],
      hrName: Defaultvalues.hrName,
      hrCurrentCompanyName: Defaultvalues.hrCurrentCompanyName,
    }));

    try {
      // Submit all newly added evaluators (exclude history) in both modes
      const validNewEvaluators = validNewEvaluatorsAll;

      if (validNewEvaluators.length === 0) {
        toast.error("Please add at least one new evaluator", getToastOptions({}));
        return;
      }
      await Promise.all(
        validNewEvaluators.map((evaluator) => {
          const payload = {
            requestEvaluations: applicationPayloads.map((app) => ({
              ...app,
              evaluatorDetails: evaluator.evaluatorDetails,
              hrDetailedFeedback: evaluator.hrDetailedFeedback,
              hrHtmlDetailedFeedback: evaluator.hrHtmlDetailedFeedback,
            })),
          };
          if (isBulk) {
            // console.log("Sending bulk to evaluator:", evaluator.evaluatorDetails.email, payload);
            if (isAdmin) {
              return AdminServiceObj.postBulkEvaluatorFeedbackRequest(payload);
            } else {
              return CorporateServiceObj.postBulkEvaluatorFeedbackRequest(payload);
            }
          } else {
            // modify the payload to match the expected structure for single evaluator requests
            const singlePayload: JobEvaluationRequestDto = {
              ...applicationPayloads[0], // Use the first application data for single evaluator requests
              evaluatorDetails: evaluator.evaluatorDetails,
              hrDetailedFeedback: evaluator.hrDetailedFeedback,
              hrHtmlDetailedFeedback: evaluator.hrHtmlDetailedFeedback,
            };

            if (isAdmin) {
              return AdminServiceObj.postEvaluatorFeedbackRequest(singlePayload);
            } else {
              return CorporateServiceObj.postEvaluatorFeedbackRequest(singlePayload);
            }
          }
        })
      );
      toast.success("Evaluation requests sent successfully", getToastOptions({}));
      if (isBulk && onBulkUpdate) {
        onBulkUpdate("UNDER_EVALUATION");
      } else {
        const corporateUserType = secureStorage.getItem<UserRole>(
          SecureStorageKeyEnum.CORPORATEUSERTYPE
        );
        const applicationUpdatePayload: JobApplicationUpdatePayloadDto = {
          status: "UNDER_EVALUATION",
          userType: isAdmin ? "ADMIN" : corporateUserType || UserRole.CORPORATE_ADMIN,
          applicantName: Defaultvalues.applicantUserName[0] || "",
          userId: Defaultvalues.applicantUserId[0] || "",
          emailId: Defaultvalues.applicantUserEmail[0] || "",
        };
        if (isAdmin) {
          await AdminServiceObj.updateApplicationStatus(
            applicationUpdatePayload,
            Defaultvalues.jobApplicationId[0]
          );
          //Invalidate the cache for the job application list

          queryClient.invalidateQueries({
            queryKey: ["AdminJobsApplicationQuery"],
          });
        } else {
          await CorporateServiceObj.updateApplicationStatus(
            applicationUpdatePayload,
            Defaultvalues.jobApplicationId[0]
          );
          //Invalidate the cache for the job application list
          queryClient.invalidateQueries({
            queryKey: ["CorporateJobsApplicationQuery"],
          });
        }
      }
    } catch (error: any) {
      toast.error(
        error instanceof Error ? error.message : "Error sending bulk evaluation requests",
        getToastOptions({})
      );
    } finally {
      // clear the form and close the modal\
      reset();
      onClose();
    }
  };

  const handleRemoveTab = (index: number) => {
    remove(index);
    if (activeTab === index) {
      setActiveTab(index > 0 ? index - 1 : 0);
    } else if (index < activeTab) {
      setActiveTab((prev) => prev - 1);
    }
    setSubmittedTabs(submittedTabs.filter((i) => i !== index));
  };

  const checkEmailExists = (email: string) => {
    const allEvaluators = getValues("evaluators");
    const normalized = (email || "").trim().toLowerCase();
    const historyEmails = new Set(
      (Array.isArray(evaluationData?.data) ? evaluationData!.data! : []).map(
        (h) => (h.evaluatorDetails?.email || "").trim().toLowerCase()
      )
    );
    const hasEvaulator = allEvaluators.some(
      (evaluator, index) =>
        (evaluator.evaluatorDetails.email || "").trim().toLowerCase() === normalized &&
        (historyItems.length + index) !== activeTab
    );
    const existsInHistory = historyEmails.has(normalized);
    if (hasEvaulator) {
      toast.error("Evaluator email already exists", getToastOptions({}));
      setError(`evaluators.${activeTab}.evaluatorDetails.email`, {
        type: "manual",
        message: "This email is already used in another tab",
      });
      return false;
    }
    if (existsInHistory) {
      toast.error("This evaluator was already requested earlier", getToastOptions({}));
      setError(`evaluators.${activeTab}.evaluatorDetails.email`, {
        type: "manual",
        message: "Evaluator already exists in history",
      });
      return false;
    }
    clearErrors(`evaluators.${activeTab}.evaluatorDetails.email`);
    return true;
  };
  const historyItems = React.useMemo(() => {
    if (!Array.isArray(evaluationData?.data)) return [] as OldEvaluationDetails[];
    return [...evaluationData!.data!].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [evaluationData]);
  const historyCount = historyItems.length;

  return (
    <div className="flex flex-col mt-4 h-full">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {Array.from({ length: historyCount + fields.length }).map((_, index) => {
          const isHistory = index < historyCount;
          const fieldIndex = index - historyCount;
          const historyTitle = isHistory
            ? (historyItems[index].evaluatorDetails?.name || historyItems[index].evaluatorDetails?.email || `Evaluator ${index + 1}`)
            : (getValues(`evaluators.${fieldIndex}.evaluatorDetails.name`) || getValues(`evaluators.${fieldIndex}.evaluatorDetails.email`) || `Evaluator ${index + 1}`);
          return (
            <div
              key={index}
              className="flex items-center border px-2 py-1 rounded-xl border-gray-300 bg-white">
              <button
                onClick={() => setActiveTab(index)}
                className={`text-sm font-semibold pr-1 capitalize ${
                  activeTab === index ? "text-black" : "text-gray-400"
                }`}>
                {historyTitle}
              </button>
              {!isHistory && (fields.length > 1) && (
                <button
                  onClick={() => handleRemoveTab(fieldIndex)}
                  className="text-gray-400 text-xs capitalize hover:text-red-500 ml-1"
                  title="Remove Evaluator">
                  ×
                </button>
              )}
            </div>
          );
        })}

        {fields.length < formLimit && (
          <button
            type="button"
            onClick={() => {
              append({
                jobApplicationId: Defaultvalues.jobApplicationId.join(","),
                jobId: Defaultvalues.jobId,
                jobTitle: Defaultvalues.jobTitle,
                companyId: Defaultvalues.companyId,
                applicantName: Defaultvalues.applicantUserName.join(","),
                applicantUserId: Defaultvalues.applicantUserId.join(","),
                applicantUserEmail: Defaultvalues.applicantUserEmail.join(","),
                evaluatorDetails: {
                  name: "",
                  email: "",
                },
                hrName: Defaultvalues.hrName,
                hrCurrentCompanyName: Defaultvalues.hrCurrentCompanyName,
                hrDetailedFeedback: "",
                hrHtmlDetailedFeedback: "",
              });
              setActiveTab(historyCount + fields.length);
            }}
            className="text-blue-500 text-xl font-bold px-2"
            title="Add Evaluator">
            +
          </button>
        )}
      </div>

      {/* Combined Content */}
      {Array.from({ length: historyCount + fields.length }).map((_, index) => {
        const isHistory = index < historyCount;
        const fieldIndex = index - historyCount;
        return (
          <div key={index} className={`h-full ${activeTab === index ? "block" : "hidden"}`}>
            {isHistory ? (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluator Name</label>
                  <input
                    value={historyItems[index].evaluatorDetails?.name || ""}
                    readOnly
                    className="w-full rounded-xl bg-#[EBEFF3] p-4 pl-[26px] text-sm text-black/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evaluator Email</label>
                  <input
                    value={historyItems[index].evaluatorDetails?.email || ""}
                    readOnly
                    className="w-full rounded-xl bg-#[EBEFF3] p-4 pl-[26px] text-sm text-black/40 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={historyItems[index].hrDetailedFeedback}
                    readOnly
                    rows={3}
                    className="w-full h-[96px] rounded-xl bg-gray-100 p-4 pl-[26px] text-sm focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              submittedTabs.includes(fieldIndex) ? (
                <div className="flex flex-col items-center justify-center text-center p-4">
                  <img src={evaluationRequest} className="w-[134px]" />
                  <p className="text-sm font-medium">
                    Evaluation request has been sent to :{" "}
                    <span className="font-semibold">
                      {getValues(`evaluators.${fieldIndex}.evaluatorDetails.name`)}
                    </span>
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex flex-col h-full gap-12 text-left">
                  <div className="flex flex-col gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Evaluator Name</label>
                      <ReusableInput
                        type="text"
                        register={register(`evaluators.${fieldIndex}.evaluatorDetails.name`, {
                          required: "Evaluator name is required",
                        })}
                        placeholder="Write evaluator name"
                        error={errors?.evaluators?.[fieldIndex]?.evaluatorDetails?.name?.message}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Evaluator Email</label>
                      <ReusableInput
                        type="email"
                        register={register(
                          `evaluators.${fieldIndex}.evaluatorDetails.email`,
                          validationRules.corporateEmail
                        )}
                        placeholder="Write evaluator email address"
                        error={errors?.evaluators?.[fieldIndex]?.evaluatorDetails?.email?.message}
                        onChange={(e) => checkEmailExists(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Message</label>
                      <textarea
                        {...register(`evaluators.${fieldIndex}.hrDetailedFeedback`)}
                        placeholder="Write a message to the evaluator"
                        className="w-full h-[96px] rounded-xl bg-gray-100 p-4 pl-[26px] text-sm focus:outline-none"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use double line breaks for paragraphs. Text will be automatically converted to
                        HTML format.
                      </p>
                    </div>

                    {/* Hidden HTML feedback field - auto-populated */}
                    <input type="hidden" {...register(`evaluators.${fieldIndex}.hrHtmlDetailedFeedback`)} />
                  </div>

                  <button
                    type="submit"
                    className="w-fit flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition">
                    <Send size={16} />
                    <span>Submit</span>
                  </button>
                </form>
              )
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EvaluatorForm;
