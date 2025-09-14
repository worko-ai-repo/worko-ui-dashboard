import { useForm } from "react-hook-form";
import { ChevronDown, Minus } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import AdminServiceObj from "../Services/Admin.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";

interface DeleteCompanyProps {
  companyId: string;
  onClose: () => void;
  fetchCompany: () => void;
  isRequest: boolean;
}

type FormData = {
  revokeReason: string;
};

const DeleteCompany: React.FC<DeleteCompanyProps> = ({ companyId, onClose, fetchCompany ,isRequest=false}) => {
  const {
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (formData: FormData) => {
    const isDeleted: boolean = await (isRequest ? AdminServiceObj.deleteCompanyRequest(companyId):AdminServiceObj.deleteCompany(companyId));
    if (isDeleted) {
      toast.success("Company deleted successfully", getToastOptions({}));
      onClose();
      fetchCompany();
    } else {
      toast.error("Failed to delete company", getToastOptions({ type: "error" }));
      onClose();
      fetchCompany();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col justify-between max-w-md mx-auto  text-sm font-medium text-gray-800 space-y-6 bg-white ">
      <header className="text-center">
        <h2 className="text-xl font-semibold mb-2">Confirm Deletion</h2>
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this company? This action cannot be undone.
        </p>
      </header>
      <footer className="flex flex-row gap-5">
        <button
          type="submit"
          className="w-full bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-colors duration-300">
          Yes, Delete Company
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-gray-200 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors duration-300">
          Cancel
        </button>
      </footer>
    </form>
  );
};

export default DeleteCompany;
