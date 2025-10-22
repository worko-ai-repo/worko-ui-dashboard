import { SendIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';

interface UploadProfileProps{
    dashboardType:string;
    onClose: () => void;
    isOpen: boolean;
    userID:string;
}

interface FormValues {
  candidateName: string;
  candidateEmail: string;
  candidateContact: string;
  currentCompany: string;
  currentDesignation: string;
  totalYOE:number | null;
  relevantYOE:number | null;
  currentCTC:number | null;
  expectedCTC:number | null;
  location:string;
  relocate:string;
  noticePeriod:number | null;
  negotiable:boolean;
  contractCopy: FileList;
}

const UploadProfile:React.FC<UploadProfileProps> = ({dashboardType,onClose,isOpen,userID}) => {
  const { register, handleSubmit, reset, setValue, watch,formState: { errors },} = useForm<FormValues>({ mode: "onChange",
        defaultValues: {
          candidateName: "",
          candidateEmail: "",
          candidateContact:"",
          currentCompany: "",
          currentDesignation: "",
          totalYOE:null,
          relevantYOE:null,
          currentCTC:null,
          expectedCTC:null,
          location:"",
          relocate:"",
          noticePeriod:null,
          negotiable:true,
        },
      });
      const [visible, setVisible] = useState(false);
      const [isAnimatingIn, setIsAnimatingIn] = useState(false);
      const [isSubmitting,setIsSubmitting]  = useState(false);
      
      useEffect(() => {
      if (isOpen) {
          setVisible(true);
          const timer = setTimeout(() => setIsAnimatingIn(true), 10);
          return () => clearTimeout(timer);
      } else {
          setIsAnimatingIn(false);
          const timer = setTimeout(() => setVisible(false), 300);
          return () => clearTimeout(timer);
      }
      }, [isOpen]);
  
    const formSubmit = (data: any) => {
        const contractFile = data.contractCopy?.[0];
        console.log("Form Data:", data);
        console.log("Uploaded PDF File:", contractFile);
        reset()
        onClose()
      }
  
    return (
      <div
        className={`fixed inset-0 z-50 flex items-start justify-end transition-opacity duration-300 ease-in-out ${
          isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
        } ${visible ? "visible" : "invisible"}`}>
        <div
          className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[100vh] overflow-y-auto ${
            isAnimatingIn ? "translate-x-0" : "translate-x-full"
          }`}>
          <button
            onClick={()=>{
                reset();
                onClose();}}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
            ×
          </button>
  
          <h2 className="text-xl font-semibold mb-4 text-left">Upload profile</h2>
  
          <form onSubmit={handleSubmit(formSubmit)}>
            <div className='text-left'>
                <label>Candidate name<span className='text-red-500'>*</span></label>
                <input
                placeholder='Rahul yadav'
                type="text"
                className="input_primary auth_input capitalize"
                {...register("candidateName", { required: "Candidate name is required." })}
                />
                {errors.candidateName && <p className="text-red-500 text-sm mt-1">{errors.candidateName.message}</p>}
            </div>
  
              <div className='text-left'>
                  <label htmlFor="">Candidate email<span className='text-red-500'>*</span></label>
                  <input 
                  placeholder='contact@apexmarketing.com'
                  type="text" 
                  className="input_primary auth_input"
                  {...register("candidateEmail", {
                    required: "Candidate email is required",
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                    },
                    })}
                  />
                {errors.candidateEmail && <p className="text-red-500 text-sm mt-1">{errors.candidateEmail.message}</p>}
              </div>
  
                <div className='text-left'>
                  <label htmlFor="">Current contact no<span className='text-red-500'>*</span></label>
                  <input
                  placeholder='Enter valid contact number'
                  maxLength={10}
                    type="text"
                    className="input_primary auth_input capitalize"
                    {...register("candidateContact", {
                        required: "current company is required",
                        pattern: {
                        value: /^[0-9]{10}$/,
                        message: "Contact number must be exactly 10 digits",
                        },
                    })}
                    onInput={(e) => {
                        const input = e.target as HTMLInputElement;
                        input.value = input.value.replace(/\D/g, ''); // remove non-digits
                    }}
                    />
                  {errors.candidateContact && <p className="text-red-500 text-sm mt-1">{errors.candidateContact.message}</p>}
              </div>
                    
              <div className='text-left'>
                  <label htmlFor="">Current company<span className='text-red-500'>*</span></label>
                  <input 
                  placeholder='Rahul Sharma'
                  type="text" 
                  className="input_primary auth_input"
                  {...register("currentCompany",{required:"Contact number is required"})}
                  />
                  {errors.currentCompany && <p className="text-red-500 text-sm mt-1">{errors.currentCompany.message}</p>}
              </div>

              <div className='text-left'>
                  <label htmlFor="">Current designation<span className='text-red-500'>*</span></label>
                  <input 
                    placeholder='Enter registered GSTIN no'
                    type="text" 
                    maxLength={15}
                    className="input_primary auth_input capitalize"
                    {...register("currentDesignation", {
                        required: "GSTIN no is required",
                        pattern: {
                            value: /^[A-Z0-9]{15}$/i,
                            message: "GSTIN must be exactly 15 characters",
                        },
                        })}
                  />
                {errors.currentDesignation && <p className="text-red-500 text-sm mt-1">{errors.currentDesignation.message}</p>}
              </div>

            {/* total and relevant yoe */}
            <div className='flex flex-row gap-3'>
                <div className='text-left'>
                    <label htmlFor="">Total YOE<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='Rahul Sharma'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("totalYOE",{required:"Contact number is required"})}
                    />
                    {errors.totalYOE && <p className="text-red-500 text-sm mt-1">{errors.totalYOE.message}</p>}
                </div>
                <div className='text-left'>
                    <label htmlFor="">Relevant YOE<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='Rahul Sharma'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("relevantYOE",{required:"Contact number is required"})}
                    />
                    {errors.relevantYOE && <p className="text-red-500 text-sm mt-1">{errors.relevantYOE.message}</p>}
                </div>
            </div>

            {/* current and expected ctc */}
            <div className='flex flex-row gap-3'>
                <div className='text-left'>
                    <label htmlFor="">Current CTC<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='Rahul Sharma'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("currentCTC",{required:"Contact number is required"})}
                    />
                    {errors.currentCTC && <p className="text-red-500 text-sm mt-1">{errors.currentCTC.message}</p>}
                </div>
                <div className='text-left'>
                    <label htmlFor="">Expected CTC<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='Rahul Sharma'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("expectedCTC",{required:"Contact number is required"})}
                    />
                    {errors.expectedCTC && <p className="text-red-500 text-sm mt-1">{errors.expectedCTC.message}</p>}
                </div>
            </div>

            {/* location and preference */}
            <div className='flex flex-row gap-3'>
                <div className='text-left flex-1'>
                    <label htmlFor="">Location<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='Rahul Sharma'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("location",{required:"Contact number is required"})}
                    />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="">Ready to relocate<span className='text-red-500'>*</span></label>
                    <select
                        className="input_primary auth_input text-gray-300"
                        {...register("relocate", { required: "Expected CTC selection is required" })}
                    >
                        <option value="">Choose</option>
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                    </select>
                    {errors.relocate && <p className="text-red-500 text-sm mt-1">{errors.relocate.message}</p>}
                </div>
            </div>

            {/* notice period and negotiable */}
            <div className='flex flex-row gap-3 justify-center items-center'>
                <div className='text-left flex-1'>
                    <label htmlFor="">Notice period<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='Notice Period in days'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("noticePeriod",{required:"Contact number is required"})}
                    />
                    {errors.noticePeriod && <p className="text-red-500 text-sm mt-1">{errors.noticePeriod.message}</p>}
                </div>
                <div className='text-left flex-1'>
                <label htmlFor="negotiable" className="flex items-center gap-2">
                    <input
                    id="negotiable"
                    type="checkbox"
                    className="accent-blue-600 w-4 h-4"
                    {...register("negotiable", {
                        required: "Negotiable agreement is required",
                    })}
                    />
                    Negotiable<span className='text-red-500'>*</span>
                </label>
                {errors.negotiable && <p className="text-red-500 text-sm mt-1">{errors.negotiable.message}</p>}
                </div>

            </div>

            <div className='text-left mt-4'>
            <label htmlFor="contractCopy">Upload Contract Copy (PDF only)<span className='text-red-500'>*</span></label>
            <input
                type="file"
                accept="application/pdf"
                {...register("contractCopy", {
                required: "Please upload a contract copy.",
                validate: {
                    isPdf: (value: FileList) =>
                    value?.[0]?.type === "application/pdf" || "Only PDF files are allowed.",
                    isUnder5MB: (value: FileList) =>
                    value?.[0]?.size <= 5 * 1024 * 1024 || "File size must be under 5MB",
                },
                })}
                className="input_primary auth_input"
            />
            {errors.contractCopy && (
                <p className="text-red-500 text-sm mt-1">{errors.contractCopy.message}</p>
            )}
            </div>

            <div className="flex justify-start mt-4">
              <button
                  className="flex items-center gap-1 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                  <SendIcon className='h-4 w-4'/>
                  {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
              </div>
          </form>
        </div>
      </div>
    )
  }

export default UploadProfile