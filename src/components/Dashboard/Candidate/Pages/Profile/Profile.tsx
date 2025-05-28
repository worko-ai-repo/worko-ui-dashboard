import React, { useEffect, useState } from 'react';
import profileService from '../../Service/ProfileService';
import { Group, eyeIcon, verified, gender, salary } from "@Assets";
import {
  AtSign,
  Briefcase,
  MapPin,
  PhoneCall,
  Plus,
  Video,
  X
} from "lucide-react";
import QuickLinks from "./QuickLinks";
import { renderCard, renderSkillsSection, renderListSection } from "./Helper/ProfileHelper";
import EditForm from './Helper/EditForm';
import SkillsEditor from "./Helper/SkillsEditor";
import ListEditor from "./Helper/ListEditor";

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
  editMode: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: (data: any) => Promise<boolean>;
  formFields?: any[];
  formData?: any;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  children,
  editMode,
  onEdit,
  onCancel,
  onSave,
  formFields,
  formData
}) => {
  if (editMode && formFields) {
    return (
      <div className="w-full rounded-3xl bg-white shadow p-4 sm:p-6 lg:p-8">
        <EditForm
          title={title}
          fields={formFields}
          initialData={formData}
          onCancel={onCancel}
          onSave={onSave}
        />
      </div>
    );
  }

  return renderCard({
    title,
    children,
    onEdit
  });
};

