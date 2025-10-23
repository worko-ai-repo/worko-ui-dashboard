import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import {
  CursorPaginationReferAndEarnAdminParams,
  ReferAndEarnDto,
  ReferAndEarnUpdateApiDto,
} from "@Interfaces/AdminServices.dto";
import { useEffect, useRef } from "react";
import AdminServiceObj from "../Services/Admin.service";
import HeaderDetails from "@Components/Shared/Stats";
import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import EarningsCard from "./EarningsDropdown";
import AdminReferAndEarnTable from "./ReferAndEarnTable";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

const AdminReferAndEarn = () => {
  const queryClient = useQueryClient();
  const currentPageIndexRef = useRef(0);

  const {
    searchText: searchBarText,
    setSearchText: handleSearchChange,
    pageSize,
    setPageSize: handlePageSizeChange,
  } = useUrlState({
    search: {
      defaultValue: null,
    },
    pageSize: {
      defaultValue: 25,
      validValues: [10, 25, 50, 100, 150, 200],
    },
  });

  const params: Omit<CursorPaginationReferAndEarnAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };

  // Base query key without the dynamic currentPageIndex
  const baseQueryKey = ["AdminReferAndEarnQuery", searchBarText || "", JSON.stringify(params)];

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
  } = useCursorPagination<ReferAndEarnDto, CursorPaginationReferAndEarnAdminParams>({
    queryKey: baseQueryKey,
    queryFn: AdminServiceObj.fetchReferAndEarnDetails,
    baseParams: params,
    enabled: !!params,
  });

  // Update current page index ref whenever page changes
  useEffect(() => {
    currentPageIndexRef.current = currentPage - 1;
  }, [currentPage]);

  // Mutation for single refer and earn status update
  const updateReferAndEarnMutation = useMutation({
    mutationFn: async (payload: { id: string; updateData: ReferAndEarnUpdateApiDto }) => {
      const result = await AdminServiceObj.patchReferAndEarnStatus(payload.id, payload.updateData);
      if (!result) {
        throw new Error("Failed to update refer and earn status");
      }
      return result;
    },
    onMutate: async (payload) => {
      // The actual query key used by useInfiniteQuery includes the currentPageIndex
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      await queryClient.cancelQueries({ queryKey: actualQueryKey });

      // Get the previous data using the correct query key
      const previousData = queryClient.getQueryData(actualQueryKey);

      // Optimistically update the cache
      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((item: ReferAndEarnDto) => {
              if (item.id === payload.id) {
                return {
                  ...item,
                  ...payload.updateData,
                  updatedAt: new Date().toISOString(),
                };
              }
              return item;
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
      console.error("Failed to update refer and earn status:", err);
      toast.error("Failed to update. Please try again.", getToastOptions({}));
    },
    onSuccess: (updatedItem: ReferAndEarnDto) => {
      toast.success("Updated successfully!", getToastOptions({}));

      // Update local data array
      if (!data || !Array.isArray(data)) {
        return;
      }

      const index = data.findIndex((item: ReferAndEarnDto) => item.id === updatedItem.id);
      if (index !== -1) {
        data[index] = { ...data[index], ...updatedItem };
      }
    },
  });

  useEffect(() => {
    refetch();
    reset();
  }, [searchBarText, pageSize]);

  // Handler for updating refer and earn status with optimistic updates
  const handleReferAndEarnUpdate = async (
    id: string,
    updateData: ReferAndEarnUpdateApiDto,
    successMessage?: string,
    hasRefetch: boolean = false
  ) => {
    try {
      await updateReferAndEarnMutation.mutateAsync({ id, updateData });

      if (successMessage) {
        toast.success(successMessage, getToastOptions({}));
      }

      // Optional background refetch after delay
      if (hasRefetch) {
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: baseQueryKey });
        }, 2000);
      }
    } catch (error) {
      // Error is already handled in onError
      console.error("Update failed:", error);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex gap-3">
          <div className="flex flex-1  flex-col ">
            <div className="flex flex-wrap  gap-4">
              <HeaderDetails key={`header-details-refer-and-earn`} pageType="referr&earn" />
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              {/* Search Bar */}
              <SearchBar
                placeholder="Search by company name, job title, ph.no, recipient detail."
                searchBarText={searchBarText}
                setSearchBarText={handleSearchChange}
                handleClick={() => refetch()}
              />
            </div>
          </div>
          <EarningsCard />
        </div>
        {queryIsJobsLoading && (!data || data.length === 0) ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <AdminReferAndEarnTable
            data={data}
            fetchRefernEarn={refetch}
            handleReferAndEarnUpdate={handleReferAndEarnUpdate}
            isUpdating={updateReferAndEarnMutation.isPending}
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
  );
};
export default AdminReferAndEarn;
