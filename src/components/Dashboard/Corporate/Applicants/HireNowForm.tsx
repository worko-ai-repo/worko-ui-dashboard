import React from "react";
import { useForm } from "react-hook-form";
import { Upload, Send, ChevronDown } from "lucide-react";

type HireFormInputs = {
  jobTitle: string;
  workMode: string;
  location: string;
  department: string;
  ctc: string;
  offerLetter: FileList;
  remarks: string;
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
      className="size-full space-y-4"
    >
      <h2 className="text-lg font-semibold text-gray-800">Hire now</h2>

      {/* Job Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Job title
        </label>
        <input
          type="text"
          placeholder="Marketing manager"
          {...register("jobTitle", { required: "Job title is required" })}
          className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
        />
        {errors.jobTitle && (
          <p className="text-sm text-red-500 mt-1">{errors.jobTitle.message}</p>
        )}
      </div>

      {/* Work Mode */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Work mode
        </label>
        <input
          type="text"
          placeholder="Remote"
          {...register("workMode", { required: "Work mode is required" })}
          className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
        />
        {errors.workMode && (
          <p className="text-sm text-red-500 mt-1">{errors.workMode.message}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Location
        </label>
        <input
          type="text"
          placeholder="Bangalore"
          {...register("location", { required: "Location is required" })}
          className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
        />
        {errors.location && (
          <p className="text-sm text-red-500 mt-1">{errors.location.message}</p>
        )}
      </div>

      {/* Department */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>Department
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Marketing"
            {...register("department", { required: "Department is required" })}
            className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
          />
          <ChevronDown className="absolute cursor-pointer right-3 top-4 text-gray-400" size={18} />
        </div>
        {errors.department && (
          <p className="text-sm text-red-500 mt-1">{errors.department.message}</p>
        )}
      </div>

      {/* CTC */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          <span className="text-red-500 mr-1">*</span>CTC <span className="text-xs text-gray-400">(fix + variable)</span>
        </label>
        <input
          type="text"
          placeholder="50,00,000.00"
          {...register("ctc", { required: "CTC is required" })}
          className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
        />
        {errors.ctc && (
          <p className="text-sm text-red-500 mt-1">{errors.ctc.message}</p>
        )}
      </div>

      {/* Offer Letter Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Attach offer letter
        </label>
        <div className="relative">
          <input
            type="file"
            {...register("offerLetter")}
            className="mt-1 w-full px-4 py-2 pr-10 border rounded-lg bg-gray-100 file:hidden cursor-pointer"
          />
          <Upload className="absolute right-3 top-4 text-gray-400" size={18} />
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Remarks</label>
        <textarea
          placeholder="write here"
          {...register("remarks")}
          className="mt-1 w-full px-4 py-2 border rounded-lg bg-gray-100 focus:outline-none"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="flex justify-center items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
      >
        <Send size={16} />
        Send
      </button>
    </form>
  );
}
