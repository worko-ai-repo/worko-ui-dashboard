import { Suspense } from 'react';
import MainLoader from '@Components/Loader/Loader';
import { Navigate, useRoutes } from 'react-router-dom';
import PageNotFound from '../errors/404/PageNotFound';
import CorporateDashboardLayout from '@Layouts/Dashboard.layout';

const CorporateDashboard = () => {
	const routes = useRoutes([
		{
			path: '/corporate',
			element: (
				<Suspense fallback={<MainLoader />}>
					<CorporateDashboardLayout />
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
							<CorporateDashboard />
						</Suspense>
					),
				},
				{
					path: 'jobs',
					element: (
						<Suspense fallback={<MainLoader />}>
							<CorporateDashboard />
						</Suspense>
					),
				},
				{
					path: 'applicants',
					element: (
						<Suspense fallback={<MainLoader />}>
							<CorporateDashboard />
						</Suspense>
					),
				},
				{
					path: 'bulk-cv-check',
					element: (
						<Suspense fallback={<MainLoader />}>
							<CorporateDashboard />
						</Suspense>
					),
				},
				{
					path: 'invites',
					element: (
						<Suspense fallback={<MainLoader />}>
							<CorporateDashboard />
						</Suspense>
					),
				},
				{
					path: 'referrals',
					element: (
						<Suspense fallback={<MainLoader />}>
							<CorporateDashboard />
						</Suspense>
					),
				},
				{
					path: 'support',
					element: (
						<Suspense fallback={<MainLoader />}>
							<CorporateDashboard />
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
