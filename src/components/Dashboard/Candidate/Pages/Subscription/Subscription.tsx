import { useEffect, useState } from "react";
import PricingCard from "./PricingCard";
import { SubscriptionSkeletonLoader } from "@Components/Loader/Skeleton/SkeletonLoader";
import { useDashboardContext } from "@Context/CandidateDashboard.context";

const plans = [
  {
    name: "Starter",
    price: 199,
    referrals: 3,
    referralCost: "265.33",
    validity: "90 days",
    features: ["AI Feedback Score", "Referee Feedback"],
    isPopular: false,
    gradientFrom: "#76c6ff",
    gradientTo: "#76c6ff",
    elevation: 0,
  },
  {
    name: "Accelerator",
    price: 499,
    referrals: 10,
    referralCost: "749.90",
    validity: "90 days",
    features: [
      "On Call Support",
      "Referee Feedback",
      "Chat With Referee",
      "Follow up: Additional Fee",
    ],
    isPopular: true,
    gradientFrom: "#4fb5ff",
    gradientTo: "#316bff",
    elevation: 55,
  },
  {
    name: "Maximizer",
    price: 999,
    referrals: 25,
    referralCost: "239.96",
    validity: "90 days",
    features: [
      "On Call Support",
      "Referee Feedback",
      "Chat With Referee",
      "Follow up: Additional Fee",
    ],
    isPopular: false,
    gradientFrom: "#76c6ff",
    gradientTo: "#76c6ff",
    elevation: 95,
  },
];

const Subscription = () => {
  const [activePlan, setActivePlan] = useState("");
  interface SubscriptionData {
    name: string;
    status: string;
    purchaseDate: string;
    expiryDate: string;
    creditedReferrals: number;
    availableReferrals: number;
  }

  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { getSubscriptionPlan } = useDashboardContext();

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setIsLoading(true);
      try {
        const data = await getSubscriptionPlan();
        if (data && data.length > 0) {
          setSubscriptionData(data[0]);
          setActivePlan(data[0].name);
        }
        setError(null);
      } catch (err) {
        console.error("Error fetching subscription data:", err);
        setError("Failed to load subscription data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [getSubscriptionPlan]);

  // Format date to DD-MM-YYYY
  const formatDate = (dateString:any) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}`;
  };

  if (isLoading) {
    return <SubscriptionSkeletonLoader />;
  }

  if (error) {
    return (
      <div className="w-full py-10">
        <div className="bg-red-50 border border-red-200 text-red-700 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full font-['Poppins'] text-[#000000]">
      {/* Current Plan */}
      {subscriptionData && (
        <div className="bg-white rounded-[19px] p-6 mb-8 shadow-sm">
          <div className="flex justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center">
                <div className="text-2xl font-semibold">
                  Package : <span className="text-[#316bff]">{subscriptionData.name}</span>
                </div>
                <div className="ml-4 bg-[#d6e2ff] text-[#316bff] px-4 py-1 rounded-full">
                  {subscriptionData.status}
                </div>
              </div>

              <div className="mt-4 font-semibold text-left">Package info:</div>
              <div className="mt-4 flex gap-16">
                {[
                  { label: "Start date", value: formatDate(subscriptionData.purchaseDate) },
                  { label: "End date", value: formatDate(subscriptionData.expiryDate) },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="font-medium">{item.label} :</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <span className="font-medium">Referral expires :</span>
                <span className="font-medium">{formatDate(subscriptionData.expiryDate)}</span>
              </div>
            </div>

            <div className="w-[250px] h-[120px] bg-gradient-to-br from-[#316bff] to-[#5fc9ff] rounded-[18px] p-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold">Total referrals</div>
                <div className="bg-[#f6f6f6] text-[#316bff] font-semibold w-12 h-[30px] flex items-center justify-center rounded-lg border border-[#c0b7b7]">
                  {subscriptionData.creditedReferrals}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="font-semibold">Referrals left</div>
                <div className="bg-[#57e1e1] text-[#0048ff] font-semibold w-[45px] h-[30px] flex items-center justify-center rounded-lg border border-[#c0b7b7]">
                  {subscriptionData.availableReferrals}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section title */}
      <div className="mt-16 mb-40 text-center">
        <h1 className="text-4xl font-bold text-[#0f0f0f]">Our Pricing Plans</h1>
        <p className="text-base font-light text-[#0f0f0f] mt-2">
          Pick an account plan that fits your workflow
        </p>
      </div>

      <div className="flex justify-center gap-8 relative">
        {/* Most popular tag */}
        <div className="absolute -top-[120px] left-1/2 transform -translate-x-1/2 w-[350px] h-[99px] bg-gradient-to-br from-[#316bff] to-[#5fc9ff] rounded-t-[35px] flex items-center justify-center">
          <span className="text-2xl font-bold text-white tracking-wider uppercase">
            Most popular
          </span>
        </div>

        {plans.map((plan) => (
          <PricingCard
            key={plan.name}
            {...plan}
            isActive={plan.name === activePlan}
            buttonText={plan.name === activePlan ? "Already using" : "Buy now"}
          />
        ))}
      </div>
    </div>
  );
};

export default Subscription;