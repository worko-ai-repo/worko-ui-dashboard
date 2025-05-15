import React, { useState } from "react";
import { DynamicTable } from "../DynamicTable";
import { Calendar, Eye } from "lucide-react";
import Modal from "../Modal";
import DateTimePicker from "./DateTimePicker/DateTimePicker";
import ProgressCircle from "../Applicants/CircularBar";

type Applicant = {
    id: string;
    name: string;
    company: string;
    profile: string;
    yoe: number;
    location: string;
    matchingScore: number;
    status: string;
};

const staticApplicants: Applicant[] = [
    {
        id: "1",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/Ux designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 80,
        status: "Document requested",
    },
    {
        id: "2",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/Ux designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 20,
        status: "Pending",
    },
    {
        id: "3",
        name: "Avijit Dutta Gupta",
        company: "Apple",
        profile: "UI/Ux designer",
        yoe: 0,
        location: "Bangalore",
        matchingScore: 40,
        status: "Pending",
    },
];

export default function InterviewTable() {
    const [selected, setSelected] = useState<string[]>([]);
    const [expanded, setExpanded] = useState<string[]>([]);
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    const toggleSelectAll = () => {
        if (selected.length === staticApplicants.length) {
            setSelected([]);
        } else {
            setSelected(staticApplicants.map((a) => a.id));
        }
    };

    const toggleRow = (id: string) => {
        setSelected((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleExpand = (id: string) => {
        setExpanded((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const columns = [
        { key: "name", label: "Applicants name" },
        { key: "company", label: "Company" },
        { key: "profile", label: "Profile" },
        { key: "yoe", label: "YOE" },
        { key: "location", label: "Location" },
        {
            key: "matchingScore",
            label: "Matching Score",
            render: (row: Applicant) => (
                <div className="flex justify-center">
                    <ProgressCircle value={row.matchingScore} />
                </div>
            ),
        },
        {
            key: "status",
            label: "Status",
            render: (row: Applicant) => (
                <div>
                    {row.status === "Document requested" ? (
                        <span className="text-sky-500 font-medium text-sm bg-sky-200/50 rounded-full px-2 py-1">
                            {row.status}
                        </span>
                    ) : (
                        <div className="flex gap-2">
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            render: (row: Applicant) => (
                <div className="flex gap-2 min-w-[150px]">
                    {row.status === "Pending" && (
                        <div className="flex gap-2 justify-center items-center w-full">
                            <button className="flex gap-2 btn-view">
                                <Eye size={16} />
                                View CV
                            </button>
                            <button
                                onClick={() => setIsScheduleModalOpen(true)}
                                className="flex gap-1 items-center btn-close"
                            >
                                <Calendar size={16} />
                                Schedule
                            </button>
                        </div>
                    )}
                </div>
            ),
        }
    ];

    const renderExpandedDetails = (row: Applicant) => {
        if (row.id === "1") {
            return (
                <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-500">About</p>
                        <p>
                            he is a student, live in Kolkata. Previously worked at … (truncated)
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">CTC</p>
                        <p>$399.00</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Notice period</p>
                        <p>1 Month</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                    <p className="text-xs text-gray-500">About</p>
                    <p>----</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">CTC</p>
                    <p>----</p>
                </div>
                <div>
                    <p className="text-xs text-gray-500">Notice period</p>
                    <p>----</p>
                </div>
            </div>
        );
    };

    return (
        <>
            <DynamicTable
                activeTab="all"
                columns={columns}
                rows={staticApplicants}
                selectedRows={selected}
                expandedRows={expanded}
                toggleSelectAll={toggleSelectAll}
                toggleRow={toggleRow}
                toggleExpand={toggleExpand}
                allSelected={selected.length === staticApplicants.length}
                renderExpandedDetails={renderExpandedDetails}
                enableSelect
            />

            <Modal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                className="w-[90vw] sm:w-[1000px] h-auto"
            >
                <DateTimePicker />
            </Modal>
        </>
    );
}
