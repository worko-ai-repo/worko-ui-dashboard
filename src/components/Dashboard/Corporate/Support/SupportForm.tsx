import { useForm } from "react-hook-form";
import { ChevronDown, Send } from "lucide-react";
import { SubmitButton } from "../SubmitButton";

type FormData = {
    reason: string;
    header: string;
    details: string;
};

const SupportForm = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormData>();

    const onSubmit = (data: FormData) => {
        // console.log("Submitted support request:", data);
    };

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col h-full text-left max-w-md w-full space-y-12 text-sm font-medium text-[#0F172A]"
        >
            <div className="flex flex-col gap-4">
                <h2 className="font-semibold text-base mb-12">How can we help you?</h2>

                {/* Reason */}
                <div>
                    <select
                        {...register("reason", { required: "Reason is required" })}
                        className="w-full px-4 py-2 rounded-lg border text-[#0F172A] placeholder-[#94A3B8] bg-white focus:outline-none"
                        defaultValue=""
                    >
                        <option value="" disabled>
                            Choose your reason
                        </option>
                        <option value="access">Access Issue</option>
                        <option value="bug">Bug Report</option>
                        <option value="feature">Feature Request</option>
                    </select>
                    {errors.reason && (
                        <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>
                    )}
                </div>

                {/* Header */}
                <div>
                    <select
                        {...register("header", { required: "Header is required" })}
                        className="w-full px-4 py-2 rounded-lg border text-[#0F172A] placeholder-[#94A3B8] bg-white focus:outline-none"
                        defaultValue=""
                    >
                        <option value="" disabled>
                            Request header
                        </option>
                        <option value="account">Account</option>
                        <option value="billing">Billing</option>
                        <option value="technical">Technical</option>
                    </select>
                    {errors.header && (
                        <p className="text-red-500 text-xs mt-1">{errors.header.message}</p>
                    )}
                </div>

                {/* Details */}
                <div>
                    <textarea
                        {...register("details", { required: "Details are required" })}
                        placeholder="Write in details"
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg bg-[#F1F5F9] placeholder:text-[#94A3B8] focus:outline-none resize-none"
                    />
                    {errors.details && (
                        <p className="text-red-500 text-xs mt-1">{errors.details.message}</p>
                    )}
                </div>
            </div>
            {/* Submit Button */}
            <div className="mt-auto">
                <SubmitButton
                    type="submit"
                    label="Submit"
                />
            </div>
        </form>
    );
};

export default SupportForm;
