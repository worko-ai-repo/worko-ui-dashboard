import React, { memo, useMemo, useState } from "react";
import { ReferralApiResponse, ReferralDetailsDto, PaginationInfo } from "./ReferralTypes";
import { DynamicTable } from "@Components/Shared/DynamicTable";
import { chat, eyeIcon } from "@AssetsFolder/assets";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import { getToastOptions } from "@Utils/Toast.utils";
import { useDashboardContext } from "@Context/Dashboard.context";
import SimpleStepper from "./SimpleStepper";
import profileService from "@Components/Dashboard/Candidate/Service/ProfileService";
import AcceptRefferralModal from "./AcceptReferralModal";
import RejectRefferralModal from "./RejectReferralModal";
import RaiseIssueModal from "./RaiseIssueModal";
import CompletedReferralModal from "./CompletedReferralModal";
import ProvideFeedbackModal from "./ProvideFeedbackModal";
import ViewDetailsModal from "@Components/Dashboard/Candidate/Pages/Job/modals/ViewDetailsModal";
import ChatWindow from "@Components/Dashboard/Candidate/Pages/Referral/modals/ChatWindow";

interface UserDetails {
  cvAwsS3SignedUrl?: string;
}

interface ReferralsTableProps {
  data: ReferralApiResponse | null;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}
interface StepperProps {
  status: string;
}

