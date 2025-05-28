
import Sidebar from '@Components/Dashboard/Sidebar';
import Header from '@Components/Dashboard/Header';
import { AppProvider } from '@Context/App.context';
import { DashboardProvider } from '@Context/Dashboard.context';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';

function CorporateDashboardLayout(): JSX.Element {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr]">
            <AppProvider>
            <DashboardProvider>
                <Sidebar
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    collapsed={collapsed}
                    setCollapsed={setCollapsed}
                />
                
                <div className="grid grid-rows-[auto_1fr] h-screen">
                    <Header
                        sidebarOpen={sidebarOpen}
                        setSidebarOpen={setSidebarOpen}
                    />
                    <main className="overflow-auto p-0 lg:p-8 pt-2">
                        <Outlet />
                    </main>
                </div>
            </DashboardProvider>
            </AppProvider>
        </div>
    );
}

export default CorporateDashboardLayout;
