import React from "react";
import { useForm } from "react-hook-form";
import { Upload, Send, ChevronDown } from "lucide-react";
import ReusableInput from "../ReusableInput";

type HireFormInputs = {
  jobTitle: string;
  workMode: string;
  location: string;
  department: string;
  ctc: string;
  offerLetter: FileList;
  remarks: string;
  joiningDate: string;
};

export default function HireNowForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<HireFormInputs>();

  const onSubmit = (data: HireFormInputs) => {
    console.log("Form submitted", data);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 text-left"
    >
      <h2 className="text-lg font-semibold text-gray-800">Hire now</h2>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Job title
        </label>
        <ReusableInput
          type="text"
          placeholder="Marketing manager"
          register={register("jobTitle", { required: "Job title is required" })}
          error={errors?.jobTitle?.message}
        />
      </div>

      {/* Work Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Work mode
        </label>
        <ReusableInput
          type="text"
          placeholder="Remote"
          register={register("workMode", { required: "Work mode is required" })}
          error={errors?.workMode?.message}
        />
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Location
        </label>
        <ReusableInput
          register={register("location", { required: "Location is required" })}
          type="text"
          placeholder="Bangalore"
          error={errors?.location?.message}
        />
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Department
        </label>
        <div className="relative">
          <ReusableInput
            register={register("department", { required: "Department is required" })}
            type="text"
            placeholder="Marketing"
            error={errors?.department?.message}
          />
          <ChevronDown className="absolute cursor-pointer right-3 top-4 text-gray-400" size={18} />
        </div>
      </div>

      {/* CTC */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>CTC <span className="text-xs text-gray-400">(fix + variable)</span>
        </label>
        <ReusableInput
          register={register("ctc", { required: "CTC is required" })}
          type="text"
          placeholder="50,00,000.00"
          error={errors?.ctc?.message}
        />
      </div>

      {/* Offer Letter Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Attach offer letter
        </label>
        <div className="relative">
          <ReusableInput
            register={register("offerLetter")}
            type="file"
            accept=".pdf,.doc,.docx"
          />
          <Upload className="absolute right-3 top-4 text-gray-400" size={18} />
        </div>
      </div>

      {/* Joining Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Joining Date
        </label>
        <ReusableInput
          register={register("joiningDate", { required: "Joining date is required" })}
          type="text"
          placeholder="14/11/2023"
          error={errors?.joiningDate?.message}
        />
      </div>

      {/* Remarks */}
      <div className="flex flex-col gap-12">
        <div>
          <label className="block text-sm font-medium text-gray-700">Remarks</label>
          <textarea
            placeholder="write here"
            {...register("remarks")}
            className="mt-1 h-[95px] w-full px-4 py-2 pl-[26px] border rounded-lg bg-[#EBEFF3] focus:outline-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="flex justify-center items-center w-fit gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
        >
          <Send size={16} />
          Send
        </button>
      </div>
    </form>
  );
}
