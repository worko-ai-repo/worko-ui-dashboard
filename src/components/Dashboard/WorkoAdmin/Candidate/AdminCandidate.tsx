import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationUsersDataAdminParams } from "@Interfaces/AdminServices.dto";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { useEffect, useState, useRef } from "react";
import AdminServiceObj from "../Services/Admin.service";
import CandidateTable from "./CandidateTable";
import InputFromDataToDateFilter from "@Components/Shared/ui/InputFromDataToDateFilter";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import httpServiceObj from "@Services/ApiHandler.service";

const AdminCandidate = () => {
  const queryClient = useQueryClient();
  const currentPageIndexRef = useRef(0);

  const {
    searchText: searchBarText,
    setSearchText: handleSearchChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    filters,
    setFilter,
    setFilters,
  } = useUrlState({
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: 25,
      validValues: [10, 25, 50, 100, 150, 200],
    },
    filters: {
      fromDate: {
        defaultValue: "",
      },
      toDate: {
        defaultValue: "",
      },
    },
  });

  const fromDate = filters.fromDate || "";
  const toDate = filters.toDate || "";


  // Local state for date filter to match InputFromDataToDateFilter's expected type
  const [dateRange, setDateRange] = useState<{ fromDate: string; toDate: string }>({
    fromDate: fromDate,
    toDate: toDate,
  });

  // Sync dateRange with URL filters
  useEffect(() => {
    setDateRange({ fromDate, toDate });
  }, [fromDate, toDate]);

  // Handler for date change that updates URL params
  const handleDateRangeChange: React.Dispatch<
    React.SetStateAction<{ fromDate: string; toDate: string }>
  > = (value) => {
    const newValue = typeof value === "function" ? value(dateRange) : value;
    
    setDateRange(newValue);
    
    // Use setFilters to update both dates atomically instead of individual setFilter calls
    setFilters({
      ...filters,
      fromDate: newValue.fromDate || "",
      toDate: newValue.toDate || "",
    });
  };

  const params: Omit<CursorPaginationUsersDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    userType: "CAND",
    ...(fromDate ? { fromDate: fromDate } : {}),
    ...(toDate ? { toDate: toDate } : {}),
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };

  // Base query key without the dynamic currentPageIndex
  const baseQueryKey = [
    "AdminCandidateQuery",
    searchBarText || "",
    fromDate || "",
    toDate || "",
    JSON.stringify(params),
  ];

  const {
    data,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
    currentPage,
  } = useCursorPagination<ApplicantDetails, CursorPaginationUsersDataAdminParams>({
    queryKey: baseQueryKey,
    queryFn: AdminServiceObj.fetchAdminUsers,
    baseParams: params,
    enabled: !!params,
  });

  // Update current page index ref whenever page changes
  useEffect(() => {
    currentPageIndexRef.current = currentPage - 1;
  }, [currentPage]);

  // Mutation for verifying user contact (email or mobile)
  const verifyContactMutation = useMutation({
    mutationFn: async ({ userEmail, type }: { userEmail: string; type: "EMAIL" | "MOBILE" }) => {
      const payload = type === "EMAIL" ? { isEmailVerified: true } : { isNumberVerified: true };
      const { response, error } = await httpServiceObj.patch(
        `/user/${userEmail}/details`,
        payload,
        true,
        {},
        false,
        "BASE"
      );
      if (error || !response) {
        throw new Error("Failed to verify user");
      }
      return { ...response, userEmail, type };
    },
    onMutate: async ({ userEmail, type }) => {
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      await queryClient.cancelQueries({ queryKey: actualQueryKey });
      const previousData = queryClient.getQueryData(actualQueryKey);

      // Optimistically update the cache
      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((candidate: ApplicantDetails) => {
              if (candidate.email === userEmail) {
                return {
                  ...candidate,
                  ...(type === "EMAIL" ? { isEmailVerified: true } : { isNumberVerified: true }),
                  updatedAt: new Date().toISOString(),
                };
              }
              return candidate;
            }),
          })),
        };
      });

      return { previousData, actualQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData && context?.actualQueryKey) {
        queryClient.setQueryData(context.actualQueryKey, context.previousData);
      }
      console.error("Failed to verify user:", err);
      toast.error("Failed to verify user. Please try again.", getToastOptions({}));
    },
    onSuccess: (result, variables) => {
      const contactType = variables.type === "EMAIL" ? "Email" : "Mobile";
      toast.success(`${contactType} verified successfully!`, getToastOptions({}));

      // Update local data array
      if (!data || !Array.isArray(data)) return;

      const index = data.findIndex(
        (candidate: ApplicantDetails) => candidate.email === variables.userEmail
      );
      if (index !== -1) {
        data[index] = {
          ...data[index],
          ...(variables.type === "EMAIL" ? { isEmailVerified: true } : { isNumberVerified: true }),
        };
        
      }

      // Mark the query as fresh to prevent automatic refetch
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];
      queryClient.setQueryDefaults(actualQueryKey, {
        staleTime: 5 * 60 * 1000,
      });
    },
  });

  // Mutation for archiving/deleting user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const result = await AdminServiceObj.deleteUser(userId);
      if (!result) {
        throw new Error("Failed to delete user");
      }
      return { userId };
    },
    onMutate: async (userId: string) => {
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      await queryClient.cancelQueries({ queryKey: actualQueryKey });
      const previousData = queryClient.getQueryData(actualQueryKey);

      // Optimistically remove from cache
      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((candidate: ApplicantDetails) => candidate.userId !== userId),
          })),
        };
      });

      return { previousData, actualQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData && context?.actualQueryKey) {
        queryClient.setQueryData(context.actualQueryKey, context.previousData);
      }
      console.error("Failed to delete user:", err);
      toast.error("Failed to delete user. Please try again.", getToastOptions({}));
    },
    onSuccess: () => {
      toast.success("User deleted successfully!", getToastOptions({}));

      // Mark the query as fresh to prevent automatic refetch
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];
      queryClient.setQueryDefaults(actualQueryKey, {
        staleTime: 5 * 60 * 1000,
      });
    },
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset();
    refetch();
  }, [searchBarText, pageSize, fromDate, toDate]);

  // Handler functions for optimistic updates
  const handleVerifyContact = async (userEmail: string, type: "EMAIL" | "MOBILE") => {
    await verifyContactMutation.mutateAsync({ userEmail, type });
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUserMutation.mutateAsync(userId);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
          <div className="flex flex-wrap  gap-4">
            <HeaderDetails key="admin-candidate-stats" pageType="candidates" />
          </div>

          <div className="flex flex-col sm:flex-row  justify-between items-center gap-3">
            {/* Search Bar */}
            <SearchBar
              placeholder="Search by email"
              searchBarText={searchBarText}
              setSearchBarText={handleSearchChange}
              handleClick={() => refetch()}
            />
            <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
              <InputFromDataToDateFilter
                onDateChange={handleDateRangeChange}
                defaultFromDate={fromDate}
                defaultToDate={toDate}
              />
            </div>
          </div>
        </div>
        <div className="sticky top-60 ">
          {queryIsJobsLoading ? (
            <SkeletonLoader
              showTableHeader={true}
              showTableRows={true}
              tableColumns={5}
              rowCount={5}
            />
          ) : (
            <CandidateTable
              data={data}
              fetchEmployees={refetch}
              handleVerifyContact={handleVerifyContact}
              handleDeleteUser={handleDeleteUser}
              isUpdating={verifyContactMutation.isPending || deleteUserMutation.isPending}
              pagination={{
                goToNextPage,
                goToPreviousPage,
                hasNextPage,
                hasPreviousPage,
                pageSize,
                setPageSize: handlePageSizeChange,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCandidate;
