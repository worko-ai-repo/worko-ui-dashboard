import RevokeForm from "@Components/Dashboard/Corporate/Invites/RevokeForm";
import { DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";
import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { CompanyDto } from "@Interfaces/JobsAndCompany.dto";
import { Building2, Edit, Trash2 } from "lucide-react";
import { useReducer, useState } from "react";
import DeleteCompany from "./DeleteCompanyModal";
import UpdateCompany from "./UpdateCompany";

interface CompanyTableProps {
  data: CompanyDto[];
  fetchCompany: () => void;
  pagination: CommonCursorPaginationProp;
}

// 1. Define modal types
type ModalType = "deleteCompany" | "updateCompany" | null;

// 2. Define state shape
interface ModalState {
  activeModal: ModalType;
  key?: string;
  data?: CompanyDto | null;
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

const CompanyTable: React.FC<CompanyTableProps> = ({ data, fetchCompany, pagination }) => {
  // Modal state is the state in modalReducer and dispatch is the action dispatcher
  const [modalState, dispatch] = useReducer(modalReducer, {
    activeModal: null,
    key: undefined,
    data: null,
    fetchCompany: undefined,
  });

  const { sortedData, onSortChange } = useSortableData(data, {});

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  /*  const [OpenExtraDetailsModal, setOpenExtraDetailsModal] = useState<{
    isOpen: boolean;
    details: ExtraReferralDetailsResponse | null;
    key?: string;
  }>({ isOpen: false, details: null, key: undefined });
 */
  const columns = [
    { key: "name", label: "Company Name", sortable: true },
    {
      key: "website",
      label: "Website",
      sortable: true,
      render: (row: CompanyDto) => (
        <InteractiveInput
          data={row.website}
          isLoading={false}
          variant="open-link"
          placeholder="No company URL available"
          width="w-48 mx-auto lowercase"
        />
      ),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      sortable: true,
      render: (row: CompanyDto) => (
        <InteractiveInput
          data={row.linkedIn}
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
      render: (row: CompanyDto) => (
        <InteractiveInput
          data={row.carrierPage}
          isLoading={false}
          variant="open-link"
          placeholder="No company URL available"
          width="w-48 mx-auto lowercase"
        />
      ),
    },
    {
      key: "logo",
      label: "Logo",
      sortable: false,
      render: (row: CompanyDto) => {
        const [imgError, setImgError] = useState(false);
        const finalLogoUrl = row.logo
          ? `${import.meta.env.APP_WORKO_BASE_URL}/images/${row.logo}`
          : row.logoUrl;
        return finalLogoUrl && !imgError ? (
          <img
            data-tooltip-id="my-tooltip"
            data-tooltip-content={row.name}
            src={finalLogoUrl}
            alt={row.name}
            loading="lazy"
            className="h-12 w-12 cursor-pointer border object-contain rounded-full"
            onError={() => setImgError(true)} // This only affects the current component
          />
        ) : (
          <Building2 className="h-12 w-12 cursor-pointer border p-2 rounded-full text-gray-400" />
        );
      },
    },
    {
      key: "industry",
      label: "Industry",
      sortable: true,
    },

    {
      key: "action",
      label: "Actions",
      render: (row: CompanyDto) => (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() =>
              dispatch({
                type: "OPEN",
                modal: "updateCompany",
                payload: { data: row, key: row.id, fetchCompany },
              })
            }
            className="btn-sky grid grid-cols-[20px_auto] ">
            <Edit className="h-4 w-4" />
            Update Status
          </button>
          <button
            onClick={() =>
              dispatch({
                type: "OPEN",
                modal: "deleteCompany",
                payload: { data: row, key: row.id, fetchCompany },
              })
            }
            className="bg-red-500 rounded-lg w-9 items-center   h-9 flex justify-center">
            <Trash2 className=" text-white p-1" />
          </button>
        </div>
      ),
    },
  ];
  const renderExpandedDetails = (row: CompanyDto) => {
    return (
      <div className="flex items-center gap-4 p-4">
        <span className="flex flex-col items-center mt-0 p-0">
          <label className="font-semibold text-gray-500 ">About Company</label>
          <div
            className="whitespace-pre-wrap text-center"
            dangerouslySetInnerHTML={{ __html: row.aboutCompany || "------" }}></div>
        </span>
        <span className="flex flex-col items-center mt-0 p-0">
          <label className="font-semibold text-gray-500 ">Team Size</label>
          <p className="whitespace-pre-wrap">{row.teamSize}</p>
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
  return (
    <>
      <DynamicTable<CompanyDto>
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
            companyData={modalState.data}
            mode="UPDATE"
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
          isRequest={false}
        />
      </Modal>
    </>
  );
};

export default CompanyTable;
