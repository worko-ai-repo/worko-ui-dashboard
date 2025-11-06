import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ErrorFallback from "@Pages/errors/base-error/ErrorFallback";
import ProtectedRoute from "@Services/SessionValidator.service";
import { UserRole } from "@Interfaces/RoleBasedAccessControl";
import AdminDashboard from "@Pages/WorkoAdmin/AdminDashboard";
import EmployeeDashboard from "@Pages/Employee/EmployeeDashboard";
import Interview from "@Pages/Interview/Interview";


const EvaluatorDashboard = lazy(() => import("@Components/EvaluatorDashboard/EvaluatorDashboard"));
const CorporateDashboard = lazy(() => import("@Pages/Corporate/CorporateDashboard"));
const PageNotFound = lazy(() => import("@Pages/errors/404/PageNotFound"));
const JobCardGrid = lazy(() => import("@Pages/test"));
const CandidateDashboard = lazy(() => import("@Pages/Candidate/CandidateDashboard"));

// Create router with a basename of '/v1' to match the proxy configuration
const AppRoutes = createBrowserRouter(
  [
    {
      path: "/",
      errorElement: <ErrorFallback />,
      children: [
        {
          index: true,
          element: <Navigate to="/candidate" replace />,
        },
/*         {
          path: "test/*",
          element: <JobCardGrid />,
        }, */
        {
          path: "corporate/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={[UserRole.CORPORATE]} element={<CorporateDashboard />} />
            </Suspense>
          ),
        },
        {
          path: "admin/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]} element={<AdminDashboard />} />
            </Suspense>
          ),
        },
        {
          path: "candidate/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.GENERAL_USER]} element={<CandidateDashboard />} />
            </Suspense>
          ),
        },
        {
          path: "interview/:emailId",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.GENERAL_USER]} element={<Interview />} />
            </Suspense>
          ),
        },
        {
          path: "employee/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={[UserRole.ADMIN, UserRole.GENERAL_USER]} element={<EmployeeDashboard />} />
            </Suspense>
          ),
        },
        {
          path: "evaluator-dashboard/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <EvaluatorDashboard />
            </Suspense>
          ),
        },
      ],
    },
    { path: "*", element: <PageNotFound /> },
  ],
  {
    basename: "/v1/",
  }
);

export default AppRoutes;
