import { FunctionComponent } from 'react';
import { BsCheckCircleFill } from 'react-icons/bs';
import { ApplicationStep } from './JobTypes';
import { stat } from 'fs';


interface StepperProps {
  steps?: ApplicationStep[];
  statusTracker?: any; // Optional status tracker if direct data is provided
}

// Function to convert status tracker to application steps
// export function convertStatusTrackerToSteps(statusTracker: any): ApplicationStep[] {
//   // Define all possible steps in order
//   const allSteps = [
//     { key: "APPLIED", label: "Applied" },
//     { key: "CV_DOWNLOADED", label: "CV downloaded" },
//     { key: "UNDER_EVALUATION", label: "Under evaluation" },
//     { key: "PROCESSING_INTERVIEW", label: "Interview processing" },
//     { key: "INTERVIEW_DONE", label: "Interviewed" },
//     { key: "HIRING_IN_PROCESS", label: "Hiring-in Process" },
//     { key: "DOCUMENT_REQUESTED", label: "Document requested" },
//     { key: "DOCUMENT_SUBMITTED", label: "Document submitted" },
//     { key: "OFFER_SENT", label: "Offer received" },
//     { key: "HIRED", label: "Hired" },
//     { key: "JOINED", label: "Joined" },
//   ];

//   // console.log(statusTracker)
//   // Find the latest status from the tracker
//   let latestStatus = statusTracker.newStatus; // Default to APPLIED
//   let latestDate = "";
  
//   if (statusTracker && Array.isArray(statusTracker) && statusTracker.length > 0) {
//     // Sort by date (newest first)
//     const sortedTracker = [...statusTracker].sort((a, b) => 
//       new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime()
//     );
    
//     latestStatus = sortedTracker[0].newStatus;
//     latestDate = new Date(sortedTracker[0].actionDate).toLocaleDateString();
//   } else if (statusTracker && statusTracker.newStatus) {
//     // Handle case where statusTracker might be a single object with newStatus
//     latestStatus = statusTracker.newStatus;
//     latestDate = statusTracker.actionDate ? new Date(statusTracker.actionDate).toLocaleDateString() : "";
//   }

//   if (latestStatus === "ACCEPTED") {
//   latestStatus = "UNDER_EVALUATION";
//   }
//   if(latestStatus === "DOCUMENT_ADDITIONAL_REQUESTED" || latestStatus === "DOCUMENT_REVISION_REQUESTED"){
//     latestStatus = "DOCUMENT_REQUESTED";
//   }
//   if(latestStatus === "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED" || latestStatus === "DOCUMENT_REVISION_REQUEST_SUBMITTED"){
//     latestStatus = "DOCUMENT_SUBMITTED";
//   }
//   if(latestStatus === "REVISED_OFFER_SENT"){
//     latestStatus = "OFFER_SENT";
//   }
//   // Find the index of the latest status in our steps array
//   const latestStatusIndex = allSteps.findIndex(step => step.key === latestStatus);
//   if (latestStatusIndex === -1) return []; // If status not found, return empty array
  
//   // use below if we want to show all remaining steps as well
//   // return allSteps.map((step, index) => ({
//   // step: step.label,
//   // date: index === latestStatusIndex ? latestDate : "",
//   // completed: index <= latestStatusIndex
//   // }));

//   // Create the steps array with completed flags
//   return allSteps
//     .slice(0, latestStatusIndex + 1)
//     .map((step, index) => ({
//       step: step.label,
//       date: index === latestStatusIndex ? latestDate : "",
//       completed: true
//     }));
// }

export function convertStatusTrackerToSteps(statusTracker: any[]): ApplicationStep[] {
  if (!Array.isArray(statusTracker) || statusTracker.length === 0) return [];

  const allSteps = [
    { key: "APPLIED", label: "Applied" },
    { key: "CV_DOWNLOADED", label: "CV downloaded" },
    { key: "UNDER_EVALUATION", label: "Under evaluation" },
    { key: "PROCESSING_INTERVIEW", label: "Interview processing" },
    { key: "INTERVIEW_DONE", label: "Interviewed" },
    { key: "HIRING_IN_PROCESS", label: "Hiring-in Process" },
    { key: "DOCUMENT_REQUESTED", label: "Document requested" },
    { key: "DOCUMENT_SUBMITTED", label: "Document submitted" },
    { key: "OFFER_SENT", label: "Offer received" },
    { key: "OFFER_ISSUE_RAISED", label: "Offer issue raised" },
    { key: "HIRED", label: "Hired" },
    { key: "JOINED", label: "Joined" },
  ];

  // normalize backend → UI step
  const normalize = (status: string) => {
    if (status === "ACCEPTED") return "UNDER_EVALUATION";
    if (
      status === "DOCUMENT_ADDITIONAL_REQUESTED" ||
      status === "DOCUMENT_REVISION_REQUESTED"
    ) return "DOCUMENT_REQUESTED";
    if (
      status === "DOCUMENT_ADDITIONAL_REQUEST_SUBMITTED" ||
      status === "DOCUMENT_REVISION_REQUEST_SUBMITTED"
    ) return "DOCUMENT_SUBMITTED";
    // if (status === "OFFER_ISSUE_RAISED") return "OFFER_SENT";
    if (status === "REVISED_OFFER_SENT") return "OFFER_SENT";
    return status;
  };

  // build timeline in order
  const timeline = statusTracker.map(item => ({
    key: normalize(item.newStatus),
    date: new Date(item.actionDate).toLocaleDateString(),
  }));

  // latest visible step
  const lastKey = timeline[timeline.length - 1].key;
  const lastIndex = allSteps.findIndex(s => s.key === lastKey);
  if (lastIndex === -1) return [];

  let lastDate = "";

  return allSteps
    .slice(0, lastIndex + 1)
    .filter(step => timeline.some(t => t.key === step.key))
    .map(step => {
      const hit = timeline.find(t => t.key === step.key);
      return {
        step: step.label,
        date: hit?.date || "",
        completed: true,
      };
    });
}


const Stepper: FunctionComponent<StepperProps> = ({ steps, statusTracker }) => {
  // If statusTracker is provided, convert it to steps
  const displaySteps = statusTracker ? convertStatusTrackerToSteps(statusTracker) : steps;
  
  if (!displaySteps || displaySteps.length === 0) return null;

  return (
    <div className="flex justify-center mx-auto px-4 py-3 bg-gray-50">
      {displaySteps.map((step, index) => (
        <div key={index} className="flex flex-col items-center">
          <div className="flex items-center">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${step.completed ? 'bg-green-500' : 'bg-gray-300'}`}>
              {step.completed && <BsCheckCircleFill className="text-white" size={16} />}
            </div>
            {index < displaySteps.length - 1 && (
              <div className={`h-0.5 w-16 md:w-24 ${displaySteps[index].completed && displaySteps[index + 1].completed ? 'bg-green-500' : 'bg-gray-300'}`}></div>
            )}
          </div>
         <div className="text-[0.625rem] mt-1 font-medium text-center">
            {step.step.split(' ').map((word, i) => (
              <div key={i}>{word}</div>
            ))}
          </div>
          <div className="text-[0.625rem] text-gray-500">{step.date}</div>
        </div>
      ))}
    </div>
  );
};

export default Stepper;