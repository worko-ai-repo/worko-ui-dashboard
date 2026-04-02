import React, { useState } from "react";
import { Minus, Plus, Info } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

interface Props {
  activeTab: "recruiter" | "evaluator";
  subscription: any;

  recruiterQuarterlyPricePerMonth: number;
  recruiterAnnuallyPricePerMonth: number;
  evaluatorQuarterlyPricePerMonth: number;
  evaluatorAnnuallyPricePerMonth: number;

  onSuccess: (data?: any) => void;
}

const RenewSubscriptionModal: React.FC<Props> = ({
  activeTab,
  subscription,
  recruiterQuarterlyPricePerMonth,
  recruiterAnnuallyPricePerMonth,
  evaluatorQuarterlyPricePerMonth,
  evaluatorAnnuallyPricePerMonth,
  onSuccess
}) => {
  const [count, setCount] = useState(1);
  const [months, setMonths] = useState(12);
  const [assignedUsers, setAssignedUsers] = useState<string[]>([
    "john@gmail.com",
    "alex@gmail.com",
    "emma@gmail.com",
    "olivia@gmail.com",
    "noah@gmail.com",
  ]);
  const handleRemoveUser = (email: string) => {
    setAssignedUsers((prev) => prev.filter((u) => u !== email));
  };
  const price =
    months === 3
      ? activeTab === "recruiter"
        ? recruiterQuarterlyPricePerMonth
        : evaluatorQuarterlyPricePerMonth
      : activeTab === "recruiter"
      ? recruiterAnnuallyPricePerMonth
      : evaluatorAnnuallyPricePerMonth;

  const total = count * months * price;

  const handleSubmit = () => {
  if (count < assignedUsers.length) {
    const diff = assignedUsers.length - count;

    toast.error(
      `You have selected fewer licenses. Please remove ${diff} user(s) before proceeding.`,
      getToastOptions({})
    );
    return;
    }

    onSuccess({ count, months });
    };

  return (
    <div className="bg-white rounded-2xl p-5">
      <h2 className="text-xl font-semibold mb-4">
        {activeTab === "recruiter"
            ? "Recruiter Subscription"
            : "Evaluator Subscription"}
      </h2>

      {/* Count */}
      <div className="flex items-center gap-3">
        <p className="text-sm font-semibold flex items-center gap-1">
          Number of {activeTab === "recruiter" ? "Recruiters" : "Evaluators"}
          <Info className="h-3 text-gray-400" />
        </p>

        <button onClick={() => setCount((p) => Math.max(1, p - 1))}>
          <Minus />
        </button>

        <div className="px-3">{count}</div>

        <button onClick={() => setCount((p) => p + 1)}>
          <Plus />
        </button>
      </div>

      {/* Duration */}
      <div className="mt-5 flex gap-3">
        {[3, 12].map((m) => (
          <div
            key={m}
            onClick={() => setMonths(m)}
            className={`px-4 py-2 rounded-lg border cursor-pointer text-sm
              ${months === m ? "bg-blue-100 border-blue-500 text-blue-600" : ""}
            `}
          >
            {m} Months
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <input
          disabled
          value={`₹${total}`}
          className="bg-gray-100 p-2 rounded"
        />
        <input
          disabled
          value={`${months} Months`}
          className="bg-gray-100 p-2 rounded"
        />
      </div>

      {/* CTA */}
      <button
        // onClick={() => onSuccess({ count, months })}
        onClick={handleSubmit}
        className="mt-6 w-full bg-gradient-to-r from-blue-500 to-cyan-400 text-white py-2 rounded-xl"
      >
        Proceed to Pay
      </button>
      <p className="text-xs text-gray-500 mt-2">
        {assignedUsers.length > count
            ? `Remove ${assignedUsers.length - count} user(s) to continue`
            : "You're good to proceed"}
        </p>
      <div className="mt-4 max-h-[120px] overflow-y-auto flex flex-wrap gap-2">
        {assignedUsers.map((email) => (
            <div
            key={email}
            className="flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs"
            >
            <span>{email}</span>

            <button
                onClick={() => handleRemoveUser(email)}
                className="text-blue-500 hover:text-red-500"
            >
                ✕
            </button>
            </div>
        ))}
    </div>
    </div>
  );
};

export default RenewSubscriptionModal;