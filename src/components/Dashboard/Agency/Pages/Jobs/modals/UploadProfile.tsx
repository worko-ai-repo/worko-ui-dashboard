import { AgencyJobsList } from '@Interfaces/AgencyDashboardList.dto';
import { SendIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import DuplicateModal from './DuplicateModal';

interface UploadProfileProps{
    dashboardType:string;
    onClose: () => void;
    isOpen: boolean;
    rowData: AgencyJobsList | null;
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
  cv: FileList;
  comments:string;
}

const UploadProfile:React.FC<UploadProfileProps> = ({dashboardType,onClose,isOpen,rowData}) => {
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
          comments:"",
        },
      });
      const [visible, setVisible] = useState(false);
      const [isAnimatingIn, setIsAnimatingIn] = useState(false);
      const [isSubmitting,setIsSubmitting]  = useState(false);
      const [isDuplicateModal,setIsDuplicateModal] = useState(false);

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
        setIsDuplicateModal(true)
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
                  placeholder='rahulyadav@gmail.com'
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
                        required: "candidate contact number is required",
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

              {/* ask if current company is optional or manditory*/}
              <div className='text-left'>
                  <label htmlFor="">Current company<span className='text-red-500'>*</span></label>
                  <input 
                  placeholder='Infosys'
                  type="text" 
                  className="input_primary auth_input"
                  {...register("currentCompany",{required:"Current company is required"})}
                  />
                  {errors.currentCompany && <p className="text-red-500 text-sm mt-1">{errors.currentCompany.message}</p>}
              </div>

              <div className='text-left'>
                  <label htmlFor="">Current designation<span className='text-red-500'>*</span></label>
                  <input 
                    placeholder='sales manager'
                    type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("currentDesignation", {required: "please specify the designation"})}
                  />
                {errors.currentDesignation && <p className="text-red-500 text-sm mt-1">{errors.currentDesignation.message}</p>}
              </div>

            {/* ask if experience is in months how to handle and what is its a fresher*/} {/* total and relevant yoe */}
            <div className='flex flex-row gap-3'>
                <div className='text-left'>
                    <label htmlFor="">Total YOE (in years)<span className='text-red-500'>*</span></label>
                    <input 
                      placeholder='total experience'
                      type="number" 
                      className="input_primary auth_input"
                      {...register("totalYOE",{required:"total experience must be filled"})}
                    />
                    {errors.totalYOE && <p className="text-red-500 text-sm mt-1">{errors.totalYOE.message}</p>}
                </div>
                <div className='text-left'>
                    <label htmlFor="">Relevant YOE (in years)<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='relevant experience'
                    type="number" 
                    className="input_primary auth_input"
                    {...register("relevantYOE",{required:"relevant experience must be filled"})}
                    />
                    {errors.relevantYOE && <p className="text-red-500 text-sm mt-1">{errors.relevantYOE.message}</p>}
                </div>
            </div>

            {/* current and expected ctc */}
            <div className='flex flex-row gap-3'>
                <div className='text-left'>
                    <label htmlFor="">Current CTC (in LPA)<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='5'
                    type="number" 
                    className="input_primary auth_input"
                    {...register("currentCTC",{required:"current Ctc is required"})}
                    />
                    {errors.currentCTC && <p className="text-red-500 text-sm mt-1">{errors.currentCTC.message}</p>}
                </div>
                <div className='text-left'>
                    <label htmlFor="">Expected CTC (in LPA)<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='7'
                    type="number" 
                    className="input_primary auth_input"
                    {...register("expectedCTC",{required:"expected Ctc is required"})}
                    />
                    {errors.expectedCTC && <p className="text-red-500 text-sm mt-1">{errors.expectedCTC.message}</p>}
                </div>
            </div>

            {/* location and preference */}
            <div className='flex flex-row gap-3'>
                <div className='text-left flex-1'>
                    <label htmlFor="">Location (current)<span className='text-red-500'>*</span></label>
                    <input 
                    placeholder='mumbai'
                    type="text" 
                    className="input_primary auth_input"
                    {...register("location",{required:"current location is required"})}
                    />
                    {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>}
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="">Ready to relocate<span className='text-red-500'>*</span></label>
                    <select
                        className="input_primary auth_input text-gray-300"
                        {...register("relocate", { required: "relocation preference is required" })}
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
                    <label htmlFor="">Notice period (in days)<span className='text-red-500'>*</span></label>
                    <input 
                      placeholder='Notice Period'
                      type="number" 
                      className="input_primary auth_input"
                      {...register("noticePeriod",{required:"notice period is required"})}
                    />
                    {errors.noticePeriod && <p className="text-red-500 text-sm mt-1">{errors.noticePeriod.message}</p>}
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="negotiable" className="flex items-center gap-2">
                    <input
                      id="negotiable"
                      type="checkbox"
                      className="accent-blue-600 w-4 h-4"
                      {...register("negotiable", {required: "negotiable agreement is required",})}
                    />
                    Negotiable<span className='text-red-500'>*</span>
                    </label>
                {errors.negotiable && <p className="text-red-500 text-[11px] mt-1">{errors.negotiable.message}</p>}
                </div>

            </div>

            <div className='text-left mt-4'>
            <label htmlFor="cv">CV (PDF only)<span className='text-red-500'>*</span></label>
            <input
                type="file"
                accept="application/pdf"
                {...register("cv", {
                required: "please upload candidate cv",
                validate: {
                    isPdf: (value: FileList) =>
                    value?.[0]?.type === "application/pdf" || "Only PDF files are allowed.",
                    isUnder5MB: (value: FileList) =>
                    value?.[0]?.size <= 5 * 1024 * 1024 || "File size must be under 5MB",
                },
                })}
                className="input_primary auth_input"
            />
            {errors.cv && (
                <p className="text-red-500 text-sm mt-1">{errors.cv.message}</p>
            )}
            </div>

            <div className='text-left flex-1'>
                <label htmlFor="">Any comments</label>
                <textarea 
                placeholder='comments'
                className="input_primary auth_input"
                {...register("comments")}
                />
            </div>

            <div className="flex justify-start mt-4">
              <button className="flex items-center gap-1 px-3 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                <SendIcon className='h-4 w-4'/>
                {isSubmitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
        <DuplicateModal
          onClose={()=>setIsDuplicateModal(false)}
          isOpen={isDuplicateModal}
          />
      </div>
    )
  }

export default UploadProfile