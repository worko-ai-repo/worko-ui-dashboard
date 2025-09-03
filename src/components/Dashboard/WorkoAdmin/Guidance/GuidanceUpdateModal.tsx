import React, { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";

import {
  CursorPaginationUsersDataAdminParams,
  GuidanceRequestDto,
} from "@Interfaces/AdminServices.dto";
import { UserGuidanceRequestStatusType } from "src/types/JobsAndApplication.type";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { validationRules } from "@Utils/FormValidator.utils";
import AdminServiceObj from "../Services/Admin.service";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";

interface GuidanceUpdateModalProps {
  data: GuidanceRequestDto;
  overrideType?: "REJECT" | "RESCHEDULE";
  onClose: () => void;
  fetchGuidance: () => void;
}

interface SelectedMentor {
  id: string;
  email: string;
  name: string;
}

interface MentorSearchResult {
  id: string;
  email: string;
  name: string;
  companyName: string;
  about?: string;
}

interface FormData {
  selectedAction?: string;
  mentorEmail?: string;
  selectedMentor?: SelectedMentor;
  date?: string;
  time?: string;
  duration?: string;
  totalAmount?: number;
  linkForPayment?: string;
  remarks?: string;
  rejectionReason?: string;
  utrNumber?: string;
  meetingLink?: string;
}

const GuidanceUpdateModal: React.FC<GuidanceUpdateModalProps> = ({ data, onClose ,overrideType,fetchGuidance}) => {
  const [searchResults, setSearchResults] = useState<MentorSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [generalError, setGeneralError] = useState<string>("");

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    mode: "onChange",
    defaultValues: {
      selectedAction: "",
      mentorEmail: "",
      selectedMentor: undefined,
      date: "",
      time: "",
      duration: "",
      totalAmount: 0,
      linkForPayment: "",
      remarks: "",
      rejectionReason: "",
      utrNumber: "",
      meetingLink: "",
    },
  });

  const selectedAction = watch("selectedAction");
  const totalAmount = watch("totalAmount");
  const mentorEmail = watch("mentorEmail");
  const date = watch("date");
  const time = watch("time");

  // Get available actions based on current status
  const getAvailableActions = (status: UserGuidanceRequestStatusType) => {
    switch (status) {
      case "PENDING":
        return [
          { value: "MENTOR_ASSIGNED", label: "Schedule Meeting" },
          { value: "REJECTED", label: "Reject" },
        ];
      case "MEETING_CONFIRMED":
        return [
          { value: "RESCHEDULE_MEETING", label: "Reschedule Meeting" },
          { value: "PROJECT_COMPLETED", label: "Project Completed" },
        ];
      case "PAYMENT_CONFIRMATION_PENDING":
        return [{ value: "PAYMENT_CONFIRMATION_DONE", label: "Payment Confirmation Done" }];
      case "PAYMENT_CONFIRMATION_DONE":
        return [{ value: "MEETING_CONFIRMED", label: "Meeting Confirm" }];
      case "MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE":
      case "MEETING_RESCHEDULE_REQUESTED_BY_MENTOR":
        return [{ value: "MEETING_RESCHEDULE_CONFIRMED", label: "Meeting Reschedule Confirmed" }];
      case "MEETING_CONFIRMED":
      case "MEETING_RESCHEDULE_CONFIRMED":
        return [{ value: "PROJECT_COMPLETED", label: "Project Completed" }];
      default:
        return [];
    }
  };

  useEffect(() => {
    if (overrideType === "REJECT") {
      setValue("selectedAction", "REJECTED");
    } else if (overrideType === "RESCHEDULE") {
      setValue("selectedAction", "RESCHEDULE_MEETING");
    }
  }
  , [overrideType]);

  const availableActions = getAvailableActions(data?.status);

  // Search mentor by email
  const searchMentor = async (email: string): Promise<void> => {
    if (!email || email.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const params: CursorPaginationUsersDataAdminParams = {
        userType: "EMP",
        pageSize: 25,
        sortOrder: "descending",
        searchText: email,
      };
      const response = await AdminServiceObj.fetchAdminUsers(params);
      if (response?.data?.length === 0) {
        setSearchResults([]);
        return;
      }
      setSearchResults(
        response?.data?.map((applicant: ApplicantDetails) => ({
          id: applicant?.id,
          email: applicant?.email,
          name: applicant?.name,
          companyName: applicant?.candidateExperience?.companyName || "N/A", // Provide a default value if companyName is missing
          about: applicant?.about,
        })) || []
      );
    } catch (error) {
      console.error("Error searching mentor:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Watch mentor email and trigger search
  useEffect(() => {
    if (mentorEmail) {
      searchMentor(mentorEmail);
    }
  }, [mentorEmail]);

  // Helper functions to convert between datetime-local and separate date/time
  const combineDateTime = (dateStr: string, timeStr: string): string => {
    if (!dateStr || !timeStr) return "";
    return `${dateStr}T${timeStr}`;
  };

  const splitDateTime = (datetimeStr: string): { date: string; time: string } => {
    if (!datetimeStr) return { date: "", time: "" };
    const [datePart, timePart] = datetimeStr.split("T");
    return {
      date: datePart || "",
      time: timePart || "",
    };
  };

  // Handle datetime-local input change
  const handleDateTimeChange = (datetimeValue: string) => {
    const { date, time } = splitDateTime(datetimeValue);
    setValue("date", date);
    setValue("time", time);
  };

  // Get current datetime-local value for the input
  const getCurrentDateTime = (): string => {
    return combineDateTime(date || "", time || "");
  };

  // Handle form submission
  const onSubmit = async (formData: FormData): Promise<void> => {
    setIsSubmitting(true);
    setGeneralError("");

    try {
      let requestBody: Record<string, any> = {
        newStatus: formData.selectedAction,
        actionByUserId: secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERID) || "",
        actionByUserType: "ADMIN",
      };

      // Add specific fields based on action
      switch (formData.selectedAction) {
        case "MENTOR_ASSIGNED":
          requestBody = {
            ...requestBody,
            mentorDetails: {
              userId: formData.selectedMentor?.id,
              userEmail: formData.selectedMentor?.email,
              name: formData.selectedMentor?.name,
            },
            scheduleMeetingDetails: {
              date: new Date(formData.date + "T" + formData.time).toISOString(),
              time: formData.time,
              duration: formData.duration,
            },
            mentorAssignedRemarks: formData.remarks || "",
            currency: "INR",
            totalAmount: formData.totalAmount,
            linkForPayment: formData.linkForPayment,
          };
          break;

        case "REJECTED":
          requestBody.rejectionReason = formData.rejectionReason?.trim();
          break;

        case "PAYMENT_CONFIRMATION_DONE":
          requestBody.uniqueTransactionReference = formData.utrNumber?.trim();
          break;

        case "MEETING_CONFIRMED":
          requestBody.meetingLink = formData.meetingLink?.trim();
          break;

        case "MEETING_RESCHEDULE_CONFIRMED":
          requestBody = {
            ...requestBody,
            scheduleMeetingDetails: {
              date: new Date(formData.date + "T" + formData.time).toISOString(),
              time: formData.time,
              duration: formData.duration,
            },
            meetingLink: formData.meetingLink?.trim(),
          };
          break;
      }

      const response = await AdminServiceObj.patchGuidanceStatus(data?.id || "", requestBody);

      if (response) {
        onClose();
        fetchGuidance();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      setGeneralError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when action changes
  const handleActionChange = (action: string) => {
    reset({
      selectedAction: action,
      mentorEmail: "",
      selectedMentor: undefined,
      date: "",
      time: "",
      duration: "",
      totalAmount: 0,
      linkForPayment: "",
      remarks: "",
      rejectionReason: "",
      utrNumber: "",
      meetingLink: "",
    });
    setSearchResults([]);
    setGeneralError("");
  };

  return (
    <div className="p-4 max-w-2xl">
      <h3 className="text-lg font-semibold mb-6">Update Guidance Status</h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Action Selection Dropdown */}
        {!overrideType&&<div>
          <Controller
            name="selectedAction"
            control={control}
            rules={validationRules.default}
            render={({ field }) => (
              <select
                {...field}
                onChange={(e) => {
                  field.onChange(e);
                  handleActionChange(e.target.value);
                }}
                className={`w-full p-3 border rounded-lg ${
                  errors.selectedAction ? "border-red-500" : ""
                }`}>
                <option value="">Choose an action...</option>
                {availableActions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.selectedAction && (
            <div className="mt-1 text-sm text-red-600">{errors.selectedAction.message}</div>
          )}
        </div>}
        {generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {generalError}
          </div>
        )}
        {selectedAction === "RESCHEDULE_MEETING" && (
          <div className="space-y-6">
            {/* New DateTime Input */}
            <div>
              <label className="block text-sm font-medium mb-2">*New Date & Time</label>
              <input
                type="datetime-local"
                value={getCurrentDateTime()}
                onChange={(e) => handleDateTimeChange(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  errors.date || errors.time ? "border-red-500" : ""
                }`}
                min={new Date().toISOString().slice(0, 16)}
              />
              {(errors.date || errors.time) && (
                <div className="mt-1 text-sm text-red-600">Date and time is required</div>
              )}
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">*Duration</label>
              <Controller
                name="duration"
                control={control}
                rules={validationRules.default}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full p-3 border rounded-lg ${
                      errors.duration ? "border-red-500" : ""
                    }`}>
                    <option value="">Select duration</option>
                    <option value="30 mins">30 mins</option>
                    <option value="1 hr">1 hr</option>
                    <option value="1 hr 30 mins">1 hr 30 mins</option>
                    <option value="2 hrs">2 hrs</option>
                    <option value="2 hrs 30 mins">2 hrs 30 mins</option>
                    <option value="3 hrs">3 hrs</option>
                  </select>
                )}
              />
              {errors.duration && (
                <div className="mt-1 text-sm text-red-600">{errors.duration.message}</div>
              )}
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium mb-2">*New Meeting Link</label>
              <Controller
                name="meetingLink"
                control={control}
                rules={validationRules.url}
                render={({ field }) => (
                  <input
                    {...field}
                    type="url"
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className={`w-full p-3 border rounded-lg ${
                      errors.meetingLink ? "border-red-500" : ""
                    }`}
                  />
                )}
              />
              {errors.meetingLink && (
                <div className="mt-1 text-sm text-red-600">{errors.meetingLink.message}</div>
              )}
            </div>
          </div>
        )}
        {/* Rejection Form */}
        {selectedAction === "REJECTED" && (
          <div>
            <label className="block text-sm font-medium mb-2">*Rejection Reason</label>
            <Controller
              name="rejectionReason"
              control={control}
              rules={validationRules.defaultTextarea}
              render={({ field }) => (
                <textarea
                  {...field}
                  placeholder="Please provide the reason for rejection..."
                  className={`w-full p-3 border rounded-lg h-24 resize-none ${
                    errors.rejectionReason ? "border-red-500" : ""
                  }`}
                />
              )}
            />
            {errors.rejectionReason && (
              <div className="mt-1 text-sm text-red-600">{errors.rejectionReason.message}</div>
            )}
          </div>
        )}
        {/* Schedule Meeting Form */}
        {selectedAction === "MENTOR_ASSIGNED" && (
          <div className="space-y-6">
            {/* Choose Mentor */}
            <div>
              <label className="block text-sm font-medium mb-2">*Choose Mentor</label>
              <Controller
                name="mentorEmail"
                control={control}
                rules={validationRules.email}
                render={({ field }) => (
                  <input
                    {...field}
                    type="email"
                    placeholder="Search by employee email"
                    className={`w-full p-3 border rounded-lg ${
                      errors.mentorEmail ? "border-red-500" : ""
                    }`}
                  />
                )}
              />
              {errors.mentorEmail && (
                <div className="mt-1 text-sm text-red-600">{errors.mentorEmail.message}</div>
              )}

              {isSearching && <div className="mt-2 text-sm text-gray-500">Searching...</div>}

              {searchResults.length > 0 && (
                <div className="mt-2 border rounded-lg max-h-40 overflow-y-auto">
                  {searchResults.map((mentor) => (
                    <div
                      key={mentor.id}
                      onClick={() => {
                        setValue("mentorEmail", mentor.email);
                        setValue("selectedMentor", {
                          id: mentor.id,
                          email: mentor.email,
                          name: mentor.name,
                        });

                        setSearchResults([]);
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0">
                      <div className="font-medium capitalize">{mentor.name}</div>
                      <div className="text-sm text-gray-600 capitalize">{mentor.email}</div>
                      <div className="text-xs text-gray-500 capitalize">{mentor.companyName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Single DateTime Input */}
            <div>
              <label className="block text-sm font-medium mb-2">*Choose Date & Time </label>
              <input
                type="datetime-local"
                value={getCurrentDateTime()}
                onChange={(e) => handleDateTimeChange(e.target.value)}
                className={`w-full p-3 border rounded-lg ${
                  errors.date || errors.time ? "border-red-500" : ""
                }`}
                min={new Date().toISOString().slice(0, 16)}
              />
              {(errors.date || errors.time) && (
                <div className="mt-1 text-sm text-red-600">Date and time is required</div>
              )}
            </div>
            {/* Duration */}
            <div>
              <label className="block text-sm font-medium mb-2">*Duration</label>
              <Controller
                name="duration"
                control={control}
                rules={validationRules.default}
                render={({ field }) => (
                  <select
                    {...field}
                    className={`w-full p-3 border rounded-lg ${
                      errors.duration ? "border-red-500" : ""
                    }`}>
                    <option value="">Select duration</option>
                    <option value="30 mins">30 mins</option>
                    <option value="1 hr">1 hr</option>
                    <option value="1 hr 30 mins">1 hr 30 mins</option>
                    <option value="2 hrs">2 hrs</option>
                    <option value="2 hrs 30 mins">2 hrs 30 mins</option>
                    <option value="3 hrs">3 hrs</option>
                  </select>
                )}
              />
              {errors.duration && (
                <div className="mt-1 text-sm text-red-600">{errors.duration.message}</div>
              )}
            </div>

            {/* Show formatted preview */}
            {date && time && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="text-sm text-blue-800">
                  <strong>Scheduled for:</strong> {new Date(`${date}T${time}`).toLocaleString()}
                </div>
              </div>
            )}

            {/* Hidden Controllers for form validation */}
            <div className="hidden">
              <Controller
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                render={({ field }) => <input {...field} />}
              />
              <Controller
                name="time"
                control={control}
                rules={{ required: "Time is required" }}
                render={({ field }) => <input {...field} />}
              />
            </div>

            {/* Payment Amount */}
            <div>
              <label className="block text-sm font-medium mb-2">*Payment Amount (INR)</label>
              <Controller
                name="totalAmount"
                control={control}
                rules={{
                  ...validationRules.defaultNumber,
                  min: { value: 1, message: "Amount must be greater than 0" },
                }}
                render={({ field }) => (
                  <input
                    {...field}
                    type="number"
                    placeholder="5000"
                    className={`w-full p-3 border rounded-lg ${
                      errors.totalAmount ? "border-red-500" : ""
                    }`}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />
              {errors.totalAmount && (
                <div className="mt-1 text-sm text-red-600">{errors.totalAmount.message}</div>
              )}
              {/*  {totalAmount && totalAmount > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Platform Fee (20%): ₹{Math.round(totalAmount * 0.2)} | Guidance Fee (80%): ₹
                  {Math.round(totalAmount * 0.8)}
                </div>
              )} */}
            </div>

            {/* Payment Link */}
            <div>
              <label className="block text-sm font-medium mb-2">*Link for Payment</label>
              <Controller
                name="linkForPayment"
                control={control}
                rules={validationRules.url}
                render={({ field }) => (
                  <input
                    {...field}
                    type="url"
                    placeholder="https://payment-link.com"
                    className={`w-full p-3 border rounded-lg ${
                      errors.linkForPayment ? "border-red-500" : ""
                    }`}
                  />
                )}
              />
              {errors.linkForPayment && (
                <div className="mt-1 text-sm text-red-600">{errors.linkForPayment.message}</div>
              )}
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-sm font-medium mb-2">Remarks (Optional)</label>
              <Controller
                name="remarks"
                control={control}
                render={({ field }) => (
                  <textarea
                    {...field}
                    placeholder="Additional notes..."
                    className="w-full p-3 border rounded-lg h-24 resize-none"
                  />
                )}
              />
            </div>
          </div>
        )}
        {/* Payment Confirmation Form */}
        {selectedAction === "PAYMENT_CONFIRMATION_DONE" && (
          <div>
            <label className="block text-sm font-medium mb-2">*UTR Number</label>
            <Controller
              name="utrNumber"
              control={control}
              rules={validationRules.default}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="N1234567***23456"
                  className={`w-full p-3 border rounded-lg ${
                    errors.utrNumber ? "border-red-500" : ""
                  }`}
                />
              )}
            />
            {errors.utrNumber && (
              <div className="mt-1 text-sm text-red-600">{errors.utrNumber.message}</div>
            )}
          </div>
        )}
        {/* Meeting Confirmation Form */}
        {selectedAction === "MEETING_CONFIRMED" && (
          <div>
            <label className="block text-sm font-medium mb-2">*Meeting Link</label>
            <Controller
              name="meetingLink"
              control={control}
              rules={validationRules.url}
              render={({ field }) => (
                <input
                  {...field}
                  type="url"
                  placeholder="https://meet.google.com/xyz-abc-def"
                  className={`w-full p-3 border rounded-lg ${
                    errors.meetingLink ? "border-red-500" : ""
                  }`}
                />
              )}
            />
            {errors.meetingLink && (
              <div className="mt-1 text-sm text-red-600">{errors.meetingLink.message}</div>
            )}
          </div>
        )}
        {/* Meeting Reschedule Confirmation Form */}
        {selectedAction === "MEETING_RESCHEDULE_CONFIRMED" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">*New Date & Time</label>
                <input
                  type="datetime-local"
                  value={getCurrentDateTime()}
                  onChange={(e) => handleDateTimeChange(e.target.value)}
                  className={`w-full p-3 border rounded-lg ${
                    errors.date || errors.time ? "border-red-500" : ""
                  }`}
                  min={new Date().toISOString().slice(0, 16)}
                />
                {(errors.date || errors.time) && (
                  <div className="mt-1 text-sm text-red-600">Date and time is required</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">*Duration</label>
                <Controller
                  name="duration"
                  control={control}
                  rules={validationRules.default}
                  render={({ field }) => (
                    <select
                      {...field}
                      className={`w-full p-3 border rounded-lg ${
                        errors.duration ? "border-red-500" : ""
                      }`}>
                      <option value="">Select duration</option>
                      <option value="30 mins">30 mins</option>
                      <option value="1 hr">1 hr</option>
                      <option value="1 hr 30 mins">1 hr 30 mins</option>
                      <option value="2 hrs">2 hrs</option>
                      <option value="2 hrs 30 mins">2 hrs 30 mins</option>
                      <option value="3 hrs">3 hrs</option>
                    </select>
                  )}
                />
                {errors.duration && (
                  <div className="mt-1 text-sm text-red-600">{errors.duration.message}</div>
                )}
              </div>
            </div>

            {/* Hidden Controllers for form validation */}
            <div className="hidden">
              <Controller
                name="date"
                control={control}
                rules={{ required: "Date is required" }}
                render={({ field }) => <input {...field} />}
              />
              <Controller
                name="time"
                control={control}
                rules={{ required: "Time is required" }}
                render={({ field }) => <input {...field} />}
              />
            </div>

            {/* Meeting Link */}
            <div>
              <label className="block text-sm font-medium mb-2">*Meeting Link</label>
              <Controller
                name="meetingLink"
                control={control}
                rules={validationRules.url}
                render={({ field }) => (
                  <input
                    {...field}
                    type="url"
                    placeholder="https://meet.google.com/xyz-abc-def"
                    className={`w-full p-3 border rounded-lg ${
                      errors.meetingLink ? "border-red-500" : ""
                    }`}
                  />
                )}
              />
              {errors.meetingLink && (
                <div className="mt-1 text-sm text-red-600">{errors.meetingLink.message}</div>
              )}
            </div>
          </div>
        )}
        {/* Project Completed Confirmation */}
        {selectedAction === "PROJECT_COMPLETED" && (
          <div className="text-center py-8">
            <h4 className="text-lg font-medium mb-2">Mark Project as Completed?</h4>
            <p className="text-gray-600">
              This action will mark the guidance request as completed.
            </p>
          </div>
        )}
        {/* Action Buttons */}
        <div className="flex justify-start space-x-3 pt-6">
          <button
            type="submit"
            disabled={isSubmitting || !selectedAction}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
            <PaperAirplaneIcon className="inline w-4 h-4 fill-white outline-blue-500 text-blue-600 relative -top-0.5 -rotate-45" />
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default GuidanceUpdateModal;
