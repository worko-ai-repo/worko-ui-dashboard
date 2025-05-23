import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import secureStorage from "@Utils/SecureStorage.utils";
import { Star } from "lucide-react";
import { createContext, ReactNode, useState, useContext, useEffect, useCallback, useRef } from "react";
import httpServiceObj from "@Services/ApiHandler.service";

const APP_API_URI = import.meta.env.APP_API_URI || '';

type Tab =
  | 'profile'
  | 'jobs'
  | 'referral'
  | 'guidance'
  | 'refer-and-earn'
  | 'subscription'
  | 'support'

// Data entity types for API calls
type DataEntity = 'profile' | 'details' | 'education' | 'experience' | 'skills' | 'achievement' | 'subscription';
interface CognitoUserDetails {
  aud: string;
  auth_time: number;
  'cognito:groups'?: string[];
  'cognito:username': string;
  email: string;
  email_verified: boolean;
  event_id: string;
  exp: number;
  iat: number;
  iss: string;
  jti: string;
  name: string;
  origin_jti: string;
  phone_number: string;
  phone_number_verified: boolean;
  sub: string;
  token_use: 'id';
}

interface DashboardContextType {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  breadcrumb: ReactNode;
  user: CognitoUserDetails | null;
  profileData: any | null;
  detailsData: any | null;
  educationData: any | null;
  experienceData: any | null;
  achievementData: any | null;
  skillsData: any | null;
  isLoading: boolean;
  error: string | null;
  fetchProfileData: () => Promise<void>;
  getSubscriptionPlan: () => Promise<any>;
  dataFetchInProgress: boolean;
  editMode: {[key: string]: boolean};
  setEditMode: (section: string, value: boolean) => void;
  updateProfileData: (data: Partial<any>) => Promise<boolean>;
  updateDetailsData: (data: Partial<any>) => Promise<boolean>;
  updateEducationData: (data: any, index?: number) => Promise<boolean>;
  updateExperienceData: (data: any, index?: number) => Promise<boolean>;
  updateSkillsData: (data: Partial<any>, skillType: keyof any) => Promise<boolean>;
  updateAchievementData: (data: any | string, type: 'achievement' | 'responsibility', index?: number) => Promise<boolean>;
  removeSkill: (skillType: keyof any, index: number) => Promise<boolean>;
  removeAchievement: (type: 'achievement' | 'responsibility', index: number) => Promise<boolean>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState<Tab>('jobs');
  const [user, setUser] = useState<CognitoUserDetails | null>(null);
  const [profileData, setProfileData] = useState<any | null>(null);
  const [detailsData, setDetailsData] = useState<any | null>(null);
  const [educationData, setEducationData] = useState<any | null>(null);
  const [experienceData, setExperienceData] = useState<any | null>(null);
  const [skillsData, setSkillsData] = useState<any | null>(null);
  const [achievementData, setAchievementData] = useState<any | null>(null);
  const [subscriptionPlanData, setSubscriptionPlanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataFetchInProgress, setDataFetchInProgress] = useState(false);
  const [editMode, setEditModeState] = useState<{[key: string]: boolean}>({});

   const hasFetchedData = useRef(false);

  // Helper function to set edit mode for specific sections
  const setEditMode = (section: string, value: boolean) => {
    setEditModeState(prev => ({
      ...prev,
      [section]: value
    }));
  };


useEffect(() => {
  if (user?.email && !hasFetchedData.current) {
    hasFetchedData.current = true;
    fetchProfileData();
  }
}, [user?.email]);

