import { Submit } from "@Assets";
import React from "react";

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const SubmitButton: React.FC<IconButtonProps> = ({
  label,
  ...props
}) => {
  return (
    <button
      type="button"
      className={`flex items-center w-fit bg-[#316BFF] text-white px-[10px] pr-5 py-[10px] rounded-xl hover:bg-blue-600`}
      {...props}
    >
      <img src={Submit} alt='submit' title='Submit' className='w-6 h-6 mr-1' />
      <span>{label}</span>
    </button>
  );
};
