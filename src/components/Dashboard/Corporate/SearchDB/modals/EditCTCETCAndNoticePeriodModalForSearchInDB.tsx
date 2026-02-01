import { AgencyDatabaseApplicantDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import { SendIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import ConfirmMessageModal from '../../Database/modals/ConfirmMessageModal';


interface EditCTCETCAndNoticePeriodModalForSearchInDBProps{
    dashboardType:string;
    dashboardPage:string;
    onClose: () => void;
    isOpen: boolean;
    // candidateFullDetails:any;
    localUpdate:(jobId:string,updatedData:any) => void;
    candidateList: any[];
    skippableCandidates:any[];
    currentIndex: number;
    setCurrentIndex: (i:number)=>void;
    setCandidateList:any;
    selectedCompany:any;
    setIsFinalReviewModalOpen:(value:boolean) => void;
    setSuccessfullySentCandidateList:(value:string) => void;
    setIncompleteSentCandidateList:(value:string) => void;
}
const EditCTCETCAndNoticePeriodModalForSearchInDB:React.FC<EditCTCETCAndNoticePeriodModalForSearchInDBProps> = ({  
    dashboardType,
    dashboardPage,
    onClose,
    isOpen,
    localUpdate,
    candidateList,
    skippableCandidates,
    currentIndex,
    setCurrentIndex,
    setCandidateList,
    selectedCompany,
    setIsFinalReviewModalOpen,
    setSuccessfullySentCandidateList,
    setIncompleteSentCandidateList,
}) => {
  const { register, handleSubmit, reset, setValue, watch, getValues,formState: { errors },} = useForm({ mode: "onChange",
      defaultValues: {
        currentCTC: 0,
        expectedCTC: 0,
        noticePeriod: 0,
      },
    });
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isSubmitting,setIsSubmitting]  = useState(false);
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const [confirmModal, setConfirmModal] = useState({
        open: false,
        onContinue: () => {},
        onCancel: () => {}
    });
    
  const currentCandidate = candidateList[currentIndex];
  useEffect(() => {
    if (isOpen && currentCandidate) {
        setVisible(true);
        const timer = setTimeout(() => setIsAnimatingIn(true), 10);
        return () => clearTimeout(timer);
    } else {
        setIsAnimatingIn(false);
        const timer = setTimeout(() => setVisible(false), 300);
        return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (currentCandidate) {
        reset({
            currentCTC: currentCandidate?.currentCTC || 0,
            expectedCTC: currentCandidate?.expectedCTC || 0,
            noticePeriod: currentCandidate?.noticePeriod || 0,
        });
    }
  }, [currentCandidate, reset]);

  useEffect(() => {
    if (isOpen && candidateList.length === 0 && skippableCandidates.length > 0) {
        continueSubmit(skippableCandidates);
    }
  }, [isOpen]);

  const formSubmit = async (data:any) => {
    setIsSubmitting(true);

    const updated = [...candidateList];

    updated[currentIndex] = {
        ...updated[currentIndex],
        currentCTC: Number(data.currentCTC),
        expectedCTC: Number(data.expectedCTC),
        noticePeriod: Number(data.noticePeriod),
    };

    // Checking for those candidates for which details is not entered
    const incomplete = updated.filter(c => {
        return !c.currentCTC || !c.expectedCTC || !c.noticePeriod;
    });

    if (incomplete.length > 0) {
      setConfirmModal({
            open: true,
            onContinue: () => continueSubmit(updated),
            onCancel: () => setIsSubmitting(false)
      });
      return;
    }
      // if no then it will end here
      // if yes then we remove those candidates for which either ctc,etc or notice period is missing in the below function
      continueSubmit(updated);
    }

  const continueSubmit = async (updated: any) => {    
    const filtered = updated.filter((c:any) => {
        return c.currentCTC && c.expectedCTC && c.noticePeriod;
    });
    // filtering out candidates with missing details
    const inCompleteCandidates = updated.filter((c:any) => {
        return !c.currentCTC || !c.expectedCTC || !c.noticePeriod;
    });
    const nameOfIncompleteCandidates = inCompleteCandidates.map((row:any)=>{
        return row.name
    })

    // merging both filtered and candidates which already had all details present
    // const finalFilteredList = [...filtered, ...skippableCandidates];
    let finalFilteredList
    if (candidateList.length === 0 && skippableCandidates.length > 0) {
        finalFilteredList = [...skippableCandidates];
    }else{
        finalFilteredList = [...filtered, ...skippableCandidates];
    }
    
    const nameOfCompleteCandidates = finalFilteredList.map((row:any)=>{
        return row.name
    })
    // creating payload for post api
    const companyName = selectedCompany?.companyName
    const jobTitle = selectedCompany?.jobTitle
    const jobId = selectedCompany?.id
    if(!jobId || !jobTitle || !companyName){
    const message = !jobId 
      ? "Job ID not found"
      : !jobTitle 
        ? "Job title not found"
        : "Company name not found"
      toast.error(message,getToastOptions({}))
      setIsSubmitting(false);
      return
    }
    const payload = {
      candidateParsedCvs: finalFilteredList.map(c => ({
        candidateParsedCvId: c.id,
        currentCTC: c.currentCTC,
        expectedCTC: c.expectedCTC,
        noticePeriod: c.noticePeriod
      })),
      companyName,
      jobTitle,
      jobId,
    };
    setCandidateList(updated);
    try {
      const {response,error} =  await httpServiceObj.post(`${agencyBaseUrl}/candidate-parsed-cv/move-to-applicant/bulk`,payload,true,{},true)   
      if(error){
          toast.error(error.message,getToastOptions({}))
          setIsSubmitting(false)
          return
        }
      if(response){
        setSuccessfullySentCandidateList(nameOfCompleteCandidates.join(", "))
        setIncompleteSentCandidateList(nameOfIncompleteCandidates.join(", "))
        toast.success("Details updated and moved to applicant successfully",getToastOptions({}))
        setIsFinalReviewModalOpen(true)
        for (let i = 0; i < payload.candidateParsedCvs.length; i++) {
            const data = payload.candidateParsedCvs[i];
            const parent = updated.find((c:any) => 
                c.id === data.candidateParsedCvId
            );
            if (!parent) continue;
            const updatedData = {
                ...parent,
                currentCTC: data.currentCTC,
                expectedCTC: data.expectedCTC,
                noticePeriod: data.noticePeriod
            };
            localUpdate(parent.id, updatedData);
        }
      }
      reset()
      onClose()
    } catch (error) {
        console.log(error)
    } finally {
        setIsSubmitting(false)
    }
};

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        className={`bg-white rounded-l-lg p-6 w-full max-w-lg relative transform transition-transform duration-300 ease-in-out self-auto max-h-[100vh] overflow-y-auto ${
          isAnimatingIn ? "translate-x-0" : "translate-x-full"
        }`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button>

        <h2 className="text-xl font-semibold mb-2 text-left">Update profile</h2>

        {/* Tabs section */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
        {candidateList.map((c, i) => (
            <button
            key={i}
            onClick={() => {
        // Save current form into candidateList before switching
        const formData = getValues();

        setCandidateList((prev:any) => {
            const updated = [...prev];
            updated[currentIndex] = {
                ...updated[currentIndex],
                currentCTC: Number(formData.currentCTC),
                expectedCTC: Number(formData.expectedCTC),
                noticePeriod: Number(formData.noticePeriod),
            };
            return updated;
        });

        setCurrentIndex(i);
        }}

            data-tooltip-id="my-tooltip"
            data-tooltip-content={c?.name}
            className={`px-3 py-1 text-xs rounded-full border 
            ${i === currentIndex ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
            {/* Candidate {i + 1} */}
            <p className="truncate block w-[60px]">{c?.name}</p>
            
            </button>
        ))}
        </div>

        {/* Red warning text */}
        <h2 className="text-sm text-red-500 mb-4 text-left">
        {`${currentCandidate?.name ?? "Candidate"} profile does not contain CTC, ETC and Notice Period or details are older than 90 days — these fields are mandatory to update`}
        </h2>

        <form onSubmit={handleSubmit(formSubmit)}>
            <div className='text-left'>
                <label htmlFor="">Current CTC(LPA)
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input type="number" 
                className="input_primary auth_input capitalize"
                {...register("currentCTC")}/>
            </div>
            <div className='text-left'>
                <label htmlFor="">Expected CTC(LPA)
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input type="number" 
                className="input_primary auth_input capitalize"
                {...register("expectedCTC")}/>
            </div>    
            {/* <div className='text-left'>
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
            <div className='text-left'>
                <label htmlFor="">Notice Period(in days)
                    {/* <span className='text-red-500'>*</span> */}
                </label>
                <input 
                    type="number"
                    className="input_primary auth_input"
                    {...register("noticePeriod", {
                        valueAsNumber: true,
                    })}
                />
                {errors.noticePeriod && <p className="text-red-500 text-sm">Please enter a valid number</p>}
            </div>
            <div className="flex justify-start mt-4 gap-3">
            <button
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-white
                ${isSubmitting 
                    ? "bg-blue-300 cursor-not-allowed opacity-70" 
                    : "bg-blue-500"}`}
            >
                <SendIcon className='h-4 w-4'/>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
                type="button"
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-white bg-blue-500`}
                onClick={onClose}
            >
                Close
            </button>
            </div>
        </form>
      </div>
        {confirmModal.open && (
        <ConfirmMessageModal
            isOpen={confirmModal.open}
            onClose={() => setConfirmModal({...confirmModal, open:false})}
            onContinue={() => {
                confirmModal.onContinue();
                setConfirmModal({...confirmModal, open:false});
            }}
            onCancel={() => {
                confirmModal.onCancel();
                setConfirmModal({...confirmModal, open:false});
            }}
        />
        )}
    </div>
  )
}

export default EditCTCETCAndNoticePeriodModalForSearchInDB