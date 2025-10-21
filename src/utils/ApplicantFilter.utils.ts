import { JobApplicationDetailsDto } from "@Interfaces/CorporateDashboard.dto";
import { ApplicantFilterValues } from "@Components/Shared/ApplicantsPage/ApplicantFilters";

/**
 * Filter applicant data based on filter criteria
 * @param data - Array of job application data
 * @param filters - Filter values for CTC, Experience, Date, and Notice Period
 * @returns Filtered array of job applications
 */
export const filterApplicants = (
  data: JobApplicationDetailsDto[],
  filters: ApplicantFilterValues
): JobApplicationDetailsDto[] => {
  if (!data || data.length === 0) return data;

  return data.filter((application) => {
    const { applicantDetails, createdAt } = application;

    // CTC Filter
    if (filters.ctcMin !== undefined || filters.ctcMax !== undefined) {
      const ctc = applicantDetails?.CTC;

      // Skip if CTC is not available
      if (ctc === null || ctc === undefined) {
        return false;
      }

      if (filters.ctcMin !== undefined && ctc < filters.ctcMin) {
        return false;
      }

      if (filters.ctcMax !== undefined && ctc > filters.ctcMax) {
        return false;
      }
    }

    // Experience Filter
    if (filters.expMin !== undefined || filters.expMax !== undefined) {
      const experience = applicantDetails?.YOE;

      // Skip if experience is not available
      if (experience === null || experience === undefined) {
        return false;
      }

      if (filters.expMin !== undefined && experience < filters.expMin) {
        return false;
      }

      if (filters.expMax !== undefined && experience > filters.expMax) {
        return false;
      }
    }

    // Notice Period Filter
    if (filters.noticePeriod) {
      const noticePeriod = applicantDetails?.noticePeriod;
      
      if (noticePeriod === null || noticePeriod === undefined) {
        return false;
      }

      // Convert to number if it's a string, or use directly if it's already a number
      const noticePeriodDays = typeof noticePeriod === 'number' 
        ? noticePeriod 
        : parseInt(String(noticePeriod), 10);

      // Skip if conversion failed
      if (isNaN(noticePeriodDays)) {
        return false;
      }

      switch (filters.noticePeriod) {
        case "Immediate":
          // 0-15 days
          if (noticePeriodDays > 15) {
            return false;
          }
          break;
        case "1 Month":
          // 16-45 days (around 1 month, allowing some flexibility)
          if (noticePeriodDays < 16 || noticePeriodDays > 45) {
            return false;
          }
          break;
        case "2 Months":
          // 46-75 days (around 2 months)
          if (noticePeriodDays < 46 || noticePeriodDays > 75) {
            return false;
          }
          break;
        case "3 Months":
          // 76-105 days (around 3 months)
          if (noticePeriodDays < 76 || noticePeriodDays > 105) {
            return false;
          }
          break;
        case "More than 3 Months":
          // More than 105 days
          if (noticePeriodDays <= 105) {
            return false;
          }
          break;
        default:
          break;
      }
    }

    // Application Date Filter
    if (filters.dateFrom || filters.dateTo) {
      if (!createdAt) {
        return false;
      }

      const applicationDate = new Date(createdAt);
      applicationDate.setHours(0, 0, 0, 0); // Normalize to start of day

      if (filters.dateFrom) {
        const fromDate = new Date(filters.dateFrom);
        fromDate.setHours(0, 0, 0, 0);

        if (applicationDate < fromDate) {
          return false;
        }
      }

      if (filters.dateTo) {
        const toDate = new Date(filters.dateTo);
        toDate.setHours(23, 59, 59, 999); // End of day

        if (applicationDate > toDate) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Get filter summary text for display
 * @param filters - Current filter values
 * @returns Human-readable filter summary
 */
export const getFilterSummary = (filters: ApplicantFilterValues): string => {
  const summary: string[] = [];

  if (filters.ctcMin !== undefined || filters.ctcMax !== undefined) {
    if (filters.ctcMin !== undefined && filters.ctcMax !== undefined) {
      summary.push(`CTC: ${filters.ctcMin}-${filters.ctcMax} LPA`);
    } else if (filters.ctcMin !== undefined) {
      summary.push(`CTC: ≥${filters.ctcMin} LPA`);
    } else if (filters.ctcMax !== undefined) {
      summary.push(`CTC: ≤${filters.ctcMax} LPA`);
    }
  }

  if (filters.expMin !== undefined || filters.expMax !== undefined) {
    if (filters.expMin !== undefined && filters.expMax !== undefined) {
      summary.push(`Experience: ${filters.expMin}-${filters.expMax} years`);
    } else if (filters.expMin !== undefined) {
      summary.push(`Experience: ≥${filters.expMin} years`);
    } else if (filters.expMax !== undefined) {
      summary.push(`Experience: ≤${filters.expMax} years`);
    }
  }

  if (filters.noticePeriod) {
    summary.push(`Notice Period: ${filters.noticePeriod}`);
  }

  if (filters.dateFrom || filters.dateTo) {
    if (filters.dateFrom && filters.dateTo) {
      summary.push(`Applied: ${filters.dateFrom} to ${filters.dateTo}`);
    } else if (filters.dateFrom) {
      summary.push(`Applied: After ${filters.dateFrom}`);
    } else if (filters.dateTo) {
      summary.push(`Applied: Before ${filters.dateTo}`);
    }
  }

  return summary.length > 0 ? summary.join(" | ") : "No filters applied";
};
