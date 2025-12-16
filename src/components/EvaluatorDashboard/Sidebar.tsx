import React, { useEffect } from 'react';
import { Users, FileText } from 'lucide-react';
import { Candidate } from 'src/types/index';
import { toTitleCase } from "@Utils/Titlecase.utils";
import { Menu, X, ChevronDown, LogOut, User } from "lucide-react";
import CognitoServiceObj from '@Utils/Cognito.utils';
interface SidebarProps {
  candidates: Candidate[];
  selectedCandidateId: string;
  onCandidateSelect: (candidateId: string) => void;
  userName: string;
  companyLogo: string;
  isLoadingData:boolean;
  setIsLoadingData:(value:boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  candidates,
  selectedCandidateId,
  onCandidateSelect,
  userName,
  companyLogo,
  isLoadingData,
  setIsLoadingData
}) => {
  
  useEffect(() => {
    if (candidates.length === 0) return
    if (selectedCandidateId) return
    setIsLoadingData(true)
    onCandidateSelect(candidates[0].id)
    setIsLoadingData(false)
  }, [candidates, selectedCandidateId])

  const handleLogout = async () => {
  try {
    await CognitoServiceObj.handleSignOut();
    sessionStorage.clear();
    window.location.href = 'https://worko.ai/';
  } catch (err) {
    console.error('Logout failed', err);
  }
};

  return (
    <div className="w-64 bg-[#316BFF] text-white h-full flex flex-col overflow-hidden rounded-tr-xl rounded-br-xl">
      <div className="p-4 flex-1 overflow-auto">
        {/* User Profile Section */}
        <div className="flex items-center gap-3 mb-6 p-3 rounded-lg bg-indigo-700/50">
          <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
            {/* <img
              src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop"
              alt="Profile"
              className="w-full h-full rounded-full object-cover"
            /> */}
            <User className="w-6 h-6 text-white cursor-pointer" />
          </div>
          <div>
            <div className="font-medium text-lg">{toTitleCase(userName)}</div>
          </div>
        </div>

        {/* Candidates Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5" />
          <h2 className="text-lg font-semibold">Candidates</h2>
        </div>

        {/* Candidates List */}
        <div className="space-y-2">
          {candidates.map((candidate) => {
            const isSelected = selectedCandidateId === candidate.id;
            // console.log('Candidate:', candidate.id, 'Selected ID:', selectedCandidateId, 'isSelected:', isSelected)
            return (
              <div
                key={candidate.id}
                onClick={() => onCandidateSelect(candidate.id)}
                className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? 'bg-white text-slate-800 hover:bg-gray-50'
                    : 'hover:bg-[#3D78FF] text-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex flex-col min-w-0 text-left">
                    <div
                      className={`text-sm truncate font-semibold w-40 ${
                        isSelected ? 'text-slate-800' : 'text-white'
                      }`}
                      title={toTitleCase(candidate.applicantName) || toTitleCase(candidate.email)}
                    >
                      {toTitleCase(candidate.applicantName) || toTitleCase(candidate.email)}
                    </div>
                    <div
                      className={`text-xs mt-1 ${
                        isSelected ? 'text-slate-500' : 'text-indigo-200'
                      }`}
                    >
                      {new Date(candidate.sentTime).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        hour12: true
                      })}
                    </div>
                  </div>

                  {candidate.isNew && (
                    <span
                      className={`ml-2 px-2 py-1 text-xs font-medium rounded ${
                        isSelected
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'bg-indigo-500 text-white'
                      }`}
                    >
                      New
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="border-t border-white/20 pt-4 hover:text-red-600 pb-3">
        <button onClick={handleLogout} className="hover:text-red-500 text-white flex items-center justify-between focus:outline-none w-full text-left hover:bg-white/10 p-2 px-4 rounded"
            aria-label="Logout">
              <p>Logout</p>
            <LogOut className="cursor-pointer self-center" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
