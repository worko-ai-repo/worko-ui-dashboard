import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UserDetails {
  name?: string;
  email?: string;
  number?: string;
  userId?: string;
}

interface ProductPayload {
  name: string;
  price: number;
  referrals: number;
  validity: number;
  userDetails?: UserDetails;
  razorpayKey: string;
  productContextId:string;
  createOrder: (userId: string, payload: any) => Promise<any>;
  APP_API_URI: string;
  onPaymentSuccess: (response: any) => void;
  onPaymentFailure: (response: any) => void;
}

export async function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export async function startRazorpayPayment({
  name,
  price,
  referrals,
  validity,
  userDetails,
  razorpayKey,
  productContextId,
  createOrder,
  APP_API_URI,
  onPaymentSuccess,
  onPaymentFailure,
}: ProductPayload) {
  const loaded = await loadRazorpayScript();
  if (!loaded) {
    toast.error("Razorpay SDK failed to load. Please check internet connection", getToastOptions({}));
    return;
  }

  const payload = {
    pgatewayProvider: "RAZORPAY",
    subTotalAmount: price,
    discountAmount: 0,
    gstAmount: 0,
    orderType: "SUBS",
    returnUrl: `${APP_API_URI}/v1/candidate/pgresponse/RAZORPAY`,
    products: [
      {
        productContext: "SUBS",
        productContextId: productContextId,
        productContextDetails: {
          details: `The ${name} subscription plan, priced at ₹${price}, receive a referral count of ${referrals} for a duration of ${validity}`,
        },
        unitPrice: price,
        quantity: 1,
        totalAmount: price,
      },
    ],
  };

  try {
    const response = await createOrder(userDetails?.userId ?? "", payload);
    // console.log("order created",response)
    const orderId = response.userOrderResponse.pgatewayOrderId;

    const options = {
      key: razorpayKey,
      amount: price * 100, //in paisa
      currency: "INR",
      name: "Worko Ai",
      description: `The ${name} subscription plan, priced at ₹${price}`,
      order_id: orderId,
      prefill: {
        name: userDetails?.name,
        email: userDetails?.email,
        contact: userDetails?.number,
      },
      theme: {
        color: "#3399cc",
      },
      handler: function (response: any) {
        // console.log("Payment success", response);
        onPaymentSuccess(response);
      },
      modal: {
        ondismiss: function () {
        //   console.log("Payment popup closed");
          onPaymentFailure?.("User cancelled the payment");
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
    return response;
  } catch (error) {
    console.error("Order creation or Razorpay init failed", error);
    toast.error("Something went wrong while processing the payment. Please try again.", getToastOptions({}));
    onPaymentFailure(error);
  }
}
