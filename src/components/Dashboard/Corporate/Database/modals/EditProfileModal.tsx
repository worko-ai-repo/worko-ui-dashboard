import { AgencyDatabaseApplicantDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import { SendIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';


{/* Add validation to the forms */}

interface EditProfileModalProps{
    onClose: () => void;
    isOpen: boolean;
    candidateFullDetails:any;
    localUpdate:(jobId:string,updatedData:any) => void;
}
const EditProfileModal:React.FC<EditProfileModalProps> = ({  
    onClose,
    isOpen,
    candidateFullDetails,
    localUpdate
}) => {
      const { register, handleSubmit, reset, setValue, watch,formState: { errors },} = useForm({ mode: "onChange",
      defaultValues: {
        name: "",
        email: "",
        contactNumber: "",
        currentCompany: "",
        // phoneNumberDetails: {
        //   countryCode: "",
        //   phoneNumber: "",
        // },
        currentDesignation: "",
        totalYOE: null,
        currentCTC: "",
        expectedCTC: "",
        location: "",
        noticePeriod: "",
        // coolingPeriodCompanies: "",
        referredBy:"",
      },
    });
    const [visible, setVisible] = useState(false);
    const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [isSubmitting,setIsSubmitting]  = useState(false);
    const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    if (isOpen && candidateFullDetails) {
        reset({
            name: candidateFullDetails?.candidateParsedCvDetails?.name || "",
            email: candidateFullDetails?.candidateParsedCvDetails?.email || "",
            contactNumber:candidateFullDetails?.candidateParsedCvDetails?.phoneNumberDetails?.number || "",
            currentCompany: candidateFullDetails?.candidateParsedCvDetails?.currentCompany || "",
            currentDesignation:candidateFullDetails?.candidateParsedCvDetails?.currentDesignation || "",
            totalYOE: candidateFullDetails?.candidateParsedCvDetails?.totalYOE || 0,
            currentCTC: candidateFullDetails?.candidateParsedCvDetails?.currentCTC || 0,
            expectedCTC: candidateFullDetails?.candidateParsedCvDetails?.expectedCTC || 0,
            location: candidateFullDetails?.candidateParsedCvDetails?.location || "",
            noticePeriod: candidateFullDetails?.candidateParsedCvDetails?.noticePeriod || 0,
            // coolingPeriodCompanies: candidateFullDetails.coolingPeriodCompanies || "",
            referredBy:candidateFullDetails.referredBy || "",
        })
        setVisible(true);
        const timer = setTimeout(() => setIsAnimatingIn(true), 10);
        return () => clearTimeout(timer);
    } else {
        setIsAnimatingIn(false);
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
    }
    }, [isOpen,candidateFullDetails,reset]);

    const formSubmit = async (data:any) => {
        setIsSubmitting(true)
        const candidateID = candidateFullDetails?.candidateParsedCvDetails?.id
        if(!candidateID){
            toast.error("Candidate Id not found",getToastOptions({}))
            return
        }
        try {
        for(const key in data){
            if(data[key] === ""){
                delete data[key];
            }
        }
        // const hasDifference = Object.keys(candidateFullDetails?.candidateParsedCvDetails).some(
        //     key => key in data && candidateFullDetails?.candidateParsedCvDetails[key] !== data[key]
        // );
        // console.log(candidateFullDetails?.candidateParsedCvDetails)
        // console.log(data)
        // if(!hasDifference){
        //     toast.error("Cannot update same details",getToastOptions({}))
        //     return
        // }
        
        const {response,error} =  await httpServiceObj.patch(`${agencyBaseUrl}/candidate-parsed-cv/${candidateID}`,data,true,{},true)   
        if(error){
            toast.error(error.message,getToastOptions({}))
            return
        }
        if(response){
            toast.success("Details updated successfully",getToastOptions({}))
            const parentFields = ['refereeName', 'refereeType', "referredBy"];
            const childFields: any = {};

            // Split data
            const parentData: any = {};
            Object.entries(data).forEach(([key, value]) => {
            if (parentFields.includes(key)) parentData[key] = value;
            else childFields[key] = value;
            });

            // Create structured payload
            const payload = {
            ...parentData,
            candidateParsedCvDetails: {...childFields}
            };
            localUpdate(candidateFullDetails?.id, {
                ...candidateFullDetails,
                ...parentData,
                candidateParsedCvDetails: {
                    ...candidateFullDetails.candidateParsedCvDetails, 
                    ...childFields
                }
            });
        }
        reset()
        onClose()
        } catch (error) {
            console.log(error)
        } finally {
            setIsSubmitting(false)
        }
    }

  return (
    <div
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          // reset();
          onClose();
        }
      }}
      className={`fixed inset-0 z-[100] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        ref={modalRef}
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[100vh] overflow-y-auto ${
          !isAnimatingIn ? "animate-slide-out" : "animate-slide-in"
        }`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button>

        <h2 className="text-xl font-semibold mb-4 text-left">Edit profile</h2>

        <form onSubmit={handleSubmit(formSubmit)}>
            <div className='text-left'>
                <label htmlFor="">Candidate Name 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("name")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate Email 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input disabled={true} type="text" 
                className="input_primary auth_input capitalize"
                {...register("email")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate contact no 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input disabled={true} type="text" 
                className="input_primary auth_input capitalize"
                {...register("contactNumber")}/>
            </div>
            
            <div className='text-left'>
                <label htmlFor="">Current company 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("currentCompany")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Current designation 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("currentDesignation")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Total YOE 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input 
                    type="number"
                    step="0.1" //allows in decimal
                    className="input_primary auth_input"
                    {...register("totalYOE", {
                        valueAsNumber: true,
                    })}
                />
                {errors.totalYOE && <p className="text-red-500 text-sm">Please enter a valid number</p>}
            </div>

            <div className='flex gap-2'>
                <div className='text-left flex-1'>
                    <label htmlFor="">Current CTC(LPA)
                        {/* <span className='text-red-500'>*</span> */}
                    </label>
                    <input 
                    type="number"
                    min={0}
                    step={0.1} 
                    className="input_primary auth_input capitalize"
                    {...register("currentCTC",{ valueAsNumber: true })}/>
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="">Expected CTC(LPA)
                        {/* <span className='text-red-500'>*</span> */}
                    </label>
                    <input 
                    type="number"
                    min={0}
                    step={0.1} 
                    className="input_primary auth_input capitalize"
                    {...register("expectedCTC",{ valueAsNumber: true,            
                        validate: (value) => {
                        const current = watch("currentCTC");
                        return value >= current || "Expected CTC cannot be less than Current CTC";
                    }})}/>
                    {errors.expectedCTC && (<p className="text-red-500 text-sm">{errors.expectedCTC.message}</p>
                    )}
                </div>
            </div>
            <div className='flex gap-2'>     
                <div className='text-left flex-1'>           
                    <label htmlFor="">Location 
                        {/* <span className='text-red-500'>*</span> */}
                    </label>
                    <input type="text" 
                    className="input_primary auth_input capitalize"
                    {...register("location")}/>
                </div>
            {/* <div className='text-left flex-1'>
                <label htmlFor="">Notice Period <span className='text-red-500'>*</span></label>
                <select 
                    className="input_primary auth_input capitalize"
                    {...register("noticePeriod")}
                >
                    <option value="">Select notice period</option>
                    <option value="15">15</option>
                    <option value="30">30</option>
                    <option value="45">45</option>
                    <option value="60">60</option>
                    <option value="90">90</option>
                </select>
            </div> */}
            {/* <div className='text-left flex-1'>
                <label htmlFor="">Notice Period(in days)
                    <span className='text-red-500'>*</span>
                </label>
                <input 
                    type="number"
                    className="input_primary auth_input"
                    {...register("noticePeriod", {
                        valueAsNumber: true,
                    })}
                />
                {errors.noticePeriod && <p className="text-red-500 text-sm">Please enter a valid number</p>}
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
            {/* <div className='text-left'>
                <label htmlFor="">Referred by / Added by <span className='text-red-500'>*</span></label>
                <input type="text" 
                className="input_primary auth_input capitalize"
                {...register("referredBy")}/>
            </div> */}
            <div className="flex justify-start mt-4">
            <button
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-white
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