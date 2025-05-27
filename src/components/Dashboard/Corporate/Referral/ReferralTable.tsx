import React, { useState } from "react";
import { Check, X, Eye } from "lucide-react";
import { DynamicTable } from "../DynamicTable";
import ProgressCircle from "../Applicants/CircularBar";
import Modal from "../Modal";
import RejectionForm from "../Applicants/RejectForm";

interface WorkoRow {
    id: string;
    employeeName: string;
    jobUrl: string;
    candidateName: string;
    score: number;
    feedback: string;
    status: "Referred" | "Accepted" | "Rejected";
    timeline: { label: string; date: string }[];
}

const data: WorkoRow[] = [
    {
        id: "1",
        employeeName: "Avijit Dutta Gupta",
        jobUrl: "https://example.com/job1",
        candidateName: "Sayan Roy",
        score: 80,
        feedback: "This is not good as well as it is not working",
        status: "Referred",
        timeline: [
            { label: "Requested", date: "12-01-2025" },
        ],
    },
    {
        id: "2",
        employeeName: "Avijit Dutta Gupta",
        jobUrl: "https://example.com/job2",
        candidateName: "Anushka Goswami",
        score: 80,
        feedback: "This is not good as well as it is not working",
        status: "Accepted",
        timeline: [
            { label: "Requested", date: "12-01-2025" },
            { label: "Accepted", date: "12-02-2025" },
            { label: "Done", date: "12-03-2025" },
        ],
    },
    {
        id: "3",
        employeeName: "Avijit Dutta Gupta",
        jobUrl: "https://example.com/job3",
        candidateName: "Anushka Goswami",
        score: 80,
        feedback: "This is not good as well as it is not working",
        status: "Rejected",
        timeline: [
            { label: "Requested", date: "12-01-2025" },
            { label: "Rejected", date: "12-02-2025" },
        ],
    },
];

const statusColorMap = {
    Referred: "bg-blue-100 text-blue-700",
    Accepted: "bg-green-100 text-green-700",
    Rejected: "bg-red-100 text-red-700",
};

export default function ReferralTable() {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

    const toggleExpand = (id: string) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
        );
    };

    const columns = [
        { key: "employeeName", label: "Employee name" },
        {
            key: "jobUrl",
            label: "Job URL",
            render: (row: WorkoRow) => (
                <a href={row.jobUrl} className="text-blue-500 underline" target="_blank" rel="noreferrer">
                    link
                </a>
            ),
        },
        { key: "candidateName", label: "Candidate name" },
        {
            key: "score",
            label: "Worko score",
            render: (row: WorkoRow) => (
                <div className="flex justify-center">
                    <ProgressCircle value={row.score} onClick={function (): void {
                        throw new Error("Function not implemented.");
                    } } />
                </div>
            ),
        },
        { key: "feedback", label: "Employee feedback" },
        {
            key: "status",
            label: "Status",
            render: (row: WorkoRow) => (
                <span
                    className={`text-sm px-3 py-1 rounded-full font-semibold ${statusColorMap[row.status]}`}
                >
                    {row.status}
                </span>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (row: WorkoRow) => {
                if (row.status === "Rejected") return null;

                const showAccept = row.status === "Referred";
                const showView = row.status === "Accepted";
                const showReject = row.status === "Referred" || row.status === "Accepted";

                return (
                    <div className="flex gap-2 justify-center">
                        {showAccept && (
                            <button className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-[10px]">
                                <Check size={16} />
                            </button>
                        )}
                        {showView && (
                            <button className="btn-sky p-3">
                                <Eye size={16} />
                            </button>
                        )}
                        {showReject && (
                            <button
                                onClick={() => setIsRejectModalOpen(true)}
                                className="bg-red-500 hover:bg-red-600 text-white px-3 py-3 rounded-[10px]"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                );
            }

        },
    ];

    const renderExpandedRow = (row: WorkoRow) => {
        if (row.timeline.length === 0) return null;

        return (
            <div className="flex w-full justify-start">
                <div className="px-6 py-4">
                    <div className="flex items-center justify-start gap-6 w-full overflow-x-auto">
                        {row.timeline.map((step, index) => (
                            <React.Fragment key={index}>
                                <div className="flex flex-col items-center min-w-[100px]">
                                    <div className="flex items-center gap-2">
                                        <div className="bg-emerald-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                            ✓
                                        </div>
                                        <span className="text-sm font-semibold">{step.label}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 mt-1">{step.date}</span>
                                </div>
                                {index < row.timeline.length - 1 && (
                                    <div className="flex-1 h-1 bg-emerald-400 rounded-full" style={{ minWidth: "80px" }} />
                                )}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <DynamicTable
                columns={columns}
                rows={data}
                expandedRows={expandedRows}
                toggleExpand={toggleExpand}
                renderExpandedDetails={renderExpandedRow}
                enableSelect={false}
            />

            <Modal
                isOpen={isRejectModalOpen}
                onClose={() => setIsRejectModalOpen(false)}
                className="w-[90vw] sm:w-[455px] h-auto"
            >
                <RejectionForm />
            </Modal>
        </>
    );
}
