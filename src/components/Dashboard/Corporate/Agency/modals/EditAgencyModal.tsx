import { useAppContext } from '@Context/App.context';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from '@Utils/Toast.utils';
import { SendIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface EditAgencyModalProps{
    dashboardType:string;
    onClose: () => void;
    isOpen: boolean;
    data:any;
    localUpdate: (id: string, updatedData: Partial<FormValues>) => void;
}

export interface FormValues {
  agencyName: string;
  agencyEmail: string;
  contactPersonName: string;
  contactNumber: string;
  GSTIN: string;
  contractCopy: FileList;
}

const EditAgencyModal:React.FC<EditAgencyModalProps> = ({dashboardType,onClose,isOpen,data,localUpdate}) => {
  const { register, handleSubmit, reset, setValue, watch,formState: { errors },} = useForm<FormValues>({ mode: "onChange",
        defaultValues: {
          agencyName: data?.agencyName,
          agencyEmail: data?.email,
          contactPersonName:data?.name,
          contactNumber: data?.phoneNumberDetails?.number,
          GSTIN: data?.GSTIN,
        },
      });
      const [visible, setVisible] = useState(false);
      const [isAnimatingIn, setIsAnimatingIn] = useState(false);
      const [isSubmitting,setIsSubmitting]  = useState(false);
      const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
      const { userDetails } = useAppContext();

      useEffect(() => {
      if (isOpen && data) {
            reset({
            agencyName: data.agencyName || "",
            agencyEmail: data.email || "",
            contactPersonName: data.name || "",
            contactNumber: data?.phoneNumberDetails?.number || "",
            GSTIN: data.GSTIN || "",
            contractCopy: data.contractCopy,
            });
          setVisible(true);
          const timer = setTimeout(() => setIsAnimatingIn(true), 10);
          return () => clearTimeout(timer);
      } else {
          setIsAnimatingIn(false);
          const timer = setTimeout(() => setVisible(false), 300);
          return () => clearTimeout(timer);
      }
      }, [isOpen,data,reset]);
  
    const formSubmit = async (data: any) => {
      // setIsSubmitting(true)

      // if(!data.agencyEmail || !data.agencyName || !data.contactNumber || !data.contactPersonName){
      //   console.log(data)
      //   toast.error("Please fill all mandatory fields",getToastOptions({}))
      //   setIsSubmitting(false);
      //   return
      // }

      // const hasContract = data?.contractCopy?.length > 0;
      // if(!hasContract){
      //   let payload

      //   if(data?.GSTIN?.trim()){
      //       payload = {
      //       agencyName: data?.agencyName,
      //       email: data?.agencyEmail,
      //       phoneNumberDetails: {
      //           number: Number(data.contactNumber),
      //           countryCode: 91
      //       },
      //       name:data?.contactPersonName,
      //       GSTIN: data?.GSTIN,
      //       companyId:userDetails?.companyId,
      //     }
      //   }else{
      //     payload = {
      //       agencyName: data?.agencyName,
      //       email: data?.agencyEmail,
      //       phoneNumberDetails: {
      //           number: Number(data.contactNumber),
      //           countryCode: 91
      //       },
      //       name:data?.contactPersonName,
      //       companyId:userDetails?.companyId,
      //     }
      //   }
      //   console.log(payload,"payload")
      //   try {
      //     const uploadResponse:any = await invitingAgency(payload);
      //     if (!uploadResponse.success) {
      //       toast.error("Failed to invite agency. Please try again.", getToastOptions({}));
      //       return; 
      //     }
      //     toast.success("Agency invited successfully!", getToastOptions({}));
      //     // setFetchData((prev:any) => ([...(prev ?? []), uploadResponse.data]));
      //     reset();
      //     onClose();
      //     return
      //   } catch (error) {
      //       console.error("Unexpected error:", error);
      //       toast.error("Failed to invite agency, Please try again later.", getToastOptions({}));
      //   } finally{
      //       setIsSubmitting(false)
      //   }
      // }
      
      const contractFile = data.contractCopy?.[0];

      const updatedData = {
        name: data.agency,
        email: data.email,
        contactName: data.contactName,
        contactNumber: data.contactNumber,
        GSTIN: data.GSTIN,
        contractCopyAwsS3FileName:contractFile.name,
      };
      
      localUpdate(data.id, updatedData);

      reset();
      onClose();
      }

      const invitingAgency = async (payload: any) => {
        try {
          const { response } = await httpServiceObj.post(`${agencyBaseUrl}/agency-invite/`, payload, true, {}, true);
          if (response) {
            return { success: true, data: response };
          }
          return { success: false };
        } catch (error) {
          console.error("Upload failed:", error);
          return { success: false, error };
        }
      };

//   @TODO handle the already uploaded contract copy and mobile number 
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
  
          <h2 className="text-xl font-semibold mb-4 text-left">Edit agency</h2>
  
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
                  <label htmlFor="">GSTIN</label>
                  <input 
                    placeholder='Enter registered GSTIN no'
                    type="text" 
                    maxLength={15}
                    className="input_primary auth_input capitalize"
                    {...register("GSTIN", {
                      validate: value => {
                        if (!value) return true;
                        return /^[A-Z0-9]{15}$/i.test(value) || "GSTIN must be exactly 15 alphanumeric characters";
                      },
                    })}
                  />
                {errors.GSTIN && <p className="text-red-500 text-sm mt-1">{errors.GSTIN.message}</p>}
              </div>

            <div className='text-left mt-4'>
            <label htmlFor="contractCopy">Upload Contract Copy (PDF only) max 5MB</label>
            <input
                type="file"
                accept="application/pdf"
                {...register("contractCopy", {
               validate: (value: FileList) => {
                    if (!value || value.length === 0) return true;
                    const file = value[0];
                    if (file.type !== "application/pdf") {
                      return "Only PDF files are allowed.";
                    }
                    if (file.size > 5 * 1024 * 1024) {
                      return "File size must be under 5MB.";
                    }
                    return true;
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

export default EditAgencyModal