import React, { FunctionComponent } from "react";
import { BsCheckCircleFill } from "react-icons/bs";

interface SimpleStepperProps {
  currentStatus: string; // the current status string like "AWAITING", "ACCEPTED", "DONE"
}

const steps = [
  { key: "AWAITING", label: "Awaiting" },
  { key: "ACCEPTED", label: "Accepted" },
  { key: "DONE", label: "Done" },
];

const SimpleStepper: FunctionComponent<SimpleStepperProps> = ({ currentStatus }) => {
  // Find index of current status
  const currentIndex = steps.findIndex((step) => step.key === currentStatus);

  // If status is unknown or not found, treat as no progress
  if (currentIndex === -1) return null;

  return (
    <div className="flex justify-center mx-auto px-4 py-3 bg-gray-50">
      {steps.map((step, index) => {
        const completed = index <= currentIndex;

        return (
          <div key={step.key} className="flex flex-col items-center">
            <div className="flex items-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  completed ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                {completed && <BsCheckCircleFill className="text-white" size={16} />}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 w-16 md:w-24 ${
                    steps[index].key <= currentStatus && steps[index + 1].key <= currentStatus
                      ? "bg-green-500"
                      : "bg-gray-300"
                  }`}
                ></div>
              )}
            </div>
            <div className="text-xs mt-1 font-medium text-center">{step.label}</div>
          </div>
        );
      })}
    </div>
  );
};

export default SimpleStepper;
