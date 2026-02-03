import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, Mail, MailPlus, Plus, SendIcon, X } from 'lucide-react';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useForm } from "react-hook-form";
import { gmail_logo, outlook_logo } from "@AssetsFolder/assets";
import { useAppContext } from "@Context/App.context";
import OutlookSteps from "./Modals/OutlookSteps";
import GmailSteps from "./Modals/GmailSteps";

interface ReferralsProps {

}

interface ReferralData {
  createdByCorporateUserId: string;
  createdByCorporateUserEmail: string;
  companyId: string;
  referralSourceTypeEmail: string;
  systemReferralSourceTypeEmail: string;
  id: string;
  createdAt: string;
  updatedAt: string;   
}

interface VerifyOtpResponse {
  verificationStatus: boolean;   
}

const Referrals: React.FC<ReferralsProps> = () => {

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [referralSourceData, setReferralSourceData] = useState<ReferralData | null>(null);
  const [isReferralData, setIsReferralData] = useState(false);

  const [visible, setVisible] = useState<boolean>(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [IsVerifying, setIsVerifying] = useState<boolean>(false);
  const [IsVerifyingCompleted, setIsVerifyingCompleted] = useState<boolean>(false);
  const [showInput, setShowInput] = useState<boolean>(false);
  const [otpTimer, setOtpTimer] = useState<number>(30);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [isResendingOtp, setIsResendingOtp] = useState<boolean>(false);
  const [isEmailAddedSuccessfully, setIsEmailAddedSuccessfully] = useState<boolean>(false);
  const [forwardingMailId, setForwardingMailId] = useState<string>("");
  const [submittedMailId, setSubmittedMailId] = useState<string>("");
  const {register, handleSubmit, getValues,formState: { errors },reset } = useForm<{ email: string, otp: string}>({
  defaultValues: {
    email: "",
    otp:""
  }
});

  const [isSeeOutlookSteps, setIsSeeOutlookSteps] = useState<boolean>(false);
  const [isSeeGmailSteps, setIsSeeGmailSteps] = useState<boolean>(false);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("Referral");
  const {userDetails} = useAppContext()

  const getDataFunction = async () => {
    if(!userDetails) return
    setIsDataLoading(true)
    try {
    const {response,error} = await httpServiceObj.get<ReferralData>(`/referral-sourcetype-activation/${userDetails?.companyId}`,true,{},false)
    if(error){
      toast.error("Cannot find details please try later",getToastOptions({}))
      reset()
    }

    if(response?.referralSourceTypeEmail && response?.systemReferralSourceTypeEmail){
      setReferralSourceData(response)
      setIsReferralData(true)
    } else{
      setReferralSourceData(null)
      setIsReferralData(false)
    }

    } catch (error) {
      console.log(error)
    } finally{
      setIsDataLoading(false)
      // setReferralSourceData(null)
      // setIsReferralData(false)
    }
  }
  
  useEffect(() => {
    console.log(userDetails?.userType)
    getDataFunction()
  }, [userDetails?.companyId])

  useEffect(() => {
  if (!showInput) return;
  if (otpTimer === 0) {
    setCanResend(true);
    return;
  }
  const timer = setInterval(() => {
    setOtpTimer(prev => prev - 1);
  }, 1000);

  return () => clearInterval(timer);
}, [otpTimer, showInput]);

  const sendOTP = async (data:any) => {
    try {
        const payload = {
            referralSourceTypeEmail: data?.email
        }
        const {response,error} = await httpServiceObj.post(`/corporate-user/request-otp/referral-sourcetype`,payload,true,{},false)

        if(error){
            toast.error(error.message,getToastOptions({}))
            return
        }

        toast.success(`OTP has been sent to ${data?.email}`,getToastOptions({}))
        setShowInput(true)
        setOtpTimer(30);
        setCanResend(false);
    } catch (error) {
        console.log(error)
    } 
  }
  
  const verifyOTP = async (data:any)=>{
    try {
        const payload = {
            referralSourceTypeEmail: data?.email,
            otp: data?.otp,
        }
        const {response, error } = await httpServiceObj.post<VerifyOtpResponse>(`/corporate-user/verify-otp/referral-sourcetype`,payload,true,{},false)
        if(error){
            toast.error(error.message,getToastOptions({}))
            return
        }

        if(!response?.verificationStatus){
            toast.error("Invalid otp, please check your email",getToastOptions({}))
            return
        }

        toast.success(`${data?.email} has been verified`,getToastOptions({}))
        setIsVerifyingCompleted(true)
        generateForwardingMailId(payload.referralSourceTypeEmail,response?.verificationStatus)
    } catch (error) {
        console.log(error)
    }
  }

  const generateForwardingMailId = async (email:string,verificationStatus:boolean) =>{
    try {
        const payload = {
          referralSourceTypeEmail: email,
          isEmailVerified:verificationStatus
        }
        const {response, error} = await httpServiceObj.post<ReferralData>(`/referral-sourcetype-activation/`,payload,true,{},false)
        if(error){
          toast.error(error.message,getToastOptions({}))
          return
        }
        setReferralSourceData(response)
        toast.success(`${response?.referralSourceTypeEmail} has been added successfully`,getToastOptions({}))
        // setIsEmailAddedSuccessfully(true)
        // setForwardingMailId(response?.systemReferralSourceTypeEmail ?? "")
        // setSubmittedMailId(response?.referralSourceTypeEmail ?? "")
        reset()
        // onClose()
    } catch (error) {
        console.log(error)
    }
  }

  const onSubmit = async (data:any) => {
  if (!showInput) {
    setIsVerifying(true);
    await sendOTP(data);
    setIsVerifying(false);
  } else {
    setIsSubmitting(true);
    await verifyOTP(data);
    setIsSubmitting(false);
  }
};

const closeButton = async () =>{
    // onClose()
    reset()
    setIsSubmitting(false)
    setIsVerifying(false)
    setIsVerifyingCompleted(false)
    setShowInput(false)
    setCanResend(false)
    setIsResendingOtp(false)
    setOtpTimer(30)
}

  return (
    <div className="w-full min-h-screen text-gray-800 flex flex-col items-center">
      <div className="w-full max-w-3xl mx-auto">

        {/* Title */}
        {/* <h1 className="text-3xl font-semibold mb-1 text-blue-500">Referral Configuration Settings</h1> */}
        {/* <p className="text-xs text-gray-500 mb-5">
          Manage your account settings and preferences
        </p> */}

        {/* Tabs */}
        {/* <div className="flex justify-center items-center">
        <div className="flex w-full max-w-2xl bg-white rounded-xl shadow-sm p-1 mb-8">
          {["Profile", "UI", "Referral"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg transition-all ${
                activeTab === tab ? "bg-gray-200 font-medium" : "hover:bg-gray-100"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        </div> */}

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">

          {/* <h2 className="text-lg font-semibold">Email Setup for Referrals</h2> */}
          <p className="text-blue-500 mb-4">
            Connect your email account to set up referral forwarding
          </p>

          {/* Section Title */}
          <h3 className="text-lg font-semibold mb-4 text-left">
            {!isReferralData && !referralSourceData
              ? "Add Referral Email"
              : "Submitted Referral Email Details"}
          </h3>
          { isDataLoading 
          ?(<div className="flex items-center justify-center max-h-screen">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
          </div>)
          : (<>
          {/* FORM MODE */}
          {!isReferralData && !referralSourceData ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

              {/* Email Field Card */}
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner">

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>

                <input
                  type="email"
                  disabled={showInput}
                  placeholder="Enter the email in which CV will be received"
                  className={`w-full px-4 py-2 text-sm rounded-lg border 
                    focus:outline-none transition-all disabled:bg-gray-200
                    ${
                      errors.email
                        ? "border-red-500"
                        : "border-gray-300 focus:border-blue-500"
                    }`}
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Enter a valid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              {/* OTP FIELD */}
              {showInput && (
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner text-center">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    OTP Verification
                  </label>

                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    className={`w-44 mx-auto px-3 py-2 text-sm rounded-lg border shadow-sm text-center tracking-widest
                      ${
                        errors.otp
                          ? "border-red-500"
                          : "border-gray-300 focus:border-blue-500"
                      }`}
                    {...register("otp", {
                      required: "OTP is required",
                      pattern: {
                        value: /^[0-9]{6}$/,
                        message: "OTP must be exactly 6 digits",
                      },
                      onChange: (e) => {
                        e.target.value = e.target.value.replace(/\D/g, "");
                      },
                    })}
                  />

                  {/* Timer / Resend */}
                  <div className="mt-3 text-sm text-gray-600">
                    {!canResend ? (
                      <span>
                        Resend OTP in <b>0:{otpTimer.toString().padStart(2, "0")}</b>
                      </span>
                    ) : (
                      <button
                        type="button"
                        disabled={isResendingOtp}
                        className={`text-blue-600 font-medium hover:underline ${
                          isResendingOtp && "opacity-50 cursor-not-allowed"
                        }`}
                        onClick={async () => {
                          setIsResendingOtp(true);
                          await sendOTP({ email: getValues("email") });
                          setIsResendingOtp(false);
                        }}
                      >
                        {isResendingOtp ? "Sending OTP..." : "Resend OTP"}
                      </button>
                    )}
                  </div>

                  {errors.otp && (
                    <p className="text-red-500 text-xs mt-2">{errors.otp.message}</p>
                  )}
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-blue-600 text-white 
                    hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 text-sm"
                  disabled={!showInput ? IsVerifying : isSubmitting}
                >
                  <SendIcon className="h-4 w-4" />
                  {!showInput
                    ? IsVerifying
                      ? "Sending OTP..."
                      : "Send OTP"
                    : isSubmitting
                    ? "Submitting..."
                    : "Submit"}
                </button>
              </div>
            </form>
          ) : (
            /* DETAILS MODE */
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 shadow-inner space-y-4">

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 font-medium">Submitted Email:</span>
                <span className="text-gray-900 font-semibold break-all">
                  {referralSourceData?.referralSourceTypeEmail}
                </span>
              </div>

              <div className="flex items-center gap-3 text-sm">
                <span className="text-gray-500 font-medium">Forwarding Email:</span>
                <span className="text-gray-900 font-semibold break-all">
                  {referralSourceData?.systemReferralSourceTypeEmail}
                </span>
              </div>
            </div>
          )}
          </>)
          }
          

          {/* Email Provider Options */}
          {!isDataLoading &&
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 place-items-center">

            {/* Gmail */}
            <div
              onClick={() => {
                setSelectedEmail("gmail");
                setIsSeeGmailSteps(true);
              }}
              className="
                flex items-center justify-between gap-4 
                bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl 
                w-full sm:w-[300px]
                cursor-pointer hover:bg-gray-100 transition shadow-sm
              "
            >
              <img src={gmail_logo} className="w-6 h-auto object-contain" />
              <div className="flex-1">
                <p className="font-semibold">Gmail</p>
                <p className="text-gray-500 text-xs">Check steps to connect Gmail account</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedEmail === "gmail"
                    ? "border-blue-600"
                    : "border-gray-400"
                }`}
              >
                {selectedEmail === "gmail" && (
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                )}
              </div>
            </div>

            {/* Outlook */}
            <div
              onClick={() => {
                setSelectedEmail("outlook");
                setIsSeeOutlookSteps(true);
              }}
              className="
                flex items-center justify-between gap-4 
                bg-gray-50 border border-gray-200 px-4 py-4 rounded-xl 
                w-full sm:w-[300px]
                cursor-pointer hover:bg-gray-100 transition shadow-sm
              "
            >
              <img src={outlook_logo} className="w-6 h-auto object-contain" />
              <div className="flex-1">
                <p className="font-semibold">Microsoft Outlook</p>
                <p className="text-gray-500 text-xs">Check steps to connect Outlook account</p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  selectedEmail === "outlook"
                    ? "border-blue-600"
                    : "border-gray-400"
                }`}
              >
                {selectedEmail === "outlook" && (
                  <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                )}
              </div>
            </div>

          </div>
          }

        </div>
      </div>

      {/* Outlook Steps */}
      {isSeeOutlookSteps && selectedEmail === "outlook" && (
        <OutlookSteps
          dashboardType="CORPORATE"
          onClose={() => {
            setIsSeeOutlookSteps(false);
            setSelectedEmail(null);
          }}
          isOpen={isSeeOutlookSteps}
        />
      )}

      {/* Gmail Steps */}
      {isSeeGmailSteps && selectedEmail === "gmail" &&(
        <GmailSteps
          dashboardType="CORPORATE"
          onClose={() => {
            setIsSeeGmailSteps(false)
            setSelectedEmail(null)
          }}
          isOpen={isSeeGmailSteps}
        />
      )}

    </div>
  );
};

export default Referrals;
