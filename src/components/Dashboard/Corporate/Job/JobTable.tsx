import React, { useState } from "react";
import { Filter, X, Link } from 'lucide-react';
import { DynamicTable } from "../DynamicTable";
import Modal from "../Modal";
import CloseJob from "./CloseJob";
import { JobApiResponse, JobData } from "@Interfaces/CorporateDashboard.dto";
import { Archive, Duplicate, Edit, Repost, View } from "@Assets";

interface JobsTableProps {
    activeTab: 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';
    setActiveTab: (tab: 'PUBLISHED' | 'CLOSED' | 'ARCHIVED') => void;
    data: JobApiResponse
    selectedRows: string[];
    setSelectedRows: React.Dispatch<React.SetStateAction<string[]>>;

}

const JobTableWrapper: React.FC<JobsTableProps> = ({
    activeTab,
    setActiveTab,
    data,
    selectedRows,
    setSelectedRows,
}) => {
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [isCloseJobModalOpen, setIsCloseJobModalOpen] = useState(false);

    const columns = [
        {
            key: "jobTitle",
            label: "Job Title",
            render: (row: JobData) => <span className="font-bold w-full capitalize">{row.jobTitle}</span>,
        },
        { key: "department", label: "Department" },
        { key: "totalApplications", label: "Total Applications" },
        ...(activeTab === "PUBLISHED"
            ? [{ key: "pending", label: "Pending" }]
            : [{ key: "archivedBy", label: "Archived By" }]),
        ...(activeTab === "CLOSED" ? [{ key: "status", label: "Status" }] : []),
        {
            key: "actions",
            label: "Actions",
            render: (row: JobData) => {
                const tabButtonConfig: Record<string, {
                    icon: JSX.Element,
                    className: string,
                    onClick?: () => void,
                    tooltip: string
                }[]> = {
                    PUBLISHED: [
                        { icon: <img src={View} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "View Applicants" },
                        { icon: <Filter className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Screen Resumes" },
                        { icon: <img src={Duplicate} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Duplicate Job" },
                        { icon: <img src={Edit} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Update Job" },
                        { icon: <Link className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "View Job" },
                        { icon: <X className="w-5 h-5" />, className: "btn-blue shrink-0", tooltip: "Close Job", onClick: () => setIsCloseJobModalOpen(true) },
                        { icon: <img src={Archive} className="w-5 h-5" />, className: "btn-blue shrink-0", tooltip: "Archive Job" }
                    ],
                    ARCHIVED: [
                        { icon: <X className="w-5 h-5" />, className: "btn-blue shrink-0", tooltip: "Remove Job" },
                        { icon: <img src={Repost} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Repost Job" },
                        { icon: <img src={Duplicate} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Duplicate" }
                    ],
                    CLOSED: [
                        { icon: <img src={Duplicate} className="w-5 h-5" />, className: "btn-sky shrink-0", tooltip: "Duplicate Job" }
                    ]
                };


                const buttons = tabButtonConfig[activeTab];

                if (!buttons) return null;

                return (
                    <div className="p-1 flex gap-2 items-center justify-center">
                        {buttons.map((btn, idx) => (
                            <button
                                key={idx}
                                className={btn.className}
                                onClick={btn.onClick}
                                title={btn.tooltip}
                            >
                                {btn.icon}
                            </button>
                        ))}
                    </div>
                );
            }
        }
    ];

    const toggleRow = (id: string) => {
        setSelectedRows((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleExpand = (id: string) => {
        setExpandedRows((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (!data?.data) return;

        if (selectedRows.length === data.data.length) {
            setSelectedRows([]);
        } else {
            setSelectedRows(data.data.map((job) => job.id));
        }
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
                <span>deselect {selectedRows?.length} rows</span>
            </button>
            <DynamicTable<JobData>
                columns={columns}
                rows={data?.data ?? []}
                selectedRows={selectedRows}
                expandedRows={expandedRows}
                toggleRow={toggleRow}
                toggleExpand={toggleExpand}
                toggleSelectAll={toggleSelectAll}
                allSelected={selectedRows?.length === data?.data.length && data.data.length > 0}
                renderExpandedDetails={(row) => (
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        <div className="col-span-2">
                            <div className="text-gray-400">Experience</div>
                            {`${row.experienceRange.min} - ${row.experienceRange.max}`}
                        </div>
                        <div>
                            <div className="text-gray-400">Salary bucket</div>
                            {`${row.salaryRange.min} - ${row.salaryRange.max}`}
                        </div>
                        <div>
                            <div className="text-gray-400">Created at</div>
                            {new Date(row.createdAt).toLocaleDateString('en-GB')}
                        </div>
                        <div>
                            <div className="text-gray-400">Created by</div>
                            {row.createdByUserId}
                        </div>
                    </div>
                )}
            />
            <Modal
                isOpen={isCloseJobModalOpen}
                onClose={() => setIsCloseJobModalOpen(false)}
            >
                <CloseJob
                    onClose={() => setIsCloseJobModalOpen(false)}
                    onSubmit={() => { }}
                />
            </Modal>
        </div>
    );
};

export default JobTableWrapper;
