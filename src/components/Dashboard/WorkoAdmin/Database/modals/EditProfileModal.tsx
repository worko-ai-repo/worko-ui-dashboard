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
        currentCTC: null,
        expectedCTC: null,
        locationComfortableWith: "",
        noticePeriod: "",
        coolingPeriodCompanies: "",
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
            currentCTC: fullDetails.currentCTC || null,
            expectedCTC: fullDetails.expectedCTC || null,
            locationComfortableWith: fullDetails.locationComfortableWith || "",
            noticePeriod: fullDetails.noticePeriod || "",
            coolingPeriodCompanies: fullDetails.coolingPeriodCompanies || "",
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
                <label htmlFor="">Candidate Name</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("candidateName")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate Email</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("candidateEmail")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate contact no</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("contactNumber")}/>
            </div>
            
            <div className='text-left'>
                <label htmlFor="">Current company</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("currentCompany")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Current designation</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("currentDesignation")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Total YOE</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("YOE")}/>
            </div>
            <div className='flex gap-2'>
                <div className='text-left flex-1'>
                    <label htmlFor="">Current CTC</label>
                    <input 
                    type="number"
                    step={0.1}
                    min={0}
                    max={300}  
                    placeholder='Enter your salary in LPA'
                    className="input_primary auth_input capitalize placeholder:text-xs"
                    {...register("currentCTC",{ valueAsNumber: true })}/>
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="">Expected CTC</label>
                    <input
                    type="number"
                    step={0.1}
                    min={0}
                    max={400}
                    placeholder='Enter your salary in LPA'
                    className="input_primary auth_input capitalize placeholder:text-xs"
                    {...register("expectedCTC",{ valueAsNumber: true,                         
                        validate: (value) => {
                        const current = watch("currentCTC");
                        const expectedNum = Number(value ?? 0);
                        const currentNum = Number(current ?? 0);
                        return expectedNum >= currentNum || "Expected CTC cannot be less than Current CTC";
                    }})}/>
                    {errors.expectedCTC && (<p className="text-red-500 text-sm">{errors.expectedCTC.message}</p>
                    )}
                    <p className='text-xs text-slate-500 text-left'>Enter your salary in LPA(e.g., 25 for 25,00,000 Lakhs per annum).</p>
                </div>
            </div>
            <div className='flex gap-2'>     
                <div className='text-left flex-1'>           
                    <label htmlFor="">Location</label>
                    <input type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("locationComfortableWith")}/>
                </div>
                {/* <div className='text-left flex-1'>
                    <label htmlFor="">Notice Period</label>
                    <input type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("noticePeriod")}/>
                </div> */}
            <div className='text-left flex-1'>
                <label htmlFor="">Notice period (in days)
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <select
                    className="input_primary auth_input"
                    {...register("noticePeriod", {
                        valueAsNumber: true,
                    })}
                >
                    <option value={0}>Immediate</option>
                    <option value={15}>15 Days</option>
                    <option value={30}>30 Days</option>
                    <option value={45}>45 Days</option>
                    <option value={60}>60 Days</option>
                    <option value={90}>90 Days</option>
                    <option value={120}>120 Days</option>
                </select>
                {errors.noticePeriod && <p className="text-red-500 text-sm">Please select from the options</p>}
            </div>
            </div>
            <div className='text-left'>
                <label className='text-left' htmlFor="">Cooling period companies</label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("coolingPeriodCompanies")}/>
            </div>
            <div className="flex justify-start mt-4">
            <button
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-white text-xs
                ${isSubmitting 
                    ? "bg-blue-300 cursor-not-allowed opacity-70" 
                    : "bg-blue-500"}`}
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