const ReferralsTable = memo(
  ({
    data,
    pagination,
    currentPage,
    onPageChange,
    onPageSizeChange,
    onRefresh,
  }: ReferralsTableProps) => {
    const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showRaiseIssueModal, setShowRaiseIssueModal] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const [selectedRow, setSelectedRow] = useState<ReferralDetailsDto | null>(null);
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentCandidate, setCurrentCandidate] = useState<any>(null);
    const [detailsData, setDetailsData] = useState<any>(null);
    const [referralData, setReferralData] = useState<any>(null);
    const [showProvideFeedback, setShowProvideFeedback] = useState(false);
    const [showViewDetails, setShowViewDetails] = useState<boolean>(false);
    const [viewDetailsContent, setViewDetailsContent] = useState<string>("");
    const [showChatWindow,setShowChatWindow] = useState<boolean>(false);

    const { user } = useDashboardContext();

    const referrals = data?.data || [];

    // const keyExtractor = (item: ReferralDetailsDto) => item.id?.toString() ?? Math.random().toString();

    const handleSelectChange = (
      e: React.ChangeEvent<HTMLSelectElement>,
      row: ReferralDetailsDto
    ) => {
      const value = e.target.value;
      if (value === "accept") {
        // console.log("Accepted", row);
        setReferralData(row);
        setShowAcceptModal(true);
      } else if (value === "reject") {
        // console.log("Rejected", row);
        setReferralData(row);
        setShowRejectModal(true);
      } else if (value === "raiseIssue") {
        setReferralData(row);
        setShowRaiseIssueModal(true);
      } else if (value === "markDone") {
        setReferralData(row);
        setShowCompletedModal(true);
      }
      e.target.selectedIndex = 0;
    };

    const fetchData = async (row: ReferralDetailsDto) => {
      const PK = row.PK.split("#");
      const userEmail = PK[PK.length - 1];

      try {
        setIsLoading(true);
        setError(null);

        if (!userEmail) {
          throw new Error("User not found");
        }
        // console.log(userEmail);
        const { response } = await httpServiceObj.get<UserDetails[]>(
          `/user/${userEmail}/details`, true, {}, false, "BASE");
        
        if (!response || response.length === 0) {
          toast.error("No CV found", getToastOptions({}));
          return;
        }

        setDetailsData(response[0]);
        const url = response[0].cvAwsS3SignedUrl;

        if (!url) {
          toast.error("No CV found", getToastOptions({}));
        }

        return url;
      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };

    const columns = [
      {
        key: "candidateName",
        label: "Candidate Name",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]">
            <span className="truncate block w-full" title={row.userDetails.name}>
              {row.userDetails.name}
            </span>
          </div>
        ),
      },
      {
        key: "referredJobURL",
        label: "Job URL",
        sortable: true,
        render: (row: ReferralDetailsDto) =>
          row.jobUrl ? (
            <div className="flex justify-center m-auto w-[150px]">
              <a
                className="text-blue-500 visited:text-blue-500 truncate block w-full"
                href={row.jobUrl}>
                Link
              </a>
            </div>
          ) : (
            <p className="truncate block w-full">-</p>
          ),
      },
      {
        key: "createdAt",
        label: "Request Date",
        sortable: true,
        render: (row: ReferralDetailsDto) =>
          new Date(row.createdAt).toLocaleDateString("en-GB", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }),
      },
      {
        key: "matchingScore",
        label: "Matching Score",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]">
            <MatchingScoreCircle
              score={row.matchingScore ?? 0}
              scoreDetails={row}
              status={row.status}  
              />
          </div>
        ),
      },
      {
        key: "status",
        label: "Current Status",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]">
            <div
              className={`w-32 text-center rounded-full px-1 py-3 text-sm font-medium ${
                row.status === "ACCEPTED"
                  ? "bg-green-100 text-green-500"
                  : row.status === "PENDING"
                  ? "bg-yellow-100 text-yellow-600"
                  : row.status === "AWAITING"
                  ? "bg-blue-100 text-blue-500"
                  : row.status === "DONE"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-red-400 text-white"
              }`}>
              {row.status}
            </div>
          </div>
        ),
      },
      {
        key: "viewCV",
        label: "View CV",
        render: (row: ReferralDetailsDto) => (
          <div className="flex justify-center m-auto w-[150px]">
            <a
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                const url = await fetchData(row);
                if (url) {
                  window.open(url, "_blank");
                }
              }}
              target="_blank"
              rel="noopener noreferrer">
              <img className="w-8 h-8 rounded-md bg-[#57E1E1]" src={eyeIcon} alt="View CV" />
            </a>
          </div>
        ),
      },
      {
        key: "chat",
        label: "Chat",
        render: (row: ReferralDetailsDto) =>
          row.status !== "REJECTED" && row.status !== "AWAITING"? (
            <div className="flex justify-center m-auto w-[150px]">
            <button
            onClick={() => {
                  setReferralData(row);
                  setShowChatWindow(true);
                }}>
            <a className="text-blue-600 hover:underline">
              <img src={chat} alt="" />
            </a>
            </button>
            </div>
          ) : (
            <div className="flex justify-center m-auto w-[150px]">
              <a
                className="w-14 h-11 rounded-xl flex items-center justify-center transition-all
              bg-gray-300 cursor-not-allowed grayscale">
                <img src={chat} alt="Chat disabled" className="grayscale opacity-50" />
              </a>
            </div>
          ),
      },
      {
        key: "update",
        label: "Update",
        render: (row: ReferralDetailsDto) => {
          return row.status === "AWAITING" ? (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="w-32 text-center rounded-full px-1 py-3 text-sm font-medium bg-gray-100 text-gray-600">
                <select
                  onChange={(e) => handleSelectChange(e, row)}
                  defaultValue=""
                  className="w-full text-center bg-transparent border-none focus:outline-none cursor-pointer">
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="accept">Accept</option>
                  <option value="reject">Reject</option>
                </select>
              </div>
            </div>
          ) : row.status === "ACCEPTED" ? (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="w-32 text-center rounded-full px-1 py-3 text-sm font-medium bg-gray-100 text-gray-600">
                <select
                  onChange={(e) => handleSelectChange(e, row)}
                  defaultValue=""
                  className="w-full text-center bg-transparent border-none focus:outline-none cursor-pointer">
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="raiseIssue">Raise Issue</option>
                  <option value="markDone">Mark as Done</option>
                </select>
              </div>
            </div>
          ) : row.status === "DONE" ? (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="truncate block w-full text-center rounded-full px-1 py-3 text-sm font-medium bg-yellow-200 text-black">
                <button
                  className="truncate w-full overflow-hidden whitespace-nowrap"
                  onClick={() => {
                    setShowProvideFeedback(true);
                    setReferralData(row);
                  }}>
                  Feedback
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="truncate block w-full text-center rounded-full px-1 py-3 text-sm font-medium bg-white text-black">
                <button className="truncate w-full overflow-hidden whitespace-nowrap"></button>
              </div>
            </div>
          );
        },
      },
    ];

