import { Archive, email_sync, mobile_install } from "@AssetsFolder/assets";
import VerifyUserContact from "@Components/Modals/SharedModals/VerifyUserContact";
import CVPreviewRaw from "@Components/Shared/CvPreviewRaw";
import { Column, DynamicTable } from "@Components/Shared/DynamicTable";
import Modal from "@Components/Shared/Modal";
import NoDataPresent from "@Components/Shared/NoDataPresent";
import { useSortableData } from "@Hooks/useSortTableData.hook";
import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import { CommonCursorPaginationProp } from "@Interfaces/CorporateServices.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { AtSign, Eye } from "lucide-react";
import { useState } from "react";
import { toast } from "react-toastify";
import { handleDeleteUsers } from "../Employee/EmployeeTable";
import { getCurrentPositionCell } from "../Applicants/ApplicantsTable";

interface CandidateTableProps {
  data: ApplicantDetails[];
  fetchEmployees: () => void;
  pagination: CommonCursorPaginationProp;
}
const CandidateTable: React.FC<CandidateTableProps> = ({ data, fetchEmployees, pagination }) => {
  const keyFallbacks = {
    candidateExperience_companyName: ["companyName", "candidateExperience.companyName"],
    candidateExperience_department: ["department", "candidateExperience.department"],
    candidateExperience_designation: ["designation", "candidateExperience.designation"],
  };

  const { sortedData, onSortChange } = useSortableData(data, keyFallbacks);
  const [expandedRows, setExpandedRows] = useState<string[]>([]);
  const [isViewCVModalOpen, setIsViewCVModalOpen] = useState(false);
  const [pdfViewDetails, setPdfViewDetails] = useState<string>();
  const [verifyModalOpen, setVerifyModalOpen] = useState<{
    isOpen: boolean;
    type: "EMAIL" | "MOBILE";
    user: ApplicantDetails;
    key?: number; // Add a unique key to force re-render
  }>({ isOpen: false, type: "EMAIL", user: {} as ApplicantDetails });

  const handleVerifyClick = (type: "EMAIL" | "MOBILE", user: ApplicantDetails) => {
    setVerifyModalOpen({
      isOpen: true,
      type,
      user,
      key: Date.now(), // Add a unique timestamp
    });
  };

  const handleFetchAndOpenCV = async (row: ApplicantDetails) => {
    try {
      //https://api.worko.ai/file/e1b35d9a-d0c1-70cc-1641-08179377a01a/01K3K5S4RJ56GJT2DMAQR12FDG.pdf/USER_RESUME
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
        setIsViewCVModalOpen(true);
      }
    } catch (error) {
      toast.error("Failed to fetch CV. Please try again.", getToastOptions({}));
    }
  };
  const columns: Column<ApplicantDetails>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
      render: (row: ApplicantDetails) => <span className="w-full capitalize">{row?.name}</span>,
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
    { key: "referralCount", label: "Referrals Request Accepted", sortable: true },
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
          title="View CV"
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
        return (
          <div className="flex gap-3 px-2  justify-between">
            <button
              disabled={row.isNumberVerified === true}
              onClick={() => {
                handleVerifyClick("MOBILE", row);
              }}
              className=" cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              <img src={mobile_install} alt="Verify Mobile" className="h-4 w-4 flex-shrink-0" />
              <span className="w-full">
                {row.isNumberVerified === false ? "Verify Mobile" : "Mobile Verified"}
              </span>
            </button>

            <button
              disabled={row.isEmailVerified === true} //@TODO:ROHIT ADD ATTRB
              onClick={() => {
                handleVerifyClick("EMAIL", row);
              }}
              className="cursor-pointer text-white btn-sky py-2.5 btn_disabled flex items-center gap-2">
              <AtSign className="h-4 w-4 flex-shrink-0" />
              <span className="w-full">
                {row.isEmailVerified === false ? "Verify Email" : "Email Verified"}
              </span>
            </button>
            <button
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Archive Candidate"}
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
          <p>{row?.YOE || "  "} </p>
        </span>
        <span>
          <label>Account created at</label>
          <p>{new Date(row.createdAt).toLocaleDateString()}</p>
        </span>

        <span>
          <label>Department</label>
          <span
            data-tooltip-id="my-tooltip"
            data-tooltip-content={
              getCurrentPositionCell(row)?.department ||
              row?.candidateExperience?.department ||
              "NA"
            }>
            {getCurrentPositionCell(row)?.department ||
              row?.candidateExperience?.department ||
              "NA"}
          </span>
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
        isOpen={isViewCVModalOpen}
        onClose={() => {
          setIsViewCVModalOpen(false);
        }}
        className="w-[90vw] sm:max-w-4xl h-full">
        {!pdfViewDetails ? (
          <NoDataPresent />
        ) : (
          <CVPreviewRaw pdfUrl={pdfViewDetails} onClose={() => setIsViewCVModalOpen(false)} />
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
          refetch={fetchEmployees}
        />
      </Modal>
    </>
  );
};

export default CandidateTable;
