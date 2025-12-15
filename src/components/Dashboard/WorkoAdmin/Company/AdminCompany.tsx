import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import { PaginatedApiResponse, useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationCompanyDataAdminParams } from "@Interfaces/AdminServices.dto";
import { useEffect, useState, useRef } from "react";
import AdminServiceObj from "../Services/Admin.service";
import { CompanyDto, CompanyRequestDto } from "@Interfaces/JobsAndCompany.dto";
import CompanyTable from "./CompanyTable";
import Modal from "@Components/Shared/Modal";
import UpdateCompany from "./UpdateCompany";
import { ListPlus, ListTodo, ListTodoIcon } from "lucide-react";
import NeoToggle from "@Components/Shared/ui/neoToggle";
import CompanyRequestTable from "./CompanyRequestTable";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";

const AdminCompany = () => {
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

  const [IsCompanyRequestListing, setIsCompanyRequestListing] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);

  const params: Omit<CursorPaginationCompanyDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };

  // Base query key without the dynamic currentPageIndex
  const baseQueryKey = [
    IsCompanyRequestListing ? "AdminCompanyRequestQuery" : "AdminCompanyQuery",
    searchBarText || "",
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
  } = useCursorPagination<CompanyDto | CompanyRequestDto, CursorPaginationCompanyDataAdminParams>({
    queryKey: baseQueryKey,
    queryFn: IsCompanyRequestListing
      ? (AdminServiceObj.fetchCompanyRequests as (
          params: CursorPaginationCompanyDataAdminParams
        ) => Promise<PaginatedApiResponse<CompanyRequestDto>>)
      : (AdminServiceObj.fetchCompanies as (
          params: CursorPaginationCompanyDataAdminParams
        ) => Promise<PaginatedApiResponse<CompanyDto>>),
    baseParams: params,
    enabled: !!params,
  });

  // Update current page index ref whenever page changes
  useEffect(() => {
    currentPageIndexRef.current = currentPage - 1;
  }, [currentPage]);

  // Mutation for company updates (update, delete)
  const updateCompanyMutation = useMutation({
    mutationFn: async ({
      companyId,
      updateData,
      action,
    }: {
      companyId: string;
      updateData?: any;
      action: "update" | "delete" | "updateLogo";
    }) => {
      if (action === "delete") {
        const result = await AdminServiceObj.deleteCompany(companyId);
        if (!result) throw new Error("Failed to delete company");
        return { action, companyId };
      } else if (action === "updateLogo") {
        const result = await AdminServiceObj.patchCompanyLogo(companyId, updateData);
        if (!result) throw new Error("Failed to update company logo");
        return { action, companyId, data: result };
      } else {
        const result = await AdminServiceObj.putCompanyDetails(companyId, updateData);
        if (!result) throw new Error("Failed to update company");
        return { action, companyId, data: result };
      }
    },
    onMutate: async ({ companyId, updateData, action }) => {
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      await queryClient.cancelQueries({ queryKey: actualQueryKey });
      const previousData = queryClient.getQueryData(actualQueryKey);

      // Optimistically update the cache
      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData) return oldData;

        // Handle array structure (direct data array)
        if (Array.isArray(oldData)) {
          if (action === "delete") {
            return oldData.filter((company: CompanyDto) => company.id !== companyId);
          } else {
            return oldData.map((company: CompanyDto) => {
              if (company.id === companyId && updateData) {
                return {
                  ...company,
                  ...updateData,
                  updatedAt: new Date().toISOString(),
                };
              }
              return company;
            });
          }
        }

        // Handle paginated structure
        if (oldData?.pages) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => ({
              ...page,
              data:
                action === "delete"
                  ? page.data.filter((company: CompanyDto) => company.id !== companyId)
                  : page.data.map((company: CompanyDto) => {
                      if (company.id === companyId && updateData) {
                        return {
                          ...company,
                          ...updateData,
                          updatedAt: new Date().toISOString(),
                        };
                      }
                      return company;
                    }),
            })),
          };
        }

        return oldData;
      });

      return { previousData, actualQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData && context?.actualQueryKey) {
        queryClient.setQueryData(context.actualQueryKey, context.previousData);
      }
      console.error("Failed to update company:", err);
      toast.error("Failed to update company. Please try again.", getToastOptions({}));
    },
    onSuccess: (result, variables) => {
      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];

      if (variables.action === "delete") {
        toast.success("Company deleted successfully!", getToastOptions({}));
      } else {
        // Update cache with actual server response
        if (result && typeof result === "object" && "data" in result) {
          queryClient.setQueryData(actualQueryKey, (oldData: any) => {
            if (!oldData) return oldData;

            // Handle array structure
            if (Array.isArray(oldData)) {
              return oldData.map((company: CompanyDto) =>
                company.id === variables.companyId
                  ? { ...company, ...(result.data as any) }
                  : company
              );
            }

            // Handle paginated structure
            if (oldData?.pages) {
              return {
                ...oldData,
                pages: oldData.pages.map((page: any) => ({
                  ...page,
                  data: page.data.map((company: CompanyDto) =>
                    company.id === variables.companyId
                      ? { ...company, ...(result.data as any) }
                      : company
                  ),
                })),
              };
            }

            return oldData;
          });
        }
      }
    },
  });

  // Mutation for company request actions
  const companyRequestMutation = useMutation({
    mutationFn: async ({ companyId, action }: { companyId: string; action: "delete" }) => {
      const result = await AdminServiceObj.deleteCompanyRequest(companyId);
      if (!result) throw new Error("Failed to delete company request");
      return { action, companyId };
    },
    onMutate: async ({ companyId, action }) => {
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
            data: page.data.filter((request: CompanyRequestDto) => request.companyId !== companyId),
          })),
        };
      });

      return { previousData, actualQueryKey };
    },
    onError: (err, variables, context) => {
      if (context?.previousData && context?.actualQueryKey) {
        queryClient.setQueryData(context.actualQueryKey, context.previousData);
      }
      console.error("Failed to delete company request:", err);
      toast.error("Failed to delete company request. Please try again.", getToastOptions({}));
    },
    onSuccess: () => {
      toast.success("Company request deleted successfully!", getToastOptions({}));
    },
  });

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset();
    refetch();
  }, [searchBarText, pageSize, IsCompanyRequestListing]);

  // Handler functions for optimistic updates
  const handleCompanyUpdate = async (
    companyId: string,
    updateData: any,
    successMessage?: string
  ) => {
    await updateCompanyMutation.mutateAsync({
      companyId,
      updateData,
      action: "update",
    });

    if (successMessage) {
      toast.success(successMessage, getToastOptions({}));
    }

    // Optional background refetch - commented out
    // setTimeout(() => {
    //   queryClient.invalidateQueries({ queryKey: baseQueryKey });
    // }, 2000);
  };

  const handleCompanyLogoUpdate = async (companyId: string, logoData: any) => {
    await updateCompanyMutation.mutateAsync({
      companyId,
      updateData: logoData,
      action: "updateLogo",
    });

    // Optional background refetch - commented out
    // setTimeout(() => {
    //   queryClient.invalidateQueries({ queryKey: baseQueryKey });
    // }, 2000);
  };

  const handleCompanyDelete = async (companyId: string) => {
    await updateCompanyMutation.mutateAsync({
      companyId,
      action: "delete",
    });

    // Optional background refetch - commented out
    // setTimeout(() => {
    //   queryClient.invalidateQueries({ queryKey: baseQueryKey });
    // }, 2000);
  };

  const handleCompanyRequestDelete = async (companyId: string) => {
    await companyRequestMutation.mutateAsync({
      companyId,
      action: "delete",
    });

    // Optional background refetch - commented out
    // setTimeout(() => {
    //   queryClient.invalidateQueries({ queryKey: baseQueryKey });
    // }, 2000);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[15px]">
        <div className="flex flex-col ">
          <div className="flex flex-col my-3 sm:flex-row justify-between items-center gap-1">
            {/* Search Bar */}
            <SearchBar
              placeholder="Search by company name and industry"
              searchBarText={searchBarText}
              setSearchBarText={handleSearchChange}
              handleClick={() => refetch()}
            />
            <NeoToggle
              buttonOne={{ label: "Company List", icon: <ListTodoIcon className="w-4 h-4" /> }}
              buttonTwo={{ label: "Company Request", icon: <ListPlus className="w-4 h-4" /> }}
              isChecked={IsCompanyRequestListing}
              onToggle={(isChecked) => {
                setIsCompanyRequestListing(isChecked);
              }}
            />
            <div className="flex">
              <button
                onClick={() => setIsCreateCompanyModalOpen(true)}
                className="bg-gradient-to-b text-nowrap from-[#80E7E7] to-[#316BFF] text-white px-5 py-2 rounded-xl font-medium w-full">
                + Add Company
              </button>
            </div>
          </div>
        </div>

        {queryIsJobsLoading && (!data || data.length === 0) ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : IsCompanyRequestListing ? (
          <CompanyRequestTable
            data={data as CompanyRequestDto[]}
            fetchCompany={refetch}
            handleCompanyUpdate={handleCompanyUpdate}
            handleCompanyRequestDelete={handleCompanyRequestDelete}
            isUpdating={updateCompanyMutation.isPending || companyRequestMutation.isPending}
            pagination={{
              goToNextPage,
              goToPreviousPage,
              hasNextPage,
              hasPreviousPage,
              pageSize,
              setPageSize: handlePageSizeChange,
            }}
          />
        ) : (
          <CompanyTable
            data={data as CompanyDto[]}
            fetchCompany={refetch}
            handleCompanyUpdate={handleCompanyUpdate}
            handleCompanyLogoUpdate={handleCompanyLogoUpdate}
            handleCompanyDelete={handleCompanyDelete}
            isUpdating={updateCompanyMutation.isPending}
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

      <Modal
        isOpen={isCreateCompanyModalOpen}
        onClose={() => setIsCreateCompanyModalOpen(false)}
        className="py-5">
        <UpdateCompany
          companyData={null}
          mode="CREATE"
          onClose={() => setIsCreateCompanyModalOpen(false)}
          fetchCompany={refetch}
        />
      </Modal>
    </div>
  );
};

export default AdminCompany;
