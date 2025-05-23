import React, { useState } from "react";
import { Eye, User } from "lucide-react";
import { DynamicTable } from "../DynamicTable";
import Modal from "../Modal";
import CVPreview from "./CVPreview";
import RejectionForm from "./RejectForm";
import EvaluatorForm from "./EvaluatorForm";
import HireNowForm from "./HireNowForm";
import ProgressCircle from "./CircularBar";
import RequestDocumentModal from "./RequestDocModal";

type ApplicantStatus =
  | "pending"
  | "rejected"
  | "evaluation pending"
  | "interviewing"
  | "hired"
  | "not processed"
  | "document requested"
  | "document submitted"
  | "document verified"
  | "offer sent"
  | "joined";

type ApplicationRow = {
  id: string;
  name: string;
  company: string;
  profile: string;
  yoe: number;
  location: string;
  matchingScore: number;
  about?: string;
  ctc?: string;
  noticePeriod?: string;
  videoScore?: number;
  cvViewedBy?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  rejectedReason?: string;
  status: ApplicantStatus;
  viewdCv?: boolean;
  documentSubmitted?: boolean;
  hiredBy?: string;
  joiningDate?: string;
  designation?: string;
};

const applicationRows: ApplicationRow[] = [
    {
        id: "1",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/UX designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 80,
        about: "He is a student, lives in Kolkata. Previously worked at Worko. He is a student, lives in Kolkata. Previously worked at Worko. He is a student, lives in Kolkata. Previously worked at Worko. He is a student, lives in Kolkata. Previously worked at Worko.",
        ctc: "$399.00",
        noticePeriod: "1 Month",
        videoScore: 60,
        status: "pending",
        viewdCv: true,
        documentSubmitted: true,
    },
    {
        id: "2",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/UX designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 20,
        rejectedBy: "Somesh Dey",
        rejectedDate: "12-06-2025",
        rejectedReason: "Used a dictionary of over 20 words",
        status: "rejected",
        viewdCv: true,
        documentSubmitted: true,
    },
    {
        id: "3",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/UX designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 50,
        rejectedBy: "Somesh Dey",
        rejectedDate: "12-06-2025",
        rejectedReason: "Used a dictionary of over 20 words",
        status: "evaluation pending",
        viewdCv: true,
        documentSubmitted: true,
    },
    {
        id: "4",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/UX designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 50,
        rejectedBy: "Somesh Dey",
        rejectedDate: "12-06-2025",
        rejectedReason: "Used a dictionary of over 20 words",
        status: "evaluation pending",
        viewdCv: false,
        documentSubmitted: true,
    },
    {
        id: "5",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/UX designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 70,
        rejectedBy: "Somesh Dey",
        rejectedDate: "12-06-2025",
        rejectedReason: "Used a dictionary of over 20 words",
        status: "hired",
        viewdCv: false,
        documentSubmitted: true,
    },
    {
        id: "6",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/UX designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 10,
        rejectedBy: "Somesh Dey",
        rejectedDate: "12-06-2025",
        rejectedReason: "Used a dictionary of over 20 words",
        status: "interviewing",
        viewdCv: true,
        documentSubmitted: false,
    },
    // Add more as needed
];



