import React from "react";
import { ExtraReferralDetailsResponse } from "@Utils/CommonDashboard.utils";
import { ReferralStatusEnum } from "@Enums/JobAndApplication.enum";
import { View } from "@AssetsFolder/assets";
import ProgressCircle from "@Components/Shared/CircularBar";
import { ModalBodyTable } from "../ModalBodyTable";

interface ViewExtraReferralDetailsModalProps {
  details: ExtraReferralDetailsResponse | null;
  onClose?: () => void;
}

const ViewExtraReferralDetailsModal: React.FC<ViewExtraReferralDetailsModalProps> = ({
  details,
  onClose,
}) => {
  if (!details) return null;

  return (
    <>
      {/* Info rows */}
      <div className="flex flex-col gap-3">
        <ModalBodyTable label="Name" value={details.name} />
        <ModalBodyTable label="Email id" value={details.email} />
        <ModalBodyTable label="Phone no" value={details.phone} />
        <ModalBodyTable label="Company name" value={details.companyName} multiline />
        <ModalBodyTable label="Company ID" value={details.companyId || "N/A"} />

        {/* Score */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-xs text-left font-medium min-w-[200px]">Score</span>
          <div className="flex flex-col items-center">
          <ProgressCircle value={details.score} onClick={()=>{}}/>
          </div>
        </div>

        {/* Status */}
        <div className="flex items-center gap-2 ">
          <span className="text-slate-400 text-xs text-left font-medium min-w-[200px]">Status</span>
          <div
            className={`px-3 py-1 rounded-full text-sm ${
              details.status === ReferralStatusEnum.REJECTED
                ? "text-red-600 border border-red-600"
                : "text-green-600 border border-green-600"
            }`}>
            {details.status}
          </div>
        </div>

        <ModalBodyTable label="Request date" value={details.requestDate} />

        {/* View CV */}
        <div className="flex items-center ">
          <span className="text-slate-400 text-xs text-left font-medium min-w-[200px]">View CV</span>
          <a
            href={details.viewCvLink}
            target="_blank"
            rel="noreferrer"
            className="  px-4 py-2 btn-sky text-sm font-medium">
            <img src={View} className="h-4 w-4" />
          </a>
        </div>

        <ModalBodyTable
          label="Job Url"
          value={
            <a
              href={details.jobUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 underline">
              Link
            </a>
          }
        />

        <ModalBodyTable
          label="Job description extracted"
          value={
            <div
              className="text-xs text-black font-medium whitespace-pre-line"
              dangerouslySetInnerHTML={{
                __html: details.jobDescription,
              }}
            />
          }
          multiline
        />
      </div>
    </>
  );
};


export default ViewExtraReferralDetailsModal;
