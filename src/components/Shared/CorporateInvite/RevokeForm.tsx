import { useForm } from "react-hook-form";
import { ChevronDown, Minus } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

interface RevokeFormProps {
  inviteId: string;
  onClose: () => void;
}

type FormData = {
  revokeReason: string;
};

const RevokeForm: React.FC<RevokeFormProps> = ({
  inviteId,
  onClose,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: { revokeReason: "" },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { status } = await httpServiceObj.patch(
        `https://api.dev.worko.work/corporate-invite/${inviteId}/delete`,
        { reasonForRevokingInvite: data.revokeReason },
        true,
        {},
        true
      );

      if (status === 204) {
        onClose();
      } else {
        toast.error("Failed to revoke the invite. Please try again.",getToastOptions());
      }
      toast.success("Invite revoked successfully.",getToastOptions());
    } catch (error) {
      console.error("Error revoking invite:", error);
      toast.error("An error occurred while revoking the invite. Please try again.",getToastOptions());
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col justify-between max-w-sm h-52 text-sm font-medium text-gray-800 p-4 space-y-4 bg-white"
    >
        <label className="block mb-1 font-bold text-lg">Reason for revoke</label>
      <div>

        <div className="relative">
          <select
            {...register("revokeReason", { required: "Please select a reason" })}
            className={`w-full appearance-none px-4 py-2 pr-10 rounded-lg border ${
              errors.revokeReason
                ? "border-red-500"
                : "border-gray-300"
            } bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            defaultValue=""
          >
            <option value="" disabled>
              Choose why you are revoking
            </option>
            <option value="access_misuse">Access misuse</option>
            <option value="role_changed">Role changed</option>
            <option value="temporary_access">Temporary access ended</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
        </div>

        {errors.revokeReason && (
          <p className="text-red-500 text-xs mt-1">
            {errors.revokeReason.message}
          </p>
        )}
      </div>

      <div className="mt-auto">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-white ${
            isSubmitting
              ? "bg-red-400 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          <div className="p-[2px] rounded-full border border-white">
            <Minus className="w-2 h-2" />
          </div>
          <span>{isSubmitting ? "Revoking..." : "Revoke"}</span>
        </button>
      </div>
    </form>
  );
};

export default RevokeForm;
