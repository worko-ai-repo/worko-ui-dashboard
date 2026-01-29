import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from 'lib-worko-ui';
import { ChevronDown, Plus, SendIcon, X } from 'lucide-react';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useForm } from "react-hook-form";
import { gmail_logo, outlook_logo } from "@AssetsFolder/assets";
import OutlookSteps from "../Database/modals/OutlookSteps";
import GmailSteps from "../Database/modals/GmailSteps";
import { useAppContext } from "@Context/App.context";

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
  const {userDetails} = useAppContext()

  const getDataFunction = async () => {
    try {
    const {response,error} = await httpServiceObj.get<ReferralData>(`https://api.dev.worko.work/referral-sourcetype-activation/${userDetails?.companyId}`,true,{},true)
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
    }
  }
  
  useEffect(() => {
    getDataFunction()
  }, [])

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
        <div className="flex justify-center item-center">
        {isDataLoading ? (
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin h-10 w-10 border-2 border-t-transparent rounded-full"></div>
        </div>
      ) : (      
            <div className={`p-6 overflow-y-auto ${!isReferralData && !referralSourceData ? "min-h-[50vh]" : "min-h-[30vh]"}`}>
                <h2 className="text-xl font-semibold mb-4 text-left">{
                !isReferralData && !referralSourceData 
                ? "Add Referral Email" 
                : "Referral Email details"
                }</h2>
                {!isReferralData && !referralSourceData ?
                <form onSubmit={handleSubmit(onSubmit)}>
                    {/* Email Input & OTP Input */}
                    <div className="relative w-full flex flex-col gap-2">
                        {/* {Email input} */}
                        <div>               
                        <input
                        type="email"
                        disabled={showInput}
                        placeholder="Enter the email in which CV will be received"
                        className={`w-full pr-10 px-3 py-2 text-sm border rounded-md focus:outline-none disabled:bg-gray-100 ${errors.email ? "border-red-500" : "border-gray-300"}`}
                        {...register("email", {
                            required: "Email is required",
                            pattern: {
                            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                            message: "Enter a valid email address"
                            }
                        })}
                        />

                        {errors.email && (
                        <p className="text-red-500 text-xs mt-1 text-left">{errors.email.message}</p>
                        )}
                        </div>

                        {/* OTP Input */}
                        {showInput && (
                        <div className="w-44 m-auto">
                            <input
                                type="text"
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                className={`w-full pr-10 px-3 py-2 text-sm border rounded-md focus:outline-none disabled:bg-gray-100 
                                ${errors.otp ? "border-red-500" : "border-gray-300"}`}
                                {...register("otp", {
                                required: "OTP is required",
                                pattern: {
                                    value: /^[0-9]{6}$/,
                                    message: "OTP must be exactly 6 digits"
                                },
                                onChange: (e) => {
                                    e.target.value = e.target.value.replace(/\D/g, "");
                                }
                                })}
                            />

                            {/* TIMER / RESEND */}
                            <div className="mt-2 text-sm">
                            {!canResend ? (
                                <span className="text-gray-500">
                                Resend OTP in <b>0:{otpTimer.toString().padStart(2, "0")}</b>
                                </span>
                            ) : (
                                <button
                                type="button"
                                disabled={isResendingOtp}
                                className={`text-blue-600 hover:underline ${isResendingOtp && "opacity-50 cursor-not-allowed"}`}
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
                            <p className="text-red-500 text-xs mt-1">{errors.otp.message}</p>
                            )}
                        </div>
                        )}
                    </div>
                    <div className="absolute bottom-6 left-6">
                        <button
                        type="submit"
                        className="flex items-center gap-1 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                        disabled={!showInput ? IsVerifying : isSubmitting}
                        >
                        <SendIcon className="h-4 w-4" />
                            {!showInput
                            ? IsVerifying ? 'Sending OTP...' : 'Send OTP'
                            : isSubmitting ? 'Submitting...' : 'Submit'
                            }
                        </button>
                    </div>
                </form>
                : <div className="pb-4 space-y-4 font-['Inter']">
                  
                  <div className="flex items-start gap-1 text-xs">
                    <span className="text-[#94a3b8] font-medium whitespace-nowrap">Submitted Email id : </span>
                    <span className="text-[#0f172a] font-medium font-['Poppins']">{referralSourceData?.referralSourceTypeEmail}</span>
                  </div>

                  
                  <div className="flex items-start gap-1 text-xs">
                      <span className="text-[#94a3b8] font-medium whitespace-nowrap">Forwarding Email id: </span>
                      <p className="text-[#0f172a] font-medium font-['Poppins']">{referralSourceData?.systemReferralSourceTypeEmail}</p>
                  </div>

                  <div className="flex items-start gap-1 text-sm">
                  <p 
                  className="text-blue-500 text-start"
                    >
                    See steps
                  </p>
                  </div>

                  <div className="flex items-start gap-1 text-sm">
                  <button 
                  className="text-blue-500 text-start border-2 border-blue-600 rounded-full p-2 hover:bg-gray-100 transition"
                  data-tooltip-id="my-tooltip"
                  data-tooltip-content="Check steps for outlook"
                  data-tooltip-place="top"
                  onClick={()=>{
                    setIsSeeOutlookSteps(true)
                    }}>
                    <img 
                      src={outlook_logo} 
                      alt="See the steps for outlook" 
                      className="w-6 h-auto object-contain"
                    />
                  </button>
                    <button 
                    className="text-blue-500 text-start border-2 border-blue-600 rounded-full p-2 hover:bg-gray-100 transition"
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Check steps for outlook"
                    data-tooltip-place="top"
                    onClick={()=>{
                      setIsSeeGmailSteps(true)
                      }}>
                      <img 
                        src={gmail_logo} 
                        alt="See the steps for outlook" 
                        className="w-6 h-auto object-contain"
                      />
                    </button>
                  </div>
                </div>
                }
            </div>
      )}

        
        {isSeeOutlookSteps && 
        <OutlookSteps
        dashboardType="CORPORATE"
        onClose={()=>setIsSeeOutlookSteps(false)}
        isOpen={isSeeOutlookSteps}/>
        }
        {isSeeGmailSteps && 
        <GmailSteps
        dashboardType="CORPORATE"
        onClose={()=>setIsSeeGmailSteps(false)}
        isOpen={isSeeGmailSteps}/>
        }
    </div>
  );
};

export default Referrals;
