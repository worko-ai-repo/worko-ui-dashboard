import { Navigate } from "react-router-dom";
import { jwtDecode, JwtPayload } from "jwt-decode";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import CognitoServiceObj from "@Utils/Cognito.utils";
import { UnauthorizedAccessError } from "@Utils/ErrorBoundary.utils";
import ErrorFallback from "@Pages/errors/base-error/ErrorFallback";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import { useCrossAppAuth } from "@Hooks/useCrossAppAuth.hook";
import { useState, useEffect } from "react";

/**
 * Interface defining the structure of a decoded Cognito token.
 *
 * This interface represents the payload of a JWT token issued by Amazon Cognito.
 * It includes standard claims as well as custom claims specific to the application.
 */
export interface DecodedCognitoToken {
  sub: string;
  "cognito:groups"?: string[];
  email_verified: boolean;
  iss: string;
  phone_number_verified: boolean;
  "cognito:username": string;
  origin_jti: string;
  aud: string;
  event_id: string;
  token_use: string;
  auth_time: number;
  name: string;
  phone_number: string;
  exp: number;
  iat: number;
  jti: string;
  email: string;
}

/**
 * Interface defining the props for the ProtectedRoute component.
 * @property {JSX.Element} element - The component/element to render if the user is authorized.
 * @property {UserRole[]} [requiredRoles] - Optional array of roles that are allowed to access this route.
 */
interface ProtectedRouteProps {
  element: JSX.Element;
  requiredRoles?: UserRole[];
  tokenRequired?: boolean;
}

/**
 * A component that protects routes by checking authentication and authorization.
 * This component performs the following checks:
 * 1. Verifies if a user token exists
 * 2. Validates that the token hasn't expired
 * 3. Checks if the user has the required role (if specified)
 *
 * If any check fails, the user is redirected to the appropriate page.
 *
 * @param {JSX.Element} element - The component to render if authorization passes
 * @param {UserRole[]} [requiredRoles] - Optional roles required for access
 * @returns {JSX.Element} Either the protected component or a redirect
 */

//@Fixed - Added authStatus state to handle async token verification instead of
//         reading token synchronously at render time, which caused a race condition
//         where expired tokens triggered redirect before the refresh could complete.
type AuthStatus = "pending" | "ok" | "expired" | "no-token" | "no-role" | "error";

const ProtectedRoute = ({ element, requiredRoles, tokenRequired = true }: ProtectedRouteProps) => {
  //@Fixed - Replaced synchronous token read with async state. Previously, token was
  //         read directly at render time — before sessionSync could refresh it —
  //         causing premature redirects to /auth/login on browser refresh.
  const [authStatus, setAuthStatus] = useState<AuthStatus>("pending");
  const [decodeError, setDecodeError] = useState<Error | undefined>();

  const appHref = useCrossAppAuth();

  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      //@Fixed - Call sessionSync first so Amplify can silently refresh the access token
      //         if it's expired or near expiry. Previously this was skipped entirely in
      //         ProtectedRoute, so a stale token would always fail the exp check below.
      try {
        const synced = await CognitoServiceObj.sessionSync(false);

        if (cancelled) return;

        if (!synced && tokenRequired) {
          setAuthStatus("no-token");
          return;
        }
      } catch {
        if (cancelled) return;
        if (tokenRequired) {
          setAuthStatus("no-token");
          return;
        }
      }

      //@Fixed - Read token AFTER sessionSync completes so we always get the
      //         freshly-written value, not the pre-refresh stale one.
      const token = CognitoServiceObj.getAccessToken();

      // Step 1: If token is required but not present
      if (tokenRequired && !token) {
        setAuthStatus("no-token");
        return;
      }

      // Step 2: If token is present, validate expiry
      if (token) {
        try {
          const decodedToken: JwtPayload & { role?: string } = jwtDecode(token);
          const currentTime = Date.now() / 1000;

          if (decodedToken.exp && decodedToken.exp < currentTime) {
            //@Fixed - Token is genuinely expired even after a sessionSync attempt.
            //         Previously this check ran before any refresh, so a token that
            //         was expired but refreshable still triggered this branch.
            setAuthStatus("expired");
            return;
          }
        } catch (err) {
          setDecodeError(err instanceof Error ? err : undefined);
          setAuthStatus("error");
          return;
        }
      }

      //@Fixed - Read userType AFTER sessionSync so roles written by sessionSync
      //         (from the fresh idToken payload) are available here. Previously
      //         userType was read at the top of the component before any refresh,
      //         so it could be null/stale on browser refresh.
      const userType = secureStorage.getItem<UserRole[]>(SecureStorageKeyEnum.USERTYPE);

      //@Fixed - Removed the old refetchUserType() fire-and-forget pattern. It was
      //         async but called without await in a sync render, so the updated
      //         userType was never actually used in the same render cycle.
      //         sessionSync above now handles role hydration correctly.

      // Step 3: Check role if requiredRoles is specified
      if (requiredRoles?.length) {
        if (!userType && !tokenRequired) {
          if (requiredRoles.includes(UserRole.GENERAL_USER)) {
            setAuthStatus("ok");
            return;
          }
          setAuthStatus("no-token");
          return;
        }

        if (Array.isArray(userType) && !userType.some((role) => requiredRoles.includes(role))) {
          setAuthStatus("no-role");
          return;
        }
      }

      setAuthStatus("ok");
    };

    verifyAuth();

    //@Fixed - Cleanup flag prevents setState calls if the component unmounts
    //         mid-verification (e.g. user navigates away during the async check).
    return () => {
      cancelled = true;
    };
  }, []);

  // --- Render based on resolved auth status ---

  //@Fixed - Return null during pending instead of rendering/redirecting immediately.
  //         This is the key fix: nothing renders until the async check completes,
  //         eliminating the race condition window entirely.
  if (authStatus === "pending") {
    return null; // or swap for <PageLoader /> if you have a spinner component
  }

  if (authStatus === "error") {
    return <ErrorFallback error={decodeError} />;
  }

  if (authStatus === "no-token") {
    //@Fixed - Replaced alert() + appHref() side-effect pattern in render with
    //         effect-safe navigation inside useEffect state resolution.
    //         alert() in render is a side effect and can fire multiple times.
    if (requiredRoles?.includes(UserRole.CORPORATE)) {
      appHref("/auth/corporate/login");
    } else {
      appHref("/auth/login");
    }
    return null;
  }

  if (authStatus === "expired") {
    appHref("/auth/login");
    return null;
  }

  if (authStatus === "no-role") {
    const userType = secureStorage.getItem<UserRole[]>(SecureStorageKeyEnum.USERTYPE);
    return (
      <ErrorFallback
        error={
          new UnauthorizedAccessError(
            Array.isArray(userType) && userType.includes(UserRole.GENERAL_USER)
              ? UserRole.GENERAL_USER
              : (userType?.[0] ?? UserRole.GENERAL_USER)
          )
        }
      />
    );
  }

  return element;
};

export default ProtectedRoute;