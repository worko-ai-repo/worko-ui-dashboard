import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { createBrowserRouter } from "react-router-dom";
import ErrorFallback from "./Pages/errors/base-error/ErrorFallback";
import CorporateDashboard from "./Pages/Corporate/CorporateDashboard";

const CandidateDashboard = lazy(() => import("./Pages/Candidate/CandidateDashboard"));

const AppRoutes = createBrowserRouter([
  {
    path: "/dashboard",
    errorElement: <ErrorFallback />,
    children: [
      {
        path: "corporate/*",
        element: (
          <Suspense fallback={<MainLoader />}>
            <CorporateDashboard />
          </Suspense>
        ),
      },
      {
        path: "candidate/*",
        element: (
          <Suspense fallback={<MainLoader />}>
            <CandidateDashboard />
          </Suspense>
        ),
      },
    ],
  },
]);

export default AppRoutes;
