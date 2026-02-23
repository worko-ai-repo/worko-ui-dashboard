import { Archive, email_sync, mobile_install } from "@AssetsFolder/assets";
import VerifyUserContact from "@Components/Modals/SharedModals/VerifyUserContact";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import { Column, NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import Modal from "@Components/Shared/Modal";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { AtSign, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { handleDeleteUsers } from "../Employee/EmployeeTable";
import { getCurrentPositionCell } from "../Applicants/ApplicantsTable";

interface CandidateTableProps {
  data: ApplicantDetails[];
  fetchEmployees: () => void;
  handleVerifyContact?: (userEmail: string, type: "EMAIL" | "MOBILE") => Promise<void>;
  handleDeleteUser?: (userId: string) => Promise<void>;
  isUpdating?: boolean;
  pagination: CommonCursorPaginationProp;
}

const CandidateTable: React.FC<CandidateTableProps> = ({
  data,
  fetchEmployees,
  handleVerifyContact,
  handleDeleteUser,
  isUpdating = false,
  pagination,
}) => {
  const keyFallbacks = {
    candidateExperience_companyName: ["companyName", "candidateExperience.companyName"],
    candidateExperience_department: ["department", "candidateExperience.department"],
    candidateExperience_designation: ["designation", "candidateExperience.designation"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks, {
    tableId: "admin-candidate",
    defaultSort: null,
    persistInLocalStorage: false,
    persistInUrl: true,
  });

  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const [pdfViewUserDetails, setPdfViewUserDetails] = useState<{
    name: string;
    YOE?: number;
    companyName?: string;
  }>();
  const [verifyModalOpen, setVerifyModalOpen] = useState<{
    isOpen: boolean;
    type: "EMAIL" | "MOBILE";
    user: ApplicantDetails;
    key?: number;
  }>({ isOpen: false, type: "EMAIL", user: {} as ApplicantDetails });
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const handleVerifyClick = (type: "EMAIL" | "MOBILE", user: ApplicantDetails) => {
    setVerifyModalOpen({
      isOpen: true,
      type,
      user,
      key: Date.now(),
    });
  };

  const handleFetchAndOpenCV = async (row: ApplicantDetails) => {
    try {
      const { response, error } = await httpServiceObj.get<{ objectUrl: string }>(
        `/file/${row?.userId}/${row?.CV}/USER_RESUME`,
        true,
        {},
        false,
        "BASE"
      );
      if (error || !response) {
        throw new Error("Failed to fetch CV");
      }
      if (response.objectUrl) {
        setPdfViewDetails(response.objectUrl);
        setPdfViewUserDetails({
          name: row.name,
          YOE: row.YOE,
          companyName: getCurrentPositionCell(row)?.companyName || "",
        });
        setIsViewCVModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to fetch CV. Please try again.", getToastOptions({}));
    }
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
          <span className="w-full capitalize font-semibold">{row?.name}</span>
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
    // { key: "referralApplied", label: "Referrals Applied", sortable: true },
    // { key: "referralCount", label: "Referrals Request Accepted", sortable: true },
    { key: "jobCount", label: "Job Applied", sortable: true },
    {
      key: "candidateExperience_designation",
      label: "Designation",
      sortable: true,
      render: (row: ApplicantDetails) => (
        <span
          data-tooltip-id="my-tooltip"
          data-tooltip-content={
            getCurrentPositionCell(row)?.designation ||
            row?.candidateExperience?.designation ||
            "NA"
          }>
          {getCurrentPositionCell(row)?.designation ||
            row?.candidateExperience?.designation ||
            "NA"}
        </span>
      ),
    },
    {
      key: "Cv link",
      label: "CV Link",
      render: (row: ApplicantDetails) => (
        <button
          key="view-cv"
          data-tooltip-id="my-tooltip"
          data-tooltip-content="View CV"
          onClick={async () => {
            await handleFetchAndOpenCV(row);
          }}
          className="flex gap-2 items-center btn-info mx-auto">
          <Eye size={16} />
        </button>
      ),
    },
    {
      key: "Actions",
      label: "Actions",
      contentWidth: "max-w-none !min-w-96",
      render: (row: ApplicantDetails) => {
        const isRowUpdating = updatingUserId === row.userId;

        return (
          <div className="flex gap-3 px-2 justify-between">
            <button
              disabled={row.isNumberVerified === true || isUpdating || isRowUpdating}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Verify Mobile Number"
              onClick={() => {
                handleVerifyClick("MOBILE", row);
              }}
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
              disabled={row.isEmailVerified === true || isUpdating || isRowUpdating}
              data-tooltip-id="my-tooltip"
              data-tooltip-content="Verify Email Address"
              onClick={() => {
                handleVerifyClick("EMAIL", row);
              }}
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
              data-tooltip-content="Archive Candidate"
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
          <p>{row?.YOE || "  "} </p>
        </span>
        <span>
          <label>Account created at</label>
          <p>{new Date(row.createdAt).toLocaleDateString()}</p>
        </span>

        <span>
          <label>Department</label>
          <div
            data-tooltip-id="my-tooltip"
            data-tooltip-content={
              getCurrentPositionCell(row)?.department ||
              row?.candidateExperience?.department ||
              "NA"
            }>
            {getCurrentPositionCell(row)?.department ||
              row?.candidateExperience?.department ||
              "NA"}
          </div>
        </span>

        <div>
          <span className=" text-gray-500">Current CTC</span>
          <p className="capitalize">{typeof row?.CTC === "number" ? `${row.CTC} LPA` : "-"}</p>
        </div>
        <div>
          <span className=" text-gray-500">Expected CTC</span>
          <p className="capitalize">{typeof row?.ECTC === "number" ? `${row.ECTC} LPA` : "-"}</p>
        </div>
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
      <NewDynamicTable<ApplicantDetails>
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
        enableExpand={true}
      />
      <Modal
        isOpen={isViewCVModalOpen}
        onClose={() => {
          setIsViewCVModalOpen(false);
        }}
        className="w-[90vw] sm:max-w-4xl h-full">
        {!pdfViewDetails ? (
          <NoDataPresent />
        ) : (
          <CVPreviewRaw
            pdfUrl={pdfViewDetails}
            candidateName={pdfViewUserDetails?.name || "Candidate"}
            companyName={pdfViewUserDetails?.companyName}
            YOE={pdfViewUserDetails?.YOE}
            onClose={() => setIsViewCVModalOpen(false)}
          />
        )}
      </Modal>
      <Modal
        key={verifyModalOpen.key} // Use the unique key to force re-render
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

export default CandidateTable;
