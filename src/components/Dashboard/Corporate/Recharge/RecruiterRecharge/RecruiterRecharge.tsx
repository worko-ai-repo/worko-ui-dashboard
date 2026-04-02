import { useAppContext } from "@Context/App.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import React, { useEffect, useState } from "react";
import { Info, Square, TrendingUp, Plus, Minus, RefreshCw, XCircle } from "lucide-react";
import { startRazorpayPayment, startRazorpaySubscription } from "@Utils/RazorpayUtilsForRecharge";
import OrderDetailsModal from "../Credits/modals/OrderDetailsModal";
import Modal from "@Components/Shared/Modal";
import RenewSubscriptionModel from "./modal/RenewSubscriptionModal";
import RenewSubscriptionModal from "./modal/RenewSubscriptionModal";

interface SubscriptionPricing {
  createdAt: string;
  durationMonths: number;
  entityType: string;
  id: string;
  planType : string;
  pricePerEntityPerMonth: number;
  updatedAt: string;
}
interface TransactionHistoryItem {
  corporateCvRechargeOrderId:string;
  corporateUserId:string;
  id: string;
  createdAt: string;
  months: number;
  users: number;
  amount: number;
  corporateRegisteredEmail:string;
  updatedAt:String;
}

interface RecruiterWalletStats {
  totalAmountPaid?: number;
  totalAvailableCvCount?: number;
  totalUsedCvCount?: number;
  recruiterPurchased?: number;
  evaluatorPurchased?: number;
  recruiterPending?: number;
  evaluatorPending?: number;
  recruiterUsed?: number;
  evaluatorUsed?: number;
  recruiterSpent?: number;
  evaluatorSpent?: number;
}

