import { SendIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';


{/* Add validation to the forms */}

interface EditProfileModalProps{
    onClose: () => void;
    isOpen: boolean;
    fullDetails:any;
}
const EditProfileModal:React.FC<EditProfileModalProps> = ({  
    onClose,
    isOpen,
    fullDetails,
}) => {
      const { register, handleSubmit, reset, setValue, watch,formState: { errors },} = useForm({ mode: "onChange",
      defaultValues: {
        candidateName: "",
        candidateEmail: "",
        contactNumber: "",
        currentCompany: "",
        // phoneNumberDetails: {
        //   countryCode: "",
        //   phoneNumber: "",
        // },
        currentDesignation: "",
        YOE: "",
        currentCTC: "",
        expectedCTC: "",
        locationComfortableWith: "",
        noticePeriod: "",
        coolingPeriod: "",
        referredBy:"",
      },
    });
    const [visible, setVisible] = useState(false);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [isSubmitting,setIsSubmitting]  = useState(false);
    
    useEffect(() => {
    if (isOpen && fullDetails) {
        reset({
            candidateName: fullDetails.candidateName || "",
            candidateEmail: fullDetails.candidateEmail || "",
            contactNumber:fullDetails.contactNumber || "",
            // phoneNumberDetails: {
            // countryCode: fullDetails.phoneNumberDetails?.countryCode || "",
            // phoneNumber: fullDetails.phoneNumberDetails?.phoneNumber || "",
            // },
            currentCompany: fullDetails.currentCompany || "",
            currentDesignation:fullDetails.currentDesignation || "",
            YOE: fullDetails.YOE || "",
            currentCTC: fullDetails.currentCTC || "",
            expectedCTC: fullDetails.expectedCTC || "",
            locationComfortableWith: fullDetails.locationComfortableWith || "",
            noticePeriod: fullDetails.noticePeriod || "",
            coolingPeriod: fullDetails.coolingPeriod || "",
            referredBy:fullDetails.referredBy || "",
        })
        setVisible(true);
        const timer = setTimeout(() => setIsAnimatingIn(true), 10);
        return () => clearTimeout(timer);
    } else {
        setIsAnimatingIn(false);
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
    }
    }, [isOpen,fullDetails,reset]);

    const formSubmit = (data:any) =>{
        console.log(data)
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
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">Edit profile</h2>

        <form onSubmit={handleSubmit(formSubmit)}>
            <div className='text-left'>
                <label htmlFor="">Candidate Name <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("candidateName")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate Email <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("candidateEmail")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate contact no <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("contactNumber")}/>
            </div>
            
            <div className='text-left'>
                <label htmlFor="">Current company <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("currentCompany")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Current designation <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("currentDesignation")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Total YOE <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("YOE")}/>
            </div>
            <div className='flex gap-2'>
                <div className='text-left flex-1'>
                    <label htmlFor="">Current CTC <span className='text-red-500'>*</span></label>
                    <input type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("currentCTC")}/>
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="">Expected CTC <span className='text-red-500'>*</span></label>
                    <input type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("expectedCTC")}/>
                </div>
            </div>
            <div className='flex gap-2'>     
                <div className='text-left flex-1'>           
                    <label htmlFor="">Location <span className='text-red-500'>*</span></label>
                    <input type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("locationComfortableWith")}/>
                </div>
            <div className='text-left flex-1'>
                <label htmlFor="">Notice Period <span className='text-red-500'>*</span></label>
                <select 
                    className="input_primary auth_input capitalize"
                    {...register("noticePeriod")}
                >
                    <option value="">Select notice period</option>
                    <option value="15">15 days</option>
                    <option value="30">30 days</option>
                    <option value="45">45 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                </select>
            </div>
            </div>
            <div className='text-left'>
                <label htmlFor="">Referred by / Added by <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("referredBy")}/>
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

export default EditProfileModal