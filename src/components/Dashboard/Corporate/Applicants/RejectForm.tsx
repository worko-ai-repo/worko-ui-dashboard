import { Send, ChevronDownIcon } from 'lucide-react';
import React from 'react';
import { useForm } from 'react-hook-form';
import { SubmitButton } from '../SubmitButton';
import { Submit } from '@Assets';

type RejectionFormData = {
  reason: string;
  feedback: string;
};

const RejectionForm: React.FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RejectionFormData>();

  const onSubmit = (data: RejectionFormData) => {
    console.log('Rejection submitted:', data);
  };

  return (
    <div className="size-full mt-4 text-left">
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col space-y-4 size-full">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-[26px]">
            Why are you rejecting?
          </label>
          <div className="relative">
            <select
              {...register('reason', { required: 'Please select a reason' })}
              className="w-full appearance-none rounded-xl border border-gray-300 bg-white p-3 pr-10 text-sm text-gray-700 focus:outline-none"
              defaultValue=""
            >
              <option value="" disabled hidden>
                Choose your reason for rejection
              </option>
              <option value="not-qualified">Not qualified</option>
              <option value="not-available">Not available</option>
              <option value="cultural-fit">Not a cultural fit</option>
              <option value="other">Other</option>
            </select>

            {/* Dropdown arrow icon placeholder */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <ChevronDownIcon size={16} className="text-gray-500" />
            </div>
          </div>
          {errors.reason && (
            <p className="text-red-500 text-xs mt-1">{errors.reason.message}</p>
          )}
        </div>

        <div className='flex flex-col gap-[61px]'>
          <textarea
            {...register('feedback')}
            placeholder="Please provide a detail feedback. It will help us to do a better matching"
            className="w-full h-[231px] rounded-xl bg-gray-100 p-3 text-sm  focus:outline-none"
            rows={4}
          />

          <SubmitButton
            type="submit"
            label="Submit"
          />
        </div>
      </form>
    </div>
  );
};

export default RejectionForm;
