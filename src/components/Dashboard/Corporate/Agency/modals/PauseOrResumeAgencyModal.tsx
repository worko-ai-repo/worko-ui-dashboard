import SubmitButton from "@Components/ui/SubmitButton";
import { useDashboardContext } from "@Context/Dashboard.context";
import { AgencyListDetailsDto } from "@Interfaces/AgencyDatabaseApplicantDetailsDto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { SendIcon } from "lucide-react";
import { FC, useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";

interface PauseOrResumeAgencyModalProps {
  dashboardType:string;
  onClose: () => void;
  isOpen: boolean;
  isCandidate?: boolean;
  data:any;
  localUpdate: (id: string, updatedData: Partial<any>) => void;
  currentAction:string;
}

const PauseOrResumeAgencyModal: FC<PauseOrResumeAgencyModalProps> = ({
  onClose,
  isOpen,
  isCandidate,
  data,
  localUpdate,
  currentAction,
}) => {
  const [visible, setVisible] = useState(false);
  const [isAnimatingIn, setIsAnimatingIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState("");
  const { user } = useDashboardContext();
  const modalRef = useRef<HTMLDivElement>(null);

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

  const pause = async () =>{
    if (!data) return;
    if(data.inviteAction === "PAUSE"){
      toast.error("Agency's action are already paused",getToastOptions({}))
      return
    }
    setIsLoading(true)
    try {
      const payload =    {
      inviteAction:"PAUSE",
      agencyInviteId: data?.id,
   }
    const {response, error} = await httpServiceObj.patch(`/agency-invite/action-type`,payload,true,{},false,"AGENCY")
      if(error){
        toast.error(error.message,getToastOptions({}))
        return
      }
      toast.success("Agency action's paused successfully",getToastOptions({}))
      const updatedData = {
        ...data,
        inviteAction: "PAUSE",
      };
      localUpdate(data.id, updatedData);
      onClose();
    } catch (error) {
      console.log("Pause action failed",error)
    } finally {
      setIsLoading(false)
    }
  }

  const resume = async () =>{
    if (!data) return;
    if(data.inviteAction === "RESUME"){
      toast.error("Agency's action are already resumed",getToastOptions({}))
      return
    }
    setIsLoading(true)
    try {
      const payload =    {
      inviteAction:"RESUME",
      agencyInviteId: data?.id,
   }
      const {response, error} = await httpServiceObj.patch(`/agency-invite/action-type`,payload,true,{},false,"AGENCY")
        if(error){
          toast.error(error.message,getToastOptions({}))
          return
        }
        toast.success("Agency action's resumed successfully",getToastOptions({}))
        const updatedData = {
          ...data,
          inviteAction: "RESUME",
        };
        localUpdate(data.id, updatedData);
        onClose();
    } catch (error) {
      console.log("Resume action failed",error)
    } finally {
      setIsLoading(false)
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
      className={`fixed inset-0 z-[80] flex items-start justify-end transition-opacity duration-300 ease-in-out ${
        isAnimatingIn ? "bg-black bg-opacity-50" : "bg-opacity-0 bg-black"
      } ${visible ? "visible" : "invisible"}`}>
      <div
        ref={modalRef}
        className={`bg-white rounded-l-lg p-6 w-full max-w-md relative transform transition-transform duration-300 ease-in-out self-auto max-h-[80vh] overflow-y-auto ${
          !isAnimatingIn ? "animate-slide-out" : "animate-slide-in"
        }`}>
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
          ×
        </button>

        {data?.inviteAction === "PAUSE" 
        ? <p className="text-lg font-semibold mb-4">
          Are you sure you want to resume all activity for this agency?
        </p>
        : <p className="text-lg font-semibold mb-4">
          Are you sure you want to pause all activity for this agency?
        </p>}

        {/* Submit and cancel Button */}
        <div className="flex justify-center gap-3">
          {/* <button
            // onClick={handleSubmit}
            disabled={isLoading}
            className={`w-30 flex items-center gap-2 text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors duration-200 ${
              isLoading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-300"
            }`}
            onClick={currentAction === "PAUSE" ? pause : resume}
            >
            <SendIcon className="w-4 h-4" />
            {isLoading ? "Accepting..." : "Accept"}
          </button> */}
          <button
          disabled={isLoading}
          onClick={currentAction === "PAUSE" ? pause : resume}>
            <SubmitButton   
            text = "Accept"
            submittingText = {"Accepting..."}
            isSubmitting={isLoading}/>
          </button>
          <button
            onClick={onClose}
            className="w-30 flex items-center gap-2 bg-white text-blue-600 border border-blue-600 text-xs font-medium px-4 py-3 rounded-xl">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PauseOrResumeAgencyModal;
