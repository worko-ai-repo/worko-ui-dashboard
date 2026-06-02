import { JwtPayload } from "jwt-decode";
import { fetchAuthSession } from "@aws-amplify/auth";
import CognitoServiceObj from "@Utils/Cognito.utils";
import secureStorage from "@Utils/SecureStorage.utils";
import httpServiceObj from "@Services/ApiHandler.service";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { AuthLoginForGeneralUserDto } from "@Interfaces/Auth.dto";
import { AppContextType, ContextProviderProps } from "@Interfaces/ContextProvider.dto";
import {
  createContext,
  useState,
  useContext,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { NormalizedUser, normalizeUserData } from "@Utils/NormalizeUser";
import { CompanyDetails } from "@Interfaces/CorporateDashboard.dto";

// Corporate User Interface
export interface CorporateUserDetail extends AuthLoginForGeneralUserDto {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  cognitoUserId: string;
  corporateUserType: string;
  PK: string;
  SK: string;
  GSI1PK: string;
  GSI1SK: string;
  cvDuplicacyAccess?: boolean;
}

export interface CognitoMetaDataDto extends JwtPayload {
  "cognito:groups"?: string[];
  email_verified?: boolean;
  phone_number_verified?: boolean;
  "cognito:username"?: string;
  origin_jti?: string;
  event_id?: string;
  token_use?: string;
  auth_time?: number;
  name?: string;
  phone_number?: string;
  email?: string;
}

// Create the context object
export const AppContext = createContext<AppContextType | undefined>(undefined);

// Create the provider component
export const AppProvider = ({ children }: ContextProviderProps) => {
  // State variables
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [tokenData, setTokenData] = useState<any | null>(null);
  const [userDetails, setUserDetails] = useState<NormalizedUser | null>(null);
  const [updateCheck, setUpdateCheck] = useState<boolean>(false);
  const [PendingApply, setPendingApply] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isLoadingUserDetails, setIsLoadingUserDetails] = useState<boolean>(false);
  const companyIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    companyIdRef.current = userDetails?.companyId;
  }, [userDetails?.companyId]);

  /**
   * fetchCorporateCompanyDetails
   *
   * Accepts companyId as a direct param so it always uses the fresh value
   * from the just-normalized user response — not the stale userDetails state
   * (since setUserDetails is async and state won't have updated yet at call time).
   *
   * Falls back to userDetails?.companyId for external calls made after
   * state has already settled (e.g. called directly by consumers).
   */
  const fetchCorporateCompanyDetails = useCallback(
    async (companyId?: string): Promise<CompanyDetails | null> => {
      // //@hotfix: prevent auth refresh loops by reading companyId from a ref instead of userDetails state
      const id = companyId ?? companyIdRef.current;
      if (!id) {
        console.error("Company ID is missing in user details");
        return null;
      }
      try {
        const { response: userCompanyResponse, error: userCompanyError } =
          await httpServiceObj.get<any>(`/company/${id}`, true, {});
        if (userCompanyError) {
          console.error("Error fetching company details:", userCompanyError);
          return null;
        }
        if (userCompanyResponse) {
          secureStorage.setItem<CompanyDetails>(
            SecureStorageKeyEnum.CORPORATECOMPANYDERAILS,
            userCompanyResponse[0]
          );
          return userCompanyResponse[0];
        }
      } catch (error) {
        console.error("Error in fetchCorporateCompanyDetails:", error);
      }
      return null;
    },
    []
  );

  /**
   * fetchUserDetails
   *
   * Wrapped in useCallback so checkUserLoggedIn always holds a fresh
   * reference and never calls a stale closure of this function.
   *
   * Key fix: passes normalizedUser.companyId directly to
   * fetchCorporateCompanyDetails instead of relying on userDetails state,
   * which hasn't updated yet at the time of the call.
   */
  const fetchUserDetails = useCallback(
    async (
      userType: string[] | undefined,
      userId: string | undefined,
      userEmail: string | undefined
    ) => {
      try {
        setIsLoadingUserDetails(true);
        let userResponse;
        const isCorporateUser =
          userType?.includes("corporate-admin") || userType?.includes("corporate-recruiter");

        if (isCorporateUser) {
          const { response, error } = await httpServiceObj.get<[CorporateUserDetail]>(
            `/corporate-user/${userId}/cognito`,
            true,
            {}
          );
          if (error) throw new Error(error.message);
          userResponse = response?.[0] || {};
        } else {
          const { response, error } = await httpServiceObj.get<[Partial<CorporateUserDetail>]>(
            `/user/${userEmail}/details`,
            true,
            {}
          );
          if (error) throw new Error(error.message);
          userResponse = response?.[0] || {};
        }

        const normalizedUser: NormalizedUser = normalizeUserData(userResponse);

        setUserDetails(normalizedUser);
        secureStorage.setItem<NormalizedUser>(SecureStorageKeyEnum.LOGINDETAILS, normalizedUser);
        secureStorage.setItem<object>(SecureStorageKeyEnum.CORPORATECOMPANYID, {
          companyId: normalizedUser?.companyId || "",
        });

        // Pass companyId directly from the fresh normalizedUser —
        // do NOT rely on userDetails state here since setUserDetails above
        // is async and the new value won't be in state yet at this point.
        if (isCorporateUser) {
          await fetchCorporateCompanyDetails(normalizedUser.companyId);
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        await CognitoServiceObj.handleSignOut();
        setIsLoggedIn(false);
        setUserDetails(null);
      } finally {
        setIsLoadingUserDetails(false);
      }
    },
    [fetchCorporateCompanyDetails]
  );

  /**
   * checkUserLoggedIn
   *
   * Wrapped in useCallback with fetchUserDetails as a dependency so it
   * always holds a fresh reference and never captures a stale closure.
   *
   * forceRefetch = true  → skips cache, always fetches fresh user data
   * forceRefetch = false → uses secureStorage cache if available
   */
  const checkUserLoggedIn = useCallback(
    async (forceRefetch = false, forceRefreshSession = false) => {
      try {
        const isUserLoggedIn = await CognitoServiceObj.isLoggedIn();

        if (!isUserLoggedIn) {
          setIsLoggedIn(false);
          setUserDetails(null);
          setTokenData(null);
          return;
        }

        const { tokens } = await fetchAuthSession({ forceRefresh: forceRefreshSession });
        const cognitoUserDetails: CognitoMetaDataDto | undefined = tokens?.idToken?.payload;
        const userType: string[] | undefined = cognitoUserDetails?.["cognito:groups"];
        const userEmail = cognitoUserDetails?.email;
        const userId = cognitoUserDetails?.sub;

        const token = CognitoServiceObj.getAccessToken();
        setTokenData(token);

        // Sync refreshed tokens to secure storage
        await CognitoServiceObj.setAccessToken();

        if (forceRefetch) {
          // Always fetch fresh user data, skip cache
          await fetchUserDetails(userType, userId, userEmail);
        } else {
          const storedUserDetails = secureStorage.getItem<NormalizedUser>(
            SecureStorageKeyEnum.LOGINDETAILS
          );
          if (storedUserDetails && Object.keys(storedUserDetails).length > 0) {
            setUserDetails(storedUserDetails);
          } else {
            await fetchUserDetails(userType, userId, userEmail);
          }
        }

        // Set isLoggedIn AFTER user details are resolved
        setIsLoggedIn(true);
      } catch (error) {
        console.error("Authentication check failed:", error);
        await CognitoServiceObj.handleSignOut();
        setIsLoggedIn(false);
        setUserDetails(null);
        setTokenData(null);
      }
    },
    [fetchUserDetails]
  );

  /**
   * Token Refresh Effect
   *
   * On mount: checks auth using cache (forceRefetch: false), then schedules
   * a token refresh exactly 1 minute before the Cognito access token expires.
   *
   * Why fetchAuthSession() instead of localStorage:
   * - Cognito manages its own token storage internally.
   * - After a refresh, localStorage may still hold the old token temporarily.
   * - fetchAuthSession() always returns the current live token with the correct exp.
   *
   * After each refresh, scheduleRefresh() is called again with the NEW token's
   * expiry so the next timeout is always based on fresh data.
   *
   * Fixes vs original setInterval approach:
   * - setInterval every 50 min is imprecise and doesn't align with actual token expiry.
   * - This approach fires at exactly (exp - 1 min), regardless of token TTL.
   * - scoped timeoutRef + cancelled flag prevent stale async work after unmount.
   */
  useLayoutEffect(() => {
    const timeoutRef = { current: null as NodeJS.Timeout | null };
    let cancelled = false;

    const scheduleRefresh = async () => {
      if (cancelled) return;

      try {
        // Read exp directly from Cognito session — always reflects the current
        // live token, unlike localStorage which can lag after a refresh.
        const { tokens } = await fetchAuthSession();
        const expTimestamp = tokens?.accessToken?.payload?.exp;

        if (!expTimestamp) {
          console.warn("No exp found in access token, skipping refresh schedule");
          return;
        }

        const expiryTime = expTimestamp * 1000;
        // Fire 1 min before expiry; floor at 5s to avoid a tight loop
        // in case the token is already near or past expiry.
        const refreshIn = Math.max(expiryTime - Date.now() - 60 * 1000, 5000);

        console.info(
          `Token expires at ${new Date(expiryTime).toLocaleTimeString()}, ` +
            `refresh scheduled in ${Math.round(refreshIn / 1000)}s`
        );

        timeoutRef.current = setTimeout(async () => {
          if (cancelled) return;
          try {
            // Force fresh session + user data
            await checkUserLoggedIn(true, true);
            // Re-schedule using the NEW token's expiry
            await scheduleRefresh();
          } catch (err) {
            console.error("Token refresh failed:", err);
          }
        }, refreshIn);
      } catch {
        console.error("Could not read token expiry from Cognito session");
      }
    };

    // On mount: load from cache first, then schedule refresh
    checkUserLoggedIn(false).then(() => scheduleRefresh());

    return () => {
      cancelled = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [checkUserLoggedIn]);

  /**
   * Manual Re-check Effect
   *
   * Triggered externally via setUpdateCheck(prev => !prev).
   * Forces a fresh fetch of user details whenever updateCheck flips.
   */
  useLayoutEffect(() => {
    if (isLoggedIn) {
      checkUserLoggedIn(true);
    }
  }, [updateCheck, isLoggedIn, checkUserLoggedIn]);

  // Function to set authentication state
  const setAuthState = useCallback((data: any, loggedIn: boolean) => {
    setTokenData(data);
    setIsLoggedIn(loggedIn);
    if (!loggedIn) {
      setUserDetails(null);
    }
  }, []);

  // Memoized context value
  const memoizedValue = useMemo(
    () => ({
      isLoggedIn,
      tokenData,
      setAuthState,
      setUpdateCheck,
      userDetails,
      setUserDetails,
      PendingApply,
      setPendingApply,
      isModalOpen,
      setIsModalOpen,
      isLoadingUserDetails,
      fetchCorporateCompanyDetails,
      checkUserLoggedIn,
    }),
    [
      isLoggedIn,
      tokenData,
      setAuthState,
      userDetails,
      setUpdateCheck,
      PendingApply,
      isModalOpen,
      isLoadingUserDetails,
      fetchCorporateCompanyDetails,
      checkUserLoggedIn,
    ]
  );

  return <AppContext.Provider value={memoizedValue}>{children}</AppContext.Provider>;
};

/**
 * useAppContext Hook
 *
 * This hook is used to access the context object.
 * Must be used within an AppProvider.
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
