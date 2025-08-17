import httpServiceObj from "@Services/ApiHandler.service";
import secureStorage from "@Utils/SecureStorage.utils";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";

const APP_API_URI = import.meta.env.APP_API_URI || '';

// Data entity types for API calls
export type DataEntity = 'profile' | 'details' | 'education' | 'experience' | 'skills' | 'achievement' | 'subscription' | 'socialprofile';

export interface CognitoUserDetails {
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

class ProfileService {
  // Get current user from secure storage
  getCurrentUser(): CognitoUserDetails | null {
    const userDetails = secureStorage.getItem(SecureStorageKeyEnum.COGNITOUSERDETAILS);
    return userDetails ? (userDetails as CognitoUserDetails) : null;
  }

  // Generic data fetching function
  async fetchUserData(email: string, entity: DataEntity): Promise<any> {
    if (!email) throw new Error("Email is required");

    // Handle the special case for skills endpoint
    const endpoint = entity === 'skills' ? 'Skill' : entity;
    
    const { response, error } = await httpServiceObj.get(
      `${APP_API_URI}/user/${email}/${endpoint}`, 
      true, 
      {}, 
      true
    );
    // console.log(response,"response")
    if (error) throw error;
    return response;
  }

  // Fetch all user data types
  async fetchAllUserData(email: string): Promise<Record<DataEntity, any>> {
    if (!email) throw new Error("Email is required");
    
    // Define entities to fetch
    const entitiesToFetch: DataEntity[] = [
      'profile', 
      'details', 
      'education', 
      'experience', 
      'skills', 
      'achievement',
      'socialprofile',
    ];

    const result: Partial<Record<DataEntity, any>> = {};

    try {
      // Create array of promises for all entities
      const fetchPromises = entitiesToFetch.map(async entity => {
        const data = await this.fetchUserData(email, entity);
        result[entity] = data;
        return data;
      });
      
      // Execute all promises in parallel
      await Promise.all(fetchPromises);
      // console.log("✅ All user data fetched:\n", JSON.stringify(result, null, 2));
      return result as Record<DataEntity, any>;
    } catch (err) {
      console.error("Failed to fetch user data:", err);
      throw new Error("Failed to fetch user data");
    }
  }

  // Generic data updating function
  async updateUserData(email: string, entity: DataEntity, data: any, method: 'POST' | 'PUT' = 'POST'): Promise<boolean> {
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
      // console.log(response)
      if (error) throw error;
      return true;
    } catch (err) {
      console.error(`Failed to update ${entity}:`, err);
      return false;
    }
  }

  // Update profile data
  async updateProfileData(email: string, data: any): Promise<boolean> {
    return await this.updateUserData(email, 'profile', data);
  }

  // Update details data
  async updateDetailsData(email: string, currentData: any, newData: Partial<any>): Promise<boolean> {
    
    if (!currentData) {
      console.error("Details data is null or undefined");
      return false;
    }
    console.log(currentData,newData)
    // Handle both array and object formats for detailsData
    let updatedDetailsData;
    
    if (Array.isArray(currentData)) {
      // If it's an array, update the first item
      if(!currentData[0]?.isCandidateFresher){
        updatedDetailsData = {
          ...currentData[0],
          ...newData,
          isCandidateFresher:true
        };
      }else{
        updatedDetailsData = {
          ...currentData[0],
          ...newData
        };
      }
    } else {
      // If it's already an object, just update it directly
      if(!currentData?.isCandidateFresher){
        updatedDetailsData = {
          ...currentData,
          ...newData,
          isCandidateFresher:true
        };
      }else{
        updatedDetailsData = {
          ...currentData,
          ...newData
        };
      }
    }
    console.log(updatedDetailsData)
    return await this.updateUserData(email, 'details', updatedDetailsData, 'PUT');
  }

  // Update education data
  async updateEducationData(email: string, data: any, currentData: any[] | null, index?: number): Promise<boolean> {
    // If index is provided, update existing education entry
    if (index !== undefined && currentData && currentData[index]) {
      const updatedData = {
        ...currentData[index],
        ...data
      };
      return await this.updateUserData(email, 'education', updatedData, 'PUT');
    } 
    // Otherwise add new education entry
    else {
      return await this.updateUserData(email, 'education', data);
    }
  }

  // Update experience data
  async updateExperienceData(email: string, data: any, currentData: any[] | null, index?: number): Promise<boolean> {
    // If index is provided, update existing experience entry
    if (index !== undefined && currentData && currentData[index]) {
      const updatedData = {
        ...currentData[index],
        ...data
      };
      return await this.updateUserData(email, 'experience', updatedData, 'PUT');
    } 
    // Otherwise add new experience entry
    else {
      return await this.updateUserData(email, 'experience', data);
    }
  }

  // Update skills data
  async updateSkillsData(email: string, currentData: any, data: Partial<any>, skillType: string): Promise<boolean> {
    if (!currentData) return false;

    const updatedSkills = [...currentData]; // Clone the entire array
    
    // Update the specific skill type within the first element
    updatedSkills[0] = {
      ...updatedSkills[0],             // Keep all existing data
      [skillType]: data[skillType],    // Update only the specific skill type
    };
      // console.log(updatedSkills,"updated skills")
    return await this.updateUserData(email, 'skills', updatedSkills[0]);
  }

  // Update achievement data
  async updateAchievementData(
    email: string,
    currentData: any, 
    data: any | string, 
    type: 'achievement' | 'responsibility', 
    index?: number
  ): Promise<boolean> {
    // console.log("currentData",currentData)
    // if (!currentData) return false;
    // console.log("currentData",currentData)
    let updatedData = { ...currentData };
    
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
          PK: `USR#EML#${email}`
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
    console.log("currentData",updatedData)
    return await this.updateUserData(email, 'achievement', updatedData);
  }

  // Remove skill
  async removeSkill(email: string, currentData: any, skillType: string, index: number): Promise<boolean> {
    if (!currentData || !currentData[skillType]) return false;
    
    const updatedSkills = { ...currentData };
    updatedSkills[skillType] = [
      ...updatedSkills[skillType].slice(0, index),
      ...updatedSkills[skillType].slice(index + 1)
    ];
    
    return await this.updateUserData(email, 'skills', updatedSkills);
  }

  // Remove achievement
  async removeAchievement(email: string, currentData: any, type: 'achievement' | 'responsibility', index: number): Promise<boolean> {
    if (!currentData) return false;
    
    const updatedData = { ...currentData };
    
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
    
    return await this.updateUserData(email, 'achievement', updatedData);
  }

  // Get subscription plan
  async getSubscriptionPlan(email: string): Promise<any> {
    console.log(email);
    if (!email) {
      return null;
    }
    
    try {
        console.log('In get subscription plan');
      return await this.fetchUserData(email, 'subscription');
    } catch (error) {
      console.error("Error fetching subscription plan:", error);
      return null;
    }
  }
}

// Create singleton instance
const profileService = new ProfileService();
export default profileService;