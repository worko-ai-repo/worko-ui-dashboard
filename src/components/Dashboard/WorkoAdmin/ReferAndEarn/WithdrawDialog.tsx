import { useEffect, useState } from "react";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

const WithdrawDialog = ({ isOpen, onClose, referral, statusData }: any) => {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [branchName, setBranchName] = useState("");
  const [loading, setLoading] = useState(false);

  const APP_JOBS_API_URI = import.meta.env.APP_JOBS_API_URI;

  const handleSubmit = async () => {
    if (!accountHolderName || !accountNumber || !ifscCode || !branchName) {
      toast.warning("Please fill all the fields",getToastOptions());
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

      await httpServiceObj.patch(`${APP_JOBS_API_URI}/refer-and-earn/${statusData.id}/request-withdrawal
    `, payload, true);

          toast.success("Withdrawal request submitted successfully!",getToastOptions());
          onClose();
        } catch (error) {
          console.error("Withdrawal failed:", error);
          toast.error("Something went wrong. Please try again.",getToastOptions());
        } finally {
          setLoading(false);
        }
      };

  if (!isOpen) return null;

//   useEffect(() => {
//     console.log(isOpen, onClose, referral, statusData)
//   }, [])
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
        <button
          className="absolute top-3 right-3 text-gray-600 hover:text-red-500"
          onClick={onClose}
          disabled={loading}
        >
          ×
        </button>

        <h2 className="text-lg font-bold mb-4">Withdraw Referral Bonus</h2>

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
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {loading ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawDialog;
