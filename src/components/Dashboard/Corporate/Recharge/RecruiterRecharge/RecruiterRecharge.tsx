import { useAppContext } from "@Context/App.context";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "lib-worko-ui";
import { toast } from "react-toastify";
import React, { useEffect, useState } from "react";
import { Info, Square, TrendingUp, Plus, Minus } from "lucide-react";
import { startRazorpayPayment, startRazorpaySubscription } from "@Utils/RazorpayUtilsForRecharge";
import OrderDetailsModal from "../Credits/modals/OrderDetailsModal";

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
    setTransactionHistoryRecruiter(recruiter)
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
    setTransactionHistoryEvaluator(evaluator)
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
            <div className="flex-1 min-h-[30em] w-full rounded-xl shadow-xl border bg-white p-6">
            <h1 className="text-2xl font-semibold mb-4">
                {activeTab === "recruiter" ? "Recruiter Recharge" : "Evaluator Recharge"}
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

                {[3, 6, 12].map((m) => (
                    <div
                    key={m}
                    onClick={() => setSelectedMonths(m)}
                    className={`cursor-pointer border rounded-lg px-3 py-2 text-xs font-semibold ${
                        selectedMonths === m
                        ? "bg-blue-100 text-blue-600 border-blue-700"
                        : "border-gray-400"
                    }`}
                    >
                    {m} Months
                    </div>
                ))}
                </div>
            </div>

            {/* Pricing Summary */}
            <div className="mt-6 flex gap-4 text-xs">
                <div className="flex-1">
                <label className="text-sm flex items-center gap-1">Total Users</label>
                <input
                    disabled
                    className="w-full bg-gray-200 rounded h-10 px-3"
                    value={`${recruiterCount} user(s)`}
                />
                </div>

                <div className="flex-1">
                <label className="text-sm flex items-center gap-1">Total Amount</label>

                <input
                    disabled
                    className="w-full bg-gray-200 rounded h-10 px-3"
                    value={
                    activeTab === "recruiter"
                        ? `₹${recruiterCount * selectedMonths * 1500}`
                        : `₹${recruiterCount * selectedMonths * 100}`
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
            </div>

            {/* Purchase Button */}
            <div className="mt-6">
                <button
                className="bg-gradient-to-t from-blue-500 to-cyan-300 px-6 py-2 rounded-xl shadow-xl text-white font-semibold text-sm"
                onClick={handleBuyNow}
                >
                Proceed to Pay
                </button>
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
                    <span className="text-xs opacity-80">Total Purchased</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterPurchased ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorPurchased ?? 0}
                    </span>
                </div>

                {/* Pending */}
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">Pending</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterPending ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorPending ?? 0}
                    </span>
                </div>

                {/* Used */}
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">Used</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterUsed ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorUsed ?? 0}
                    </span>
                </div>

                {/* Total Spent */}
                <div className="flex flex-col items-center">
                    <span className="text-xs opacity-80">Total Spent</span>
                    <span className="bg-white text-blue-600 font-semibold rounded-lg px-4 py-1 text-sm">
                    {activeTab === "recruiter"
                        ? balanceCVCountListAndWalletDetails?.recruiterSpent ?? 0
                        : balanceCVCountListAndWalletDetails?.evaluatorSpent ?? 0}
                    </span>
                </div>
                </div>
            </div>

            {/* HISTORY PANEL */}
            <div className="flex-1 rounded-xl shadow-xl bg-white flex flex-col">
                <div className="p-4">
                <div className="font-semibold text-sm flex items-center gap-2">
                    <span className="bg-cyan-300 text-cyan-300 h-2 w-2 rounded-full"></span>
                    {activeTab === "recruiter"
                    ? "Recruiter Recharge History"
                    : "Evaluator Recharge History"}
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
    </div>
  );
};

export default RecruiterRecharge;
