import React, { ReactNode } from "react";
import { CorporateUserDetail } from "@Context/App.context";
import { NormalizedUser } from "@Utils/NormalizeUser";

/**
 * Interface for the ContextProvider
 * @interface
 */
export interface ContextProviderProps {
  children: ReactNode;
}

export interface AppContextType {
  isLoggedIn: boolean;
  tokenData: any | null;
  setAuthState: (tokenData: any, isLoggedIn: boolean) => void;
  setUpdateCheck: React.Dispatch<React.SetStateAction<boolean>>;
  userDetails: NormalizedUser | null;
  setUserDetails: React.Dispatch<React.SetStateAction<NormalizedUser | null>>;
  PendingApply: any | null ;
  setPendingApply: React.Dispatch<React.SetStateAction<any | null >>;
  isModalOpen: boolean;
  setIsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}