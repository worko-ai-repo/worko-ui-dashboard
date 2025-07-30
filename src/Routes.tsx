import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ErrorFallback from "@Pages/errors/base-error/ErrorFallback";
import CorporateDashboard from "@Pages/Corporate/CorporateDashboard";
import PageNotFound from "@Pages/errors/404/PageNotFound";
import ProtectedRoute from "@Services/SessionValidator.service";
import JobCardGrid from "@Pages/test";

const CandidateDashboard = lazy(() => import("./Pages/Candidate/CandidateDashboard"));
import EvaluatorDashboard from '@Components/EvaluatorDashboard/EvaluatorDashboard';


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
        {
          path: "test/*",
          element: (
            <JobCardGrid />
          ),
        },
        {
          path: "corporate/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={["Corporate"]} element={<CorporateDashboard />} />
            </Suspense>
          ),
        },
        {
          path: "candidate/*",
          element: (
            <Suspense fallback={<MainLoader />}>
              <ProtectedRoute requiredRoles={["General_Users", "Admin"]} element={<CandidateDashboard />} />
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
    basename: "/v2/",
  }
);

export default AppRoutes;
