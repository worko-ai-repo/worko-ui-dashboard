import { SendIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';

interface AddNewAgencyModalProps{
  dashboardType:string;
  onClose: () => void;
  isOpen: boolean;
  companyId:string | undefined;
  setFetchData:any;
}

interface FormValues {
  agencyName: string;
  agencyEmail: string;
  contactPersonName: string;
  contactNumber: string;
  GSTIN: string;
  contractCopy: FileList;
}

export interface AwsS3FileUploadResponse {
	// awsS3SignedUrl: string;
	// cloudFileName: string;
	// fileExtension: string;
	// fileMimeType: string;
	// userFileName: string;
	// awsS3Tag:any;
  // objectUrl: string;
  companyId:string;
  agencyInviteEmail:string;
  inviteId:string;
  contractCopyAwsS3FileName:string;
}

const AddNewAgencyModal:React.FC<AddNewAgencyModalProps> = ({dashboardType,onClose,isOpen}) => {
  const { register, handleSubmit, reset, setValue, watch,formState: { errors },} = useForm<FormValues>({ mode: "onChange",
        defaultValues: {
          agencyName: "",
          agencyEmail: "",
          contactPersonName:"",
          contactNumber: "",
          GSTIN: "",
        },
      });
      const [visible, setVisible] = useState(false);
      const [isAnimatingIn, setIsAnimatingIn] = useState(false);
      const [isSubmitting,setIsSubmitting]  = useState(false);
      const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
      
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
  
          <h2 className="text-xl font-semibold mb-4 text-left">Add agency</h2>
  
          <form onSubmit={handleSubmit(formSubmit)}>
            <div className='text-left'>
                <label>Enter agency name<span className='text-red-500'>*</span></label>
                <input
                placeholder='Apex Marketing Pvt Ltd'
                type="text"
                className="input_primary auth_input capitalize"
                {...register("agencyName", { required: "Agency name is required." })}
                />
                {errors.agencyName && <p className="text-red-500 text-sm mt-1">{errors.agencyName.message}</p>}
            </div>
  
              <div className='text-left'>
                  <label htmlFor="">Enter agency email<span className='text-red-500'>*</span></label>
                  <input 
                  placeholder='contact@apexmarketing.com'
                  type="text" 
                  className="input_primary auth_input"
                  {...register("agencyEmail", {
                    required: "Agency email is required",
                    pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Enter a valid email",
                    },
                    })}
                  />
                {errors.agencyEmail && <p className="text-red-500 text-sm mt-1">{errors.agencyEmail.message}</p>}
              </div>
  
              <div className='text-left'>
                  <label htmlFor="">Contact person name<span className='text-red-500'>*</span></label>
                  <input 
                  placeholder='Rahul Sharma'
                  type="text" 
                  className="input_primary auth_input"
                  {...register("contactPersonName",{required:"Contact person name is required"})}
                  />
                  {errors.contactPersonName && <p className="text-red-500 text-sm mt-1">{errors.contactPersonName.message}</p>}
              </div>

              <div className='text-left'>
                  <label htmlFor="">Contact no<span className='text-red-500'>*</span></label>
                  <input
                  placeholder='Enter valid contact number'
                  maxLength={10}
                    type="text"
                    className="input_primary auth_input capitalize"
                    {...register("contactNumber", {
                        required: "Contact no is required",
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
                  {errors.contactNumber && <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>}
              </div>
              

              <div className='text-left'>
                  <label htmlFor="">GSTIN<span className='text-red-500'>*</span></label>
                  <input 
                    placeholder='Enter registered GSTIN no'
                    type="text" 
                    maxLength={15}
                    className="input_primary auth_input capitalize"
                    {...register("GSTIN", {
                        required: "GSTIN no is required",
                        pattern: {
                            value: /^[A-Z0-9]{15}$/i,
                            message: "GSTIN must be exactly 15 characters",
                        },
                        })}
                  />
                {errors.GSTIN && <p className="text-red-500 text-sm mt-1">{errors.GSTIN.message}</p>}
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
                  {isSubmitting ? 'Inviting...' : 'Invite'}
              </button>
              </div>
          </form>
        </div>
      </div>
    )
  }

export default AddNewAgencyModal