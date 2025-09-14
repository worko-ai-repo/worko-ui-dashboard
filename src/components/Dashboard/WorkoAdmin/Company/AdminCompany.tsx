import SearchBar from "@Components/Shared/SearchBar";
import SkeletonLoader from "@Components/Shared/SkeletonLoader";
import { PaginatedApiResponse, useCursorPagination } from "@Hooks/usePaginatedQuery.hook";
import { CursorPaginationCompanyDataAdminParams } from "@Interfaces/AdminServices.dto";
import { useEffect, useState } from "react";
import AdminServiceObj from "../Services/Admin.service";
import { CompanyDto, CompanyRequestDto } from "@Interfaces/JobsAndCompany.dto";
import CompanyTable from "./CompanyTable";
import Modal from "@Components/Shared/Modal";
import UpdateCompany from "./UpdateCompany";
import { ListPlus, ListTodo, ListTodoIcon } from "lucide-react";
import NeoToggle from "@Components/Shared/ui/neoToggle";
import CompanyRequestTable from "./CompanyRequestTable";

const AdminCompany = () => {
  const [pageSize, setPageSize] = useState(25);
  const [searchBarText, setSearchBarText] = useState<string | null>(null);
  const [IsCompanyRequestListing, setIsCompanyRequestListing] = useState(false);
  const [isCreateCompanyModalOpen, setIsCreateCompanyModalOpen] = useState(false);
  const params: Omit<CursorPaginationCompanyDataAdminParams, "lastKey"> = {
    pageSize: pageSize,
    sortOrder: "descending",
    ...(searchBarText && searchBarText.trim() ? { searchText: searchBarText.trim() } : {}),
  };
  const {
    data,
    isLoading: queryIsJobsLoading,
    hasNextPage,
    hasPreviousPage,
    goToNextPage,
    goToPreviousPage,
    refetch,
    reset,
  } = useCursorPagination<CompanyDto | CompanyRequestDto, CursorPaginationCompanyDataAdminParams>({
    queryKey: [
      IsCompanyRequestListing ? "AdminCompanyQuery" : "AdminCompanyRequestQuery",
      !!searchBarText,
      params,
    ],
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

  /**
   * UseEffect to reset selected rows when the active tab changes
   */
  useEffect(() => {
    reset(); // Reset pagination when active tab changes
    refetch(); // Refetch data when active tab changes
  }, [searchBarText, pageSize, IsCompanyRequestListing]); // Add IsCompanyRequestListing here

  return (
    <div>
      <div className="flex flex-col sm:flex-col gap-4 sm:gap-[35px]">
        <div className="flex flex-col ">
          <div className="flex flex-col my-2 sm:flex-row justify-between items-center gap-1">
            {/* Search Bar */}
            <SearchBar
              searchBarText={searchBarText}
              setSearchBarText={setSearchBarText}
              handleClick={() => refetch()}
            />
            <NeoToggle
              buttonOne={{ label: "Company List", icon: <ListTodoIcon className="w-4 h-4" /> }}
              buttonTwo={{ label: "Company Request", icon: <ListPlus className="w-4 h-4" /> }}
              isChecked={IsCompanyRequestListing} // Pass the current state
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

        {queryIsJobsLoading ? (
          <SkeletonLoader
            showTableHeader={true}
            showTableRows={true}
            tableColumns={5}
            rowCount={5}
          />
        ) : IsCompanyRequestListing ? (
          <CompanyRequestTable // Switch the order to match the state
            data={data as CompanyRequestDto[]}
            fetchCompany={refetch}
            pagination={{
              goToNextPage,
              goToPreviousPage,
              hasNextPage,
              hasPreviousPage,
              pageSize,
              setPageSize,
            }}
          />
        ) : (
          <CompanyTable
            data={data as CompanyDto[]}
            fetchCompany={refetch}
            pagination={{
              goToNextPage,
              goToPreviousPage,
              hasNextPage,
              hasPreviousPage,
              pageSize,
              setPageSize,
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
