import httpServiceObj from "@Services/ApiHandler.service";
import { Check } from "lucide-react";
import { useEffect, useReducer } from "react";
import profileService from "../../Service/ProfileService";
import { useAppContext } from "@Context/App.context";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import { startRazorpayPayment } from "@Utils/RazorpayUtils";

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
  onRefresh:(()=>void)
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
  onRefresh,
}: PricingCardProps) => {

  const APP_API_URI= import.meta.env.APP_API_URI
  const APP_JOBS_API_URI= import.meta.env.APP_JOBS_API_URI
  const APP_WORKO_BASE_URL= import.meta.env.APP_WORKO_BASE_URL
  const razorpayKey= import.meta.env.APP_RAZORPAY
  
const handleBuyNow = async () => {
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
        console.log(paymentResponse,createOrderResponse)
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
        const response = await httpServiceObj.post(`/user/${userDetails?.userId}/order/gatewayres`, payload, true, {}, false, "BASE");
        console.log("gatewayres",response)
        if(response.status === 200){
          const payload = {
            masterSubscriptionId: SK,
            orderId:createOrderResponse.userOrderResponse.orderId, 
          }
          const response = await httpServiceObj.post(`/user/${userDetails?.email}/subscription`,payload,true,{},false,"BASE")
          if(response.status === 400 && typeof(response.status) === 'number'){
            toast.error(response?.error?.message,getToastOptions({}))
            return
          }else{
            toast.success("Payment completed",getToastOptions({}))
            console.log("subscription added",response)
            onRefresh()
          }

        }else{
          toast.error("Error while confirming the payment",getToastOptions({}))
          console.log(response?.error?.message)
          return
        }
      }
    },
    onPaymentFailure: (reason) => {
      toast.error("Payment was not completed.", getToastOptions({}));
    },
  });
};


return (
    <div
      // className={`
      //   w-[350px] rounded-[35px] overflow-hidden shadow-lg flex flex-col
      //   bg-gradient-to-br from-blue-400 to-blue-400
      //   transition-transform duration-300 bc
      //   ${elevationClass}
      // `}
    >
      <div className="p-8 text-left bc">
        <h2 className="text-2xl font-bold text-white tracking-wider">{name}</h2>
        <div className="flex items-end mt-2">
          <span className="text-5xl font-bold text-white">₹{amount}</span>
          <span className="text-2xl text-white ml-1">/mo</span>
        </div>
      </div>
      
      <div className="px-8 text-left flex-1 bc">
        <FeatureItem label={`No. of Referral: ${referralCount}`} />
        <FeatureItem label={`Per referral cost: ₹${(Number(amount) / referralCount).toFixed(2)}`} />
        <FeatureItem label={`Validity: ${duration}`} />
        {features.map((feature, idx) => (
          <FeatureItem key={idx} label={feature} />
        ))}
      </div>

      <div className="px-8 pb-8 mt-4 bc">
        <button
          className={`w-full h-[55px] rounded-xl text-white font-bold text-xl ${
            isActive ? "bg-[#56b8ff]" : "bg-[#316bff]"
          }`}
          disabled={isActive}
          onClick={isActive ? undefined : handleBuyNow}
        >
          {buttonText || (isActive ? "Already using" : "Buy now")}
        </button>
      </div>
    </div>
  );
};

const FeatureItem = ({ label }: { label: string }) => (
  <div className="flex items-center gap-3 mb-2">
    <Check strokeWidth={1.25} className="text-white" />
    <div className="text-[#e7f5ff] font-medium">{label}</div>
  </div>
);

export default PricingCard;