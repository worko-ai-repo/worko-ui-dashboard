import { useEffect, useState } from "react";
import PricingCard from "./PricingCard";
import { SubscriptionSkeletonLoader } from "@Components/Loader/Skeleton/SkeletonLoader";
import profileService from "../../Service/ProfileService";
import { useDashboardContext } from "@Context/Dashboard.context";
import { useAppContext } from "@Context/App.context";
import OrderDetailsModal from "./modals/OrderDetailsModal";

  interface SubscriptionData {
    name: string;
    status: string;
    purchaseDate: string;
    expiryDate: string;
    creditedReferrals: number;
    availableReferrals: number;
    requestedReferrals:number;
  }
  interface UserDetails {
  name: string;
  number: string;
  userId: string;
  email: string;
  }

  interface PlansList {
    SK: string;
    amount: number;
    details: string;
    duration: number;
    isActive:boolean;
    name:string;
    referralCount:number
  }

  interface SubscriptionStatus{
    isSubscribed: boolean;
    referralCount: number;
  }
const features = [
  {features: ["AI Feedback Score", "Referee Feedback"]},
  {features: ["On Call Support", "Referee Feedback", "Chat With Referee", "Follow up: Additional Fee"]},
  {features: [ "On Call Support", "Referee Feedback", "Chat With Referee", "Follow up: Additional Fee",]}
]

const Subscription = () => {
  const [activePlan, setActivePlan] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | undefined>(undefined);
  const [PlansList, setPlansList] = useState<PlansList[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const {user} = useDashboardContext();
  // const { setUserDetails } = useAppContext();
  const [showOrderDetails, setShowOrderDetails] = useState<boolean>(false);
  const [paymentID, setPaymentID] = useState<string>("");
  const [orderID, setOrderID] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);

  const fetchSubscriptionData = async () => {
    if(!user?.email) return;
    setIsLoading(true);
    try {
      const data = await profileService.getSubscriptionPlan(user.email);
      if (data && data.length > 0) {
        setSubscriptionData(data[data.length-1]);
        setActivePlan(data[data.length-1].name);
      }

      const details = await profileService.fetchUserData(user.email,"details");
      if(details && details.length > 0){
        setUserDetails(details[0])
      }

      const plans = await profileService.getPlans(user.email);
      if(plans && plans.length > 0){
        const reverse = plans.reverse()
        setPlansList(reverse.slice(0,3));
      }

      const subscriptionStatus = await profileService.getSubscriptionStatus(user.email);
      if(subscriptionStatus.referralCount){
        setSubscriptionStatus(subscriptionStatus)
      }
      // console.log(data,details,plans,subscriptionStatus,"here")
      setError(null);
    } catch (err) {
      console.error("Error fetching subscription data:", err);
      setError("Failed to load subscription data. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.email]);

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
    <div className="w-full font-['Poppins'] text-[#000000] mt-5">
      {/* Current Plan */}
      {subscriptionData && (
        <div className="bg-white rounded-[19px] p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between gap-6">
            {/* Left Side */}
            <div className="flex-1">
              <div className="flex flex-wrap items-center">
                <div className="text-xl sm:text-2xl font-semibold">
                  Package: <span className="text-[#316bff]">{subscriptionData.name}</span>
                </div>
                <div className="ml-2 sm:ml-4 mt-2 sm:mt-0 bg-[#d6e2ff] text-[#316bff] px-3 py-1 rounded-full text-sm">
                  {subscriptionData.status}
                </div>
              </div>

              <div className="mt-4 font-semibold text-left">Package info:</div>

              <div className="mt-4 flex flex-col sm:flex-row gap-4 sm:gap-16">
                  <div className="flex items-center gap-8">
                    <span className="font-medium">Start date : {formatDate(subscriptionData.purchaseDate)}</span>
                    <span className="font-medium">End date : {formatDate(subscriptionData.expiryDate)}</span>
                    <span className="font-medium">Referral expires : {formatDate(subscriptionData.expiryDate)}</span>
                  </div>
              </div>
            </div>

            {/* Right Side */}
            <div className="w-full md:w-[250px] h-full bg-gradient-to-br from-[#316bff] to-[#5fc9ff] rounded-[18px] p-4 text-white">
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-sm">Total referrals</div>
                <div className="bg-[#f6f6f6] text-[#316bff] font-semibold w-12 h-[30px] flex items-center justify-center rounded-lg border border-[#c0b7b7]">
                  {subscriptionData.creditedReferrals}
                </div>
              </div>
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-sm">Referrals Consumed</div>
                <div className="bg-[#f6f6f6] text-[#316bff] font-semibold w-12 h-[30px] flex items-center justify-center rounded-lg border border-[#c0b7b7]">
                  {subscriptionData.requestedReferrals}
                </div>
              </div>            
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-sm">Referrals left</div>
                <div className="bg-[#57e1e1] text-[#316bff] font-semibold w-12 h-[30px] flex items-center justify-center rounded-lg border border-[#c0b7b7]">
                  {subscriptionData.availableReferrals}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Section title */}
      <div className="mt-12 mb-1 text-center">
        <h1 className="text-4xl font-bold text-[#0f0f0f]">Our Pricing Plans</h1>
        <p className="text-base font-light text-[#0f0f0f] mt-2">
          Pick an account plan that fits your workflow
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center items-end">
        {/* Most popular tag */}
        {/* <div className="absolute -top-[120px] left-1/2 transform -translate-x-1/2 w-[350px] h-[99px] bg-gradient-to-br from-[#316bff] to-[#5fc9ff] rounded-t-[35px] flex items-center justify-center">
          <span className="text-2xl font-bold text-white tracking-wider uppercase">
            Most popular
          </span>
        </div> */}

    {PlansList.map((plan, index) => {
      // const elevationClass =
      //   index === 0
      //     ? "translate-y-0"
      //     : index === 1
      //     ? "md:-translate-y-10"
      //     : "md:-translate-y-20";
            return (
              // <div
              //   key={plan.name}
              //   className={`
              //     w-[350px] rounded-[35px] overflow-hidden shadow-lg flex flex-col
              //     bg-gradient-to-br from-blue-400 to-blue-400
              //     transition-transform duration-300 bc
              //     ${elevationClass}
              //   `}
              // >
                <PricingCard
                  key={plan.SK}
                  SK={plan.SK}
                  name={plan.name}
                  amount={plan.amount}
                  referralCount={plan.referralCount}
                  duration={plan.duration}
                  features={features[index]?.features || []}
                  isActive={plan.name === activePlan}
                  index={index}
                  buttonText={plan.name === activePlan ? "Already using" : "Buy now"}
                  userDetails={userDetails}
                  // onRefresh={()=>fetchSubscriptionData()}
                  setShowOrderDetails={setShowOrderDetails}
                  setPaymentID={setPaymentID}
                  setOrderID={setOrderID}
                  setAmount={setAmount}
                  existingReferrals={subscriptionData?.availableReferrals}
                />
              // </div>
            );
          })}
          <OrderDetailsModal
            show={showOrderDetails}
            amount={amount}
            paymentID={paymentID}
            orderID={orderID} 
            onRefresh={()=>fetchSubscriptionData()}
            onClose={() => setShowOrderDetails(false)} 
            />
      </div>
    </div>
  );
};

export default Subscription;