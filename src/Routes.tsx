import { Suspense, lazy } from "react";
import MainLoader from "@Components/Loader/Loader";
import { createBrowserRouter } from "react-router-dom";
import ErrorFallback from "./Pages/errors/base-error/ErrorFallback";
import CorporateDashboard from "./Pages/Corporate/CorporateDashboard";
import PageNotFound from "./Pages/errors/404/PageNotFound";

const CandidateDashboard = lazy(() => import("./Pages/Candidate/CandidateDashboard"));

// Create router with a basename of '/v1' to match the proxy configuration
const AppRoutes = createBrowserRouter(
  [
    {
      path: "/",
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
    { path: "*", element: <PageNotFound /> },
  ],
  {
    ...(import.meta.env.APP_MODE != "STAGING" ? {} : { basename: "/v2/" }),
  }
);

export default AppRoutes;
