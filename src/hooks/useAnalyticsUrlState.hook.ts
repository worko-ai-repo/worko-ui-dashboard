import { useSearchParams } from "react-router-dom";
import { useCallback, useMemo } from "react";

export type AnalyticsDateRange = "7d" | "30d" | "90d" | "180d";
export type AnalyticsJobStatus = "ALL" | "PUBLISHED";

export interface AnalyticsUrlState {
  companyId?: string;
  companyName?: string;
  recruiterId?: string;
  recruiterName?: string;
  dateRange: AnalyticsDateRange;
  jobStatus: AnalyticsJobStatus;
}

const DEFAULT_STATE: AnalyticsUrlState = {
  companyId: undefined,
  companyName: undefined,
  recruiterId: undefined,
  recruiterName: undefined,
  dateRange: "30d",
  jobStatus: "ALL",
};

/**
 * Analytics-only URL state hook.
 *
 * Persists all analytics filters in the URL:
 * - companyId & companyName
 * - recruiterId & recruiterName
 * - dateRange
 * - jobStatus
 *
 * Designed specifically for analytics pages so that filters survive reloads
 * and can be shared via URL.
 */
export function useAnalyticsUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo<AnalyticsUrlState>(() => {
    const get = (key: string): string | undefined => {
      const value = searchParams.get(key);
      return value ?? undefined;
    };

    const dateRange =
      (searchParams.get("dateRange") as AnalyticsDateRange | null) ??
      DEFAULT_STATE.dateRange;

    const jobStatus =
      (searchParams.get("jobStatus") as AnalyticsJobStatus | null) ??
      DEFAULT_STATE.jobStatus;

    return {
      companyId: get("companyId"),
      companyName: get("companyName"),
      recruiterId: get("recruiterId"),
      recruiterName: get("recruiterName"),
      dateRange,
      jobStatus,
    };
  }, [searchParams]);

  const updateParams = useCallback(
    (patch: Partial<AnalyticsUrlState>) => {
      const merged: AnalyticsUrlState = { ...state, ...patch };
      const next = new URLSearchParams(searchParams);

      const setOrDelete = (key: keyof AnalyticsUrlState, value?: string) => {
        if (!value) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      };

      setOrDelete("companyId", merged.companyId);
      setOrDelete("companyName", merged.companyName);
      setOrDelete("recruiterId", merged.recruiterId);
      setOrDelete("recruiterName", merged.recruiterName);
      next.set("dateRange", merged.dateRange);
      next.set("jobStatus", merged.jobStatus);

      setSearchParams(next, { replace: true });
    },
    [state, searchParams, setSearchParams]
  );

  const setCompany = useCallback(
    (id?: string, name?: string) => {
      updateParams({
        companyId: id,
        companyName: name,
        recruiterId: undefined,
        recruiterName: undefined,
      });
    },
    [updateParams]
  );

  const setRecruiter = useCallback(
    (id?: string, name?: string) => {
      updateParams({
        recruiterId: id,
        recruiterName: name,
      });
    },
    [updateParams]
  );

  const setDateRange = useCallback(
    (range: AnalyticsDateRange) => {
      updateParams({ dateRange: range });
    },
    [updateParams]
  );

  const setJobStatus = useCallback(
    (status: AnalyticsJobStatus) => {
      updateParams({ jobStatus: status });
    },
    [updateParams]
  );

  return {
    state,
    setCompany,
    setRecruiter,
    setDateRange,
    setJobStatus,
    setAll: updateParams,
  };
}

