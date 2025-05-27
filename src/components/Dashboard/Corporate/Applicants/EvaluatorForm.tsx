import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Send } from 'lucide-react';
import { evaluationRequest } from '@Assets';
import ReusableInput from '../ReusableInput';

type Evaluator = {
  name: string;
  email: string;
  message: string;
};

type FormValues = {
  evaluators: Evaluator[];
};

const EvaluatorForm: React.FC = () => {
  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<FormValues>({
    defaultValues: {
      evaluators: [{ name: '', email: '', message: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'evaluators',
  });

  const [activeTab, setActiveTab] = useState(0);
  const [submittedTabs, setSubmittedTabs] = useState<number[]>([]);

  const onSubmit = () => {
    const currentEvaluator = getValues(`evaluators.${activeTab}`);
    console.log('Submitted:', currentEvaluator);

    if (!submittedTabs.includes(activeTab)) {
      setSubmittedTabs([...submittedTabs, activeTab]);
    }
  };

  const handleRemoveTab = (index: number) => {
    remove(index);
    if (activeTab === index) {
      setActiveTab(index > 0 ? index - 1 : 0);
    } else if (index < activeTab) {
      setActiveTab(prev => prev - 1);
    }
    setSubmittedTabs(submittedTabs.filter(i => i !== index));
  };

  return (
    <div className="flex flex-col mt-4 h-full">
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {fields.map((_, index) => (
          <div
            key={index}
            className="flex items-center border px-2 py-1 rounded-xl border-gray-300 bg-white"
          >
            <button
              onClick={() => setActiveTab(index)}
              className={`text-sm font-semibold pr-1 ${activeTab === index ? 'text-black' : 'text-gray-400'}`}
            >
              Evaluator {index + 1}
            </button>
            {fields.length > 1 && (
              <button
                onClick={() => handleRemoveTab(index)}
                className="text-gray-400 text-xs hover:text-red-500 ml-1"
                title="Remove Evaluator"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {fields.length < 5 && (
          <button
            type="button"
            onClick={() => {
              append({ name: '', email: '', message: '' });
              setActiveTab(fields.length);
            }}
            className="text-blue-500 text-xl font-bold px-2"
            title="Add Evaluator"
          >
            +
          </button>
        )}
      </div>


      {/* Form or Confirmation */}
      {fields.map((_, index) => (
        <div key={index} className={`h-full ${activeTab === index ? 'block' : 'hidden'}`}>
          {submittedTabs.includes(index) ? (
            <div className="flex flex-col items-center justify-center text-center p-4">
              {/* Add your image here */}
              <img src={evaluationRequest} className='w-[134px]' />
              <p className="text-sm font-medium">
                Evaluation request has been sent to :{' '}
                <span className="font-semibold">{getValues(`evaluators.${index}.name`)}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full gap-12 text-left">
              <div className='flex flex-col gap-4'>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <ReusableInput
                    type="text"
                    register={register(`evaluators.${index}.name`, { required: "Name is required" })}
                    placeholder="Write name"
                    error={errors?.evaluators?.[index]?.name?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <ReusableInput
                    type="email"
                    register={register(`evaluators.${index}.email`, {
                      required: "Email is required",
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: "Invalid email format",
                      },
                    })}
                    placeholder="Write email address"
                    error={errors?.evaluators?.[index]?.email?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    {...register(`evaluators.${index}.message`)}
                    placeholder="Any message you want to write"
                    className="w-full h-[96px] rounded-xl bg-gray-100 p-4 pl-[26px] text-sm focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-fit flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm hover:bg-blue-700 transition"
              >
                <Send size={16} />
                <span>Submit</span>
              </button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
};

export default EvaluatorForm;
