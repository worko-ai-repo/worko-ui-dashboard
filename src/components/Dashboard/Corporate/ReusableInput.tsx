import { InputHTMLAttributes } from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface ReusableInputProps extends InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegisterReturn;
  error?: string;
}

const ReusableInput = ({ register, error, className = "", ...props }: ReusableInputProps) => {
  return (
    <div className="w-full">
      <input
        {...register}
        {...props}
        className={`w-full rounded-xl bg-[#EBEFF3] text-black/40 p-4 pl-[26px] text-sm focus:outline-none ${className}`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default ReusableInput;
