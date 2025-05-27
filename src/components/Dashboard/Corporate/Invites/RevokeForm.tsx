import { useForm } from "react-hook-form";
import { ChevronDown, Minus } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";

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
    formState: { errors },
  } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    const { error, status } = await httpServiceObj.patch(`https://api.dev.worko.work/corporate-invite/${inviteId}/delete`, {}, true, {}, true);
    if(status === 204) {
      onClose();
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col justify-between max-w-sm h-60 text-sm font-medium text-[#0F172A] p-4 space-y-4"
    >
      <div>
        <label className="block mb-1 font-semibold">Reason for revoke</label>

        <div className="relative">
          <select
            {...register("revokeReason", { required: "Please select a reason" })}
            className="w-full appearance-none px-4 py-2 pr-10 rounded-lg border border-gray-300 bg-white text-gray-700 placeholder:text-gray-400 focus:outline-none"
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
          <p className="text-red-500 text-xs mt-1">{errors.revokeReason.message}</p>
        )}
      </div>

      <div className="mt-auto">
        <button
          type="submit"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
            <div className="p-[2px] rounded-full border border-white">
          <Minus className="w-2 h-2" />
            </div>
          <span>Revoke</span>
        </button>
      </div>
    </form>
  );
};

export default RevokeForm;