const handlePageSizeChange: React.Dispatch<React.SetStateAction<number>> = (value) => {
  if (typeof value === "number") {
    setPageSize(value);
    onPageSizeChange(value);
  } else {
    setPageSize((prev) => {
      const newValue = value(prev);
      onPageSizeChange(newValue);
      return newValue;
    });
  }
};

    const sortData = (rows: ReferralDetailsDto[], field: string): ReferralDetailsDto[] => {
      if (!field) return rows;

      return [...rows].sort((a, b) => {
        let aValue = (a as any)[field];
        let bValue = (b as any)[field];

        if (field === "createdAt") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
        } else {
          // to handle empty undefined and null names
          aValue = aValue ?? "";
          bValue = bValue ?? "";

          if (typeof aValue === "string") aValue = aValue.toLowerCase();
          if (typeof bValue === "string") bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    };

    const handleSortChange = (columnKey: string) => {
      if (sortField === columnKey) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(columnKey);
        setSortOrder("asc");
      }
    };

    const sortedData = useMemo(
      () => sortData(referrals, sortField),
      [referrals, sortField, sortOrder]
    );

    const MatchingScoreCircle = memo(
      ({ score, scoreDetails, status }: { score: number; scoreDetails?: any; status?: string }) => (
    <div className="w-20 flex flex-col items-center justify-center gap-1 text-base text-green-500">
      <div className="w-16 relative h-16 flex items-center justify-center">
        <svg className="absolute scale-[80%]" width="65" height="65" viewBox="0 0 65 65">
          <circle cx="32.5" cy="32.5" r="30" fill="none" stroke="#eee" strokeWidth="5" />
          <circle
            cx="32.5" 
            cy="32.5" 
            r="30" 
            fill="none" 
            stroke="#4cbc9a" 
            strokeWidth="5"
            strokeDasharray={`${(score / 100) * 2 * Math.PI * 30} ${2 * Math.PI * 30}`}
            transform="rotate(-90 32.5 32.5)"
          />
        </svg>
        <div className="absolute font-semibold text-xs">{score}%</div>
      </div>
            {status !== "REJECTED" && (
              <button
                onClick={() => {
                  setShowViewDetails(true);
                  setViewDetailsContent(scoreDetails);
                }}
                className="text-[9px] font-semibold text-gray-500 text-center leading-none"
        >
          View details
        </button>
      )}
    </div>
      )
    );

    const renderExpandedDetails = (row: StepperProps) => {
      if (["REJECTED", "CANCELLED", "WITHDRAWN"].includes(row.status)) return null;

      return <SimpleStepper currentStatus={row.status} />;
    };

    const toggleExpand = (id: string) => {
      const row = sortedData.find((r) => r.id === id);
      if (!row) return;

      if (["CANCELLED", "REJECTED", "WITHDRAWN"].includes(row.status)) {
        // Do nothing — no expand allowed
        return;
      }

      setExpandedRows((prev) =>
        prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
      );
    };

    return (
      <div className="w-full font-poppins">
        <div className="bg-white shadow-md h-full rounded-xl overflow-hidden">
          <DynamicTable<ReferralDetailsDto>
            columns={columns}
            rows={sortedData}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            handlePreviousPage={() => onPageChange(currentPage - 1)}
            handleNextPage={() => onPageChange(currentPage + 1)}
            hasPrevPage={currentPage > 1}
            hasNextPage={!!pagination?.lastKey}
            emptyStateMessage="No referrals found"
            emptyStateSubMessage="Try adjusting your filters"
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
            enableSelect={false}
            // keyExtractor={keyExtractor}
            renderExpandedDetails={renderExpandedDetails}
            toggleExpand={toggleExpand}
            expandedRows={expandedRows}
          />
          <ViewDetailsModal
            show={showViewDetails}
            viewDetailsContent={viewDetailsContent}
            onClose={() => setShowViewDetails(false)}
          />
          {/* {showAcceptModal && ( */}
            <AcceptRefferralModal
              onClose={() => setShowAcceptModal(false)}
              isOpen={showAcceptModal}
              referralData={referralData}
              onRefresh={onRefresh}
            />
          {/* )} */}
          {/* {showRejectModal && ( */}
            <RejectRefferralModal
              onClose={() => setShowRejectModal(false)}
              isOpen={showRejectModal}
              referralData={referralData}
              onRefresh={onRefresh}
            />
          {/* )} */}
          {/* {showRaiseIssueModal && ( */}
            <RaiseIssueModal
              onClose={() => setShowRaiseIssueModal(false)}
              isOpen={showRaiseIssueModal}
              referralData={referralData}
              onRefresh={onRefresh}
              isCandidate={false}
            />
          {/* )} */}
          {/* {showCompletedModal && ( */}
            <CompletedReferralModal
              onClose={() => setShowCompletedModal(false)}
              isOpen={showCompletedModal}
              referralData={referralData}
              onRefresh={onRefresh}
              isCandidate={false}
            />
          {/* )} */}
          {/* {showProvideFeedback && ( */}
            <ProvideFeedbackModal
              onClose={() => setShowProvideFeedback(false)}
              isOpen={showProvideFeedback}
              referralData={referralData}
              onRefresh={onRefresh}
              isCandidate={false}
            />
          {/* )} */}
            {/* {showChatWindow && ( */}
            <ChatWindow
              onClose={()=>setShowChatWindow(false)}
              show={showChatWindow}  
              referralData={referralData}      
              user={"employee"}   
            />
          {/* )} */}
        </div>
      </div>
    );
  }
);

ReferralsTable.displayName = "ReferralsTable";

export default ReferralsTable;
