import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, X } from "lucide-react";

export interface DatabaseFilterValues {
    ctcMin?: number;
    ctcMax?: number;
    expMin?: number;
    expMax?: number;
    location?: string;
}

interface DatabaseFiltersProps {
    onFilterChange: (filters: DatabaseFilterValues) => void;
    className?: string;
}

const DatabaseFilters: React.FC<DatabaseFiltersProps> = ({ onFilterChange, className = "" }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isOpen, setIsOpen] = useState(false);
    const filterRef = useRef<HTMLDivElement>(null);

    // Initialize state from URL params
    const [filters, setFilters] = useState<DatabaseFilterValues>({
        ctcMin: searchParams.get("ctcMin") ? Number(searchParams.get("ctcMin")) : undefined,
        ctcMax: searchParams.get("ctcMax") ? Number(searchParams.get("ctcMax")) : undefined,
        expMin: searchParams.get("expMin") ? Number(searchParams.get("expMin")) : undefined,
        expMax: searchParams.get("expMax") ? Number(searchParams.get("expMax")) : undefined,
        location: searchParams.get("location") || undefined,
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

        params.delete("ctcMin");
        params.delete("ctcMax");
        params.delete("expMin");
        params.delete("expMax");
        params.delete("location");

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.set(key, String(value));
            }
        });

        setSearchParams(params, { replace: true });
        onFilterChange(filters);
    }, [filters]);

    const handleInputChange = (field: keyof DatabaseFilterValues, value: string | number) => {
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
            location: undefined,
        });
    };

    const hasActiveFilters = Object.values(filters).some(
        (value) => value !== undefined && value !== null && value !== ""
    );

    return (
        <div className={`relative ${className}`} ref={filterRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-6 py-2 h-9 text-sm font-semibold rounded-2xl transition-colors  ${
                    hasActiveFilters
                        ? "bg-blue-50 border-blue-500 text-blue-700"
                        : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
                }`}>
                <Filter size={16} />
                Filters
                {hasActiveFilters && (
                    <span className="p-0.5 w-4 h-4 bg-blue-500 text-[9px] flex items-center justify-center pt-1 text-white rounded-full">
                        {Object.values(filters).filter((v) => v !== undefined && v !== null && v !== "").length}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Filter Candidates</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-4">

                        {/* CTC Range */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                CTC Range (LPA)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.ctcMin ?? ""}
                                    onChange={(e) =>
                                        handleInputChange("ctcMin", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.ctcMax ?? ""}
                                    onChange={(e) =>
                                        handleInputChange("ctcMax", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Experience */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Experience Range (Years)
                            </label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.expMin ?? ""}
                                    onChange={(e) =>
                                        handleInputChange("expMin", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <span className="text-gray-500">-</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.expMax ?? ""}
                                    onChange={(e) =>
                                        handleInputChange("expMax", e.target.value ? Number(e.target.value) : "")
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Location
                            </label>
                            <input
                                type="text"
                                placeholder="Enter location"
                                value={filters.location || ""}
                                onChange={(e) => handleInputChange("location", e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                    </div>

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

export default DatabaseFilters;