const RecruiterRecharge = () => {
  const { userDetails } = useAppContext();

  const [recruiterCount, setRecruiterCount] = useState<number>(1);
  const [selectedMonths, setSelectedMonths] = useState<number>(3);

  const [transactionHistoryRecruiter, setTransactionHistoryRecruiter] = useState<TransactionHistoryItem[]>([]);
  const [transactionHistoryEvaluator, setTransactionHistoryEvaluator] = useState<TransactionHistoryItem[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<TransactionHistoryItem[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState<boolean>(false);
  const [evaluatorQuarterlyPricePerMonth, setEvaluatorQuarterlyPricePerMonth] = useState<number>(0);
  const [evaluatorAnnuallyPricePerMonth, setEvaluatorAnnuallyPricePerMonth] = useState<number>(0);
  const [recruiterQuarterlyPricePerMonth, setRecruiterQuarterlyPricePerMonth] = useState<number>(0);
  const [recruiterAnnuallyPricePerMonth, setRecruiterAnnuallyPricePerMonth] = useState<number>(0);
  const [isGettingSubscriptionList, setIsGettingSubscriptionList] = useState<boolean>(false);

  const [balanceCVCountListAndWalletDetails, setBalanceCVCountListAndWalletDetails] =
    useState<RecruiterWalletStats>({});

  const PRICE_PER_USER_PER_MONTH = 1500;
  const totalAmount = recruiterCount * selectedMonths * PRICE_PER_USER_PER_MONTH;

  const [activeTab, setActiveTab] = useState<"recruiter" | "evaluator">("recruiter");

  const [paymentID, setPaymentID] = useState("");
  const [orderID, setOrderID] = useState("");
  const [amount, setAmount] = useState(0);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isSeeFullHistory,setIsSeeFullHistory] = useState<boolean>(false);
  const razorpayKey = import.meta.env.APP_RAZORPAY;
  const [isRenewOpen, setIsRenewOpen] = useState(false);

//fake states
  const [licenseValidTill, setLicenseValidTill] = useState<string>("");
  const [subscription, setSubscription] = useState<{
    startDate: string;
    endDate: string;
    planType: number; // 3 or 12
    users: number;
    pricePerMonth: number;
  } | null>(null);
// untill here
  const getPriceList = async () =>{
    setIsGettingSubscriptionList(true)
    try {
        const {response,error} = await httpServiceObj.get<{data:SubscriptionPricing[]}>(`/corporate-subs-pricing-config`,true,{},false,"BASE")
        if(error){
            toast.error(error.message,getToastOptions({}))
            return
        }
        if(response?.data){
          response.data.map(subscriptionDetails =>{
            if(subscriptionDetails?.entityType === "EVALUATOR" && subscriptionDetails?.planType === "QUARTERLY"){
                setEvaluatorQuarterlyPricePerMonth(subscriptionDetails?.pricePerEntityPerMonth)
            }else if(subscriptionDetails?.entityType === "EVALUATOR" && subscriptionDetails?.planType === "ANNUALLY"){
                setEvaluatorAnnuallyPricePerMonth(subscriptionDetails?.pricePerEntityPerMonth)
            }else if(subscriptionDetails?.entityType === "RECRUITER" && subscriptionDetails?.planType === "QUARTERLY"){
                setRecruiterQuarterlyPricePerMonth(subscriptionDetails?.pricePerEntityPerMonth)
            }else if(subscriptionDetails?.entityType === "RECRUITER" && subscriptionDetails?.planType === "ANNUALLY"){
                setRecruiterAnnuallyPricePerMonth(subscriptionDetails?.pricePerEntityPerMonth)
            }
          })
          setIsGettingSubscriptionList(false)
        }
    } catch (error) {
        console.error(error)
    }
  }

  useEffect(()=>{
    getPriceList()
  },[])

  const getRecruiterTransactionHistory = async () => {
    setIsHistoryLoading(true);
    try {
    const recruiter = [
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 3000,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG9",
            corporateRegisteredEmail: "erikwhite85+1@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 3000,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG9",
            corporateRegisteredEmail: "erikwhite85+1@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 3000,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG9",
            corporateRegisteredEmail: "erikwhite85+1@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 3000,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG9",
            corporateRegisteredEmail: "erikwhite85+1@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 3000,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG9",
            corporateRegisteredEmail: "erikwhite85+1@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
    ];
    // setTransactionHistoryRecruiter(recruiter)
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const getEvaluatorTransactionHistory = async () => {
    setIsHistoryLoading(true);
    try {
    const evaluator = [
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 200,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG900",
            corporateRegisteredEmail: "erikwhite85@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 200,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG900",
            corporateRegisteredEmail: "erikwhite85@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 200,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG900",
            corporateRegisteredEmail: "erikwhite85@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 200,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG900",
            corporateRegisteredEmail: "erikwhite85@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
        {
            corporateCvRechargeOrderId: "01KJ761DNCM7QJ1BJCN98WSWK6",
            amount: 200,
            users: 2,
            corporateUserId: "21YCYSMG5HE2PMZ0459J0VPCG900",
            corporateRegisteredEmail: "erikwhite85@gmail.com",
            id: "01KJ762XN1WS7S5GRHNWM68PDS",
            createdAt: "2026-02-24T06:41:17.985+00:00",
            updatedAt: "2026-02-24T06:41:17.985+00:00",
            months:1
        },
    ]
    // setTransactionHistoryEvaluator(evaluator)
    } finally {
      setIsHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "recruiter") {
        setTransactionHistory(transactionHistoryRecruiter);
    } else {
        setTransactionHistory(transactionHistoryEvaluator);
    }
  }, [activeTab, transactionHistoryRecruiter, transactionHistoryEvaluator]);

  useEffect(() => {
    if (userDetails?.companyId) {
      getRecruiterTransactionHistory();
      getEvaluatorTransactionHistory();
    }
  }, [userDetails?.companyId]);

  const createOrder = async () => {
    if (!userDetails?.id) {
      toast.error("No user id found", getToastOptions({}));
      return null;
    }

    const payload = {
      userId: userDetails.id,
      users: recruiterCount,
      months: selectedMonths,
      amount: totalAmount,
      rechargeType: activeTab === "recruiter" ? "RECRUITER" : "EVALUATOR",
      paymentGatewayProvider: "RAZORPAY",
    };

    try {
    //   const { response } = await httpServiceObj.post( `/agency-recruiter-recharge-order/create`, payload, true, {}, false, "BASE");
    //   return response;
      return {
        id: "sub_TEST_LOCAL_12345", 
        status: "created",
        short_url: "https://rzp.io/i/mock123",
      };
    } catch (error) {
      console.error("Error creating order:", error);
      return null;
    }
  };

  const handleBuyNow = async () => {
  if (!userDetails) {
    toast.error("No user details found", getToastOptions({}));
    return;
  }

  const createOrderResponse = await createOrder();
  if (!createOrderResponse || !createOrderResponse.id) {
    toast.error("Subscription creation failed", getToastOptions({}));
    return;
  }

  await startRazorpaySubscription({
    subscriptionId: createOrderResponse.id,
    razorpayKey,
    userDetails: userDetails ?? undefined,

    onPaymentSuccess: async (paymentResponse) => {
      if (!paymentResponse || !createOrderResponse) return;

      const payload = {
        paymentGatewayProvider: "RAZORPAY",
        paymentGatewayVerificationDetails: {
          razorpay_payment_id: paymentResponse.razorpay_payment_id,
          razorpay_subscription_id: paymentResponse.razorpay_subscription_id,
          razorpay_signature: paymentResponse.razorpay_signature,
        },
      };

      setPaymentID(paymentResponse.razorpay_payment_id);
      setOrderID(paymentResponse.razorpay_subscription_id);
      setAmount(totalAmount);

      // const { response, error } = await httpServiceObj.post( `/agency-recruiter-recharge-order/verify-payment`, payload, true, {}, false, "BASE");

      // if (error) {
      //   toast.error(error.message, getToastOptions({}));
      //   return;
      // }

      setShowOrderDetails(true);
    },

    onPaymentFailure: () => {
      toast.error("Payment failed.", getToastOptions({}));
    },
  });
  };

  const fullTransactions = activeTab === "recruiter" ? transactionHistoryRecruiter : transactionHistoryEvaluator;
  const splittedTransactions = fullTransactions.slice(0,3)
  const transactions = isSeeFullHistory ? fullTransactions : splittedTransactions

    // fake payment
    const handleFakePayment = () => {
    if (!userDetails) {
        toast.error("No user details found", getToastOptions({}));
        return;
    }

    const now = new Date();

    let finalEndDate: Date;
    let paidAmount = 0;

    const isQuarterly = selectedMonths === 3;
    const newTotalDays = isQuarterly ? 90 : 365;

    const newPricePerMonth =
        activeTab === "recruiter"
        ? isQuarterly
            ? recruiterQuarterlyPricePerMonth
            : recruiterAnnuallyPricePerMonth
        : isQuarterly
        ? evaluatorQuarterlyPricePerMonth
        : evaluatorAnnuallyPricePerMonth;

    // 🟢 CASE 1: NO EXISTING SUBSCRIPTION
    if (!subscription) {
        finalEndDate = new Date(now);
        finalEndDate.setDate(now.getDate() + newTotalDays);

        paidAmount = recruiterCount * selectedMonths * newPricePerMonth;

        setSubscription({
        startDate: now.toISOString(),
        endDate: finalEndDate.toISOString(),
        planType: selectedMonths,
        users: recruiterCount,
        pricePerMonth: newPricePerMonth,
        });

        setLicenseValidTill(finalEndDate.toLocaleDateString());

        addTransaction(paidAmount);
        updateWallet(recruiterCount);

        toast.success(
        `Added ${recruiterCount} ${
            activeTab === "recruiter" ? "recruiter(s)" : "evaluator(s)"
        } | Paid ₹${paidAmount} | Valid till ${finalEndDate.toLocaleDateString()}`,
        getToastOptions({})
        );

        return;
    }

    // 🔵 CASE 2: EXISTING SUBSCRIPTION

    const startDate = new Date(subscription.startDate);

    const start = new Date(startDate);
    const today = new Date();

    start.setHours(0,0,0,0);
    today.setHours(0,0,0,0);

    const elapsedDays = Math.floor(
    (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    const oldTotalDays = subscription.planType === 3 ? 90 : 365;

    // ⛔ expired → treat as fresh
    if (elapsedDays >= oldTotalDays) {
        setSubscription(null);
        handleFakePayment();
        return;
    }

    const remainingOldDays = oldTotalDays - elapsedDays;
    let remainingNewDays = 0;

    if (subscription.planType === selectedMonths) {
    // same plan → don't reset duration
    remainingNewDays = remainingOldDays;
    } else {
    // plan change → recalc from start
    remainingNewDays = newTotalDays - elapsedDays;
    }

    const oldTotalPaid =
        subscription.users *
        subscription.planType *
        subscription.pricePerMonth;

    const oldPerDayValue = oldTotalPaid / oldTotalDays;

    const prepaidAmount = oldPerDayValue * remainingOldDays;

    const perDayNewPrice = newPricePerMonth / 30;

    const totalUsers = subscription.users + recruiterCount;
    const newUsers = recruiterCount;

    let payableBeforeAdjust = 0;

    if (subscription.planType === selectedMonths) {
    // ✅ SAME PLAN → charge only new users
    payableBeforeAdjust =
        remainingNewDays * perDayNewPrice * recruiterCount;
    } else {

    payableBeforeAdjust =
        remainingNewDays * perDayNewPrice * totalUsers;
    }

    let finalAmount = payableBeforeAdjust;

    if (subscription.planType !== selectedMonths) {
    // only apply prepaid in plan upgrade
    finalAmount = payableBeforeAdjust - prepaidAmount;
    }

    finalAmount = Math.max(0, Math.round(finalAmount));

    paidAmount = finalAmount;

    // 📅 expiry logic
    finalEndDate = new Date(subscription.endDate);

    if (subscription.planType !== selectedMonths) {
        finalEndDate = new Date(startDate);
        finalEndDate.setDate(startDate.getDate() + newTotalDays);
    }

    // update subscription
    setSubscription({
        startDate: subscription.startDate,
        endDate: finalEndDate.toISOString(),
        planType: selectedMonths,
        users: totalUsers,
        pricePerMonth: newPricePerMonth,
    });

    setLicenseValidTill(finalEndDate.toLocaleDateString());

    addTransaction(paidAmount);
    updateWallet(recruiterCount);

    toast.success(
        `Added ${recruiterCount} ${
        activeTab === "recruiter" ? "recruiter(s)" : "evaluator(s)"
        } | Paid ₹${paidAmount} | Valid till ${finalEndDate.toLocaleDateString()}`,
        getToastOptions({})
    );
    };

    const addTransaction = (amount: number) => {
    const now = new Date();

    const newTransaction: TransactionHistoryItem = {
        corporateCvRechargeOrderId: `ORDER_${Date.now()}`,
        corporateUserId: userDetails?.id || "",
        corporateRegisteredEmail: userDetails?.email || "",
        id: `TX_${Date.now()}`,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        months: selectedMonths,
        users: recruiterCount,
        amount,
    };

    if (activeTab === "recruiter") {
        setTransactionHistoryRecruiter((prev) => [
        newTransaction,
        ...prev,
        ]);
    } else {
        setTransactionHistoryEvaluator((prev) => [
        newTransaction,
        ...prev,
        ]);
    }
    };

    const updateWallet = (addedUsers: number) => {
    setBalanceCVCountListAndWalletDetails((prev) => {
        const updated = { ...prev };

        if (activeTab === "recruiter") {
        updated.recruiterPurchased =
            (prev.recruiterPurchased || 0) + addedUsers;

        updated.recruiterPending =
            (prev.recruiterPending || 0) + addedUsers;
        } else {
        updated.evaluatorPurchased =
            (prev.evaluatorPurchased || 0) + addedUsers;

        updated.evaluatorPending =
            (prev.evaluatorPending || 0) + addedUsers;
        }

        return updated;
    });
    };
    // untill here
  return (
    <div className="w-full gap-5">
        {/* TABS AT TOP */}
        <div className="flex justify-center">
            <div className="inline-flex bg-white rounded-2xl p-1 shadow-md border">
            <button
                onClick={() => {
                    setActiveTab("recruiter")
                }}
                className={`px-4 py-1 rounded-xl text-sm font-semibold transition-all duration-300
                ${
                    activeTab === "recruiter"
                    ? "bg-blue-500 text-white shadow"
                    : "text-gray-400 hover:text-blue-500"
                }`}
            >
                Recruiter
            </button>

            <button
                onClick={() => {
                    setActiveTab("evaluator")
                }}
                className={`px-4 py-1 rounded-xl text-sm font-semibold transition-all duration-300
                ${
                    activeTab === "evaluator"
                    ? "bg-blue-500 text-white shadow"
                    : "text-gray-400 hover:text-blue-500"
                }`}
            >
                Evaluator
            </button>
            </div>
        </div> 
        
        <div className="flex flex-col lg:flex-row justify-center items-start gap-5 m-5">
            {/* LEFT PANEL */}
            <div className="flex-1 min-h-[30em] w-full flex flex-col gap-3">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-3.5 px-4">
                <h2 className="text-xl font-semibold mb-2">Manage Subscription</h2>
                <div className="flex gap-3 items-center justify-center">
                <button
                onClick={() => setIsRenewOpen(true)}
                className="flex items-center gap-2 p-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md hover:shadow-lg text-xs"
                >
                {/* <RefreshCw className="w-5 h-5" /> */}
                Renew Subscription
                </button>
                {/* <button className="flex items-center gap-2 p-2 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-lg hover:from-violet-600 hover:to-purple-600 transition-all shadow-md hover:shadow-lg text-xs">
                    <TrendingUp className="w-5 h-5" />
                    Upgrade Subscription
                </button> */}
                <button className="flex items-center gap-2 p-2 bg-white text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all text-xs">
                    {/* <XCircle className="w-5 h-5" /> */}
                    Cancel Subscription
                </button>
                </div>
                <div className="text-start">
                  <span className="text-xs opacity-80">
                    {licenseValidTill ?  `License Valid till ${licenseValidTill}` : ""}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-h-[20em] w-full rounded-xl shadow-xl border bg-white p-6">
                <h1 className="text-2xl font-semibold mb-4">
                    {activeTab === "recruiter" ? "Recruiter Subscription" : "Evaluator Subscription"}
                </h1>

            {/* Count Selector */}
            <div className="flex items-center gap-4 w-full max-w-full">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                {activeTab === "recruiter" ? "Number of Recruiters" : "Number of Evaluators"}

                <Info
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content={
                    activeTab === "recruiter"
                        ? "Choose the number of recruiters you want."
                        : "Choose the number of evaluators you want."
                    }
                    className="h-3 w-auto text-gray-400"
                />
                </p>

                <button
                className="bg-gray-200 p-2 rounded hover:bg-gray-300"
                onClick={() => setRecruiterCount((prev) => Math.max(1, prev - 1))}
                >
                <Minus className="h-4 w-4" />
                </button>

                <input
                type="number"
                className="max-w-16 bg-gray-200 h-8 rounded text-center text-xs"
                min={1}
                value={recruiterCount}
                onChange={(e) => setRecruiterCount(Math.max(1, Number(e.target.value)))}
                />

                <button
                className="bg-gray-200 p-2 rounded hover:bg-gray-300"
                onClick={() => setRecruiterCount((prev) => prev + 1)}
                >
                <Plus className="h-4 w-4" />
                </button>
            </div>

            {/* Duration Selector */}
            <div className="mt-6">
                <div className="flex items-center gap-4 w-full max-w-full">
                <p className="text-sm font-semibold mb-2 flex items-center gap-1">
                    Select Duration
                    <Info
                    data-tooltip-id="my-tooltip"
                    data-tooltip-content="Select the duration for your subscription."
                    className="h-3 w-auto text-gray-400"
                    />
                </p>

                {[3, 12].map((m) => {
                    const isBlocked =
                        subscription?.planType === 12 && m === 3;

                    return (
                        <div
                        key={m}
                        onClick={() => {
                            if (isBlocked) {
                            toast.error("Cannot downgrade from annual to quarterly", getToastOptions({}));
                            return;
                            }
                            setSelectedMonths(m);
                        }}
                        className={`cursor-pointer border rounded-lg px-3 py-2 text-xs font-semibold
                            ${selectedMonths === m ? "bg-blue-100 text-blue-600 border-blue-700" : "border-gray-400"}
                            ${isBlocked ? "opacity-40 cursor-not-allowed" : ""}
                        `}
                        >
                        {m} Months
                        </div>
                    );
                    })}
                </div>
            </div>

            {/* Pricing Summary */}
            <div className="mt-6 flex gap-4 text-xs">
                {/* <div className="flex-1">
                <label className="text-sm flex items-center gap-1">Total Users</label>
                <input
                    disabled
                    className="w-full bg-gray-200 rounded h-10 px-3"
                    value={`${recruiterCount} user(s)`}
                />
                </div> */}

                <div className="flex-1">
                <label className="text-sm flex items-center gap-1">Total Amount</label>

                <input
                    disabled
                    className="w-full bg-gray-200 rounded h-10 px-3"
                    value={
                    selectedMonths === 3
                        ? `₹${recruiterCount * selectedMonths * (activeTab === "recruiter" ? recruiterQuarterlyPricePerMonth : evaluatorQuarterlyPricePerMonth)}`
                        : `₹${recruiterCount * selectedMonths * (activeTab === "recruiter" ? recruiterAnnuallyPricePerMonth : evaluatorAnnuallyPricePerMonth)}`
                    }
                />
                </div>

                <div className="flex-1">
                <label className="text-sm flex items-center gap-1">Total Duration</label>
                <input
                    disabled
                    className="w-full bg-gray-200 rounded h-10 px-3"
                    value={`${selectedMonths} Months`}
                />
                </div>

                <div className="flex-1">
                <label className="text-sm flex items-center gap-1">Price per License</label>
                <input
                    disabled
                    className="w-full bg-gray-200 rounded h-10 px-3"
                    value={
                    selectedMonths === 3
                        ? `₹${recruiterCount * (activeTab === "recruiter" ? recruiterQuarterlyPricePerMonth : evaluatorQuarterlyPricePerMonth)}`
                        : `₹${recruiterCount * (activeTab === "recruiter" ? recruiterAnnuallyPricePerMonth : evaluatorAnnuallyPricePerMonth)}`
                    }
                />
                </div>
            </div>

            {/* Purchase Button */}
            <div className="mt-6">
                <button
                disabled={isGettingSubscriptionList}
                className="bg-gradient-to-t from-blue-500 to-cyan-300 px-6 py-2 rounded-xl shadow-xl text-white font-semibold text-sm"
                // onClick={handleBuyNow}
                onClick={handleFakePayment}
                >
                Proceed to Pay
                </button>
            </div>
            <div className="mt-2 text-xs text-gray-500 text-center">
            To add additional {activeTab === "recruiter" ? "recruiters" : "evaluators"}, increase the count above and proceed with the payment.
            </div>
              </div>
            </div>


            {/* RIGHT PANEL — STATS + HISTORY */}
            <div className="flex-1 min-h-[30em] w-full flex flex-col gap-3">
            {/* BALANCE HEADER */}
            <div
                className="rounded-xl w-full p-[3px]"
                style={{ background: "linear-gradient(to bottom, blue, cyan)" }}
            >
                <div className="rounded-lg p-3 bg-blue-800 flex justify-around items-center text-white gap-4">
                {/* Total Purchased */}
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">License Purchased</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterPurchased ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorPurchased ?? 0}
                    </span>
                </div>

                {/* Used */}
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">License Used</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterUsed ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorUsed ?? 0}
                    </span>
                </div>

                {/* Pending */}
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">License Pending</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterPending ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorPending ?? 0}
                    </span>
                </div>

                {/* Total Spent */}
                {/* <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">Total Spent</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterSpent ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorSpent ?? 0}
                    </span>
                </div> */}
                </div>
            </div>

            {/* HISTORY PANEL */}
            <div className="flex-1 rounded-xl shadow-xl bg-white flex flex-col">
                <div className="p-4">
                <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="bg-cyan-300 text-cyan-300 h-2 w-2 rounded-full"></span>
                    {activeTab === "recruiter"
                    ? "Recruiter Subscription History"
                    : "Evaluator Subscription History"}
                </div>
                </div>

                <div className="overflow-y-auto max-h-[18em] px-4">
                {isHistoryLoading ? (
                    <p className="text-center text-gray-400 py-6">Loading history...</p>
                ) : transactions.length === 0 ? (
                    <p className="text-center text-gray-400 py-6">No history found</p>
                ) : (
                    transactions
                    .map((tx) => (
                        <div
                        key={tx.id}
                        className="border rounded-md p-2 flex justify-between items-center text-sm shadow mb-2"
                        >
                        <div className="flex gap-2 items-center">
                            <div className="border rounded-full bg-blue-100">
                            <Square className="w-5 h-auto m-2 text-blue-300" />
                            </div>
                            <div>
                            <p className="font-medium">{tx.users} users</p>
                            <p className="text-xs text-gray-500">For {tx.months} months</p>
                            <p className="text-xs text-gray-500">
                                {new Date(tx.createdAt).toLocaleString()}
                            </p>
                            </div>
                        </div>

                        <div className="font-semibold">₹{tx.amount}</div>

                        <div className="border rounded-full bg-blue-100">
                            <TrendingUp className="w-3 h-auto m-1 text-blue-300" />
                        </div>
                        </div>
                    ))
                )}
                </div>

                <div className="p-4 text-center">
                <span 
                    className='text-sky-400 underline capitalize text-sm cursor-pointer'
                    onClick={()=>setIsSeeFullHistory(prev=>!prev)}>
                    {isSeeFullHistory ? "hide full history" :"see full history"}
                </span>
                </div>
            </div>
            </div>
        </div>
        <OrderDetailsModal
            show={showOrderDetails}
            paymentID={paymentID}
            orderID={orderID}
            amount={amount}
            onRefresh={() => {
                getRecruiterTransactionHistory()
                getEvaluatorTransactionHistory()
            }}
            onClose={() => {
            setShowOrderDetails(false);
            setPaymentID("");
            setOrderID("");
            setAmount(0);
            }}
        />
        <Modal
        isOpen={isRenewOpen}
        onClose={() => setIsRenewOpen(false)}
        className="max-w-md sm:w-[420px]"
        classNameHeight="h-[100vh]"
        >
        <RenewSubscriptionModal
            activeTab={activeTab}
            subscription={subscription}
            recruiterQuarterlyPricePerMonth={recruiterQuarterlyPricePerMonth}
            recruiterAnnuallyPricePerMonth={recruiterAnnuallyPricePerMonth}
            evaluatorQuarterlyPricePerMonth={evaluatorQuarterlyPricePerMonth}
            evaluatorAnnuallyPricePerMonth={evaluatorAnnuallyPricePerMonth}

            // 👇 VERY IMPORTANT (parent update)
            onSuccess={(data) => {
            handleFakePayment(); // or actual API refresh
            setIsRenewOpen(false);
            }}
        />
        </Modal>
    </div>
  );
};

export default RecruiterRecharge;
