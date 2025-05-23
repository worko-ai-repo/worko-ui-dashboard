import { useRoutes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLoader from "@Components/Loader/Loader";
import DashboardLayout from "@Layouts/Dashboard.layout";
import Applicants from "@Components/Dashboard/Candidate/Applicants/Applicants";
import Profile from "@Components/Dashboard/Candidate/Pages/Profile/Profile";
import ReferAndEarn from "@Components/Dashboard/Candidate/Pages/ReferAndEarn/ReferAndEarn";
import Guidance from "@Components/Dashboard/Candidate/Pages/Guidance/Guidance";
import Support from "@Components/Dashboard/Candidate/Pages/Support/Support";
import Subscription from "@Components/Dashboard/Candidate/Pages/Subscription/Subscription";
import PageNotFound from "../errors/404/PageNotFound";

const Jobs = lazy(() => import("@Components/Dashboard/Candidate/Pages/Job/Jobs"));

const CandidateDashboard = () => {
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
          element: <Navigate to="jobs" replace />,
        },
        {
          path: "profile",
          element: <Profile />,
        },
        {
          path: "jobs",
          element: (
            <Suspense fallback={<MainLoader />}>
              <Jobs />
            </Suspense>
          ),
        },
        {
          path: "referral",
          element: <Applicants />,
        },
        {
          path: "guidance",
          element: <Guidance />,
        },
        {
          path: "refer-and-earn",
          element: <ReferAndEarn />,
        },
        {
          path: "subscription",
          element: <Subscription />,
        },
        {
          path: "support",
          element: <Support />,
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

export default CandidateDashboard;
