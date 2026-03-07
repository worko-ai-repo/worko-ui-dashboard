import { DatabaseFilterValues } from "@Components/Shared/DatabasePage/DatabaseFilters";


/**
 * Filter database candidate data based on filter criteria
 * @param data - Array of candidate database data
 * @param filters - Filter values for CTC, Experience, and Location
 * @returns Filtered array of candidates
 */
export const filterDatabaseCandidates = (
  data: any[],
  filters: DatabaseFilterValues
): any[] => {
  if (!data || data.length === 0) return data;

  return data.filter((candidate) => {
    const details = candidate?.candidateParsedCvDetails;

    if (!details) return false;

    const { currentCTC, totalYOE, location } = details;

    // CTC Filter
    if (filters.ctcMin !== undefined || filters.ctcMax !== undefined) {
      if (currentCTC === null || currentCTC === undefined) {
        return false;
      }

      if (filters.ctcMin !== undefined && currentCTC < filters.ctcMin) {
        return false;
      }

      if (filters.ctcMax !== undefined && currentCTC > filters.ctcMax) {
        return false;
      }
    }

    // Experience Filter
    if (filters.expMin !== undefined || filters.expMax !== undefined) {
      if (totalYOE === null || totalYOE === undefined) {
        return false;
      }

      if (filters.expMin !== undefined && totalYOE < filters.expMin) {
        return false;
      }

      if (filters.expMax !== undefined && totalYOE > filters.expMax) {
        return false;
      }
    }

    // Location Filter
    if (filters.location) {
      if (!location) {
        return false;
      }

      if (!location.toLowerCase().includes(filters.location.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
};