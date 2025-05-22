import { logo_text } from '@Assets';
import { useDashboardContext } from '@Context/Dashboard.context';
import { Bell, Menu } from 'lucide-react';
import React from 'react';

interface HeaderProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({ sidebarOpen, setSidebarOpen }) => {
  const { breadcrumb } = useDashboardContext();

  const getDate = () => {
    const today = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return today.toLocaleDateString('en-US', options);
  };

  return (
    <header className="px-4 w-full md:px-8 py-4">
      <div className="flex items-center justify-between z-10">
        <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-8 w-full md:w-auto">
          <div className="flex justify-between w-full md:w-auto flex-shrink-0">
            <div className='flex items-center gap-2'>
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="focus:outline-none md:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-6 h-6 text-gray-800" />
              </button>
              <img src={logo_text} className="h-6 md:h-8" alt="Logo" />
            </div>

            <div className="flex items-center gap-3 md:hidden">
              <button
                className="bg-white p-2 shadow-md rounded-lg focus:outline-none"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-blue-600" />
              </button>
            </div>
          </div>

          <div className="hidden md:block">{breadcrumb}</div>

          {breadcrumb && <div className="md:hidden">{breadcrumb}</div>}

          <span className="text-blue-600 text-left font-semibold md:hidden text-md">
            {getDate()}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 text-blue-600">
          <span className="whitespace-nowrap text-md font-semibold">
            {getDate()}
          </span>
          <button
            className="bg-white p-2 shadow-md rounded-lg focus:outline-none"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;