  useEffect(() => {
    const userDetails = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERDETAILS);
    if (userDetails) setUser(userDetails as CognitoUserDetails);
  }, []);

  // Generic data fetching function
  const fetchUserData = useCallback(async (email: string, entity: DataEntity): Promise<any> => {
    // Handle the special case for skills endpoint
    const endpoint = entity === 'skills' ? 'Skill' : entity;
    
    const { response, error } = await httpServiceObj.get(
      `${APP_API_URI}/user/${email}/${endpoint}`, 
      true, 
      {}, 
      true
    );
    
    if (error) throw error;
    
    // Update state based on entity type
    switch (entity) {
      case 'profile':
        setProfileData(response as any);
        break;
      case 'details':
        setDetailsData(response as any);
        break;
      case 'education':
        setEducationData(response as any[]);
        break;
      case 'experience':
        setExperienceData(response as any[]);
        break;
      case 'skills':
        setSkillsData(response as any);
        break;
      case 'achievement':
        setAchievementData(response as any);
        break;
      case 'subscription':
        setSubscriptionPlanData(response);
        break;
    }
    
    return response;
  }, []);

  // Generic data updating function
  const updateUserData = useCallback(async (email: string, entity: DataEntity, data: any, method: 'POST' | 'PUT' = 'POST'): Promise<boolean> => {
    if (!email) return false;
    
    try {
      // Handle the special case for skills endpoint
      const endpoint = entity === 'skills' ? 'Skill' : entity;
      
      const { response, error } = await httpServiceObj[method.toLowerCase() as 'post' | 'put'](
        `${APP_API_URI}/user/${email}/${endpoint}`, 
        data,
        true, 
        {}, 
        true
      );
      
      if (error) throw error;
      
      // Update local state with new data
      await fetchUserData(email, entity);
      return true;
    } catch (err) {
      console.error(`Failed to update ${entity}:`, err);
      return false;
    }
  }, [fetchUserData]);

  const fetchAllUserData = useCallback(async (email: string) => {
    if (!email) return;
    
    setIsLoading(true);
    setError(null);

    // Define entities to fetch
    const entitiesToFetch: DataEntity[] = [
      'profile', 
      'details', 
      'education', 
      'experience', 
      'skills', 
      'achievement'
    ];

    try {
      // Create array of promises for all entities
      const fetchPromises = entitiesToFetch.map(entity => 
        fetchUserData(email, entity)
      );
      
      // Execute all promises in parallel
      await Promise.all(fetchPromises);
    } catch (err) {
      setError("Failed to fetch user data.");
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData]);

  const fetchProfileData = useCallback(async () => {
    // Don't fetch if data is already loaded or if a fetch is in progress
    if (!user?.email || dataFetchInProgress) {
      return;
    }
    
    setDataFetchInProgress(true);
    await fetchAllUserData(user.email);
    setDataFetchInProgress(false);
  }, [
    user?.email, 
    fetchAllUserData
  ]);

  // Update functions for each data type
  const updateProfileData = useCallback(async (data: Partial<any>): Promise<boolean> => {
    if (!user?.email) return false;
    return await updateUserData(user.email, 'profile', data);
  }, [user?.email, updateUserData]);

  
const updateDetailsData = useCallback(async (data: Partial<any>): Promise<boolean> => {
  if (!user?.email) return false;
  if (!detailsData) {
    console.error("Details data is null or undefined");
    return false;
  }
  
  // Handle both array and object formats for detailsData
  let updatedDetailsData;
  
  if (Array.isArray(detailsData)) {
    // If it's an array, update the first item
    updatedDetailsData = {
      ...detailsData[0],
      ...data
    };
  } else {
    // If it's already an object, just update it directly
    updatedDetailsData = {
      ...detailsData,
      ...data
    };
  }
  return await updateUserData(user.email, 'details', updatedDetailsData, 'PUT');
}, [user?.email, detailsData, updateUserData]);

  const updateEducationData = useCallback(async (data: any, index?: number): Promise<boolean> => {
    if (!user?.email) return false;
    
    // If index is provided, update existing education entry
    if (index !== undefined && educationData && educationData[index]) {
      const updatedData = {
        ...educationData[index],
        ...data
      };
      return await updateUserData(user.email, 'education', updatedData, 'PUT');
    } 
    // Otherwise add new education entry
    else {
      return await updateUserData(user.email, 'education', data);
    }
  }, [user?.email, educationData, updateUserData]);

  const updateExperienceData = useCallback(async (data: any, index?: number): Promise<boolean> => {
    if (!user?.email) return false;
    
    // If index is provided, update existing experience entry
    if (index !== undefined && experienceData && experienceData[index]) {
      const updatedData = {
        ...experienceData[index],
        ...data
      };
      return await updateUserData(user.email, 'experience', updatedData, 'PUT');
    } 
    // Otherwise add new experience entry
    else {
      return await updateUserData(user.email, 'experience', data);
    }
  }, [user?.email, experienceData, updateUserData]);

  const updateSkillsData = useCallback(async (data: Partial<any>, skillType: string | number | symbol): Promise<boolean> => {
    if (!user?.email || !skillsData) return false;

  const updatedSkills = [...skillsData]; // Clone the entire array
  
  // Update the specific skill type within the first element
  updatedSkills[0] = {
    ...updatedSkills[0],             // Keep all existing data
    [skillType as string]: data[skillType as string],    // Update only the specific skill type
  };
    
    return await updateUserData(user.email, 'skills', updatedSkills[0]);
  }, [user?.email, skillsData, updateUserData]);

  const updateAchievementData = useCallback(async (
    data: any | string, 
    type: 'achievement' | 'responsibility', 
    index?: number
  ): Promise<boolean> => {
    if (!user?.email || !achievementData) return false;
    
    let updatedData = { ...achievementData };
    
    if (type === 'achievement') {
      // Update or add achievement
      if (index !== undefined && updatedData.achievements && updatedData.achievements[index]) {
        updatedData.achievements[index] = {
          ...updatedData.achievements[index],
          ...(data as any)
        };
      } else {
        // Format according to expected payload structure
        updatedData = {
          achievements: (data.achievements as any[]).map((item) => ({
            ...item,
            acquiredFrom: item.acquiredFrom || 'exam', // Use existing acquiredFrom or default to 'exam'
            timestamps: {
              createdAt: item.timestamps?.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString()
            }
          })),
          SK: "ACHIEVEMENT#",
          PK: `USR#EML#${user.email}`
        };
      }
    } else if (type === 'responsibility') {
      // Update or add responsibility
      if (!updatedData.responsibilities) {
        updatedData.responsibilities = [];
      }
      
      if (index !== undefined && updatedData.responsibilities[index]) {
        updatedData.responsibilities[index] = data as string;
      } else {
        updatedData.responsibilities = [
          ...updatedData.responsibilities,
          data as string
        ];
      }
    }
    console.log(updatedData);
    
    return await updateUserData(user.email, 'achievement', updatedData);
  }, [user?.email, achievementData, updateUserData]);

  const removeSkill = useCallback(async (skillType: keyof any, index: number): Promise<boolean> => {
    if (!user?.email || !skillsData || !skillsData[skillType]) return false;
    
    const updatedSkills = { ...skillsData };
    updatedSkills[skillType] = [
      ...updatedSkills[skillType].slice(0, index),
      ...updatedSkills[skillType].slice(index + 1)
    ];
    
    return await updateUserData(user.email, 'skills', updatedSkills);
  }, [user?.email, skillsData, updateUserData]);

  const removeAchievement = useCallback(async (type: 'achievement' | 'responsibility', index: number): Promise<boolean> => {
    if (!user?.email || !achievementData) return false;
    
    const updatedData = { ...achievementData };
    
    if (type === 'achievement' && updatedData.achievements) {
      updatedData.achievements = [
        ...updatedData.achievements.slice(0, index),
        ...updatedData.achievements.slice(index + 1)
      ];
    } else if (type === 'responsibility' && updatedData.responsibilities) {
      updatedData.responsibilities = [
        ...updatedData.responsibilities.slice(0, index),
        ...updatedData.responsibilities.slice(index + 1)
      ];
    }
    
    return await updateUserData(user.email, 'achievement', updatedData);
  }, [user?.email, achievementData, updateUserData]);

  const getSubscriptionPlan = useCallback(async () => {
    // Get current user details if not already loaded
    if (!user) {
      const userDetails = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERDETAILS);
      if (!userDetails) {
        console.warn("No user details found in secure storage");
        return null;
      }
      
      // Only set the user if not already set to avoid potential infinite loops
      if (!user) {
        setUser(userDetails as CognitoUserDetails);
      }
      
      const email = (userDetails as CognitoUserDetails).email;
      if (!email) {
        console.warn("No email found in user details");
        return null;
      }
      
      try {
        return await fetchUserData(email, 'subscription');
      } catch (error) {
        console.error("Error fetching subscription plan:", error);
        return null;
      }
    } else {
      // User is already loaded, proceed normally
      if (!user.email) {
        console.warn("No email found in user details");
        return null;
      }
      
      try {
        return await fetchUserData(user.email, 'subscription');
      } catch (error) {
        console.error("Error fetching subscription plan:", error);
        return null;
      }
    }
  }, [user, fetchUserData]);

  const breadcrumb: ReactNode = (
    <div className="flex items-center text-sm text-gray-500 space-x-2 truncate">
      <Star className="text-[#316bff] w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
      <span>Dashboards</span>
      <span>/</span>
      <span className="font-medium text-black capitalize">{activeTab}</span>
    </div>
  );

  return (
    <DashboardContext.Provider value={{
      activeTab,
      setActiveTab,
      breadcrumb,
      user,
      profileData,
      detailsData,
      educationData,
      experienceData,
      achievementData,
      skillsData,
      isLoading,
      error,
      fetchProfileData,
      getSubscriptionPlan,
      dataFetchInProgress,
      editMode,
      setEditMode,
      updateProfileData,
      updateDetailsData,
      updateEducationData,
      updateExperienceData,
      updateSkillsData,
      updateAchievementData,
      removeSkill,
      removeAchievement
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboardContext = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboardContext must be used within a DashboardProvider");
  }
  return context;
};