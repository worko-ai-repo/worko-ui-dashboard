import { Archive, email_sync, mobile_install } from "@AssetsFolder/assets";
import VerifyUserContact from "@Components/Modals/SharedModals/VerifyUserContact";
import { Column, DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { getToastOptions } from "@Utils/Toast.utils";
import { AtSign, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import AdminServiceObj from "../Services/Admin.service";
import { getCurrentPositionCell } from "../Applicants/ApplicantsTable";

interface EmployeeTableProps {
  data: ApplicantDetails[];
  fetchEmployees: () => void;
  handleVerifyContact?: (userEmail: string, type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL") => Promise<void>;
  handleDeleteUser?: (userId: string) => Promise<void>;
  isUpdating?: boolean;
  pagination: CommonCursorPaginationProp;
}

export async function handleDeleteUsers(row: ApplicantDetails) {
  try {
    const responseOk: boolean = await AdminServiceObj.deleteUser(row.userId);
    if (!responseOk) {
      throw new Error("Failed to delete user");
    }
    toast.success("User deleted successfully", getToastOptions());
  } catch (error) {
    console.error("Error deleting user:", error);
    toast.error("Failed to delete user", getToastOptions());
  }
}

const EmployeeTable: React.FC<EmployeeTableProps> = ({ 
  data, 
  fetchEmployees, 
  handleVerifyContact,
  handleDeleteUser,
  isUpdating = false,
  pagination 
}) => {
  const keyFallbacks = {
    candidateExperience_companyName: ["companyName", "candidateExperience.companyName"],
    candidateExperience_department: ["department", "candidateExperience.department"],
    candidateExperience_designation: ["designation", "candidateExperience.designation"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: "admin-employee",
    defaultSort: null,
    persistInLocalStorage: false,
    persistInUrl: true,
  });

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState<{
    isOpen: boolean;
    type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL";
    user: ApplicantDetails;
    key?: number;
  }>({ isOpen: false, type: "EMAIL", user: {} as ApplicantDetails });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleVerifyClick = (
    type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL",
    user: ApplicantDetails
  ) => {
    setVerifyModalOpen({
      isOpen: true,
      type,
      user,
      key: Date.now(),
    });
  };

  const handleDeleteClick = async (row: ApplicantDetails) => {
    if (!handleDeleteUser) {
      // Fallback to old method if handler not provided
      await handleDeleteUsers(row);
      fetchEmployees();
      return;
    }

    setUpdatingUserId(row.userId);
    try {
      await handleDeleteUser(row.userId);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const columns: Column<ApplicantDetails>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: ApplicantDetails) => (
        <div className="flex items-center gap-2">
          <span className="w-full capitalize">{row?.name}</span>
          {updatingUserId === row.userId && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          )}
        </div>
      ),
    },
    { key: "email", label: "Email", sortable: true },
    { key: "number", label: "Phone no", sortable: true },
    {
      key: "candidateExperience_companyName",
      label: "Company Name",
      sortable: true,
      render: (row: ApplicantDetails) => (
        <span
          data-tooltip-id="my-tooltip"
          data-tooltip-content={
            getCurrentPositionCell(row)?.companyName ||
            row?.candidateExperience?.companyName ||
            "NA"
          }>
          {getCurrentPositionCell(row)?.companyName ||
            row?.candidateExperience?.companyName ||
            "NA"}
        </span>
      ),
    },
    { key: "referralCount", label: "Referrals Request Pending", sortable: true },
    {
      key: "candidateExperience_department",
      label: "Department",
      sortable: true,
      render: (row: ApplicantDetails) => (
        <span
          data-tooltip-id="my-tooltip"
          data-tooltip-content={
            getCurrentPositionCell(row)?.department || row?.candidateExperience?.department || "NA"
          }>
          {getCurrentPositionCell(row)?.department || row?.candidateExperience?.department || "NA"}
        </span>
      ),
    },
    {
      key: "candidateExperience_designation",
      label: "Designation",
      sortable: true,
      render: (row: ApplicantDetails) => (
        <span
          data-tooltip-id="my-tooltip"
          data-tooltip-content={
            getCurrentPositionCell(row)?.department || row?.candidateExperience?.department || "NA"
          }>
          {getCurrentPositionCell(row)?.department || row?.candidateExperience?.department || "NA"}
        </span>
      ),
    },
    { key: "isEmailVerified", label: "Company Email Verified" },
    {
      key: "Actions",
      label: "Actions",
      contentWidth: "max-w-none w-96",
      render: (row: ApplicantDetails) => {
        const isRowUpdating = updatingUserId === row.userId;
        
        return (
          <div className="flex gap-3 px-2 justify-between">
            <button
              data-tooltip-id="my-tooltip"
              data-tooltip-content={
                row.isNumberVerified !== false ? "Mobile already verified" : "Verify mobile number"
              }
              disabled={row.isNumberVerified !== false || isUpdating || isRowUpdating}
              onClick={() => handleVerifyClick("MOBILE", row)}
              className="cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              {isRowUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <img src={mobile_install} alt="Verify Mobile" className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="w-full">
                {row.isNumberVerified === false ? "Verify Mobile" : "Mobile Verified"}
              </span>
            </button>

            <button
              disabled={row.isCurrentCompEmailVerified === true || !row.companyEmailId || isUpdating || isRowUpdating}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={
                !row.companyEmailId
                  ? "No company email found"
                  : row.isCurrentCompEmailVerified === true
                  ? "Company email already verified"
                  : "Verify company email"
              }
              onClick={() => handleVerifyClick("COMPANY_EMAIL", row)}
              className="cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              {isRowUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <img src={email_sync} alt="Verify Email" className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="w-full">
                {row.isEmailVerified === false ? "Verify Company Email" : "Company Email Verified"}
              </span>
            </button>

            <button
              data-tooltip-id="my-tooltip"
              data-tooltip-content={
                row.isEmailVerified === true ? "Email already verified" : "Verify email"
              }
              onClick={() => handleVerifyClick("EMAIL", row)}
              disabled={row.isEmailVerified === true || isUpdating || isRowUpdating}
              className="cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              {isRowUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
              ) : (
                <AtSign className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="w-full">
                {row.isEmailVerified === false ? "Verify Email" : "Email Verified"}
              </span>
            </button>

            <button
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Archive Employee"
              disabled={isUpdating || isRowUpdating}
              onClick={() => handleDeleteClick(row)}
              className="cursor-pointer w-12 h-9.5 text-white bg-blue-600 rounded-xl btn_disabled">
              {isRowUpdating ? (
                <Loader2 className="mx-auto w-6 flex-shrink-0 animate-spin" />
              ) : (
                <img src={Archive} alt="Archive Employee" className="mx-auto w-6 flex-shrink-0" />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  const renderExpandedDetails = (row: ApplicantDetails) => {
    return (
      <div className="p-4  flex justify-evenly gap-4">
        <span>
          <label>Experience</label>
          <p>{row.YOE}</p>
        </span>
        <span>
          <label>Account created at</label>
          <p>{new Date(row.createdAt).toLocaleDateString()}</p>
        </span>
        <span>
          <label>Referral request accepted</label>
          <p>{row.referralCount}</p>
          {/* >@TODO : ADD REFERRAL ACCEPTED COUNTR */}
        </span>

        {/* <p><strong>Location:</strong> {row.location}</p>
        <p><strong>Years of Experience:</strong> {row.YOE}</p>
        <p><strong>Current CTC:</strong> {row.CTC}</p>
        <p><strong>Expected CTC:</strong> {row.ECTC}</p>
        <p><strong>Notice Period:</strong> {row.noticePeriod} days</p>
        <p><strong>About:</strong> {row.about}</p> */}
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
      <DynamicTable<ApplicantDetails>
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
        key={verifyModalOpen.key}
        isOpen={verifyModalOpen.isOpen}
        onClose={() => {
          setVerifyModalOpen({ isOpen: false, type: "EMAIL", user: {} as ApplicantDetails });
        }}
        className="w-72 sm:max-w-3xl h-full py-4">
        <VerifyUserContact
          type={verifyModalOpen.type}
          user={verifyModalOpen.user}
          onClose={() => {
            setVerifyModalOpen({ isOpen: false, type: "EMAIL", user: {} as ApplicantDetails });
          }}
          handleVerifyContact={handleVerifyContact}
          refetch={fetchEmployees}
        />
      </Modal>
    </>
  );
};

export default EmployeeTable;