export default function ApplicationTable({
    activeTab,
    setActiveTab,
}: {
    activeTab: 'All' | 'Hired' | 'Joined';
    setActiveTab: (tab: 'All' | 'Hired' | 'Joined') => void;
}) {
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [isAddEvaluatorModalOpen, setIsAddEvaluatorModalOpen] = useState(false);
    const [isHireNowModalOpen, setIsHireNowModalOpen] = useState(false);
    const [isRequestDocModalOpen, setIsRequestDocModalOpen] = useState(false);

    const commonColumns = {
        name: {
            key: "name",
            label: "Applicants name",
            render: (row: ApplicationRow) => (
                <div className="flex items-center justify-center gap-2">
                    <User size={20} />
                    <span>{row.name}</span>
                </div>
            )
        },
        profile: { key: "profile", label: "Profile" },
        yoe: { key: "yoe", label: "YOE" },
        location: { key: "location", label: "Location" },
        matchingScore: {
            key: "matchingScore",
            label: "Matching Score",
            render: (row: ApplicationRow) => (
                <div className="flex justify-center">
                    <ProgressCircle value={row.matchingScore} />
                </div>
            )
        },
        status: {
            key: "status",
            label: "Status",
            render: (row: ApplicationRow) => {
                const statusColors: Record<string, string> = {
                    pending: "bg-[#D6F4FF] text-[#00ADC0]",
                    rejected: "bg-[#FFD0D0] text-[#D40000]",
                    "evaluation pending": "bg-[#EFEFEF] text-[#616161]",
                    interviewing: "bg-green-100 text-green-500",
                    hired: "bg-[#4CBC9A38] text-[#00BF29]",
                };
                const status = row.status.toLowerCase();
                const colorClass = statusColors[status] ?? "bg-gray-100 text-gray-500";
                return (
                    <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${colorClass}`}>
                            {row.status}
                        </span>
                    </div>
                );
            }
        },
        actions: { key: "actions", label: "Actions" },
        response: { key: "response", label: "Response" },
        company: { key: "company", label: "Company" },
        currentCompany: { key: "Current Company", label: "Current Company" },
    };

    const getColumnsForTab = (tab: string): any[] => {
        switch (tab) {
            case "All":
                return [
                    commonColumns.name,
                    commonColumns.company,
                    commonColumns.profile,
                    commonColumns.yoe,
                    commonColumns.location,
                    commonColumns.matchingScore,
                    commonColumns.status,
                    commonColumns.actions,
                    commonColumns.response,
                ];
            case "Hired":
                return [
                    commonColumns.name,
                    commonColumns.currentCompany,
                    commonColumns.profile,
                    commonColumns.yoe,
                    commonColumns.location,
                    commonColumns.matchingScore,
                    commonColumns.status,
                    commonColumns.actions,
                    commonColumns.response,
                ];
            case "Joined":
                return [
                    {
                        key: "name",
                        label: "Candidate name",
                    },
                    {
                        key: "ctc",
                        label: "CTC",
                    },
                    {
                        key: "designation",
                        label: "Designation",
                    },
                    {
                        key: "hiredBy",
                        label: "Hired By",
                    },
                    {
                        key: "joiningDate",
                        label: "Joining Date",
                    },
                    {
                        key: "actions",
                        label: "Documents",
                    },
                ];
            default:
                return [];
        }
    };

    const applicationColumns = getColumnsForTab(activeTab);

    const toggleSelectAll = () => {
        if (selectedRows.length === applicationRows.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(applicationRows.map((row) => row.id));
        }
    };

    const toggleRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const toggleExpand = (id: string) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]
        );
    };

    const renderStatusActions = (row: ApplicationRow) => {
        const viewCvBtn = (
            <button onClick={() => setIsViewCVModalOpen(true)} className="flex gap-2 btn-view">
                <Eye size={16} />
                View CV
            </button>
        );

        const viewEvaluatorBtn = (
            <button onClick={() => setIsAddEvaluatorModalOpen(true)} className="flex gap-2 btn-view">
                <Eye size={16} />
                View evaluator
            </button>
        );

        const hireNowBtn = (
            <button onClick={() => setIsHireNowModalOpen(true)} className="btn-view">
                {/* SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="19" viewBox="0 0 18 19" fill="none">
                    <path d="M15.75 8.34668V15.4717C15.75 16.093 15.2463 16.5967 14.625 16.5967H3.375C2.75368 16.5967 2.25 16.093 2.25 15.4717V4.22168C2.25 3.60036 2.75368 3.09668 3.375 3.09668H11.25" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M6 8.34668L9.75 11.3467L15.375 3.47168" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Hire Now
            </button>
        );

        const holdBtn = (
            <button className="flex gap-1 items-center btn-close">
                {/* SVG icon */}
                <svg xmlns="http://www.w3.org/2000/svg" width="19" height="19" viewBox="0 0 19 19" fill="none">
                    <g clip-path="url(#clip0_742_200)">
                        <path d="M10.625 4.97168C10.625 4.67331 10.7435 4.38716 10.9545 4.17618C11.1655 3.96521 11.4516 3.84668 11.75 3.84668C12.0483 3.84668 12.3345 3.96521 12.5455 4.17618C12.7564 4.38716 12.875 4.67331 12.875 4.97168V9.09668M10.625 4.97168V3.47168C10.625 3.17331 10.5065 2.88716 10.2955 2.67618C10.0845 2.46521 9.79834 2.34668 9.49998 2.34668C9.20161 2.34668 8.91546 2.46521 8.70448 2.67618C8.4935 2.88716 8.37498 3.17331 8.37498 3.47168V4.59668M10.625 4.97168V8.34668M8.37498 4.59668C8.37498 4.29831 8.25645 4.01216 8.04547 3.80118C7.83449 3.59021 7.54834 3.47168 7.24998 3.47168C6.95161 3.47168 6.66546 3.59021 6.45448 3.80118C6.2435 4.01216 6.12498 4.29831 6.12498 4.59668V10.9432L4.90998 9.72443C4.78434 9.59824 4.63342 9.50006 4.46714 9.43634C4.30086 9.37262 4.12297 9.3448 3.94518 9.35472C3.76738 9.36464 3.5937 9.41206 3.43553 9.49388C3.27737 9.57569 3.1383 9.69005 3.02748 9.82943C2.85216 10.0493 2.75464 10.321 2.75016 10.6022C2.74568 10.8834 2.8345 11.1581 3.00273 11.3834L5.70273 14.8319C6.21948 15.4919 6.49998 16.5089 6.49998 17.3467M8.37498 4.59668V7.59668M15.125 9.09668V6.47168C15.125 6.17331 15.0065 5.88716 14.7955 5.67618C14.5845 5.46521 14.2983 5.34668 14 5.34668C13.7016 5.34668 13.4155 5.46521 13.2045 5.67618C12.9935 5.88716 12.875 6.17331 12.875 6.47168M11.75 15.4717C11.75 14.7704 11.75 14.4202 11.9007 14.1592C11.9995 13.9882 12.1415 13.8462 12.3125 13.7474C12.5735 13.5967 12.9237 13.5967 13.625 13.5967H14.375C15.0762 13.5967 15.4265 13.5967 15.6875 13.7474C15.8585 13.8462 16.0005 13.9882 16.0992 14.1592C16.25 14.4202 16.25 14.7704 16.25 15.4717C16.25 16.1729 16.25 16.5232 16.0992 16.7842C16.0005 16.9552 15.8585 17.0972 15.6875 17.1959C15.4265 17.3467 15.0762 17.3467 14.375 17.3467H13.625C12.9237 17.3467 12.5735 17.3467 12.3125 17.1959C12.1415 17.0972 11.9995 16.9552 11.9007 16.7842C11.75 16.5232 11.75 16.1729 11.75 15.4717ZM12.875 12.4717C12.875 12.1733 12.9935 11.8872 13.2045 11.6762C13.4155 11.4652 13.7016 11.3467 14 11.3467C14.2983 11.3467 14.5845 11.4652 14.7955 11.6762C15.0065 11.8872 15.125 12.1733 15.125 12.4717V13.5967H12.875V12.4717Z" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                    </g>
                    <defs>
                        <clipPath id="clip0_742_200">
                            <rect width="18" height="18" fill="white" transform="translate(0.5 0.84668)" />
                        </clipPath>
                    </defs>
                </svg>
                on Hold
            </button>
        );

        if (activeTab === "All") {
            if (row.status === "pending") {
                return (
                    <div className="flex space-x-2 justify-center">
                        <button className="bg-emerald-400 hover:bg-emerald-500 px-3 py-2 rounded-md text-white">✔</button>
                        <button onClick={() => setIsRejectModalOpen(true)} className="bg-red-500 hover:bg-red-600 p-3 py-2 rounded-md text-white">✖</button>
                    </div>
                );
            }

            if (["evaluation pending", "interviewing", "hired"].includes(row.status)) {
                return (
                    <div className="flex gap-2 justify-center">
                        {viewCvBtn}
                        {row.viewdCv && viewEvaluatorBtn}
                    </div>
                );
            }

            return <span>{row.rejectedDate}</span>;
        }

        if (activeTab === "Hired") {
            if (!row.documentSubmitted) {
                return (
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => setIsRequestDocModalOpen(true)}
                            className="btn-view"
                        >
                            <Eye size={16} />
                            Request Document
                        </button>
                        {hireNowBtn}
                        {holdBtn}
                    </div>
                );
            }

            return (
                <div className="flex gap-2 justify-center">
                    <button className="btn-view">
                        <Eye size={16} />
                        View Document
                    </button>
                    {hireNowBtn}
                    {holdBtn}
                </div>
            );
        }

        if (activeTab === "Joined") {
            return (
                <button className="btn-view">
                    <Eye size={16} />
                    View Document
                </button>
            )
        }

        return null;
    };


    const renderExpandedDetails = (row: ApplicationRow) => {
        return (
            <div className="grid grid-cols-3 gap-4">
                <div>
                    <span className="font-semibold text-gray-500">About</span>
                    <p>{row.about ?? "------"}</p>
                </div>

                {row.status === "rejected" ? (
                    <>
                        <div>
                            <span className="font-semibold text-gray-500">Rejected by</span>
                            <p>{row.rejectedBy}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-500">Reason</span>
                            <p>{row.rejectedReason}</p>
                        </div>
                    </>
                ) : (
                    <>
                        <div>
                            <span className="font-semibold text-gray-500">CTC</span>
                            <p>{row.ctc}</p>
                        </div>
                        <div>
                            <span className="font-semibold text-gray-500">Notice</span>
                            <p>{row.noticePeriod}</p>
                        </div>
                    </>
                )}
            </div>
        );
    };



    return (
        <div>
            <button
                className={`text-sm text-blue-600 flex items-center gap-1 mb-2 ${selectedRows.length === 0 ? "hidden" : ""
                    }`}
                onClick={() => setSelectedRows([])}
            >
                <span className="w-4 h-4 flex items-center justify-center bg-blue-600 rounded-full text-white text-base">
                    &minus;
                </span>
                <span>deselect {selectedRows.length} rows</span>
            </button>
            <DynamicTable
                activeTab="application"
                columns={applicationColumns}
                rows={applicationRows}
                selectedRows={selectedRows}
                expandedRows={expandedRows}
                toggleSelectAll={toggleSelectAll}
                toggleRow={toggleRow}
                toggleExpand={toggleExpand}
                allSelected={selectedRows.length === applicationRows.length}
                renderActions={(row) => renderStatusActions(row)}
                renderExpandedDetails={(row) => (renderExpandedDetails(row))}
                enableSelect={activeTab !== "Joined" ? true : false}
            />
            <Modal
                isOpen={isViewCVModalOpen}
                onClose={() => setIsViewCVModalOpen(false)}
                className="w-[90vw] sm:w-[677px] h-auto"
            >
                <CVPreview
                    onClose={() => setIsViewCVModalOpen(false)}
                    onSubmit={() => { }}
                    setIsAddEvaluatorModal={setIsAddEvaluatorModalOpen}
                    setIsRejectModalOpen={setIsRejectModalOpen}
                    setIsHireNowModalOpen={setIsHireNowModalOpen}
                />
            </Modal>
            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                className="w-[90vw] sm:w-[455px] h-auto sm:h-[479px]"
            >
                <RejectionForm />
            </Modal>
            <Modal
                isOpen={isAddEvaluatorModalOpen}
                onClose={() => setIsAddEvaluatorModalOpen(false)}
                className="w-[90vw] sm:w-[455px] h-auto sm:h-[461px]"
            >
                <EvaluatorForm />
            </Modal>
            <Modal
                isOpen={isHireNowModalOpen}
                onClose={() => setIsHireNowModalOpen(false)}
                className="w-[90vw] sm:w-[532px] h-auto"
            >
                <HireNowForm />
            </Modal>
            <Modal
                isOpen={isRequestDocModalOpen}
                onClose={() => setIsRequestDocModalOpen(false)}
                className="w-[90vw] sm:w-[455px] sm:h-[500px] h-[90vh]"
            >
                <RequestDocumentModal />
            </Modal>
        </div>
    );
}

