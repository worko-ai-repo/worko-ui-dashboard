import { Outlet } from 'react-router-dom';
import styles from '../layout.module.scss';

// import Header from '@Components/Header/Header';
// import Footer from '@Components/Footer/Footer';
import ScrollToTop from '@Utils/ScrollToTop.utils';
import DynamicBackgroundHandler from '@Utils/DynamicBackground';
import useSeo from '@Hooks/useSeo.hooks';
import Header from '@Components/Dashboard/Header';
import { useState } from 'react';

/**
 * @function MainLayout
 *
 * @description A MainLayout component for nested routes
 *
 * @returns {JSX.Element} The JSX code for the MainLayout component
 */
function MainLayout(): JSX.Element {
		

	useSeo();
	return (
		<div className="bg-white w-full">
			{/* <Header /> */}
				<ScrollToTop />
				
				<main className={styles.main}>
					<DynamicBackgroundHandler />
					<Outlet />
				</main>
			{/* <Footer /> */}
		</div>
	);
}

export default MainLayout;
