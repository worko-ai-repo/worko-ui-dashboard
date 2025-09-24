import { Check } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: number;
  referrals: number;
  referralCost: string;
  validity: string;
  features: string[];
  isActive: boolean;
  isPopular?: boolean;
  elevation?: number;
  buttonText?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

const PricingCard = ({
  name,
  price,
  referrals,
  referralCost,
  validity,
  features,
  isActive,
  isPopular = false,
  elevation = 0,
  buttonText,
  gradientFrom = "#76c6ff",
  gradientTo = "#76c6ff",
}: PricingCardProps) => {
  return (
    <div
      className="w-[350px] rounded-[35px] overflow-hidden shadow-lg flex flex-col bc bg-gradient-to-br from-custom-gradient-from to-custom-gradient-to transform"
      style={{ 
        transform: `translateY(-${elevation}px)`
      }}
    >
      <div className="p-8 text-left">
        <h2 className="text-2xl font-bold text-white tracking-wider">{name}</h2>
        <div className="flex items-end mt-2">
          <span className="text-5xl font-bold text-white">₹{price}</span>
          <span className="text-2xl text-white ml-1">/mo</span>
        </div>
      </div>

      <div className="px-8 text-left flex-1">
        <FeatureItem label={`No. of Referral: ${referrals}`} />
        <FeatureItem label={`Per referral cost: ₹${referralCost}`} />
        <FeatureItem label={`Validity: ${validity}`} />
        {features.map((feature, idx) => (
          <FeatureItem key={idx} label={feature} />
        ))}
      </div>

      <div className="px-8 pb-8 mt-4">
        <button
          className={`w-full h-[55px] rounded-xl text-white font-bold text-xl ${
            isActive ? "bg-[#56b8ff]" : "bg-[#316bff]"
          }`}
          disabled={isActive}
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