import React, { useEffect, useState, useRef, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, X, Search } from "lucide-react";
import { JobData } from "@Interfaces/CorporateDashboard.dto";

export interface CompanyFilterValues {
  companyIds?: string[];
}

interface CompanyFilterProps {
  onFilterChange: (filters: CompanyFilterValues) => void;
  jobs: JobData[];
  className?: string;
}

const CompanyFilter: React.FC<CompanyFilterProps> = ({ onFilterChange, jobs, className = "" }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [searchText, setSearchText] = useState("");

  // Initialize state from URL params
  const [filters, setFilters] = useState<CompanyFilterValues>({
    companyIds: searchParams.get("companyIds")?.split(",").filter(Boolean) || undefined,
  });

  // Extract unique companies from jobs
  const companies = useMemo(() => {
    const companyMap = new Map<string, { id: string; name: string }>();

    jobs.forEach((job) => {
      if (job.companyDetails?.id && job.companyDetails?.name) {
        companyMap.set(job.companyDetails.id, {
          id: job.companyDetails.id,
          name: job.companyDetails.name,
        });
      }
    });

    return Array.from(companyMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs]);

  // Filter companies based on search text
  const filteredCompanies = useMemo(() => {
    if (!searchText.trim()) return companies;

    const search = searchText.toLowerCase();
    return companies.filter((company) => company.name.toLowerCase().includes(search));
  }, [companies, searchText]);

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

    // Remove filter param first
    params.delete("companyIds");

    // Add non-empty filters
    if (filters.companyIds && filters.companyIds.length > 0) {
      params.set("companyIds", filters.companyIds.join(","));
    }

    setSearchParams(params, { replace: true });
    onFilterChange(filters);
  }, [filters]);

  const handleCompanyToggle = (companyId: string) => {
    setFilters((prev) => {
      const currentIds = prev.companyIds || [];
      const newIds = currentIds.includes(companyId)
        ? currentIds.filter((id) => id !== companyId)
        : [...currentIds, companyId];

      return {
        companyIds: newIds.length > 0 ? newIds : undefined,
      };
    });
  };

  const handleSelectAll = () => {
    setFilters({
      companyIds: companies.map((c) => c.id),
    });
  };

  const handleReset = () => {
    setFilters({
      companyIds: undefined,
    });
    setSearchText("");
  };

  const hasActiveFilters = filters.companyIds && filters.companyIds.length > 0;

  return (
    <div className={`relative ${className}`} ref={filterRef}>
      {/* Filter Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-6 py-2 h-9 text-sm font-semibold rounded-2xl transition-colors ${
          hasActiveFilters
            ? "bg-blue-50 border-blue-500 text-blue-700"
            : "bg-white border-gray-300 text-gray-800 hover:bg-gray-50"
        }`}
        data-tooltip-id="my-tooltip"
        data-tooltip-content="Filter jobs by company">
        <Filter size={16} />
        Companies
        {hasActiveFilters && (
          <span className="p-0.5 w-4 h-4 bg-blue-500 text-[9px] flex items-center justify-center pt-1 text-white rounded-full">
            {filters.companyIds?.length || 0}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-50 max-h-[500px] flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Filter by Company</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Select All / Deselect All */}
          <div className="flex gap-2 mb-3">
            <button
              onClick={handleSelectAll}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors">
              Select All
            </button>
            <button
              onClick={handleReset}
              disabled={!hasActiveFilters}
              className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Clear All
            </button>
          </div>

          {/* Company List */}
          <div className="flex-1 overflow-y-auto space-y-2 min-h-[200px] max-h-[300px]">
            {filteredCompanies.length === 0 ? (
              <div className="text-center text-gray-500 text-sm py-8">No companies found</div>
            ) : (
              filteredCompanies.map((company) => (
                <label
                  key={company.id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={filters.companyIds?.includes(company.id) || false}
                    onChange={() => handleCompanyToggle(company.id)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-sm text-gray-700 flex-1 truncate" title={company.name}>
                    {company.name}
                  </span>
                </label>
              ))
            )}
          </div>

          {/* Footer Info */}
          {hasActiveFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <p className="text-xs text-gray-600 text-center">
                {filters.companyIds?.length}{" "}
                {filters.companyIds?.length === 1 ? "company" : "companies"} selected
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyFilter;
