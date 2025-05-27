import { Controller, useForm } from 'react-hook-form';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { X } from 'lucide-react';
import Input from './Input';
import TagInput from './TagInput';
import { useEffect } from 'react';
import { validationRules } from '@Utils/FormValidator.utils';
import Editor from './RichTextEditor';
import { JobDetails, JobFormSchema } from '@Components/Dashboard/types';

export default function JobForm({
  onClose,
  jobDetails }: {
    onClose: () => void,
    jobDetails: JobDetails | null
  }) {
  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
    watch,
    trigger,
    control,
  } = useForm<JobFormSchema>({
    defaultValues: {
      jobTitle: '',
      company: '',
      offerings: '',
      gradeLevel: '',
      department: '',
      workMode: '',
      location: [],
      experienceFrom: '',
      experienceTo: '',
      creatorName: '',
      salaryFrom: '',
      salaryTo: '',
      coreSkills: [],
      technicalSkills: [],
      softSkills: [],
      goodSkills: [],
      otherRequirements: '',
      typeOfEmployment: '',
      description: '',
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!jobDetails) return;

    if (jobDetails.formattedHTML) {
      setValue('description', jobDetails.formattedHTML);
    }

    if (jobDetails.jobTitle && jobDetails.jobTitle !== 'Not Mentioned') {
      setValue('jobTitle', jobDetails.jobTitle);
    }

    if (jobDetails.salaryRange?.min && jobDetails.salaryRange.min !== 'Not Mentioned') {
      setValue('salaryFrom', jobDetails.salaryRange.min);
    }
    if (jobDetails.salaryRange?.max && jobDetails.salaryRange.max !== 'Not Mentioned') {
      setValue('salaryTo', jobDetails.salaryRange.max);
    }

    if (jobDetails.experienceRange?.min && jobDetails.experienceRange.min !== 'Not Mentioned') {
      setValue('experienceFrom', jobDetails.experienceRange.min);
    }
    if (jobDetails.experienceRange?.max && jobDetails.experienceRange.max !== 'Not Mentioned') {
      setValue('experienceTo', jobDetails.experienceRange.max);
    }

    if (jobDetails.workMode && jobDetails.workMode !== 'Not Mentioned') {
      setValue('workMode', jobDetails.workMode);
    }

    if (jobDetails.location && jobDetails.location !== 'Not Mentioned') {
      setValue('location', [jobDetails.location]);
    }

    if (jobDetails.typeOfEmployment && jobDetails.typeOfEmployment !== 'Not Mentioned') {
      setValue('typeOfEmployment', jobDetails.typeOfEmployment);
    }
    if (jobDetails.department && jobDetails.department !== 'Not Mentioned') {
      setValue('department', jobDetails.department);
    }

    if (jobDetails.coreSkills?.length) setValue('coreSkills', jobDetails.coreSkills);
    if (jobDetails.softSkills?.length) setValue('softSkills', jobDetails.softSkills);
    if (jobDetails.technicalSkills?.length) setValue('technicalSkills', jobDetails.technicalSkills);

  }, [jobDetails, setValue]);

  useEffect(() => {
    register('description', validationRules.jobDescription);
  }, [register]);

  const onSubmit = (data: JobFormSchema) => {
    console.log('Valid form submitted:', data);
    onClose();
  };

  const location = watch('location');
  const coreSkills = watch('coreSkills');
  const technicalSkills = watch('technicalSkills');
  const softSkills = watch('softSkills');
  const goodSkills = watch('goodSkills');

  const addTag = (field: keyof JobFormSchema, tag: string) => {
    const currentTags = getValues(field) as string[];
    setValue(field, [...currentTags, tag]);
  };

  const removeTag = (field: keyof JobFormSchema, tag: string) => {
    const currentTags = getValues(field) as string[];
    setValue(field, currentTags.filter(t => t !== tag));
  };

  return (
    <div className="overflow-auto p-1 text-start">
      {/* Job Description */}
      <div className='mb-4'>
        <label className="text-sm font-medium text-gray-700">Edit Job Description*</label>
        <Editor
          value={jobDetails?.formattedHTML}
          onChange={(val) => {
            setValue('description', val)
            trigger('description')
          }}
        />

        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Controller
          name="jobTitle"
          control={control}
          rules={{ required: 'Job title is required' }}
          render={({ field }) => (
            <Input
              label="Job title*"
              {...field}
              error={errors.jobTitle?.message}
            />
          )}
        />
        <Controller
          name="company"
          control={control}
          rules={{ required: 'Company is required' }}
          render={({ field }) => (
            <Input
              label="Company*"
              {...field}
              error={errors.company?.message}
            />
          )}
        />

        <Controller
          name="offerings"
          control={control}
          render={({ field }) => (
            <Input
              label="Number of offerings"
              {...field}
            />
          )}
        />

        <Controller
          name="gradeLevel"
          control={control}
          render={({ field }) => (
            <Input
              label="Grade level"
              {...field}
            />
          )}
        />

        <Controller
          name="department"
          control={control}
          render={({ field }) => (
            <Input
              label="Department"
              {...field}
            />
          )}
        />

        <Controller
          name="workMode"
          control={control}
          rules={{ required: 'Work mode is required' }}
          render={({ field }) => (
            <Input
              label="Work mode*"
              {...field}
              error={errors.workMode?.message}
            />
          )}
        />
        
        {/* Location */}
        <div className="sm:col-span-2 lg:col-span-1">
          <TagInput label="Location*" tags={location} onAddTag={(tag) => addTag('location', tag)} onRemoveTag={(tag) => removeTag('location', tag)} />
        </div>

        {/* Experience and Salary - Stacked vertically */}
        <div className="flex flex-col sm:col-span-2 lg:col-span-1 justify-between gap-4">
          {/* Experience */}
          <div>
            <label className="text-sm font-medium text-gray-700">Experience* (in years)</label>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" placeholder="From" {...register('experienceFrom')} className="w-full rounded-xl bg-gray-100 p-3 text-sm focus:outline-none" />
              <span className="text-sm text-gray-500">to</span>
              <input type="number" placeholder="To" {...register('experienceTo')} className="w-full rounded-xl bg-gray-100 p-3 text-sm focus:outline-none" />
            </div>
          </div>

          {/* Salary */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-medium text-gray-700">Salary*</label>
              <select className="appearance-none border-2 rounded-full px-3 text-xs bg-transparent focus:outline-none">
                <option value="INR">INR</option>
                <option value="USD">USD</option>
              </select>
              <label className="flex text-[10px] items-center font-medium text-gray-700 ml-auto">
                <input
                  type="checkbox"
                  className="form-checkbox text-blue-600 w-3 h-3 focus:ring-0 mr-1 accent-blue-600"
                />
                <span className="text-gray-700">don't show on website</span>
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="From"
                {...register('salaryFrom')}
                className="w-full rounded-xl bg-gray-100 p-3 text-sm focus:outline-none"
              />
              <span className="text-sm text-gray-500">to</span>
              <input
                type="number"
                placeholder="To"
                {...register('salaryTo')}
                className="w-full rounded-xl bg-gray-100 p-3 text-sm focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Variable/Fixed Components and Employment Type */}
        <div className='sm:col-span-2 lg:col-span-1 flex flex-col gap-3'>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
            <Controller
              name="typeOfEmployment"
              control={control}
              rules={{ required: 'This field is required' }}
              render={({ field }) => (
                <Input
                  label="Variable Component"
                  {...field}
                  error={errors.typeOfEmployment?.message}
                />
              )}
            />
            <Controller
              name="typeOfEmployment"
              control={control}
              rules={{ required: 'This field is required' }}
              render={({ field }) => (
                <Input
                  label="Fixed Component"
                  {...field}
                  error={errors.typeOfEmployment?.message}
                />
              )}
            />
          </div>
          <Controller
            name="typeOfEmployment"
            control={control}
            rules={{ required: 'This field is required' }}
            render={({ field }) => (
              <Input
                label="Type of employment*"
                {...field}
                error={errors.typeOfEmployment?.message}
              />
            )}
          />
        </div>

        {/* Skills - Each skill section takes full width on mobile, adapts on larger screens */}
        <div className="sm:col-span-2 lg:col-span-1">
          <TagInput label="Core Skills*" tags={coreSkills} onAddTag={(tag) => addTag('coreSkills', tag)} onRemoveTag={(tag) => removeTag('coreSkills', tag)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <TagInput label="Technical Skills*" tags={technicalSkills} onAddTag={(tag) => addTag('technicalSkills', tag)} onRemoveTag={(tag) => removeTag('technicalSkills', tag)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <TagInput label="Soft Skills*" tags={softSkills} onAddTag={(tag) => addTag('softSkills', tag)} onRemoveTag={(tag) => removeTag('softSkills', tag)} />
        </div>
        <div className="sm:col-span-2 lg:col-span-1">
          <TagInput label="Good to Have Skills" tags={goodSkills} onAddTag={(tag) => addTag('goodSkills', tag)} onRemoveTag={(tag) => removeTag('goodSkills', tag)} />
        </div>
        
        {/* Other Requirements - Full width */}
        <div className='sm:col-span-2'>
          <label className="text-sm font-medium text-gray-700">Other mandatory requirements*</label>
          <textarea {...register('otherRequirements')} className="mt-1 w-full min-h-[133px] rounded-xl bg-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Write here" rows={3} />
        </div>
      </div>
      
      {/* Submit Button */}
      <div className="flex justify-start pt-2">
        <button onClick={handleSubmit(onSubmit)} className="bg-[#316BFF] text-white p-[10px] pr-4 rounded-[10px] font-medium text-sm sm:text-base">
          + Create Job
        </button>
      </div>
    </div>
  );
}