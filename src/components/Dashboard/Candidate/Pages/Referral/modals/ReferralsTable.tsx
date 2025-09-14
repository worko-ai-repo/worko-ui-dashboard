import React, { memo, useMemo, useState } from "react";
import {ReferralApiResponse,ReferralDetailsDto,PaginationInfo,} from "./ReferralTypes";
import { DynamicTable } from "@Components/Shared/DynamicTable";
import { chat } from "@AssetsFolder/assets";
import WithdrawRefferralModal from "./WithdrawRefferralModal";
import httpServiceObj from "@Services/ApiHandler.service";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import { useDashboardContext } from "@Context/Dashboard.context";
import SimpleStepper from "./SimpleStepper";
import ViewDetailsModal from "../../Job/modals/ViewDetailsModal";
import RaiseIssueModal from "@Components/Dashboard/Employee/Pages/Referral/modals/RaiseIssueModal";
import CompletedReferralModal from "@Components/Dashboard/Employee/Pages/Referral/modals/CompletedReferralModal";
import ProvideFeedbackModal from "@Components/Dashboard/Employee/Pages/Referral/modals/ProvideFeedbackModal";

interface ReferralsTableProps {
  data: ReferralApiResponse | null;
  pagination: PaginationInfo;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
}
interface StepperProps{
  status:string
}

