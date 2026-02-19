import React from 'react';

interface StatCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, children, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 transition-shadow hover:shadow-md ${className}`}>
      <h3 className="text-lg font-semibold text-slate-700 mb-4 font-['Poppins']">{title}</h3>
      {children}
    </div>
  );
};