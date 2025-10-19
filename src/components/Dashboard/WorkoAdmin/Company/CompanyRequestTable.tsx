import { Column, DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";
import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { CompanyDto, CompanyRequestDto } from "@Interfaces/JobsAndCompany.dto";
import { Building2, CheckCircle2Icon, Edit, Trash2 } from "lucide-react";
import { useReducer, useState } from "react";
import DeleteCompany from "./DeleteCompanyModal";
import UpdateCompany from "./UpdateCompany";

interface CompanyRequestTableProps {
  data: CompanyRequestDto[];
  fetchCompany: () => void;
  pagination: CommonCursorPaginationProp;
}

// 1. Define modal types
type ModalType = "deleteCompany" | "updateCompany" | null;

// 2. Define state shape
interface ModalState {
  activeModal: ModalType;
  key?: string;
  data?: CompanyDto | CompanyRequestDto | null;
  fetchCompany?: () => void;
}

// 3. Actions for reducer
type despatchAction =
  | {
      type: "OPEN";
      modal: ModalType;
      payload?: Partial<ModalState>;
    }
  | { type: "CLOSE" };

// 4. Reducer
function modalReducer(state: ModalState, despatchAction: despatchAction): ModalState {
  switch (despatchAction.type) {
    case "OPEN":
      return { activeModal: despatchAction.modal, ...despatchAction.payload };
    case "CLOSE":
      return { activeModal: null, key: undefined, data: null, fetchCompany: undefined };
    default:
      return state;
  }
}

const CompanyRequestTable: React.FC<CompanyRequestTableProps> = ({
  data,
  fetchCompany,
  pagination,
}) => {
  // Modal state is the state in modalReducer and dispatch is the action dispatcher
  const [modalState, dispatch] = useReducer(modalReducer, {
    activeModal: null,
    key: undefined,
    data: null,
    fetchCompany: undefined,
  });
  const keyFallbacks = {
    companyDetail_industry:["companyDetail.industry",]
  };
  let { sortedData, onSortChange } = useSortableData(data, keyFallbacks);

  const [expandedRows, setExpandedRows] = useState<string[]>([]);

  const columns: Column<CompanyRequestDto>[] = [
    { key: "userName", label: "Requested By", sortable: true /* className: "w-40"  */ },
    { key: "companyDetail_name", label: "Company Name", sortable: true },

    {
      key: "linkedin",
      label: "LinkedIn",
      sortable: true,
      render: (row: CompanyRequestDto) => (
        <InteractiveInput
          data={row.companyDetail.linkedIn}
          isLoading={false}
          variant="open-link"
          placeholder="No company URL available"
          width="w-48 mx-auto lowercase"
        />
      ),
    },
    {
      key: "carrierPage",
      label: "Carrier Page",
      sortable: true,
      render: (row: CompanyRequestDto) => (
        <InteractiveInput
          data={row.companyDetail.carrierPage}
          isLoading={false}
          variant="open-link"
          placeholder="No company URL available"
          width="w-48 mx-auto lowercase"
        />
      ),
    },
    {
      key: "companyDetail_industry",
      label: "Industry",
      sortable: true,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      contentWidth: "max-w-none",
      render: (row: CompanyRequestDto) => (
        <span
          className={`px-3 py-0 rounded-full text-white font-semibold ${
            row.status === "approved"
              ? "bg-green-500"
              : row.status === "denied"
              ? "bg-red-500"
              : "bg-blue-500"
          }`}>
          {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
        </span>
      ),
    },

    {
      key: "action",
      label: "Actions",
      render: (row: CompanyRequestDto) => (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            disabled={row.status === "denied" || row.status === "approved"}
            onClick={() => {
              //form the companyrequest data to company data type
              const rowAsCompany: CompanyDto = {
                SK: row.SK,
                GSI1PK: row.companyId,
                GSI1SK: row.companyId,
                name: row.companyDetail.name,
                industry: row.companyDetail.industry,
                linkedIn: row.companyDetail.linkedIn,
                carrierPage: row.companyDetail.carrierPage,
                logo: "",
                logoUrl: "",
                isVerified: false,
                teamSize: 0,
                updatedAt: row.updatedAt,
                id: row.companyId,
                PK: "",
                aboutCompany: "",
                createdAt: "",
                website: "",
                isCompanyRequestPageFlag: true,
              };
              dispatch({
                type: "OPEN",
                modal: "updateCompany",
                payload: { data: rowAsCompany, key: rowAsCompany.SK, fetchCompany },
              });
            }}
            className="bg-green-500 rounded-lg w-9 items-center   h-9 flex justify-center btn_disabled">
            <CheckCircle2Icon className=" text-white p-1" />
          </button>
          <button
            disabled={row.status === "denied" || row.status === "approved"}
            onClick={() =>
              dispatch({
                type: "OPEN",
                modal: "deleteCompany",
                payload: { data: row, key: row.companyId, fetchCompany },
              })
            }
            className="bg-red-500 rounded-lg w-9 items-center   h-9 flex justify-center btn_disabled">
            <Trash2 className=" text-white p-1" />
          </button>
        </div>
      ),
    },
  ];

  const renderExpandedDetails = (row: CompanyRequestDto) => {
    return (
      <div className="flex items-center gap-4 p-4">
        <span className="flex flex-col items-center mt-0 p-0">
          <label className="font-semibold text-gray-500 ">User Email</label>
          <div
            className="whitespace-pre-wrap text-center"
            dangerouslySetInnerHTML={{ __html: row.userEmail || "------" }}></div>
        </span>
        <span className="flex flex-col items-center mt-0 p-0">
          <label className="font-semibold text-gray-500 ">User Type</label>
          <p className="whitespace-pre-wrap text-center">
            {row.userType === "EMP" ? "Employee" : "Candidate"}
          </p>
        </span>
        {/* Date */}
        <span className="flex flex-col items-center mt-0 p-0">
          <label className="font-semibold text-gray-500 ">Request Date</label>
          <p className="whitespace-pre-wrap text-center">
            {new Date(row.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </span>
      </div>
    );
  };

  /**
   * Toggle row expansion
   */
  const toggleExpand = (id: string) => {
    setExpandedRows((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]));
  };
  // use sk as id in sorted data and data
  sortedData = sortedData?.map((item) => ({ ...item, id: item.SK }));
  return (
    <>
      <DynamicTable<CompanyRequestDto>
        columns={columns}
        rows={sortedData ?? []}
        enableSelect={false}
        onSortChange={onSortChange}
        pageSize={pagination.pageSize}
        setPageSize={pagination.setPageSize}
        handlePreviousPage={pagination.goToPreviousPage}
        handleNextPage={pagination.goToNextPage}
        hasNextPage={pagination.hasNextPage}
        hasPrevPage={pagination.hasPreviousPage}
        renderExpandedDetails={renderExpandedDetails}
        expandedRows={expandedRows}
        toggleExpand={toggleExpand}
      />
      <Modal
        isOpen={modalState.activeModal === "updateCompany"}
        onClose={() => dispatch({ type: "CLOSE" })}
        className="py-5">
        {modalState.data && (
          <UpdateCompany
            companyData={modalState.data as CompanyDto}
            mode="REQUEST"
            onClose={() => dispatch({ type: "CLOSE" })}
            fetchCompany={modalState.fetchCompany!}
          />
        )}
      </Modal>
      <Modal
        isOpen={modalState.activeModal === "deleteCompany"}
        onClose={() => dispatch({ type: "CLOSE" })}
        className="py-5">
        <DeleteCompany
          companyId={modalState.key!}
          onClose={() => dispatch({ type: "CLOSE" })}
          fetchCompany={modalState.fetchCompany!}
          isRequest={true}
        />
      </Modal>
    </>
  );
};

export default CompanyRequestTable;
