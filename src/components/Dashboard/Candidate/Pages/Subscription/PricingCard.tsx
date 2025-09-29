import httpServiceObj from "@Services/ApiHandler.service";
import { Check, CircleCheck } from "lucide-react";
import { useEffect, useReducer, useState } from "react";
import profileService from "../../Service/ProfileService";
import { useAppContext } from "@Context/App.context";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import { startRazorpayPayment } from "@Utils/RazorpayUtils";
import OrderDetailsModal from "./modals/OrderDetailsModal";

// declare global {
//   interface Window {
//     Razorpay: any;
//   }
// }

interface PricingCardProps {
  SK: string;
  name: string;
  amount: number;
  referralCount: number;
  referralCost?: string;
  duration: number;
  features: string[];
  isActive: boolean;
  index?: number;
  buttonText?: string;
  userDetails?: {  
    name: string;
    number: string;
    userId: string;
    email: string;
  };
  // onRefresh:(()=>void)
  setShowOrderDetails: (value: boolean) => void;
  setPaymentID: (value: string) => void;
  setOrderID: (value: string) => void;
  setAmount: (value: number) => void;
  existingReferrals:any;
}

const PricingCard = ({
  SK,
  name,
  amount,
  referralCount,
  referralCost,
  duration,
  features,
  isActive,
  index,
  buttonText,
  userDetails,
  // onRefresh,
  setShowOrderDetails,
  setPaymentID,
  setOrderID,
  setAmount,
  existingReferrals,
}: PricingCardProps) => {

  const APP_API_URI= import.meta.env.APP_API_URI
  const APP_JOBS_API_URI= import.meta.env.APP_JOBS_API_URI
  const APP_WORKO_BASE_URL= import.meta.env.APP_WORKO_BASE_URL
  const razorpayKey= import.meta.env.APP_RAZORPAY
  const isPopular = true

const handleBuyNow = async () => {
  if(existingReferrals > 0){
    toast.error(`Please use existing ${existingReferrals>1 ? "referrals" : "referral"} before buying new`,getToastOptions({}))
    return
  }
  const createOrderResponse = await startRazorpayPayment({
    name,
    price: amount,
    referrals: referralCount,
    validity: duration,
    userDetails,
    razorpayKey,
    productContextId: SK,
    createOrder: profileService.createOrder,
    APP_API_URI: APP_API_URI,
    onPaymentSuccess: async (paymentResponse) => {
      // console.log("✅ Payment success!", paymentResponse);
      if (paymentResponse && createOrderResponse) {
        // console.log(paymentResponse,createOrderResponse)
        const payload = {
          userId: userDetails?.userId,
          orderType: "SUBS",
          orderId: createOrderResponse.userOrderResponse.orderId,
          orderTxnId: createOrderResponse.userOrderResponse.orderTxnId,
          pgatewayProvider: "RAZORPAY",
          pgResponse: {
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          },
        };
        setPaymentID(paymentResponse.razorpay_payment_id)
        setOrderID(paymentResponse.razorpay_order_id)
        setAmount(amount)
        const response = await httpServiceObj.post(`/user/${userDetails?.userId}/order/gatewayres`, payload, true, {}, false, "BASE");
        // console.log("gatewayres",response)
        if(response.status === 200){
          const payload = {
            masterSubscriptionId: SK,
            orderId:createOrderResponse.userOrderResponse.orderId, 
          }
          const response = await httpServiceObj.post(`/user/${userDetails?.email}/subscription`,payload,true,{},false,"BASE")
          if(response.error || response.status === 400){
            toast.error(response?.error?.message,getToastOptions({}))
            return
          }else{
            setShowOrderDetails(true)
            // toast.success("Payment completed",getToastOptions({}))
            // console.log("subscription added",response)
          }

        }else{
          toast.error("Error while confirming the payment",getToastOptions({}))
          // console.log(response?.error?.message)
          return
        }
      }
    },
    onPaymentFailure: (reason) => {
      toast.error("Payment was not completed.", getToastOptions({}));
    },
  });
};

const FeatureItem = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-2">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#4ba1ff"
    stroke-width="1.25"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <circle cx="12" cy="12" r="10" fill="white" stroke="none" />
    <path d="M9 12l2 2 4-4" />
  </svg>
  <div className="text-[#e7f5ff] font-medium whitespace-pre-line">{label}</div>
  </div>
);

return (
  <div className={`relative w-full ${
    index === 0 || index === 2 ? 'p-0' : 
    index === 1 ? 'py-8' : 'p-0'
  } md:py-8`}>
    {/* Most Popular Banner */}
    {index === 1 && (
      <div className="w-[95%] max-w-[380px] h-28 bg-gradient-to-r from-[#4ba1ff] to-[#3777ff] transition-transform duration-300 absolute -top-8 right-0 left-0 flex justify-center items-center z-0 rounded-t-3xl pb-10 m-auto">
        <div className="text-white px-4 py-1.5 rounded-t-[20px] font-bold tracking-wider">
          <h1 className="text-xl">MOST POPULAR</h1>
        </div>
      </div>
    )}
    
    {/* Main Card */}
    <div className={`
      relative z-10 bg-[#4fbfff]
      w-[95%] mx-auto
      max-w-[380px]
      rounded-3xl overflow-hidden shadow-lg flex flex-col 
      transition-transform duration-300 pt-3
      ${index === 0 ? 'md:h-[500px] md:self-end' : ''}
      ${index === 1 ? 'md:h-[550px] md:self-end' : ''}
      ${index === 2 ? 'md:h-[600px] md:self-end' : ''}
      h-[500px]
    `}>
      
      {/* Content wrapper to handle alignment */}
      <div className="flex flex-col h-full justify-between">
        {/* Header Section */}
        <div className="px-6 pt-6 pb-4 text-left">
          <h2 className="text-3xl font-bold text-white mb-2">{name}</h2>
          <div className="flex items-end">
            <span className="text-4xl font-bold text-white">₹{amount}</span>
            <span className="text-lg text-white ml-1">/mo</span>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="px-6 text-left text-xl flex-1">
          <FeatureItem label={`No. of Referral: ${referralCount}`} />
          <FeatureItem label={`Per referral cost:\n₹${(Number(amount) / referralCount).toFixed(2)}`} />
          <FeatureItem label={`Validity: ${duration}`} />
          {features.map((feature, idx) => (
            <FeatureItem key={idx} label={feature} />
          ))}
        </div>

        {/* Button Section */}
        <div className="px-6 pb-6 mt-auto">
          <button
            className={`bg-[#316bff] w-full h-12 rounded-xl text-white font-bold text-base transition-all duration-200 ${
              isActive 
                ? "bg-pricing-button-active cursor-not-allowed opacity-80" 
                : "bg-pricing-button hover:bg-pricing-button-active"
            }`}
            disabled={isActive}
            onClick={isActive ? undefined : handleBuyNow}
          >
            {buttonText || (isActive ? "Already using" : "Buy now")}
          </button>
        </div>
      </div>
    </div>
  </div>
  );
};

export default PricingCard;