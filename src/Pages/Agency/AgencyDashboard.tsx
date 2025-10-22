import { useRoutes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLoader from "@Components/Loader/Loader";
import DashboardLayout from "@Layouts/Dashboard.layout";
import PageNotFound from "@Pages/errors/404/PageNotFound";

const Invites = lazy(() => import("@Components/Dashboard/Agency/Pages/Invites/InvitesList"));
const Jobs = lazy(() => import("@Components/Dashboard/Agency/Pages/Jobs/JobsList"));
const Applicants = lazy(() => import("@Components/Dashboard/Agency/Pages/Applicants/Applicants"));
const BulkCVCheck = lazy(() => import("@Components/Dashboard/Agency/Pages/BulkCVCheck/BulkCVCheck"));
const Recharge = lazy(() => import("@Components/Dashboard/Agency/Pages/Recharge/Recharge"));

const AgencyDashboard = () => {
  const routes = useRoutes([
    {
      path: "/",
      element: (
        <Suspense fallback={<MainLoader />}>
          <DashboardLayout />
        </Suspense>
      ),
      children: [
        {
          index: true,
          element: <Navigate to="aginvites" replace />,
        },
        {
          path: "agInvites",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Invites />
            </Suspense>
          ),
        },
        {
          path: "agJobs",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Jobs />
            </Suspense>
          ),
        },
        {
          path: "agApplicants",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Applicants />
            </Suspense>
          ),
        },
        {
          path: "agBulkCVCheck",
          element: (
            <Suspense fallback={<MainLoader />}>
              <BulkCVCheck />
            </Suspense>
          ),
        },
        {
          path: "agRecharge",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Recharge />
            </Suspense>
          ),
        },
        {
          path: "*",
          element: <PageNotFound />,
        },
      ],
    },
    {
      path: "*",
      element: <PageNotFound />,
    },
  ]);

  return routes;
};

export default AgencyDashboard;