const ReferralsTable = memo(
  ({ data, pagination, currentPage, onPageChange, onPageSizeChange,onRefresh }: ReferralsTableProps) => {
    const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);
    const [sortField, setSortField] = useState<string>("");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [withdrawReason, setWithdrawReason] = useState('');
    const [withdrawComments, setWithdrawComments] = useState('');
    const [selectedRow,setSelectedRow] = useState<ReferralDetailsDto | null>(null)
    const [expandedRows, setExpandedRows] = useState<string[]>([]);
    const [showViewDetails, setShowViewDetails] = useState<boolean>(false);
    const [viewDetailsContent, setViewDetailsContent] = useState<string>('');
    const [showRaiseIssueModal, setShowRaiseIssueModal] = useState(false);
    const [showCompletedModal, setShowCompletedModal] = useState(false);
    const [referralData, setReferralData] = useState<any>(null);
    const [showProvideFeedback, setShowProvideFeedback] = useState(false);

    const APP_API_URI= import.meta.env.APP_API_URI
    const APP_JOBS_API_URI= import.meta.env.APP_JOBS_API_URI
    const { user } = useDashboardContext();

    const referrals = data?.data || [];

    const keyExtractor = (item: ReferralDetailsDto) =>
      item.id?.toString() ?? Math.random().toString();
    
    const handleWithdrawReferral = async() => {
      if (!withdrawReason || !withdrawComments) {
        toast.error("Please select a reason and enter comments",getToastOptions({}));
        return;
      }
      const id = selectedRow?.id
      const email = user?.email
      if(!id || !email){
        toast.error("User Id or User email Missing",getToastOptions({}));
      }
      const payload = {reason:withdrawReason,userComment:withdrawComments};
      const url = `${APP_API_URI}/user/${email}/referral/${id}/WITHDRAWN`;
      try {
        const { response, error } = await httpServiceObj.put(url, payload, true, {}, true);
        if(response){
          toast.success("Referral Withdraw Succesfull",getToastOptions({}))
          setShowWithdrawModal(false);
          setSelectedRow(null);
          setWithdrawComments("");
          setWithdrawReason("");
          onRefresh()
        }else if(error){
          toast.error("Something went wrong please try again",getToastOptions({}))
        }
      } catch (error) {
        toast.error("Withdraw Referral Failed")
      }
    };

    const columns = [
    {
      key: "companyName",
      label: "Company",
      sortable: true,
      render: (row: ReferralDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
        <span 
        className="truncate block w-full"
        title={row.companyName}>{row.companyName}</span>
        </div>
      )
    },
      {
        key: "referredJobURL",
        label: "Job URL",
        sortable: true,
        render: (row: ReferralDetailsDto) => (
          row.jobUrl ?
          (<div className="flex justify-center m-auto w-[150px]">
              <a className="text-blue-500 visited:text-blue-500 truncate block w-full" href={row.jobUrl}>Link</a>
            </div>): (
              <p className="truncate block w-full">-</p>
            )     
          )
      },
      {
        key: "createdAt",
        label: "Request Date",
        sortable: true,
        render: (row: ReferralDetailsDto) =>
          new Date(row.createdAt).toLocaleDateString('en-GB', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
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
              status={row.status}  />
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
            }`}
          >
            {row.status}
          </div>
          </div>
        ),
      },
      {
        key: "chat",
        label: "Chat",
        render: (row: ReferralDetailsDto) =>
        row.status === "ACCEPTED" ? (
          <div className="flex justify-center m-auto w-[150px]">
            <a className="text-blue-600 hover:underline">
              <img src={chat} alt="" />
            </a>
          </div>
        ) : row.status === "AWAITING" ? (
            <div className="flex justify-center m-auto w-[150px]">
              <button
                onClick={()=>{
                  setSelectedRow(row),
                  setShowWithdrawModal(true)}
                }
                className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors rounded-full py-3 px-3 text-sm font-medium text-center"
              >
                Withdraw referral
              </button>
            </div>
        ) : <div className="flex justify-center m-auto w-[150px]">
            <a href={""} className="w-14 h-11 rounded-xl flex items-center justify-center transition-all
              bg-gray-300 cursor-not-allowed grayscale">
              <img src={chat} alt="Chat disabled" className="grayscale opacity-50" />
            </a>
          </div>,
      },
      {
        key: "refereeName",
        label: "Referee Name",
        render: (row: ReferralDetailsDto) => (
        <div className='flex justify-center m-auto w-[150px]'>
        <span 
          className="truncate block w-full"
          title={row.refereeName ? row.refereeName.toString() : "N/A"}
          >
          {row.refereeName ?? "N/A"}
          </span>
        </div>
      ),
      },
      {
        key: "update",
        label: "Update",
        render: (row: ReferralDetailsDto) => {
          return row.status === "ACCEPTED" ? (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="w-32 text-center rounded-full px-1 py-3 text-sm font-medium bg-gray-100 text-gray-600">
                <select
                  onChange={(e) => handleSelectChange(e, row)}
                  defaultValue=""
                  className="w-full text-center bg-transparent border-none focus:outline-none cursor-pointer"
                >
                  <option value="" disabled>
                    Select
                  </option>
                  <option value="raiseIssue">Raise Issue</option>
                  <option value="markDone">Mark as Done</option>
                </select>
              </div>
            </div>
          ): row.status === "DONE" ? (
            <div className="flex justify-center m-auto w-[150px]">
              <div className="truncate block w-full text-center rounded-full px-1 py-3 text-sm font-medium bg-yellow-200 text-black">
                <button className="truncate w-full overflow-hidden whitespace-nowrap"
                  onClick={()=>{
                    setShowProvideFeedback(true)
                    setReferralData(row)
                    }}>
                  Feedback
                </button>
              </div>
            </div>
          ):<div className="flex justify-center m-auto w-[150px]">
              <div className="truncate block w-full text-center rounded-full px-1 py-3 text-sm font-medium bg-white text-black">
                <button className="truncate w-full overflow-hidden whitespace-nowrap">
                </button>
              </div>
            </div>;
        },
      }
    ];

    const handlePageSizeChange = (newPageSize: number) => {
      setPageSize(newPageSize);
      onPageSizeChange(newPageSize);
    };

    const sortData = (
      rows: ReferralDetailsDto[],
      field: string
    ): ReferralDetailsDto[] => {
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

    
  const MatchingScoreCircle = memo((
      { score, scoreDetails, status }: { score: number; scoreDetails?: any,status?: string }
    ) => (
    <div className="w-20 flex flex-col items-center justify-center gap-px text-base text-green-500">
      <div className="w-16 relative h-16 cursor-pointer flex items-center justify-center">
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
        {status !== "REJECTED" &&
        <button 
          onClick={()=>{        
            setShowViewDetails(true)
            setViewDetailsContent(scoreDetails)}}
          className="absolute top-14 pt-1 text-[9px] font-semibold text-gray-500 text-center">View details
        </button>}
      </div>
    </div>
  ));

    const renderExpandedDetails = (row: StepperProps) => {
      if (["REJECTED", "CANCELLED", "WITHDRAWN"].includes(row.status)) return null;

      return <SimpleStepper currentStatus={row.status} />;
    };


    const toggleExpand = (id: string) => {
      const row = sortedData.find(r => r.id === id);
      if (!row) return;

      if (["CANCELLED", "REJECTED", "WITHDRAWN"].includes(row.status)) {
        // Do nothing — no expand allowed
        return;
      }

      setExpandedRows(prev =>
        prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
      );
    };

        const handleSelectChange = (
          e: React.ChangeEvent<HTMLSelectElement>,
          row: ReferralDetailsDto
        ) => {
          const value = e.target.value;
          if(value === "raiseIssue"){
            setReferralData(row)
            setShowRaiseIssueModal(true)
          } else if(value === "markDone"){
            setReferralData(row)
            setShowCompletedModal(true)
          }
          e.target.selectedIndex = 0;
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
            keyExtractor={keyExtractor}
            renderExpandedDetails={renderExpandedDetails}
            toggleExpand={toggleExpand}
            expandedRows={expandedRows}
          />
          {showRaiseIssueModal && (
            <RaiseIssueModal
              onClose={() => setShowRaiseIssueModal(false)}
              isOpen={showRaiseIssueModal}
              referralData={referralData}
              onRefresh={onRefresh}
              isCandidate={true}
            />
          )}
            {showCompletedModal && (
            <CompletedReferralModal
              onClose={() => setShowCompletedModal(false)}
              isOpen={showCompletedModal}
              referralData={referralData}
              onRefresh={onRefresh}
              isCandidate={true}
            />
          )}
          {showProvideFeedback && (
            <ProvideFeedbackModal
              onClose={() => setShowProvideFeedback(false)}
              isOpen={showProvideFeedback}
              referralData={referralData}
              onRefresh={onRefresh}
              isCandidate={true}
            />
          )}
          <ViewDetailsModal 
            show={showViewDetails} 
            viewDetailsContent={viewDetailsContent} 
            onClose={() => setShowViewDetails(false)} 
          />
            {showWithdrawModal && (
            <WithdrawRefferralModal
              reason={withdrawReason}
              comments={withdrawComments}
              setReason={setWithdrawReason}
              setComments={setWithdrawComments}
              onSubmit={handleWithdrawReferral}
              onClose={() => setShowWithdrawModal(false)}
              isOpen={showWithdrawModal}
            />
          )}
        </div>
      </div>
    );
  }
);

ReferralsTable.displayName = "ReferralsTable";

export default ReferralsTable;
