import React, { useEffect } from 'react';
import { XMarkIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import { User } from "@Assets";
import { useAppContext } from '@LibWorko';
import { useNavigate, useLocation } from 'react-router-dom';

import navigationItems from './navigation';
import SidebarItem from './SidebarItem';
import { DashboardType, TabId } from 'src/types/sidebar';
import { useDashboardContext } from '@Context/Dashboard.context';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    collapsed: boolean;
    setCollapsed: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ sidebarOpen, setSidebarOpen, collapsed, setCollapsed }) => {
    const { userDetails } = useAppContext();
    const { activeTab, setActiveTab, dashboardType, setDashboardType } = useDashboardContext();
    const navigate = useNavigate();
    const location = useLocation();

    // Filter navigation items based on current dashboard type
    const navItems = navigationItems.filter(item => 
        !item.dashboardTypes || item.dashboardTypes.includes(dashboardType)
    );

    // Sync URL with dashboard context
    useEffect(() => {
        const pathParts = location.pathname.split('/');
        
        // Update dashboard type based on URL if needed
        if (pathParts.length >= 3) {
            const urlType = pathParts[2].toUpperCase() as DashboardType;
            if (['CORPORATE', 'EMPLOYEE', 'CANDIDATE', 'ADMIN'].includes(urlType) && 
                urlType !== dashboardType) {
                setDashboardType(urlType);
            }
        }
        
        // Update active tab based on URL if needed
        if (pathParts.length >= 4 && pathParts[3]) {
            const urlTab = pathParts[3] as TabId;
            if (urlTab !== activeTab) {
                setActiveTab(urlTab);
            }
        }
    }, [location.pathname, dashboardType, activeTab, setDashboardType, setActiveTab]);

    const onNavigate = (dashboardType: DashboardType, tabId: TabId) => {
        const path = `/dashboard/${dashboardType.toLowerCase()}/${tabId}`;
        navigate(path);
    };

    const handleTabClick = (tabId: TabId) => {
        setActiveTab(tabId);
        onNavigate(dashboardType, tabId);
        setSidebarOpen(false);
    };

    const Avatar = (
        <div className="rounded-full text-[#316bff] w-8 h-8 flex items-center justify-center">
            <img src={User} alt="User" className="w-full h-full object-cover rounded-full" />
        </div>
    );

    return (
        <aside
            className={`bg-[#316bff] text-white h-screen z-40 transition-all duration-300 ease-in-out p-4 rounded-r-3xl
                ${collapsed ? 'w-[72px]' : 'w-[212px]'}
                md:relative md:block
                max-md:fixed max-md:left-0 max-md:top-0 max-md:w-[320px] 
                ${sidebarOpen ? 'max-md:translate-x-0' : 'max-md:-translate-x-full'}`}
        >

            <div className="flex justify-between items-center mb-6">
                {!collapsed ? (
                    <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2 overflow-hidden">
                            {Avatar}
                            <span className="text-base text-start font-bold capitalize">{userDetails?.name}</span>
                        </div>

                        <button
                            onClick={() => setCollapsed(true)}
                            className="hidden sm:flex focus:outline-none"
                            aria-label="Collapse sidebar"
                        >
                            <ChevronLeftIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="block sm:hidden focus:outline-none"
                            aria-label="Close sidebar"
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>
                ) : (
                    <div className="w-full flex justify-center">
                        {Avatar}
                    </div>
                )}
            </div>

            <nav className="space-y-3">
                {navItems.map((item) => (
                    <SidebarItem
                        key={item.id}
                        item={item}
                        isActive={item.id === activeTab}
                        collapsed={collapsed}
                        onClick={handleTabClick}
                    />
                ))}
            </nav>

            {collapsed && (
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={() => setCollapsed(false)}
                        className="text-white focus:outline-none"
                        aria-label="Expand sidebar"
                    >
                        <ChevronLeftIcon
                            className="w-5 h-5 rotate-180"
                        />
                    </button>
                </div>
            )}
        </aside>
    );
};

export default Sidebar;