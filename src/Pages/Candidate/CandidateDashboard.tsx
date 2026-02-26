import { useRoutes, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import MainLoader from "@Components/Loader/Loader";
import DashboardLayout from "@Layouts/Dashboard.layout";
import Profile from "@Components/Dashboard/Candidate/Pages/Profile/Profile";
import ReferAndEarn from "@Components/Dashboard/Candidate/Pages/ReferAndEarn/ReferAndEarn";
import Guidance from "@Components/Dashboard/Candidate/Pages/Guidance/Guidance";
import Support from "@Components/Dashboard/Candidate/Pages/Support/Support";
import Subscription from "@Components/Dashboard/Candidate/Pages/Subscription/Subscription";
import UnderConstruction from "@Pages/errors/under-constuction/UnderConstruction";
import PageNotFound from "../errors/404/PageNotFound";
import Referrals from "@Components/Dashboard/Candidate/Pages/Referral/Referral";

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
        // {
        //   path: "referral",
        //   element: <Referrals />,
        // },
        {
          path: "guidance",
          element: <Guidance />,
        },
        {
          path: "refer-and-earn",
          element: <ReferAndEarn />,
        },
        // {
        //   path: "subscription",
        //   element: <Subscription />,
        // },
        {
          path: "documentVault",
          element: <UnderConstruction 
          text={"Candidates can store their documents in the vault for quick and easy access, and share them with companies in just one click."}/>,
        },
        {
          path: "support",
          element: <Support />,
        },
        // {
        //   path: "*",
        //   element: <PageNotFound />,
        // },
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
