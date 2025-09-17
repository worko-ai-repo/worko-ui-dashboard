import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { toast } from "react-toastify";

const submitDuplicacyDetailsAPI = async ({
  applicantId,
  data,
  callbackfn = () => {},
}: {
  applicantId: string;
  data: { portal: string; date: string };
  callbackfn?: () => void;
}) => {
  const hiredFromOtherPortal = {
    hiredFromOtherPortal: {
      portal: data.portal,
      date: data.date,
    },
  };
  const { response } = await httpServiceObj.put(
    `/job-application/${applicantId}/hired-from-other-portal`,
    hiredFromOtherPortal,
    true,
    {},
    false,
    "JOB"
  );
  if (!response) throw new Error("Failed to submit duplicacy details");
  toast.success("Duplicacy details submitted successfully!", getToastOptions({}));
  callbackfn();
  return response;
};

interface DuplicacyProps {
  action: "EDIT" | "VIEW";
  applicant: JobApplicationDetailsDto;
  onClose: () => void;
}

export const Duplicacy: React.FC<DuplicacyProps> = ({ action, applicant, onClose }) => {
  const queryClient = useQueryClient();

  // Form state for edit
  const [portal, setPortal] = useState("");
  const [date, setDate] = useState("");

  // Mutation for submit
  const mutation = useMutation({
    mutationFn: (payload: { portal: string; date: string }) =>
      submitDuplicacyDetailsAPI({ applicantId: applicant.id, data: payload }),
    onSuccess: () => {
      onClose();
      queryClient.invalidateQueries({ queryKey: ["duplicacy", applicant.id] });
    },
  });

  return (
    <>
      {action === "EDIT" ? (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Input Duplicacy Details</h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate({ portal, date });
            }}
            className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={portal}
                onChange={(e) => setPortal(e.target.value)}
                placeholder="Enter the source"
                required
                className="w-full min-w-40 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Received Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full rounded-md border min-w-60 border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="reset"
                className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                // disabled={mutation.status === "loading"}
                className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
                {mutation.status === "pending" ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </>
      ) : (
        <>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">CV Duplicacy Details</h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="font-medium text-gray-600">Sourced From:</span>
              <span className="ml-2 text-gray-800">
                {applicant?.hiredFromOtherPortal?.portal || "Not provided"}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-600">Sourced Date:</span>
              <span className="ml-2 text-gray-800">
                {applicant?.hiredFromOtherPortal?.date
                  ? new Intl.DateTimeFormat(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }).format(new Date(applicant?.hiredFromOtherPortal?.date))
                  : "Not provided"}
              </span>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Duplicacy;
