import React from "react";
import { ChevronRight } from "lucide-react";
import { NavItem, TabId } from "src/types/sidebar";

interface SidebarItemProps {
  item: NavItem;
  isActive: boolean;
  collapsed: boolean;
  onClick: (NavItem: NavItem) => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, collapsed, onClick }) => {
  return (
    <button
      onClick={() => onClick(item)}
      className={`
        w-full flex items-center gap-3 p-2 transition-all duration-200 rounded-lg
        ${isActive ? "bg-white text-[#316bff] shadow-sm" : "hover:bg-blue-600"}
        ${collapsed ? "justify-center" : "justify-between"}
      `}>
      <div className="flex items-center gap-2 overflow-hidden">
        <span className={`p-1 rounded-lg ${isActive ? "bg-gray-100 text-[#316bff]" : "bg-blue-600 text-white"}`}>
          <span className="w-4 h-4 flex items-center justify-center">{typeof item.icon === "function" ? <item.icon /> : item.icon}</span>
        </span>
        {!collapsed && <span className="text-[11px] font-medium whitespace-nowrap">{item.label}</span>}
      </div>
      {!collapsed && (
        <span className={`${isActive ? "bg-gray-100 rounded-md p-1" : ""}`}>
          <ChevronRight className={`w-4 h-4 ${isActive ? "text-gray-400" : "text-blue-300"}`} />
        </span>
      )}
    </button>
  );
};

export default SidebarItem;
