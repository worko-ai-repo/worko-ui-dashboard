import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, X } from "lucide-react";

export interface ApplicantFilterValues {
    ctcMin?: number;
    ctcMax?: number;
    expMin?: number;
    expMax?: number;
    dateFrom?: string;
    dateTo?: string;
    noticePeriod?: string;
}

interface ApplicantFiltersProps {
    onFilterChange: (filters: ApplicantFilterValues) => void;
    className?: string;
}

const ApplicantFilters: React.FC<ApplicantFiltersProps> = ({ onFilterChange, className = "" }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Initialize state from URL params
    const [filters, setFilters] = useState<ApplicantFilterValues>({
        ctcMin: searchParams.get("ctcMin") ? Number(searchParams.get("ctcMin")) : undefined,
        ctcMax: searchParams.get("ctcMax") ? Number(searchParams.get("ctcMax")) : undefined,
        expMin: searchParams.get("expMin") ? Number(searchParams.get("expMin")) : undefined,
        expMax: searchParams.get("expMax") ? Number(searchParams.get("expMax")) : undefined,
        dateFrom: searchParams.get("dateFrom") || undefined,
        dateTo: searchParams.get("dateTo") || undefined,
        noticePeriod: searchParams.get("noticePeriod") || undefined,
    });

    // Handle click outside to close filter panel
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Update URL params and trigger filter change when filters change
    useEffect(() => {
        const params = new URLSearchParams(searchParams);

        // Remove all filter params first
        params.delete("ctcMin");
        params.delete("ctcMax");
        params.delete("expMin");
        params.delete("expMax");
        params.delete("dateFrom");
        params.delete("dateTo");
        params.delete("noticePeriod");

        // Add non-empty filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.set(key, String(value));
            }
        });

        setSearchParams(params, { replace: true });
        onFilterChange(filters);
    }, [filters]);

    const handleInputChange = (field: keyof ApplicantFilterValues, value: string | number) => {
        setFilters((prev) => ({
            ...prev,
            [field]: value === "" ? undefined : value,
        }));
    };

    const handleReset = () => {
        setFilters({
            ctcMin: undefined,
            ctcMax: undefined,
            expMin: undefined,
            expMax: undefined,
            dateFrom: undefined,
            dateTo: undefined,
            noticePeriod: undefined,
        });
    };

    const hasActiveFilters = Object.values(filters).some(
        (value) => value !== undefined && value !== null && value !== ""
    );

    return (
        <div className={`relative ${className}`} ref={filterRef}>
            {/* Filter Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    hasActiveFilters
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                data-tooltip-id="my-tooltip"
                data-tooltip-content="Filter applications by CTC, Experience, Date, and Notice Period">
                <Filter size={16} />
                Filters
                {hasActiveFilters && (
                    <span className="p-0.5 w-4 h-4 bg-blue-500 text-[9px] flex items-center justify-center pt-1 text-white rounded-full">
                        {Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length}
                    </span>
                )}
            </button>

            {/* Filter Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filter Applications</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* CTC Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CTC Range (LPA)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.ctcMin || ""}
                                    onChange={(e) =>
                                        handleInputChange("ctcMin", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.ctcMax || ""}
                                    onChange={(e) =>
                                        handleInputChange("ctcMax", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Experience Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Experience Range (Years)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.expMin || ""}
                                    onChange={(e) =>
                                        handleInputChange("expMin", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.expMax || ""}
                                    onChange={(e) =>
                                        handleInputChange("expMax", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    min="0"
                                />
                            </div>
                        </div>

                        {/* Notice Period Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Notice Period</label>
                            <select
                                value={filters.noticePeriod || ""}
                                onChange={(e) => handleInputChange("noticePeriod", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option value="">All</option>
                                <option value="Immediate">Immediate/15 days or less</option>
                                <option value="1 Month">1 Month</option>
                                <option value="2 Months">2 Months</option>
                                <option value="3 Months">3 Months</option>
                                <option value="More than 3 Months">More than 3 Months</option>
                            </select>
                        </div>

                        {/* Application Date Range Filter */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Application Date Range
                            </label>
                            <div className="flex flex-col gap-2">
                                <input
                                    type="date"
                                    placeholder="From"
                                    value={filters.dateFrom || ""}
                                    onChange={(e) => handleInputChange("dateFrom", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <input
                                    type="date"
                                    placeholder="To"
                                    value={filters.dateTo || ""}
                                    onChange={(e) => handleInputChange("dateTo", e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex gap-2 mt-6">
                        <button
                            onClick={handleReset}
                            disabled={!hasActiveFilters}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                            Reset All
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ApplicantFilters;
