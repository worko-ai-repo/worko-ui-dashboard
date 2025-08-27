import { Archive, email_sync, mobile_install } from "@AssetsFolder/assets";
import VerifyUserContact from "@Components/Modals/SharedModals/VerifyUserContact";
import { DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import { getToastOptions } from "@Utils/Toast.utils";
import { AtSign } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import AdminServiceObj from "../Services/Admin.service";

interface EmployeeTableProps {
  data: ApplicantDetails[];
  fetchEmployees: () => void;
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
const EmployeeTable: React.FC<EmployeeTableProps> = ({ data, fetchEmployees, pagination }) => {
  const keyFallbacks = {
    candidateExperience_companyName: ["companyName", "candidateExperience.companyName"],
    candidateExperience_department: ["department", "candidateExperience.department"],
    candidateExperience_designation: ["designation", "candidateExperience.designation"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState<{
    isOpen: boolean;
    type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL";
    user: ApplicantDetails | {};
    key?: number; // Add a unique key to force re-render
  }>({ isOpen: false, type: "EMAIL", user: {} });

  const handleVerifyClick = (
    type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL",
    user: ApplicantDetails
  ) => {
    setVerifyModalOpen({
      isOpen: true,
      type,
      user,
      key: Date.now(), // Add a unique timestamp
    });
  };

  const columns = [
    {
      key: "name",
      label: "Name",
      render: (row: ApplicantDetails) => <span className="w-full capitalize">{row?.name}</span>,
    },
    { key: "email", label: "Email" },
    { key: "number", label: "Phone no" },
    { key: "candidateExperience_companyName", label: "Company Name" },
    { key: "referralCount", label: "Referrals Request Pending" },
    { key: "candidateExperience_department", label: "Department" },
    { key: "candidateExperience_designation", label: "Designation" },
    { key: "isEmailVerified", label: "Company Email Verified" },
    {
      key: "Actions",
      label: "Actions",
      render: (row: ApplicantDetails) => {
        return (
          <div className="flex gap-3 px-2  justify-between">
            <button
              disabled={row.isNumberVerified === false}
              onClick={() => handleVerifyClick("MOBILE", row)}
              className=" cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              <img src={mobile_install} alt="Verify Mobile" className="h-4 w-4 flex-shrink-0" />
              <span className="w-full">
                {row.isNumberVerified === false ? "Verify Mobile" : "Mobile Verified"}
              </span>
            </button>

            <button
              disabled={row.isEmailVerified === true}
              onClick={() => handleVerifyClick("COMPANY_EMAIL", row)}
              className="cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              <img src={email_sync} alt="Verify Email" className="h-4 w-4 flex-shrink-0" />
              <span className="w-full">
                {row.isEmailVerified === false ? "Verify Company Email" : "Company Email Verified"}
              </span>
            </button>

            <button
              onClick={() => handleVerifyClick("EMAIL", row)}
              disabled={row.isEmailVerified === true} //@TODO:ROHIT ADD ATTRB
              className="cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              <AtSign className="h-4 w-4 flex-shrink-0" />
              <span className="w-full">
                {row.isEmailVerified === false ? "Verify Email" : "Email Verified"}
              </span>
            </button>

            <button
              onClick={() => handleDeleteUsers(row)}
              className=" cursor-pointer w-12 h-9.5  text-white bg-blue-600   rounded-xl">
              <img src={Archive} alt="Archive Employee" className=" mx-auto w-6 flex-shrink-0" />
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
        key={verifyModalOpen.key} // Use the unique key to force re-render
        isOpen={verifyModalOpen.isOpen}
        onClose={() => {
          setVerifyModalOpen({ isOpen: false, type: "EMAIL", user: {} });
        }}
        className="w-72 sm:max-w-3xl h-full py-4">
        <VerifyUserContact
          type={verifyModalOpen.type}
          user={verifyModalOpen.user}
          onClose={() => {
            setVerifyModalOpen({ isOpen: false, type: "EMAIL", user: {} });
          }}
          refetch={fetchEmployees}
        />
      </Modal>
    </>
  );
};

export default EmployeeTable;
