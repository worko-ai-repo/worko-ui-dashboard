import { Star } from "lucide-react";
import { createContext, ReactNode, useState, useContext, useEffect, useMemo } from "react";
import profileService, { CognitoUserDetails } from "@Components/Dashboard/Candidate/Service/ProfileService";
import { useLocation, useNavigate } from "react-router-dom";

// Define all possible tab types across different dashboard views
export type DashboardTab =
  // Candidate Dashboard Tabs
  | "profile"
  | "jobs"
  | "referral"
  | "guidance"
  | "refer-and-earn"
  | "subscription"
  | "support"
  // Corporate Dashboard Tabs
  | "home"
  | "invites"
  | "applicants"
  | "interviews"
  | "hire"
  | "bulk-cv-check"
  | "referrals"
  | "invoice-&-payment";

// Define dashboard types
export type DashboardType = "CORPORATE" | "EMPLOYEE" | "CANDIDATE" | "ADMIN";

interface DashboardContextType {
  // Core dashboard properties
  activeTab: DashboardTab;
  setActiveTab: (tab: DashboardTab) => void;
  dashboardType: DashboardType;
  setDashboardType: (type: DashboardType) => void;
  breadcrumb: ReactNode;
  user: CognitoUserDetails | null;
  isLoadingUser: boolean;
  refreshUser: () => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children, initialDashboardType = "CANDIDATE" }: { children: ReactNode; initialDashboardType?: DashboardType }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine initial tab based on dashboard type
  const getInitialTab = (dashboardType: DashboardType): DashboardTab => {
    switch (dashboardType) {
      case "CORPORATE":
        return "home";
      case "CANDIDATE":
        return "jobs";
      case "EMPLOYEE":
      case "ADMIN":
      default:
        return "home";
    }
  };

  // Parse dashboard type from URL
  const getDashboardTypeFromUrl = (): DashboardType => {
    const pathParts = location.pathname.split("/");
    if (pathParts.length >= 3) {
      const urlType = pathParts[1].toUpperCase() as DashboardType;
      // Validate that it's a valid dashboard type
      if (["CORPORATE", "EMPLOYEE", "CANDIDATE", "ADMIN"].includes(urlType)) {
        return urlType;
      }
    }
    return initialDashboardType;
  };

  // Dashboard type and active tab state
  const [dashboardType, setDashboardType] = useState<DashboardType>(getDashboardTypeFromUrl());
  const [activeTab, setActiveTab] = useState<DashboardTab>(getInitialTab(getDashboardTypeFromUrl()));

  // User state with loading indicator
  const [user, setUser] = useState<CognitoUserDetails | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState<boolean>(true);

  // Function to refresh user data
  const refreshUser = () => {
    setIsLoadingUser(true);
    const userDetails = profileService.getCurrentUser();
    setUser(userDetails);
    setIsLoadingUser(false);
  };

  // Load user from secure storage on initial mount
  useEffect(() => {
    refreshUser();
  }, []);

  // Update dashboard type and tab when URL changes
  useEffect(() => {
    const pathParts = location.pathname.split("/");

    // Update dashboard type based on URL
    if (pathParts.length >= 3) {
      const urlType = pathParts[2].toUpperCase() as DashboardType;
      if (["CORPORATE", "EMPLOYEE", "CANDIDATE", "ADMIN"].includes(urlType) && urlType !== dashboardType) {
        setDashboardType(urlType);
      }
    }

    // Update active tab based on URL
    console.log("Path parts:", pathParts);
    if (pathParts.length >= 3 && pathParts[2]) {
      setActiveTab(pathParts[2] as DashboardTab);
    } else {
      // If no tab is specified in the URL, set to default for the dashboard type
      const currentDashboardType = pathParts.length >= 3 ? (pathParts[2].toUpperCase() as DashboardType) : dashboardType;
      setActiveTab(getInitialTab(currentDashboardType));
    }
  }, [location.pathname]);

  // Update URL when dashboard type changes (but not from URL changes)
  const updateDashboardType = (type: DashboardType) => {
    setDashboardType(type);
    // Also update the URL to reflect the new dashboard type
    const newTab = getInitialTab(type);
    setActiveTab(newTab);
    navigate(`${type.toLowerCase()}/${newTab}`);
  };

  // Dynamic breadcrumb based on active tab
  const breadcrumb = useMemo(
    () => (
      <div className="flex items-center text-sm text-gray-500 space-x-2 truncate">
        <Star className="text-[#316bff] w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
        <span>Dashboards</span>
        <span>/</span>
        <span className="capitalize">{dashboardType.toLowerCase()}</span>
        <span>/</span>
        <span className="font-medium text-black capitalize">{activeTab}</span>
      </div>
    ),
    [activeTab, dashboardType]
  );

  const contextValue = useMemo(
    () => ({
      activeTab,
      setActiveTab,
      dashboardType,
      setDashboardType: updateDashboardType,
      breadcrumb,
      user,
      isLoadingUser,
      refreshUser,
    }),
    [activeTab, dashboardType, breadcrumb, user, isLoadingUser]
  );

  return <DashboardContext.Provider value={contextValue}>{children}</DashboardContext.Provider>;
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
};