const Profile = () => {
  // State for user data
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [educationData, setEducationData] = useState<any>(null);
  const [experienceData, setExperienceData] = useState<any>(null);
  const [achievementData, setAchievementData] = useState<any>(null);
  const [skillsData, setSkillsData] = useState<any>(null);
  
  // State for loading and error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for edit mode
  const [editMode, setEditModeState] = useState<Record<string, boolean>>({
    about: false,
    workExperience: false,
    coreSkills: false,
    softSkills: false,
    technicalSkills: false,
    achievements: false,
    responsibilities: false,
    salary: false
  });

  // Helper function to set edit mode for a specific section
  const setEditMode = (section: string, value: boolean) => {
    setEditModeState(prev => ({
      ...prev,
      [section]: value
    }));
  };

  // Fetch user data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get current user from the profile service
        const currentUser = profileService.getCurrentUser();
        if (!currentUser) {
          throw new Error("User not found");
        }
        
        setUser(currentUser);
        
        // Fetch all user data using the email from the current user
        const userData = await profileService.fetchAllUserData(currentUser.email);
        
        // Set state with the fetched data
        setProfileData(userData.profile);
        setDetailsData(userData.details);
        setEducationData(userData.education);
        setExperienceData(userData.experience);
        setSkillsData(userData.skills);
        setAchievementData(userData.achievement);
      } catch (err: any) {
        console.error("Error fetching profile data:", err);
        setError(err.message || "Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // About section handlers
  const handleEditAbout = () => {
    setEditMode('about', true);
  };

  const handleCancelAbout = () => {
    setEditMode('about', false);
  };

  const handleSaveAbout = async (data: any) => {
    try {
      if (!user) return false;
      
      const success = await profileService.updateDetailsData(
        user.email,
        detailsData,
        { about: data.about }
      );
      
      if (success) {
        // Update local state to reflect changes
        setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], about: data.about };
          return updatedData;
        });
        setEditMode('about', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update about section:", err);
      return false;
    }
  };

  // Work Experience handlers
  const handleEditWorkExperience = () => {
    setEditMode('workExperience', true);
  };

  const handleCancelWorkExperience = () => {
    setEditMode('workExperience', false);
  };

  const handleSaveWorkExperience = async (data: any) => {
    try {
      if (!user) return false;
      
      const updateData = {
        candidateExperience: {
          companyName: data.companyName,
          designation: data.designation,
          department: data.department
        },
        YOE: data.YOE
      };
      
      const success = await profileService.updateDetailsData(
        user.email,
        detailsData,
        updateData
      );
      
      if (success) {
        // Update local state to reflect changes
        setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { 
            ...updatedData[0], 
            candidateExperience: updateData.candidateExperience,
            YOE: updateData.YOE
          };
          return updatedData;
        });
        setEditMode('workExperience', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update work experience:", err);
      return false;
    }
  };

  // Core Skills handlers
  const handleEditCoreSkills = () => {
    setEditMode('coreSkills', true);
  };

  const handleCancelCoreSkills = () => {
    setEditMode('coreSkills', false);
  };

  const handleSaveCoreSkills = async (skills: any[]) => {
    try {
      if (!user) return false;
      
      const success = await profileService.updateSkillsData(
        user.email,
        skillsData,
        { coreSkills: skills },
        'coreSkills'
      );
      
      if (success) {
        // Update local state to reflect changes
        setSkillsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], coreSkills: skills };
          return updatedData;
        });
        setEditMode('coreSkills', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update core skills:", err);
      return false;
    }
  };

  // Soft Skills handlers
  const handleEditSoftSkills = () => {
    setEditMode('softSkills', true);
  };

  const handleCancelSoftSkills = () => {
    setEditMode('softSkills', false);
  };

  const handleSaveSoftSkills = async (skills: any[]) => {
    try {
      if (!user) return false;
      
      const success = await profileService.updateSkillsData(
        user.email,
        skillsData,
        { softSkills: skills },
        'softSkills'
      );
      
      if (success) {
        // Update local state to reflect changes
        setSkillsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], softSkills: skills };
          return updatedData;
        });
        setEditMode('softSkills', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update soft skills:", err);
      return false;
    }
  };

  // Technical Skills handlers
  const handleEditTechnicalSkills = () => {
    setEditMode('technicalSkills', true);
  };

  const handleCancelTechnicalSkills = () => {
    setEditMode('technicalSkills', false);
  };

  const handleSaveTechnicalSkills = async (skills: any[]) => {
    try {
      if (!user) return false;
      
      const success = await profileService.updateSkillsData(
        user.email,
        skillsData,
        { technicalSkills: skills },
        'technicalSkills'
      );
      
      if (success) {
        // Update local state to reflect changes
        setSkillsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], technicalSkills: skills };
          return updatedData;
        });
        setEditMode('technicalSkills', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update technical skills:", err);
      return false;
    }
  };

  // Achievements handlers
  const handleEditAchievements = () => {
    setEditMode('achievements', true);
  };

  const handleCancelAchievements = () => {
    setEditMode('achievements', false);
  };

  const handleSaveAchievements = async (items: string[]) => {
    try {
      if (!user) return false;
      
      // Transform the items into achievement objects
      const achievements = items.map(item => {
        const parts = item.split(' - ');
        const titlePart = parts[0] || '';
        
        let acquiredFrom = '';
        let achievDate = new Date();
        
        if (parts.length > 1) {
          const secondPart = parts[1] || '';
          const matches = secondPart.match(/(.+) \((\d{4})\)/);
          
          if (matches && matches.length >= 3) {
            acquiredFrom = matches[1];
            achievDate = new Date(matches[2]);
          } else {
            acquiredFrom = secondPart;
          }
        }
        
        return {
          title: titlePart,
          acquiredFrom,
          achievDate
        };
      });
      
      const success = await profileService.updateAchievementData(
        user.email,
        achievementData[0],
        { achievements },
        'achievement'
      );
      
      if (success) {
        // Update local state to reflect changes
        setAchievementData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], achievements };
          return updatedData;
        });
        setEditMode('achievements', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update achievements:", err);
      return false;
    }
  };

  // Responsibilities handlers
  const handleEditResponsibilities = () => {
    setEditMode('responsibilities', true);
  };

  const handleCancelResponsibilities = () => {
    setEditMode('responsibilities', false);
  };

  const handleSaveResponsibilities = async (items: string[]) => {
    try {
      if (!user) return false;
      
      const success = await profileService.updateAchievementData(
        user.email,
        achievementData[0],
        { responsibilities: items },
        'responsibility'
      );
      
      if (success) {
        // Update local state to reflect changes
        setAchievementData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], responsibilities: items };
          return updatedData;
        });
        setEditMode('responsibilities', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update responsibilities:", err);
      return false;
    }
  };

  // Salary handlers
  const handleEditSalary = () => {
    setEditMode('salary', true);
  };

  const handleCancelSalary = () => {
    setEditMode('salary', false);
  };

  const handleSaveSalary = async (data: any) => {
    try {
      if (!user) return false;
      
      const success = await profileService.updateDetailsData(
        user.email,
        detailsData,
        { CTC: data.CTC, ECTC: data.ECTC }
      );
      
      if (success) {
        // Update local state to reflect changes
        setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], CTC: data.CTC, ECTC: data.ECTC };
          return updatedData;
        });
        setEditMode('salary', false);
      }
      
      return success;
    } catch (err) {
      console.error("Failed to update salary information:", err);
      return false;
    }
  };

  // Retry fetching data function
  const retryFetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user) {
        const currentUser = profileService.getCurrentUser();
        if (!currentUser) {
          throw new Error("User not found");
        }
        setUser(currentUser);
      }

      // Re-fetch all user data
      const userData = await profileService.fetchAllUserData(user.email);
      
      // Update all state variables with new data
      setProfileData(userData.profile);
      setDetailsData(userData.details);
      setEducationData(userData.education);
      setExperienceData(userData.experience);
      setSkillsData(userData.skills);
      setAchievementData(userData.achievement);
      
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error retrying data fetch:", err);
      setError(err.message || "Failed to load profile data");
      setIsLoading(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );
  
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="text-red-600 text-xl font-medium text-center">Error loading profile data</div>
      <button 
        onClick={retryFetchData}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Quick Links Sidebar - Hidden on mobile, visible on desktop */}
      <div className="hidden xl:block">
        <QuickLinks />
      </div>
      
      {/* Main Content */}
      <div className="w-full lg:ml-[60px] flex justify-center">
        <div className="w-full max-w-6xl flex flex-col gap-4 sm:gap-6 text-left font-sans p-4 sm:p-6 lg:pt-0">
          {/* Profile Header Card */}
          {profileData && detailsData && educationData && (
            <div className="w-full relative rounded-3xl bg-white shadow-md overflow-hidden">
              <div className="relative flex flex-col lg:flex-row justify-between w-full p-4 sm:p-6">
                
                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row w-full lg:flex-1">
                  {/* Profile Image */}
                  <div className="flex justify-center sm:justify-start mb-4 sm:mb-0">
                    <img
                      className="w-24 h-24 sm:w-32 sm:h-32 lg:w-36 lg:h-36 object-cover rounded-full"
                      alt="Profile"
                      src={detailsData[0].profileImageAwsS3SignedUrl || "/api/placeholder/144/144"}
                    />
                  </div>

                  {/* Profile Info */}
                  <div className="sm:ml-6 lg:ml-8 space-y-2 flex-1">
                    <div className="flex items-center justify-center sm:justify-start">
                      <h2 className="text-xl sm:text-2xl font-semibold text-black capitalize">
                        {profileData?.data?.name || user?.name || "User Name"}
                      </h2>
                      <img className="ml-2 w-5 h-5 sm:w-6 sm:h-6" alt="Verified" src={Group} />
                    </div>

                    <div className="text-xs font-medium text-black text-center sm:text-left">
                      Profile last updated - {new Date().toLocaleDateString('en-US', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>

                    <div className="flex items-center justify-center sm:justify-start text-xs text-black gap-1.5 mt-2">
                      <div>{educationData[0]?.collage || "Education"}</div>
                      <img className="w-3 h-3" alt="Location" src={Group} />
                    </div>

                    <div className="border border-gray-300 opacity-50 w-full my-4"></div>

                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-[auto] sm:grid-cols-[150px_1fr] gap-y-3 sm:gap-y-4 mt-2">
                      {[
                        {
                          icon: <MapPin strokeWidth={1.75} className="h-4 w-4" />,
                          text: detailsData[0]?.location || "Location",
                        },
                        {
                          icon: <PhoneCall strokeWidth={1.75} className="h-4 w-4" />,
                          text: detailsData[0]?.number || "Phone Number",
                          verify: true,
                        },
                        {
                          icon: <img className="w-4 h-4" alt="Gender" src={gender} />,
                          text: "Add gender",
                          isAction: true,
                        },
                        {
                          icon: <AtSign strokeWidth={1.75} className="h-4 w-4" />,
                          text: detailsData[0]?.email || user?.email || "Email",
                          verified: true,
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-center sm:justify-start">
                          {item.icon}
                          <span
                            className={`text-sm ml-1 overflow-hidden text-ellipsis whitespace-nowrap ${
                              item.isAction ? "font-medium text-blue-600" : ""
                            }`}
                          >
                            {item.text}
                          </span>
                          {item.verify && (
                            <span className="text-xs font-medium text-blue-600 ml-1">
                              Verify
                            </span>
                          )}
                          {item.verified && (
                            <img
                              className="w-4 h-4 ml-1"
                              alt="Verified"
                              src={verified}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side Resume Section */}
                <div className="w-full lg:w-40 xl:w-64 mt-6 lg:mt-0 bg-gray-100 rounded-lg p-4 sm:p-6 flex flex-col gap-4 sm:gap-6">
                  <div className="flex items-center justify-between">
                    <div className="text-sm overflow-hidden text-ellipsis whitespace-nowrap flex-1 mr-2">
                      {detailsData[0]?.CV || "Resume.pdf"}
                    </div>
                    <a
                      href={detailsData[0]?.cvAwsS3SignedUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={!detailsData[0]?.cvAwsS3SignedUrl ? "cursor-not-allowed opacity-50" : ""}
                    >
                      <img
                        className="w-8 h-8 rounded-md bg-[#57E1E1]"
                        src={eyeIcon}
                        alt="View CV"
                      />
                    </a>
                  </div>

                  {[
                    {
                      icon: <Plus className="h-4 w-4 sm:h-5 sm:w-5" />,
                      text: "Upload CV",
                      className: "bg-gradient-to-r from-blue-600 to-blue-500 text-white",
                    },
                    {
                      icon: <Video className="h-4 w-4 sm:h-5 sm:w-5" />,
                      text: "Initiate video interview",
                      className: "bg-white shadow-md border border-blue-200 text-blue-600",
                    },
                  ].map((button, index) => (
                    <button
                      key={index}
                      className={`w-full h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer ${button.className}`}
                    >
                      {button.icon}
                      <span className="text-xs font-semibold">{button.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {detailsData && (
            <ProfileSection
              title="About"
              editMode={editMode.about || false}
              onEdit={handleEditAbout}
              onCancel={handleCancelAbout}
              onSave={handleSaveAbout}
              formFields={[
                {
                  name: "about",
                  label: "About",
                  type: "textarea",
                  placeholder: "Tell us about yourself",
                  required: true
                }
              ]}
              formData={{ about: detailsData[0]?.about || "" }}
            >
              <p id='about' className="text-sm text-gray-800 leading-relaxed">
                {detailsData[0]?.about || "No information provided."}
              </p>
            </ProfileSection>
          )}

          {/* Work Experience */}
          {detailsData && (
            <ProfileSection
              title="Work experience"
              editMode={editMode.workExperience || false}
              onEdit={handleEditWorkExperience}
              onCancel={handleCancelWorkExperience}
              onSave={handleSaveWorkExperience}
              formFields={[
                {
                  name: "companyName",
                  label: "Company Name",
                  type: "text",
                  placeholder: "Enter company name",
                  required: true
                },
                {
                  name: "designation",
                  label: "Designation",
                  type: "text",
                  placeholder: "Enter designation",
                  required: true
                },
                {
                  name: "department",
                  label: "Department",
                  type: "text",
                  placeholder: "Enter department",
                  required: false
                },
                {
                  name: "YOE",
                  label: "Years of Experience",
                  type: "number",
                  placeholder: "Enter years of experience",
                  required: true
                }
              ]}
              formData={{
                companyName: detailsData[0]?.candidateExperience?.companyName || "",
                designation: detailsData[0]?.candidateExperience?.designation || "",
                department: detailsData[0]?.candidateExperience?.department || "",
                YOE: detailsData[0]?.YOE || ""
              }}
            >
              {detailsData[0]?.candidateExperience ? (
                <div id='experience' className="flex flex-col sm:flex-row sm:items-start gap-4 mb-4">
                  <Briefcase strokeWidth={1.5} className="flex-shrink-0 mt-1" />
                  <div className="flex-1 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 lg:gap-4">
                    <div className="font-medium text-base">
                      {detailsData[0].candidateExperience.designation || "Position"} -{" "}
                      {detailsData[0].candidateExperience.companyName || "Company"}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm">
                      <span>
                        {detailsData[0].candidateExperience.department || "Department"}
                      </span>
                      <div className="hidden sm:block w-1 h-1 rounded-full bg-gray-800"></div>
                      <span>
                        {detailsData[0].YOE ? `${detailsData[0].YOE} years` : ""}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">No work experience added yet.</div>
              )}
            </ProfileSection>
          )}

          {/* Skills Sections */}
          {skillsData && (
            <>
              {/* Core Skills */}
              {editMode.coreSkills ? (
                <SkillsEditor
                  title="Core skills"
                  skills={skillsData[0]?.coreSkills || []}
                  onSave={handleSaveCoreSkills}
                  onCancel={handleCancelCoreSkills}
                  withYears={true}
                />
              ) : (
                renderSkillsSection({
                  title: "Core skills",
                  skills: skillsData[0]?.coreSkills || [],
                  onEdit: handleEditCoreSkills
                })
              )}

              {/* Soft Skills */}
              {editMode.softSkills ? (
                <SkillsEditor
                  title="Soft skills"
                  skills={skillsData[0]?.softSkills || []}
                  onSave={handleSaveSoftSkills}
                  onCancel={handleCancelSoftSkills}
                />
              ) : (
                renderSkillsSection({
                  title: "Soft skills",
                  skills: skillsData[0]?.softSkills || [],
                  onEdit: handleEditSoftSkills
                })
              )}

              {/* Technical Skills */}
              {editMode.technicalSkills ? (
                <SkillsEditor
                  title="Technical skills"
                  skills={skillsData[0]?.technicalSkills || []}
                  onSave={handleSaveTechnicalSkills}
                  onCancel={handleCancelTechnicalSkills}
                  withYears={true}
                />
              ) : (
                renderSkillsSection({
                  title: "Technical skills",
                  skills: skillsData[0]?.technicalSkills || [],
                  onEdit: handleEditTechnicalSkills
                })
              )}
            </>
          )}

          {/* Preference Sections */}
          {[
            {
              title: "Roles I am looking for",
              skills: [
                "Communication",
                "UI/UX",
                "Design manager",
                "Java developer",
              ],
            },
            {
              title: "Industry preference",
              skills: ["IT", { skillName: "Manufacturing", canRemove: true }],
            },
            {
              title: "Department preference",
              skills: [
                "IT",
                { skillName: "Manufacturing", canRemove: true },
              ],
            },
            {
              title: "Location preference",
              skills: [{ skillName: "Kolkata", canRemove: true }],
            },
          ].map((section, index) =>
            renderSkillsSection({
              key: index,
              title: section.title,
              skills: section.skills,
            })
          )}

          {/* Achievements */}
          {editMode.achievements ? (
            <ListEditor
              title="Achievements"
              items={(achievementData && achievementData[0]?.achievements?.map(
                (achievement: any) =>
                  `${achievement.title} - ${
                    achievement.acquiredFrom
                  } (${new Date(achievement.achievDate).getFullYear()})`
              )) || []}
              onSave={handleSaveAchievements}
              onCancel={handleCancelAchievements}
            />
          ) : (
            renderListSection({
              title: "Achievements",
              items:
                (achievementData &&
                  achievementData[0]?.achievements?.map(
                    (achievement: any) =>
                      `${achievement.title} - ${
                        achievement.acquiredFrom
                      } (${new Date(achievement.achievDate).getFullYear()})`
                  )) || [],
              onEdit: handleEditAchievements
            })
          )}

          {/* Responsibilities */}
          {editMode.responsibilities ? (
            <ListEditor
              title="Responsibility"
              items={(achievementData && achievementData[0]?.responsibilities) || []}
              onSave={handleSaveResponsibilities}
              onCancel={handleCancelResponsibilities}
            />
          ) : (
            renderListSection({
              title: "Responsibility",
              items: (achievementData && achievementData[0]?.responsibilities) || [],
              onEdit: handleEditResponsibilities
            })
          )}

          {/* Salary */}
          {detailsData && (
            <ProfileSection
            title="Salary"
            editMode={editMode.salary || false}
            onEdit={handleEditSalary}
            onCancel={handleCancelSalary}
            onSave={handleSaveSalary}
            formFields={[
              {
                name: "CTC",
                label: "Current CTC (LPA)",
                type: "number",
                placeholder: "Enter current CTC",
                required: true
              },
              {
                name: "ECTC",
                label: "Expected CTC (LPA)",
                type: "number",
                placeholder: "Enter expected CTC",
                required: true
              }
            ]}
            formData={{
              CTC: detailsData[0]?.CTC || "",
              ECTC: detailsData[0]?.ECTC || ""
            }}
          >
            <div className="flex items-start gap-20">
              {[
                { label: "Current CTC", value: `${detailsData[0]?.CTC || "0"} LPA` },
                { label: "Expected CTC", value: `${detailsData[0]?.ECTC || "0"} LPA` },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <img className="w-6 h-6" alt="Money" src={salary} />
                  <div>
                    <span className="font-medium">{item.label} - </span>
                    <span className="font-semibold text-blue-600">
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ProfileSection>
        )}
      </div>
    </div>
    </div>
  );;
};

export default Profile;