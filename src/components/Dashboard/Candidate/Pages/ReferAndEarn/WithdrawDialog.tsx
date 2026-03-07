import { useEffect, useRef, useState } from "react";
import httpServiceObj from "@Services/ApiHandler.service";
import { SendIcon } from "lucide-react";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

const WithdrawDialog = ({ isOpen, onClose, referral, statusData }: any) => {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [reEnterAccountNumber, setReEnterAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [panNumber, setPanNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleSubmit = async () => {
    if (
      !accountHolderName ||
      !accountNumber ||
      !ifscCode ||
      !branchName ||
      !reEnterAccountNumber ||
      !panNumber ||
      !amount
    ) {
      toast.error("Please fill all the fields", getToastOptions({}));
      return;
    }
    if (accountNumber !== reEnterAccountNumber) {
      toast.error("Account number not matching", getToastOptions({}));
      return;
    }

    setLoading(true);

    try {
      const payload = {
        accountHolderName,
        accountNumber,
        ifscCode,
        branchName,
      };

      await httpServiceObj.patch(`/refer-and-earn/${statusData.id}/request-withdrawal`, payload, true, {}, false,"BASE");

      toast.success("Withdrawal request submitted successfully!", getToastOptions({}));
      onClose();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      toast.error("Something went wrong. Please try again.", getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      const timer = setTimeout(() => setIsAnimatingIn(true), 10);
      return () => clearTimeout(timer);
    } else {
      setIsAnimatingIn(false);
      const timer = setTimeout(() => setVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // if (!isOpen) return null;

  // useEffect(() => {
  //   console.log("statusData", statusData);
  // }, []);

  return (
    <div
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          // reset();
          onClose();
        }
      }}
      className={`fixed inset-0 z-[80] flex justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        ref={modalRef}
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out h-[100vh] ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          onClick={onClose}
          disabled={loading}>
          ×
        </button>

        <h2 className="text-lg font-bold mb-4 text-black">Withdraw Referral Bonus</h2>

        {/* {statusData && (
          <div className="mb-4 text-sm text-gray-600">
            <p><strong>Status:</strong> {statusData.status}</p>
            <p><strong>Amount:</strong> Rs. {statusData.eligibleAmount}</p>
            <p><strong>Reason:</strong> {statusData.reason}</p>
          </div>
        )} */}

        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Account Holder Name"
            value={accountHolderName}
            onChange={(e) => setAccountHolderName(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Re-enter Account Number"
            value={reEnterAccountNumber}
            onChange={(e) => setReEnterAccountNumber(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="IFSC Code"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Branch Name"
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Pan No"
            value={panNumber}
            onChange={(e) => setPanNumber(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
          <input
            type="text"
            placeholder="Withdraw amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={loading}
            className="border p-2 rounded"
          />
        </div>

        <div className="mt-6 flex justify-start gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-500 text-white text-sm font-medium px-4 py-3  rounded-xl hover:bg-blue-300">
            <SendIcon className="w-4 h-4" />
            {loading ? "Sending OTP..." : "Send OTP"}
          </button>
          {/* <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-3 bg-gray-300 rounded-xl hover:bg-gray-400"
          >
            Cancel
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default WithdrawDialog;
