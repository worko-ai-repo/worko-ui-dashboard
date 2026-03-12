import { AgencyDatabaseApplicantDetailsDto } from '@Interfaces/AgencyDatabaseApplicantDetailsDto';
import httpServiceObj from '@Services/ApiHandler.service';
import { getToastOptions } from 'lib-worko-ui';
import { SendIcon } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import ConfirmMessageModal from '../../Database/modals/ConfirmMessageModal';

interface EditCTCETCAndNoticePeriodModalForAgencyCandidatesProps{
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
    setIsFinalReviewModalOpen:(value:boolean) => void;
    setSuccessfullySentCandidateList:(value:string) => void;
    setIncompleteSentCandidateList:(value:string) => void;
    setSelectedRows?:(value:any[]) => void;
    setAcceptingCandidate?:(value:boolean) =>void;
}
const EditCTCETCAndNoticePeriodModalForAgencyCandidates:React.FC<EditCTCETCAndNoticePeriodModalForAgencyCandidatesProps> = ({  
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
    setIsFinalReviewModalOpen,
    setSuccessfullySentCandidateList,
    setIncompleteSentCandidateList,
    setSelectedRows,
    setAcceptingCandidate,
}) => {
  const { register, handleSubmit, reset, setValue, watch, getValues,formState: { errors },} = useForm({ mode: "onChange",
      defaultValues: {
        currentCTC: null,
        expectedCTC: null,
        noticePeriod: 0,
      },
    });
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isSubmitting,setIsSubmitting]  = useState(false);
  const agencyBaseUrl = import.meta.env.APP_PROXY_AGENCY_BASE;
  const modalRef = useRef<HTMLDivElement>(null);
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
            currentCTC: currentCandidate?.candidateParsedCvDetails?.currentCTC || null,
            expectedCTC: currentCandidate?.candidateParsedCvDetails?.expectedCTC || null,
            noticePeriod: currentCandidate?.candidateParsedCvDetails?.noticePeriod || 0,
        });
    }
  }, [currentCandidate, reset]);

  useEffect(() => {
    if (isOpen && candidateList.length === 0 && skippableCandidates.length > 0) {
        continueSubmit(skippableCandidates);
    }
  }, [isOpen, candidateList, skippableCandidates]);

  const formSubmit = async (data:any) => {
    setIsSubmitting(true);

    const updated = [...candidateList];

    updated[currentIndex] = {
        ...updated[currentIndex],
        candidateParsedCvDetails: {
            ...updated[currentIndex].candidateParsedCvDetails,
            currentCTC: data.currentCTC === null || data.currentCTC === "" ? null : Number(data.currentCTC),
            expectedCTC: data.expectedCTC === null || data.expectedCTC === "" ? null : Number(data.expectedCTC),
            noticePeriod: Number(data.noticePeriod),
        },
    };

    // Checking for those candidates for which details is not entered
    const incomplete = updated.filter(c => {
        const d = c.candidateParsedCvDetails;
        return (
            d.currentCTC === null || d.currentCTC === undefined ||
            d.expectedCTC === null || d.expectedCTC === undefined ||
            d.noticePeriod === null || d.noticePeriod === undefined
        );
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
        const d = c.candidateParsedCvDetails;
        return (
            d.currentCTC !== null && d.currentCTC !== undefined &&
            d.expectedCTC !== null && d.expectedCTC !== undefined &&
            d.noticePeriod !== null && d.noticePeriod !== undefined
        );
    });
    // filtering out candidates with missing details
    const inCompleteCandidates = updated.filter((c:any) => {
        const d = c.candidateParsedCvDetails;
        return (
            d.currentCTC === null || d.currentCTC === undefined ||
            d.expectedCTC === null || d.expectedCTC === undefined ||
            d.noticePeriod === null || d.noticePeriod === undefined
        );
    });
    const nameOfIncompleteCandidates = inCompleteCandidates.map((row:any)=>{
        return row.candidateParsedCvDetails.name
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
        return row.candidateParsedCvDetails.name
    })

    // creating payload for post api
    const invalidCandidate = finalFilteredList.find((c: any) => 
    !c.jobDetails?.companyName ||
    !c.jobDetails?.jobTitle ||
    !c.candidateParsedCvDetails?.jobId ||
    !c.candidateParsedCvDetails?.agencyUserSubmissionId
    );

    if (invalidCandidate) {
    toast.error(
        `Missing job details for ${invalidCandidate.candidateParsedCvDetails?.name}`,
        getToastOptions({})
    );
    setIsSubmitting(false);
    onClose()
    return;
    }

    if (finalFilteredList.length === 0) {
        toast.error("Please enter Current CTC, Expected CTC, and Notice Period before continuing.",getToastOptions({}))
        setIsSubmitting(false);
        onClose()
        return;
    }
    
    const payload = {
        agencyUserSubmissions: finalFilteredList.map(c => ({
        agencyUserSubmissionId: c.candidateParsedCvDetails?.agencyUserSubmissionId,
        companyName: c.jobDetails?.companyName,
        jobTitle: c.jobDetails?.jobTitle,
        jobId: c.candidateParsedCvDetails?.jobId,
        currentCTC: c.candidateParsedCvDetails?.currentCTC,
        expectedCTC: c.candidateParsedCvDetails?.expectedCTC,
        noticePeriod: c.candidateParsedCvDetails?.noticePeriod,
    }))
    };

    setCandidateList(updated);
    try {
      const {response,error} =  await httpServiceObj.post(`${agencyBaseUrl}/agency-user-submission/move-to-applicant/bulk`,payload,true,{},true)   
      if(error){
          toast.error(error.message,getToastOptions({}))
          setIsSubmitting(false)
          return
        }
      if(response){
        setSuccessfullySentCandidateList(nameOfCompleteCandidates.join(", "))
        setIncompleteSentCandidateList(nameOfIncompleteCandidates.join(", "))
        toast.success("Bulk Move to applicant process initiated successfully.",getToastOptions({}))
        setIsFinalReviewModalOpen(true)
        if(setSelectedRows) setSelectedRows([])
        for (let i = 0; i < payload.agencyUserSubmissions.length; i++) {
            const data = payload.agencyUserSubmissions[i];

            const parent = updated.find((c:any) => 
                c.candidateParsedCvDetails.agencyUserSubmissionId === data.agencyUserSubmissionId
            );

            if (!parent) continue;

            const updatedData = {
                ...parent,
                jobApplicationStatus: "ACCEPTED",
                candidateParsedCvDetails: {
                    ...parent.candidateParsedCvDetails,
                    currentCTC: data.currentCTC,
                    expectedCTC: data.expectedCTC,
                    noticePeriod: data.noticePeriod
                }
            };

            localUpdate(parent.id, updatedData);
        }
      }
      reset()
    //   onClose()
    } catch (error) {
        console.log(error)
    } finally {
        setIsSubmitting(false)
        if(setAcceptingCandidate) setAcceptingCandidate(false);
        onClose()
    }
};

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
        className={`bg-white rounded-l-lg p-6 w-full max-w-lg relative transform transition-transform duration-300 ease-in-out self-auto max-h-[100vh] overflow-y-auto ${
          !isAnimatingIn ? "animate-slide-out" : "animate-slide-in"
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
                candidateParsedCvDetails: {
                    ...updated[currentIndex].candidateParsedCvDetails,
                    currentCTC: Number(formData.currentCTC),
                    expectedCTC: Number(formData.expectedCTC),
                    noticePeriod: Number(formData.noticePeriod),
                }
            };
            return updated;
        });

        setCurrentIndex(i);
        }}

            data-tooltip-id="my-tooltip"
            data-tooltip-content={c.candidateParsedCvDetails?.name}
            className={`px-3 py-1 text-xs rounded-full border 
            ${i === currentIndex ? "bg-blue-500 text-white" : "bg-gray-200"}`}
            >
            {/* Candidate {i + 1} */}
            <p className="truncate block w-[60px]">{c.candidateParsedCvDetails?.name}</p>
            
            </button>
        ))}
        </div>

        {/* Red warning text */}
        <h2 className="text-sm text-red-500 mb-4 text-left">
        {`${currentCandidate?.candidateParsedCvDetails?.name ?? "Candidate"} profile does not contain CTC, ETC and Notice Period or details are older than 90 days - these fields are mandatory to update`}
        </h2>

        <form onSubmit={handleSubmit(formSubmit)}>
            <div className='text-left'>
                <label htmlFor="">Current CTC(LPA)
                    <span className='text-red-500'>*</span>
                </label>
                <input 
                step={0.1}
                min={0}
                max={300}
                type="number" 
                placeholder='Enter your salary in LPA'
                className="input_primary auth_input capitalize placeholder:text-xs"
                {...register("currentCTC",{ valueAsNumber: true})}/>
                <p className='text-xs text-slate-500 text-left'>Enter your salary in LPA(e.g., 25 for 25,00,000 Lakhs per annum).</p>
            </div>
            <div className='text-left'>
                <label htmlFor="">Expected CTC(LPA)
                    <span className='text-red-500'>*</span>
                </label>
                <input 
                step={0.1}
                min={0}
                max={400}
                type="number" 
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
            <div className='text-left flex-1'>
                <label htmlFor="">Notice period (in days)<span className='text-red-500'>*</span></label>
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
            {/* <div className='text-left'>
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
            <div className="flex justify-start mt-4 gap-3">
            <button
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-white text-xs
                ${isSubmitting 
                    ? "bg-blue-300 cursor-not-allowed opacity-70" 
                    : "bg-blue-500"}`}
            >
                <SendIcon className='h-3 w-3'/>
                {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
            <button
                type="button"
                className={`flex items-center gap-1 px-3 py-3 rounded-xl text-white bg-blue-500 text-xs`}
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

export default EditCTCETCAndNoticePeriodModalForAgencyCandidates