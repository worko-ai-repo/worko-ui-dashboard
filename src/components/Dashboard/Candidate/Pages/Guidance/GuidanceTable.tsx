import { memo, useState, useCallback, useMemo, useRef } from "react";
import { GuidanceApiResponse, GuidanceRequest, GuidancePaginationInfo } from "./Guidance";
import { useDashboardContext } from "@Context/Dashboard.context";
import { checkbubble, eyeIcon } from "@Assets";
import GuidanceMentorModal from "../../SharedComponents/GuidanceMentorModal";
import { Column, NewDynamicTable } from "@Components/Shared/NewDynamicTable";
import MentorDetails from "./modals/MentorDetails";
import AcceptAndPay from "./modals/AcceptAndPay";
import httpServiceObj from "@Services/ApiHandler.service";
import ViewFullDetail from "./modals/ViewFullDetail";
interface GuidanceTableProps {
  data: GuidanceApiResponse | null;
  pagination: GuidancePaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  // onRefresh: () => void;
  userID: string;
  onLocalUpdate: (guidanceId: string, updatedData: Partial<GuidanceRequest>) => void;
}

interface MentorMergedData {
  socialProfile: any | null;
  mentorDetails: any | null;
}

const GuidanceTable = memo(
  ({
    data,
    pagination,
    currentPage,
    onPageChange,
    onPageSizeChange,
    // onRefresh,
    userID,
    onLocalUpdate,
  }: GuidanceTableProps) => {
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [modalState, setModalState] = useState<{
      isOpen: boolean;
      variant: "acceptAndPay" | "mentorDetails";
      selectedRequest: GuidanceRequest | null;
    }>({
      isOpen: false,
      variant: "mentorDetails",
      selectedRequest: null,
    });
    const { user } = useDashboardContext();
    const [localVisible, setLocalVisible] = useState(false);
    const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const mentorDataCache = useRef<Map<string, MentorMergedData>>(new Map());
    const [mentorDataLoading, setMentorDataLoading] = useState<boolean>(false);
    const [viewViewDetailsModal, setViewViewDetailsModal] = useState<boolean>(false);
    const [fullDetails, setFullDetails] = useState<string>("");

    const APP_API_URI = import.meta.env.APP_API_URI;

    const formatGuidanceType = (type: string) => {
      const typeMap: { [key: string]: string } = {
        MOCK_INTERVIEW_PREPARATION: "Mock interview/preparation",
        CAREER_GUIDANCE: "Career guidance",
        HELP_WITH_ASSIGNMENT: "Help with assignment",
        INTERVIEW_HAND_HOLDING: "Interview hand-holding",
        RESUME_REVIEW: "Resume review",
        OTHER: "Other",
      };
      return typeMap[type] || type;
    };

    const fetchMentorData = async (email: string): Promise<MentorMergedData> => {
      try {
        const socialProfileUrl = `/user/${encodeURIComponent(email)}/socialprofile`;
        const mentorDetailsUrl = `/user/${encodeURIComponent(email)}/details`;

        const [
          { response: socialProfileResponse, error: socialProfileError },
          { response: mentorDetailsResponse, error: mentorDetailsError },
        ] = await Promise.all([
          httpServiceObj.get(socialProfileUrl, true, {}),
          httpServiceObj.get(mentorDetailsUrl, true, {}),
        ]);

        if (socialProfileError || mentorDetailsError) {
          console.error("Error fetching mentor data:", socialProfileError || mentorDetailsError);
          return { socialProfile: null, mentorDetails: null };
        }
        // console.log(socialProfileResponse)
        return {
          socialProfile:
            Array.isArray(socialProfileResponse) && socialProfileResponse.length > 0
              ? socialProfileResponse[0]
              : null,
          mentorDetails:
            Array.isArray(mentorDetailsResponse) && mentorDetailsResponse.length > 0
              ? mentorDetailsResponse[0]
              : null,
        };
      } catch (error) {
        console.error("Exception in fetchMentorData:", error);
        return { socialProfile: null, mentorDetails: null };
      }
    };

    // Open modal and fetch mentor data if not cached
    const openModal = useCallback(
      async (request: GuidanceRequest, variant: "acceptAndPay" | "mentorDetails") => {
        setModalState({
          isOpen: true,
          variant,
          selectedRequest: request,
        });
        setLocalVisible(true);

        if (!request.id) return;

        // If data already cached, do nothing
        if (mentorDataCache.current.has(request.id)) return;

        setMentorDataLoading(true);
        const mentorEmail = request.mentorDetails?.userEmail || user?.email || "";
        if (!mentorEmail) {
          setMentorDataLoading(false);
          return;
        }

        const data = await fetchMentorData(mentorEmail);
        mentorDataCache.current.set(request.id, data);
        setMentorDataLoading(false);
      },
      [user?.email]
    );

    const closeModal = useCallback(() => {
      setLocalVisible(false);
      setTimeout(() => {
        setModalState({
          isOpen: false,
          variant: "mentorDetails",
          selectedRequest: null,
        });
      }, 300);
    }, []);

    const handleViewDetails = useCallback(
      (request: GuidanceRequest) => {
        openModal(request, "acceptAndPay");
        // console.log(request)
      },
      [openModal]
    );

    const handleAcceptAndPay = useCallback(
      async (request: GuidanceRequest) => {
        if (!user?.email) return;
        openModal(request, "mentorDetails");
      },
      [openModal, user?.email]
    );

    // const handleModalAcceptAndPay = useCallback(async (request: GuidanceRequest) => {
    //   setProcessingRequestId(request.id);
    //   try {
    //     // console.log("Accept and pay for request:", request.id);
    //     onRefresh();
    //     closeModal();
    //   } catch (error) {
    //     console.error("Error accepting guidance request:", error);
    //   } finally {
    //     setProcessingRequestId(null);
    //   }
    // }, [onRefresh, closeModal]);

    // color theme for status
    const getStatusColor = (status?: string) => {
      const statusColors: Record<string, { bg: string; text: string; label: string }> = {
        PENDING: { bg: "bg-gray-200", text: "text-gray-900", label: "Pending" },
        MENTOR_ASSIGNED: { bg: "bg-blue-100", text: "text-blue-600", label: "Mentor Assigned" },
        CANCELLED: { bg: "bg-red-100", text: "text-red-600", label: "Cancelled" },
        PAYMENT_CONFIRMATION_PENDING: {
          bg: "bg-yellow-100",
          text: "text-yellow-600",
          label: "Payment Confirmation Pending",
        },
        PAYMENT_CONFIRMATION_DONE: {
          bg: "bg-green-100",
          text: "text-green-600",
          label: "Payment Done",
        },
        MEETING_RESCHEDULE_REQUESTED_BY_CANDIDATE: {
          bg: "bg-orange-100",
          text: "text-orange-600",
          label: "Reschedule Requested by Candidate",
        },
        MEETING_RESCHEDULE_REQUESTED_BY_MENTOR: {
          bg: "bg-orange-100",
          text: "text-orange-600",
          label: "Reschedule Requested by Mentor",
        },
        MEETING_CONFIRMED: {
          bg: "bg-orange-200",
          text: "text-orange-600",
          label: "Meeting Confirmed",
        },
        MEETING_RESCHEDULE_CONFIRMED: {
          bg: "bg-teal-100",
          text: "text-teal-600",
          label: "Meeting Re-scheduled Confirmed",
        },
        PROJECT_COMPLETED: { bg: "bg-teal-400", text: "text-teal-800", label: "Project Completed" },
        REJECTED: { bg: "bg-red-100", text: "text-red-600", label: "Rejected" },
      };

      return (
        statusColors[status || ""] || {
          bg: "bg-gray-100",
          text: "text-gray-600",
          label: status || "Unknown",
        }
      );
    };

    const columns = [
      {
        key: "guidanceRequestType",
        label: "Guidance Type",
        sortable: true,
        render: (row: GuidanceRequest) => formatGuidanceType(row.guidanceRequestType),
      },
      {
        key: "companyName",
        label: "Company",
        sortable: true,
        contentWidth: `min-w-[150px]`,
        render: (row: GuidanceRequest) => row.companyName
      },
      {
        key: "dateNeeded",
        label: "Date needed by",
        sortable: true,
        render: (row: GuidanceRequest) => row.dateNeeded,
      },
      {
        key: "jobUrl",
        label: "Job URL",
        sortable: true,
        render: (row: GuidanceRequest) => (
          <a
            href={row.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="tracking-wide leading-6 font-semibold text-blue-600 cursor-pointer">
            Link
          </a>
        ),
      },
      {
        key: "guidanceRequestDescription",
        label: "Requirement detail",
        sortable: true,
        render: (row: GuidanceRequest) => (
          <div className="flex justify-center m-auto w-[150px]">
            <span
              className="truncate block w-[150px]"
              data-tooltip-id="my-tooltip"
              data-tooltip-content={"Click to view full details"}
              onClick={() => {
                setViewViewDetailsModal(true);
                setFullDetails(row.guidanceRequestDescription?.toString() || "N/A");
              }}>
              {row.guidanceRequestDescription ? row.guidanceRequestDescription.toString() : "N/A"}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row: GuidanceRequest) => {
          const color = getStatusColor(row.status);
          return (
            <div
              className={`w-32 rounded-full px-1 py-3 text-xs font-medium flex justify-center items-center truncate ${color.bg} ${color.text}`}
              data-tooltip-id="my-tooltip"
              data-tooltip-content={color.label}
              data-tooltip-place="top">
              <span className="truncate block max-w-full text-center">{color.label}</span>
            </div>
            //     <div className="flex justify-center ">
            // <div
            //     className={`w-32 text-center rounded-full px-1 py-3 text-sm font-medium ${
            //       row.status === "ACCEPTED"
            //       ? "bg-green-100 text-green-500"
            //       : row.status === "PENDING"
            //       ? "bg-yellow-100 text-yellow-600"
            //       : row.status === "AWAITING"
            //       ? "bg-blue-100 text-blue-500"
            //       : row.status === "DONE"
            //       ? "bg-gray-100 text-gray-600"
            //       : "bg-red-400 text-white"
            //   }`}
            // >
            //   {row.status}
            // </div>
            // </div>
          );
        },
      },
      {
        key: "mentorDetails",
        label: "Mentor Details",
        render: (row: GuidanceRequest) => {
          if (row.status === "PENDING" || row.status === "CANCELLED") return null;

          const isProcessing = processingRequestId === row.id;

          return (
            <div
              className={`m-auto w-[150px] rounded-lg text-xs text-nowrap bg-[#57e1e1] bg-gradient-to-t from-blue-500/30 to-cyan-500/30 py-2 px-6 flex items-center justify-center gap-1 cursor-pointer text-white ${
                isProcessing ? "opacity-75" : ""
              }`}
              onClick={() => !isProcessing && handleViewDetails(row)}>
              {isProcessing ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></div>
              ) : (
                <img src={eyeIcon} className="h-6 w-6" alt="View feedback" />
              )}
              <div className="ml-2 tracking-wide leading-6 font-semibold">
                {isProcessing ? "Loading..." : "See details"}
              </div>
            </div>
          );
        },
      },
      {
        key: "acceptPay",
        label: "Accept & pay",
        render: (row: GuidanceRequest) => {
          if (row.status !== "MENTOR_ASSIGNED") return null;

          const isProcessing = processingRequestId === row.id;

          return (
            <div className="flex justify-center">
              <button
                className={`rounded-lg w-14 h-11 ${
                  isProcessing
                    ? "bg-blue-300"
                    : "bg-[#98b5ff] bg-gradient-to-t from-[#316bff] to-[#38a1d6]"
                } flex items-center justify-center text-white ${
                  isProcessing ? "opacity-75 cursor-not-allowed" : "cursor-pointer"
                }`}
                onClick={() => !isProcessing && handleAcceptAndPay(row)}
                disabled={isProcessing}>
                {isProcessing ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <img src={checkbubble} alt="Ask question" />
                )}
              </button>
            </div>
          );
        },
      },
    ];

    const guidanceRequests = data?.data || [];

    const sortData = (rows: GuidanceRequest[], field: string): GuidanceRequest[] => {
      if (!field) return rows;
      return [...rows].sort((a, b) => {
        let aValue = (a as any)[field];
        let bValue = (b as any)[field];
        if (field === "dateNeeded") {
          aValue = new Date(aValue).getTime();
          bValue = new Date(bValue).getTime();
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
      () => sortData(guidanceRequests, sortField),
      [guidanceRequests, sortField, sortOrder]
    );

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

    // const keyExtractor = (item: GuidanceRequest) => item.id;

    // Get merged mentor data from cache for modal
    const currentMentorData: MentorMergedData | undefined = modalState.selectedRequest
      ? mentorDataCache.current.get(modalState.selectedRequest.id)
      : undefined;

    return (
      <div className="w-full font-poppins">
        <div className="shadow-md h-full rounded-xl overflow-hidden">
          <NewDynamicTable<GuidanceRequest>
            columns={columns}
            rows={sortedData}
            pageSize={pageSize}
            setPageSize={handlePageSizeChange}
            handlePreviousPage={() => onPageChange(currentPage - 1)}
            handleNextPage={() => onPageChange(currentPage + 1)}
            hasPrevPage={currentPage > 1}
            hasNextPage={!!pagination?.lastKey}
            emptyStateMessage="No guidance requests found"
            emptyStateSubMessage="Try adjusting your filters"
            onSortChange={handleSortChange}
            sortField={sortField}
            sortOrder={sortOrder}
            enableSelect={false}
            // keyExtractor={keyExtractor}
          />
        </div>

        {/* Modal */}
        {modalState.selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="relative">
              <button
                onClick={closeModal}
                className="fixed top-0 right-0 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg hover:bg-gray-100 z-10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {modalState.variant === "acceptAndPay" ? (
                <MentorDetails
                  className={`${localVisible ? "animate-slide-in" : "animate-slide-out"}`}
                  request={modalState.selectedRequest}
                  mentorDetails={mentorDataLoading ? null : currentMentorData || null}
                  closeModal={closeModal}
                  // onRefresh={onRefresh}
                  onLocalUpdate={onLocalUpdate}
                  userID={userID}
                />
              ) : (
                <AcceptAndPay
                  className={`${localVisible ? "animate-slide-in" : "animate-slide-out"}`}
                  request={modalState.selectedRequest}
                  acceptAndPayDetails={mentorDataLoading ? null : currentMentorData || null}
                  closeModal={closeModal}
                  // onRefresh={onRefresh}
                  onLocalUpdate={onLocalUpdate}
                  userID={userID}
                  // onAcceptAndPay={() =>
                  //   modalState.selectedRequest && handleModalAcceptAndPay(modalState.selectedRequest)
                  // }
                />
              )}
            </div>
          </div>
        )}
        <ViewFullDetail
          onClose={() => {
            setViewViewDetailsModal(false);
            setFullDetails("");
          }}
          isOpen={viewViewDetailsModal}
          fullDetails={fullDetails}
        />
      </div>
    );
  }
);

GuidanceTable.displayName = "GuidanceTable";
export default GuidanceTable;
