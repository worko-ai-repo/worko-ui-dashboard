import { Suspense } from 'react';
import MainLoader from '@Components/Loader/Loader';
import { Navigate, useRoutes } from 'react-router-dom';
import PageNotFound from '../errors/404/PageNotFound';
import DashboardLayout from '@Layouts/Dashboard.layout';
import Jobs from '@Components/Dashboard/Corporate/Job/Jobs';
import Applicants from '@Components/Dashboard/Corporate/Applicants/Applicants';
import BulkCVCheck from '@Components/Dashboard/Corporate/BulkCvCheck/BulkCvCheck';
import Invites from '@Components/Dashboard/Corporate/Invites/Invites';
import Support from '@Components/Dashboard/Corporate/Support/Support';
import Referral from '@Components/Dashboard/Corporate/Referral/Referral';
import Interview from '@Components/Dashboard/Corporate/Interviews/Interview';

const CorporateDashboard = () => {
	const routes = useRoutes([
		{
			path: '/',
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
					path: 'home',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Jobs />
						</Suspense>
					),
				},
				{
					path: 'jobs',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Jobs />
						</Suspense>
					),
				},
				{
					path: 'applicants',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Applicants />
						</Suspense>
					),
				},
				{
					path: 'bulk-cv-check',
					element: (
						<Suspense fallback={<MainLoader />}>
							<BulkCVCheck />
						</Suspense>
					),
				},
				{
					path: 'invites',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Invites />
						</Suspense>
					),
				},
				{
					path: 'referral',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Referral />
						</Suspense>
					),
				},
				{
					path: 'interviews',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Interview />
						</Suspense>
					),
				},
				{
					path: 'support',
					element: (
						<Suspense fallback={<MainLoader />}>
							<Support />
						</Suspense>
					),
				},
				{
					path: '*',
					element: (
						<Suspense fallback={<MainLoader />}>
							<PageNotFound />
						</Suspense>
					),
				},
			],
		},
		{
			path: '*',
			element: (
				<Suspense fallback={<MainLoader />}>
					<PageNotFound />
				</Suspense>
			),
		},
	]);

	return routes;
};

export default CorporateDashboard;
