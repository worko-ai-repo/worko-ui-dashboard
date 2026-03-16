import { AgencyDatabaseApplicantDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import { SendIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';

interface UploadToAwsData{
  awsS3SignedUrl: string;
  cloudFileName: string;
  fileExtension: string;
  fileMimeType: string;
  userFileName: string;
}
interface FormValues {
  name: string;
  email: string;
  contactNumber: number | null;
  currentCompany: string;
  currentDesignation: string;
  totalYOE: number | null;
  currentCTC: number;
  expectedCTC: number;
  location: string;
  noticePeriod: number;
  cv: FileList;
  referredBy:string;
}
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
      const { register, handleSubmit, reset, setValue, watch,formState: { errors },} = useForm<FormValues>({ mode: "onChange",
      defaultValues: {
        name: "",
        email: "",
        contactNumber: null,
        currentCompany: "",
        // phoneNumberDetails: {
        //   countryCode: "",
        //   phoneNumber: "",
        // },
        currentDesignation: "",
        totalYOE: null,
        currentCTC: 0,
        expectedCTC: 0,
        location: "",
        noticePeriod: 0,
        // coolingPeriodCompanies: "",
        referredBy:"",
      },
    });
    // const [visible, setVisible] = useState(false);
    // const [isAnimatingIn, setIsAnimatingIn] = useState(false);
    const [isSubmitting,setIsSubmitting]  = useState(false);
    const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
    // const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    if (isOpen && candidateFullDetails) {
        reset({
            name: candidateFullDetails?.candidateParsedCvDetails?.name || "",
            email: candidateFullDetails?.candidateParsedCvDetails?.email || "",
            contactNumber:candidateFullDetails?.candidateParsedCvDetails?.phoneNumberDetails?.number || null,
            currentCompany: candidateFullDetails?.candidateParsedCvDetails?.currentCompany || "",
            currentDesignation:candidateFullDetails?.candidateParsedCvDetails?.currentDesignation || "",
            totalYOE: candidateFullDetails?.candidateParsedCvDetails?.totalYOE || 0,
            currentCTC: candidateFullDetails?.candidateParsedCvDetails?.currentCTC || 0,
            expectedCTC: candidateFullDetails?.candidateParsedCvDetails?.expectedCTC || 0,
            location: candidateFullDetails?.candidateParsedCvDetails?.location || "",
            noticePeriod: candidateFullDetails?.candidateParsedCvDetails?.noticePeriod || 0,
            // coolingPeriodCompanies: candidateFullDetails.coolingPeriodCompanies || "",
            referredBy:candidateFullDetails.referredBy || "",
            cv:undefined,
        })
        // setVisible(true);
        // const timer = setTimeout(() => setIsAnimatingIn(true), 10);
        // return () => clearTimeout(timer);
    } else {
        // setIsAnimatingIn(false);
        // const timer = setTimeout(() => setVisible(false), 300);
        // return () => clearTimeout(timer);
    }
    }, [isOpen,candidateFullDetails,reset]);

    const formSubmit = async (data:any) => {
        const candidateID = candidateFullDetails?.candidateParsedCvDetails?.id
        if(!candidateID){
            toast.error("Candidate Id not found",getToastOptions({}))
            return
        }
        setIsSubmitting(true)
        try {
        if(data?.cv?.length){
          const responseFromUpload:any = await uploadCv(candidateFullDetails,data?.cv)
          if(!responseFromUpload?.success){
            return
          }
          if(responseFromUpload?.success){
            data.cvAwsS3FileName = responseFromUpload?.data?.data?.cloudFileName
          }
        }

        for (const key in data) {
            if (data[key] === "" || key === "cv" || data[key] === null || Number.isNaN(data[key])) {
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

    const uploadCv = async (candidateFullDetails:AgencyDatabaseApplicantDetailsDto,cv:FileList) =>{
        const resourceType = candidateFullDetails?.candidateParsedCvDetails?.cvAwsS3ResourceType || ""
        const pathName = candidateFullDetails?.candidateParsedCvDetails?.cvAwsS3FilePath?.split("/")
        let payload = {}
        if(resourceType === "AGENCY_SUBMIT_USER_CV"){
          payload = {
            companyId:pathName[3],
            jobId:pathName[5],
            fileName: cv[0]?.name,
            fileMimeType: cv[0]?.type,
          }
        }
        if(resourceType === "CAND_SUBMIT_CV_JOB"){
          payload = {
            companyId:pathName[2],
            jobId:pathName[4],
            fileName: cv[0]?.name,
            fileMimeType: cv[0]?.type,
          }
        }
        if(resourceType === "USER_RESUME"){
          payload = {
            userId:pathName[1],
            resumeUserFileName: cv[0]?.name,
            resumeFileMimeType: cv[0]?.type
          }
        }
        if(resourceType === "BULK_CVS"){
          payload = {
            companyId: pathName[1],
            corporateBulkJdId: pathName[3],
            fileName: cv[0]?.name,
            fileMimeType: cv[0]?.type,
          }
        }
        if(resourceType === "CORP_CAND_BULK_CV_UPLOAD"){
          payload = {
            companyId: pathName[1],
            fileName: cv[0]?.name,
            fileMimeType: cv[0]?.type,
          }
        }
        if(resourceType === "CORP_CAND_REFERRAL_CV"){
          payload = {
            companyId: pathName[1],
            fileName: cv[0]?.name,
            fileMimeType: cv[0]?.type,
          }
        }
        if(resourceType === "ADMIN_CAND_BULK_CV_UPLOAD"){
          payload = {
            fileName: cv[0]?.name,
            fileMimeType: cv[0]?.type,
          }
        }
        let url = `/file/gsu2u/${resourceType}`

        const responseFromAws = await creatingRequestToUploadToAws(payload, url, resourceType);
        if (!responseFromAws.success) {
          toast.error("Failed to upload resume", getToastOptions({}));
          setIsSubmitting(false)
          return { success: false};
        }
        const payloadForFileUpload = {
          fileType: responseFromAws?.data?.fileMimeType
        }
        const fileUpload = await uploadFileToAws(responseFromAws?.data?.awsS3SignedUrl, cv[0],payloadForFileUpload);
        
        return { success: true, data: responseFromAws };
        //         const updatedPayload = {
        //   cvAwsS3FileName: responseFromAws?.data?.cloudFileName,
        // }
        // try {
        //     const {response, error} = await httpServiceObj.patch(`/candidate-parsed-cv/${candidateFullDetails?.candidateParsedCvDetails?.id}`,updatedPayload,true,{},false,"AGENCY")
        //     // if(error){
        //     // toast.error(error.message,getToastOptions({}))
        //     if(response){
        //         return { success: true, data: response };
        //     }
        //     if(error){
        //         return { success: false, data: error};
        //     }  
        // // }
        // } catch (error) {
        //     console.error(error)
        //     setIsSubmitting(false)
        // } 
    }

    const creatingRequestToUploadToAws = async (payload: any,url: string, base: string) => {
        try {
          const { response, error } = await httpServiceObj.post<UploadToAwsData>(url, payload, true, {}, false,(base === "USER_RESUME" || base === "BULK_CVS") ? "BASE" : "AGENCY");
          if (response) {
            return { success: true, data: response };
          }
          if(error){
            toast.error(error.message,getToastOptions({}))
          }
          return { success: false };
        } catch (error) {
          console.error("Upload failed:", error);
          return { success: false, error };
        }
      };

    const uploadFileToAws = async (url:any,contractFile:any,payload: any) => {
        try {
          const { response } = await httpServiceObj.put(url, contractFile, false, payload, true);
          if (response) {
            return { success: true, data: response };
          }
          return { success: false };
        } catch (error) {
          console.error("Upload failed:", error);
          return { success: false, error };
        }
      };

  return (
    // <div
    //   onMouseDown={(e) => {
    //     if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
    //       reset();
    //       onClose();
    //     }
    //   }}
    //   className={`fixed inset-0 z-[100] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
    //     isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
    //   } ${visible ? "visible" : "invisible"}`}>
    //   <div
    //     ref={modalRef}
    //     className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[100vh] overflow-y-auto ${
    //       !isAnimatingIn ? "animate-slide-out" : "animate-slide-in"
    //     }`}>
          <div className='py-6'>
        {/* <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button> */}

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
                className="input_primary auth_input"
                {...register("email")}/>
            </div>

            <div className='text-left'>
                <label htmlFor="">Candidate contact no 
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input disabled={true} type="number" 
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
                    max={300}
                    step={0.1} 
                    placeholder='Enter your salary in LPA'
                    className="input_primary auth_input capitalize placeholder:text-xs"
                    {...register("currentCTC",{ valueAsNumber: true })}/>
                    <p className='text-xs text-slate-500 text-left'>Enter your salary in LPA(e.g., 25 for 25,00,000 Lakhs per annum).</p>
                </div>
                <div className='text-left flex-1'>
                    <label htmlFor="">Expected CTC(LPA)
                        {/* <span className='text-red-500'>*</span> */}
                    </label>
                    <input 
                    type="number"
                    min={0}
                    max={400}
                    step={0.1} 
                    placeholder='Enter your salary in LPA'
                    className="input_primary auth_input capitalize placeholder:text-xs"
                    {...register("expectedCTC",{ valueAsNumber: true,            
                        validate: (value) => {
                        const current = watch("currentCTC");
                        const expectedNum = Number(value ?? 0);
                        const currentNum = Number(current ?? 0);
                        if (isNaN(currentNum)) return true;
                        if (isNaN(expectedNum)) return true;
                        return expectedNum >= currentNum || "Expected CTC cannot be less than Current CTC";
                    }})}/>
                    {errors.expectedCTC && (<p className="text-red-500 text-sm">{errors.expectedCTC.message}</p>
                    )}
                    <p className='text-xs text-slate-500 text-left'>Enter your salary in LPA(e.g., 25 for 25,00,000 Lakhs per annum).</p>
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
            <div className='text-left mt-4'>
              <label htmlFor="cv">CV (PDF only)<span className='text-red-500'>*</span></label>
              <input
                  type="file"
                  accept="application/pdf"
                  {...register("cv", {
                    validate: {
                        isPdf: (value: FileList) => {
                            if (!value || value.length === 0) return true; // optional
                            return value[0].type === "application/pdf" || "Only PDF files are allowed.";
                        },
                        isUnder3MB: (value: FileList) => {
                            if (!value || value.length === 0) return true; // optional
                            return value[0].size <= 3 * 1024 * 1024 || "File size must be under 3MB";
                        },
                    },
                  })}
                  className="input_primary auth_input"
                  onChange={(e) => register("cv").onChange(e)}
              />
              {errors.cv && (
                  <p className="text-red-500 text-sm mt-1">{errors.cv.message}</p>
              )}
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
    // </div>
  )
}

export default EditProfileModal