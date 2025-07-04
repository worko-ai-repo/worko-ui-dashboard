import { set, useForm } from "react-hook-form";
import { ChevronDown, Send } from "lucide-react";
import httpServiceObj from "@Services/ApiHandler.service";
import { useState } from "react";
import { inviteTick } from "@AssetsFolder/assets";

type FormData = {
  name: string;
  email: string;
  phone: string;
  accessType: string;
};

const InviteForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();

  const [inviteSent, setInviteSent] = useState(false);
  const [name, setName] = useState("");

  const onSubmit = async (data: FormData) => {
    console.log("Form data:", data);
    setName(data.name);
    setTimeout(() => {
      setInviteSent(true);
    }, 2000);
    // const { response, error } = await httpServiceObj.post(`https://api.dev.worko.work/corporate-invite/`, data, true, {}, true);
  };

  if (inviteSent) {
    return (
      <div className="self-center flex flex-col items-center justify-center gap-2 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <img src={inviteTick} alt="inviteTick" />
        <p className="text-sm">{name} has been invited successfully.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className=" flex flex-col overflow-hidden justify-between max-w-sm text-sm font-medium text-[#0F172A]">
      <div className=" space-y-4 ">
        <h2 className="font-semibold text-base">Invite others</h2>

        {/* Name */}
        <div>
          <label className="block mb-1">
            <span className="text-red-500">*</span> Name
          </label>
          <input {...register("name", { required: "Name is required" })} placeholder="Write name here" className="w-full px-4 py-2 rounded-lg bg-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none" />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1">
            <span className="text-red-500">*</span> Email
          </label>
          <input type="email" {...register("email", { required: "Email is required" })} placeholder="Write email id here" className="w-full px-4 py-2 rounded-lg bg-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none" />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Phone number */}
        <div>
          <label className="block mb-1">
            <span className="text-red-500">*</span> Phone number
          </label>
          <input type="tel" {...register("phone", { required: "Phone number is required" })} placeholder="Write phone number" className="w-full px-4 py-2 rounded-lg bg-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none" />
          {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
        </div>

        {/* Access type dropdown */}
        <div>
          <label className="block mb-1">Access type</label>
          <div className="relative">
            <select {...register("accessType")} className="w-full appearance-none px-4 py-2 pr-10 rounded-lg bg-[#F1F5F9] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none" defaultValue="">
              <option value="" disabled>
                Choose access type
              </option>
              <option value="viewer">Viewer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Submit button pinned to bottom */}
      <div className="absolute bottom-8 left-5">
        <button type="submit" className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          <Send className="text-white" size={16} />
          <span>Invite</span>
        </button>
      </div>
    </form>
  );
};

export default InviteForm;
