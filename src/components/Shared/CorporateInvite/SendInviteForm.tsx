import { useForm, Controller } from "react-hook-form";
import { ChevronDown, Send } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { useEffect, useState } from "react";
import { inviteTick } from "@AssetsFolder/assets";
import { validationRules } from "@Utils/FormValidator.utils";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { RBAC } from "@Utils/RoleBaseAccessControll.utils";

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  corporateUserType: "corporate-admin" | "corporate-recruiter";
  pricingPlan: "JOB_BOARD" | "HIRING_PARTNER" | "CO_PILOT";
  cvDuplicacyAccess: boolean;
  companyId: string;
};

// This will be the actual API payload
interface InviteApiPayload {
  companyId: string;
  corporateUserType: "corporate-admin" | "corporate-recruiter";
  email: string;
  firstName: string;
  lastName: string;
  phoneNumberDetails: {
    countryCode: number;
    phoneNumber: number;
  };
  pricingPlan?: "JOB_BOARD" | "HIRING_PARTNER" | "CO_PILOT";
  cvDuplicacyAccess?: boolean;
}

const InviteForm = ({ onClose ,compId,onRefetch}: { onClose: () => void ,compId:string,onRefetch:()=>void}) => {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isValid },
    watch,
    setValue,
    trigger,
  } = useForm<FormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      designation: "",
      corporateUserType: "corporate-recruiter",
      pricingPlan: "JOB_BOARD",
      cvDuplicacyAccess: true,
      companyId: "",
    },
    mode: "onChange", // This enables instant validation
  });

  const [inviteSent, setInviteSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState("");

  const watchCvDuplicacy = watch("cvDuplicacyAccess");

  const isCorporate = RBAC.can("play_corporate");

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Extract phone number (remove any non-digit characters)
      const phoneNumber = parseInt(data.phone.replace(/\D/g, ""));

      // Validate phone number
      if (isNaN(phoneNumber) || phoneNumber.toString().length !== 10) {
        toast.error("Please enter a valid 10-digit phone number", getToastOptions());
        setIsSubmitting(false);
        return;
      }
      // Prepare API payload according to the API documentation
      const basePayload = {
        companyId: compId,
        corporateUserType: data.corporateUserType,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumberDetails: {
          countryCode: 91, // Default to India, you can make this dynamic
          phoneNumber: phoneNumber,
        },
      };

      const apiPayload: InviteApiPayload = isCorporate
        ? basePayload
        : {
            ...basePayload,
            pricingPlan: data.pricingPlan,
            cvDuplicacyAccess: data.cvDuplicacyAccess,
          };
      // Make API call
      const { response, error } = await httpServiceObj.post(
        `https://api.dev.worko.work/corporate-invite/`,
        apiPayload,
        true,
        {},
        true
      );

      if (error) {
        toast.error(error.message || "Failed to send invite", getToastOptions());
        throw new Error(error.message || "Failed to send invite");
      }

      setName(`${data.firstName} ${data.lastName}`);
      setInviteSent(true);
      toast.success("Invite sent successfully!", getToastOptions());
    } catch (error) {
      console.error("Error sending invite:", error);
      toast.error("Failed to send invite. Please try again.", getToastOptions());
    } finally {
      setIsSubmitting(false);
      // Don't close modal if there's an error - only close on success
      onRefetch();
      onClose();
    }
  };

  if (inviteSent) {
    return (
      <div className="w-[650px] h-[640px] relative overflow-hidden bg-white rounded-xl">
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center gap-4">
          <img src={inviteTick} alt="inviteTick" className="w-16 h-16" />
          <p className="text-lg font-semibold font-poppins text-green-600">Success!</p>
          <p className="text-sm font-poppins text-gray-700">
            {name} has been invited successfully.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[650px] h-[640px] relative overflow-hidden bg-white rounded-xl">
      <div className="w-full h-[640px] bg-white p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="h-full relative">
          {/* Header */}
          <div className="mb-8 w-full text-left">
            <h2 className="text-black text-lg font-semibold font-poppins leading-tight">
              Invite others
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* First Name */}
              <div>
                <label className="block mb-2 text-sm font-medium font-poppins">
                  <span className="text-red-600">*</span>
                  <span className="text-black/95 ml-1">First Name</span>
                </label>
                <div className="relative">
                  <input
                    {...register("firstName", validationRules.name)}
                    placeholder="Enter first name"
                    className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black/40 ${
                      errors.firstName ? "border-2 border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      register("firstName").onChange(e);
                      trigger("firstName"); // Trigger validation on change
                    }}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1 animate-pulse">
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label className="block mb-2 text-sm font-medium font-poppins">
                  <span className="text-red-600">*</span>
                  <span className="text-black/95 ml-1">Last Name</span>
                </label>
                <div className="relative">
                  <input
                    {...register("lastName", validationRules.name)}
                    placeholder="Enter last name"
                    className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black/40 ${
                      errors.lastName ? "border-2 border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      register("lastName").onChange(e);
                      trigger("lastName");
                    }}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1 animate-pulse">
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block mb-2 text-sm font-medium font-poppins">
                  <span className="text-red-600">*</span>
                  <span className="text-black/95 ml-1">Phone Number</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    {...register("phone", validationRules.phone)}
                    placeholder="Enter 10-digit phone number"
                    className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black/40 ${
                      errors.phone ? "border-2 border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      register("phone").onChange(e);
                      trigger("phone");
                    }}
                  />
                  {errors.phone && (
                    <p className="text-red-500 text-xs mt-1 animate-pulse">
                      {errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Designation */}
              <div>
                <label className="block mb-2 text-sm font-medium font-poppins text-black/95">
                  Designation
                </label>
                <input
                  {...register("designation")}
                  placeholder="Enter designation (optional)"
                  className="w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black/40"
                />
              </div>

              {/* Pricing Plan */}
              {!isCorporate && (
                <div>
                  <label className="block mb-2 text-sm font-medium font-poppins">
                    <span className="text-red-600">*</span>
                    <span className="text-black/95 ml-1">Pricing Plan</span>
                  </label>
                  <div className="relative">
                    <select
                      {...register("pricingPlan", { required: "Pricing plan is required" })}
                      className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                        errors.pricingPlan ? "border-2 border-red-500" : ""
                      }`}
                      onChange={(e) => {
                        register("pricingPlan").onChange(e);
                        trigger("pricingPlan");
                      }}>
                      <option value="JOB_BOARD">Job Board</option>
                      <option value="HIRING_PARTNER">Hiring Partner</option>
                      <option value="CO_PILOT">Co-pilot</option>
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                    {errors.pricingPlan && (
                      <p className="text-red-500 text-xs mt-1 animate-pulse">
                        {errors.pricingPlan.message}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Email */}
              <div>
                <label className="block mb-2 text-sm font-medium font-poppins">
                  <span className="text-red-600">*</span>
                  <span className="text-black/95 ml-1">Email Address</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    {...register("email", validationRules.corporateEmail)}
                    placeholder="Enter email address"
                    className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-black/40 ${
                      errors.email ? "border-2 border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      register("email").onChange(e);
                      trigger("email");
                    }}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1 animate-pulse">
                      {errors.email.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Corporate User Type */}
              <div>
                <label className="block mb-2 text-sm font-medium font-poppins">
                  <span className="text-red-600">*</span>
                  <span className="text-black/95 ml-1">Access Type</span>
                </label>
                <div className="relative">
                  <select
                    {...register("corporateUserType", { required: "Access type is required" })}
                    className={`w-full h-11 px-4 bg-gray-100 rounded-xl text-black text-sm font-normal font-poppins focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none ${
                      errors.corporateUserType ? "border-2 border-red-500" : ""
                    }`}
                    onChange={(e) => {
                      register("corporateUserType").onChange(e);
                      trigger("corporateUserType");
                    }}>
                    {!isCorporate && <option value="corporate-admin">Admin</option>}
                    <option value="corporate-recruiter">Recruiter</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                  {errors.corporateUserType && (
                    <p className="text-red-500 text-xs mt-1 animate-pulse">
                      {errors.corporateUserType.message}
                    </p>
                  )}
                </div>
              </div>

              {/* CV Duplicacy */}
              {!isCorporate && (
                <div>
                  <label className="block mb-2 text-sm font-medium font-poppins">
                    <span className="text-red-600">*</span>
                    <span className="text-black/95 ml-1">CV Duplicacy Access</span>
                  </label>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setValue("cvDuplicacyAccess", true)}
                      className={`flex-1 h-11 rounded-xl text-sm font-medium font-poppins transition-all duration-200 ${
                        watchCvDuplicacy
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}>
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setValue("cvDuplicacyAccess", false)}
                      className={`flex-1 h-11 rounded-xl text-sm font-medium font-poppins transition-all duration-200 ${
                        !watchCvDuplicacy
                          ? "bg-blue-100 text-blue-700 border-2 border-blue-300"
                          : "bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400"
                      }`}>
                      No
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Allow access to CV duplicacy checking features
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="mt-10">
            <div className="flex justify-between items-center">
              <button
                type="submit"
                disabled={isSubmitting || !isValid}
                className={`px-8 py-3 rounded-lg flex justify-center items-center gap-3 transition-all duration-200 font-semibold ${
                  isSubmitting || !isValid
                    ? "bg-gray-400 cursor-not-allowed text-gray-600"
                    : "bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl"
                }`}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Sending Invite...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteForm;
