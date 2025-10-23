import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import HeaderDetails from "@Components/Shared/Stats";
import { useAppContext } from "@Context/App.context";
import { useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationUsersDataAdminParams } from "@Interfaces/AdminServices.dto";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { useEffect, useState, useRef } from "react";
import AdminServiceObj from "../Services/Admin.service";
import EmployeeTable from "./EmployeeTable";
import InputFromDataToDateFilter from "@Components/Shared/ui/InputFromDataToDateFilter";
import { useUrlState } from "@Hooks/useUrlState.hook";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import httpServiceObj from "@Services/ApiHandler.service";

const Employee = () => {
  const queryClient = useQueryClient();
  const currentPageIndexRef = useRef(0);

  const {
    searchText: searchBarText,
    setSearchText: handleSearchChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    filters,
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

  const [dateRange, setDateRange] = useState<{ fromDate: string; toDate: string }>({
    fromDate: fromDate,
    toDate: toDate,
  });

  useEffect(() => {
    setDateRange({ fromDate, toDate });
  }, [fromDate, toDate]);

  const handleDateRangeChange: React.Dispatch<
    React.SetStateAction<{ fromDate: string; toDate: string }>
  > = (value) => {
    const newValue = typeof value === "function" ? value(dateRange) : value;
    setDateRange(newValue);

    setFilters({
      ...filters,
      fromDate: newValue.fromDate || "",
      toDate: newValue.toDate || "",
    });
  };

  const params: Omit<CursorPaginationUsersDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    userType: "EMP",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
    ...(fromDate ? { fromDate: fromDate } : {}),
    ...(toDate ? { toDate: toDate } : {}),
  };

  const baseQueryKey = [
    "AdminEmployeeQuery",
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

  useEffect(() => {
    currentPageIndexRef.current = currentPage - 1;
  }, [currentPage]);

  const verifyContactMutation = useMutation({
    mutationFn: async ({
      userEmail,
      type,
    }: {
      userEmail: string;
      type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL";
    }) => {
      let payload: any;
      let finalPath: string;

      if (type === "COMPANY_EMAIL") {
        payload = { isEmailVerified: true };
        finalPath = "experience";
      } else {
        payload = type === "EMAIL" ? { isEmailVerified: true } : { isNumberVerified: true };
        finalPath = "details";
      }

      const { response, error } = await httpServiceObj.patch(
        `/user/${userEmail}/${finalPath}`,
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

      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.map((employee: ApplicantDetails) => {
              if (employee.email === userEmail) {
                if (type === "COMPANY_EMAIL") {
                  return {
                    ...employee,
                    isCurrentCompEmailVerified: true,
                    updatedAt: new Date().toISOString(),
                  };
                }
                return {
                  ...employee,
                  ...(type === "EMAIL"
                    ? { isEmailVerified: true }
                    : { isNumberVerified: true }),
                  updatedAt: new Date().toISOString(),
                };
              }
              return employee;
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
      const contactType =
        variables.type === "EMAIL"
          ? "Email"
          : variables.type === "MOBILE"
          ? "Mobile"
          : "Company Email";
      toast.success(`${contactType} verified successfully!`, getToastOptions({}));

      if (!data || !Array.isArray(data)) return;

      const index = data.findIndex(
        (employee: ApplicantDetails) => employee.email === variables.userEmail
      );
      if (index !== -1) {
        if (variables.type === "COMPANY_EMAIL") {
          data[index] = {
            ...data[index],
            isCurrentCompEmailVerified: true,
          };
        } else {
          data[index] = {
            ...data[index],
            ...(variables.type === "EMAIL"
              ? { isEmailVerified: true }
              : { isNumberVerified: true }),
          };
        }
        console.log(`✅ Patched employee ${variables.userEmail} in local data.`);
      }

      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];
      queryClient.setQueryDefaults(actualQueryKey, {
        staleTime: 5 * 60 * 1000,
      });
    },
  });

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

      queryClient.setQueryData(actualQueryKey, (oldData: any) => {
        if (!oldData?.pages) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            data: page.data.filter((employee: ApplicantDetails) => employee.userId !== userId),
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

      const actualQueryKey = [...baseQueryKey, currentPageIndexRef.current];
      queryClient.setQueryDefaults(actualQueryKey, {
        staleTime: 5 * 60 * 1000,
      });
    },
  });

  useEffect(() => {
    reset();
    refetch();
  }, [searchBarText, pageSize, fromDate, toDate]);

  const handleVerifyContact = async (userEmail: string, type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL") => {
    await verifyContactMutation.mutateAsync({ userEmail, type });
  };

  const handleDeleteUser = async (userId: string) => {
    await deleteUserMutation.mutateAsync(userId);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
         {/*  <div className="flex flex-wrap  gap-4">
            <HeaderDetails key="admin-employee-stats" pageType="employees" />
          </div> */}

          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
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
        {queryIsJobsLoading ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : (
          <EmployeeTable
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
  );
};

export default Employee;
