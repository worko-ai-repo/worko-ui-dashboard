import React, { useState } from "react";
import { InteractiveInput } from "@Components/Shared/ui/Input.shared";
import { CorporateUserPageRecDataDto } from "@Interfaces/AdminServices.dto";
import { Building2, Trash, Send, Minus } from "lucide-react";

interface CorporateUsersSubTableProps {
  data: CorporateUserPageRecDataDto[];
  isLoading?: boolean;
  onDeleteUser?: (userId: string) => void;
  onResendInvite?: (inviteId: string) => void;
  onRevokeInvite?: (inviteId: string) => void;
  showActions?: boolean;
  className?: string;
}

const CorporateUsersSubTable: React.FC<CorporateUsersSubTableProps> = ({
  data,
  isLoading = false,
  onDeleteUser,
  onResendInvite,
  onRevokeInvite,
  showActions = true,
  className = "",
}) => {
  // Create columns for the sub-table
  const subTableColumns = [
    {
      key: "id",
      label: "ID",
      render: (subRow: CorporateUserPageRecDataDto) => (
        <InteractiveInput
          data={subRow?.corporateUserDetails?.id || subRow?.id}
          isLoading={false}
          variant="copy"
          placeholder="No ID available"
          width="w-60"
          className="lowercase text-xs"
        />
      ),
    },
    {
      key: "name",
      label: "Name",
      render: (subRow: CorporateUserPageRecDataDto) => {
        const firstName = subRow?.corporateUserDetails?.firstName || subRow?.firstName;
        const lastName = subRow?.corporateUserDetails?.lastName || subRow?.lastName;
        return (
          <span
            className="capitalize text-left truncate block max-w-[99.3%] cursor-pointer text-sm"
            data-tooltip-id="my-tooltip"
            data-tooltip-content={`${firstName} ${lastName}`}
            data-tooltip-place="top">
            {firstName} {lastName}
          </span>
        );
      },
    },
    {
      key: "email",
      label: "Email",
      render: (subRow: CorporateUserPageRecDataDto) => (
        <InteractiveInput
          data={subRow?.corporateUserDetails?.email || subRow?.email}
          isLoading={false}
          variant="copy"
          placeholder="No email available"
          width="w-60  lowercase text-xs"
        />
      ),
    },
    {
      key: "accessType",
      label: "Access Type",
      render: (subRow: CorporateUserPageRecDataDto) => {
        const userType =
          subRow?.corporateUserDetails?.corporateUserType || subRow?.corporateUserType;
        const isAdmin = userType === "corporate-admin";
        return (
          <span
            className={`capitalize w-fit ml-4 px-2 py-1 rounded-full text-xs font-medium truncate block max-w-[99.3%] cursor-pointer ${
              isAdmin ? "bg-red-500 text-white" : "bg-blue-500 text-white"
            }`}
            data-tooltip-place="top">
            {isAdmin ? "Admin" : "Recruiter"}
          </span>
        );
      },
    },
    {
      key: "status",
      label: "Status",
      render: (subRow: CorporateUserPageRecDataDto) => {
        const status = subRow?.inviteStatus;
        const getStatusStyle = (status: string) => {
          switch (status) {
            case "ACCEPTED":
              return "bg-green-100 text-green-800";
            case "AWAITING":
              return "bg-yellow-100 text-yellow-800";
            case "EXPIRED":
              return "bg-gray-100 text-gray-800";
            case "DELETED":
              return "bg-red-100 text-red-800";
            default:
              return "bg-gray-100 text-gray-800";
          }
        };

        return (
          <div className="w-full flex justify-start  ">
              <span
                className={`capitalize text-left   px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
                  status
                )}`}>
                {status || "Active"}
              </span>
          </div>
        );
      },
    },
    ...(showActions
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (subRow: CorporateUserPageRecDataDto) => {
              const hasUserDetails = !!subRow?.corporateUserDetails;
              const isDeleted =  subRow?.corporateUserDetails?.isDeleted ;
              const isAccepted = subRow?.inviteStatus === "ACCEPTED";
              const CantRevoke = isAccepted || isDeleted || hasUserDetails || subRow?.inviteStatus === "EXPIRED" || subRow?.inviteStatus === "REVOKED";
              return (
                <div className="flex flex-col sm:flex-row gap-1 justify-center">
                  {/* Delete button - only show for registered users (has corporateUserDetails) */}
                  {hasUserDetails && onDeleteUser && (
                    <button
                      onClick={() =>
                        subRow?.corporateUserDetails?.id &&
                        onDeleteUser(subRow.corporateUserDetails.id)
                      }
                      disabled={isDeleted}
                      className=" btn_disabled px-2 py-2 rounded-lg text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete User">
                      <Trash size={14} />
                    </button>
                  )}

                  {/* Resend invite button - only for pending invites */}
                  {!hasUserDetails && !isAccepted && onResendInvite && (
                    <button
                    disabled={CantRevoke}
                      onClick={() => onResendInvite(subRow?.id)}
                      className="btn_disabled px-2 py-1.5 rounded-lg text-white bg-blue-500 hover:bg-blue-600"
                      title="Resend Invite">
                      <Send size={14} />
                    </button>
                  )}

                  {/* Revoke invite button - only for non-deleted invites */}
                  {!hasUserDetails  && onRevokeInvite && (
                    <button
                     disabled={CantRevoke}
                      onClick={() => onRevokeInvite(subRow?.id)}
                      className="p-1 rounded-full border-2 border-red-600 hover:bg-red-50"
                      title="Revoke Invite">
                      <Minus className="text-red-500 font-bold" size={14} />
                    </button>
                  )}

                
                </div>
              );
            },
          },
        ]
      : []),
  ];

  if (isLoading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading users...</span>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-sm ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <Building2 className="w-8 h-8 mb-2 text-gray-400" />
          <p className="text-sm">No users or invites found</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="">
            <tr>
              {/* {subTableColumns.map((column) => (
                <th
                  key={column.key}
                  className="px-3 py-2  text-left font-medium text-gray-700 border-b">
                  {column.label}
                </th>
              ))} */}
            </tr>
          </thead>
          <tbody className="cursor-pointer">
            {data.map((subRow, index) => (
              <tr
                key={subRow?.corporateUserDetails?.id || subRow?.id || index}
                className="hover:bg-gray-50  transition-colors">
                {subTableColumns.map((column) => (
                  <td key={column.key} className="px-3  py-2">
                    {column.render(subRow)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorporateUsersSubTable;
