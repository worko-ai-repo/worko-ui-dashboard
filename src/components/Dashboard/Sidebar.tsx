import React, { useEffect } from "react";
import { XMarkIcon, ChevronLeftIcon } from "@heroicons/react/24/outline";
import { User } from "@Assets";
import { CorporateUserDetail, useAppContext } from "@Context/App.context";
import { useNavigate, useLocation } from "react-router-dom";

import navigationItems from "./navigation";
import SidebarItem from "./SidebarItem";
import { DashboardType, NavItem, TabId } from "src/types/sidebar";
import { useDashboardContext } from "@Context/Dashboard.context";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { LogOut } from "lucide-react";
import CognitoServiceObj from "@Utils/Cognito.utils";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (open: boolean) => void;
}

/**
 * Sidebar Component
 *
 * A responsive sidebar navigation component that supports:
 * - Collapsible/expandable states
 * - Mobile responsive behavior
 * - User profile display with avatar
 * - Dynamic navigation based on dashboard type
 * - Context-aware navigation filtering
 */

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
  // Extract user context and dashboard context
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, setActiveTab, dashboardType } = useDashboardContext();
  const { userDetails, setUpdateCheck }: { userDetails: NormalizedUser | null; setUpdateCheck: any } = useAppContext();

  // Local state to manage finalized user details
  const [userName, setUserName] = React.useState("");
  const [finalUserDetails, setFinalUserDetails] = React.useState<NormalizedUser | null>(userDetails);

  /**
   * Effect to handle user details updates
   * - Updates local state when userDetails changes
   * - Triggers update check when userDetails is null/undefined
   */
  useEffect(() => {
    if (userDetails) {
      setFinalUserDetails(userDetails);
    } else {
      // Trigger parent component to refresh user data
      setUpdateCheck((prev: any) => !prev);
    }
  }, [userDetails, setUpdateCheck]);

  /**
   * Filter navigation items based on current dashboard type
   * Only shows items that are either global or match current dashboard type
   */
  const navItems = navigationItems.filter((item) => !item.dashboardTypes || item.dashboardTypes.includes(dashboardType));

  /**
   * Handle navigation to different dashboard sections
   * @param dashboardType - The type of dashboard to navigate to
   * @param tabId - The specific tab/section within the dashboard
   */
  const onNavigate = (dashboardType: DashboardType, tabId: TabId) => {
    const path = `/${dashboardType.toLowerCase()}/${tabId}`;
    navigate(path);
  };

  /**
   * Handle tab click events
   * - Updates active tab state
   * - Navigates to selected tab
   * - Closes sidebar on mobile after navigation
   */
  const handleTabClick = (NavItem: NavItem) => {
    if (NavItem.id === "switch-dashboard") {
      //Check the current page from the URL

      const currentPath = location.pathname;
      //If the current path is admin, switch to corporate dashboard
      if (currentPath.includes("admin")) {
        onNavigate("CANDIDATE", "jobs");
        return;
      } else if (currentPath.includes("candidate")) {
        //If the current path is corporate, switch to admin dashboard
        onNavigate("ADMIN", "jobs");
        return;
      }
    } else {
      console.log("Navigating to tab:", NavItem.label);
      setActiveTab(NavItem.label);
      onNavigate(dashboardType, NavItem.id);
      setSidebarOpen(false); // Close sidebar on mobile after navigation
    }
  };

  /**
   * Effect to set appropriate user name based on user type
   * - Corporate users: firstName + lastName
   * - Other users: name field
   */
  useEffect(() => {
    setUserName(finalUserDetails?.fullName || "User");
  }, [finalUserDetails]);

  /**
   * Avatar component - reusable user profile image/icon
   */
  const Avatar = (
    <div>
      <img src={finalUserDetails?.profileImageUrl || User} alt="User Avatar" className={`w-10 h-10 rounded-full ${collapsed ? "hidden" : "block"}`} />
    </div>
  );

  return (
    <aside
      className={`bg-[#316bff] text-white  h-screen z-40 transition-all duration-300 ease-in-out p-4 rounded-r-3xl
                ${collapsed ? "w-[72px]" : "w-[212px]"}
                md:relative md:block
                max-md:fixed max-md:left-0 max-md:top-0 max-md:w-[320px] 
                ${sidebarOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full"}`}>
      <div className="h-full flex flex-col justify-between  ">
        <div className="">
          <div className="flex justify-between items-center mb-6 ">
            {!collapsed ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2 overflow-hidden">
                  {Avatar}
                  <span className="text-base text-start font-bold capitalize">{userName}</span>
                </div>
                <button onClick={() => setCollapsed(true)} className="hidden sm:flex focus:outline-none" aria-label="Collapse sidebar">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setSidebarOpen(false)} className="block sm:hidden focus:outline-none" aria-label="Close sidebar">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <div className="w-full flex justify-center">{Avatar}</div>
            )}
          </div>
          <nav className="space-y-3 ">
            {navItems.map((item) => (
              <SidebarItem key={item.id} item={item} isActive={item.label === activeTab} collapsed={collapsed} onClick={handleTabClick} />
            ))}
          </nav>
          {/* Expand Button */}
          {collapsed && (
            <div className="mt-6 flex justify-center">
              <button onClick={() => setCollapsed(false)} className="text-white focus:outline-none" aria-label="Expand sidebar">
                <ChevronLeftIcon className="w-5 h-5 rotate-180" />
              </button>
            </div>
          )}
        </div>
        {/* Logout Buttons */}

        <div className="border-t border-white/20 pt-4 hover:text-red-600">
          <button
            onClick={() => {
              CognitoServiceObj.handleSignOut();
              secureStorage.clear();
              setUpdateCheck((prev: boolean) => !prev);
              navigate("/auth/login");
            }}
            className="hover:text-red-500 text-[13px] text-white flex items-center justify-between focus:outline-none w-full text-left hover:bg-white/10 p-1 rounded"
            aria-label="Logout">
            {!collapsed && <p>Logout</p>}
            <LogOut className="cursor-pointer self-center text-[13px]" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
