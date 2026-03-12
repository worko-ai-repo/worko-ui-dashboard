import React, { useEffect, useState } from "react";
import profileService from "../../Service/ProfileService";
import { Group, eyeIcon, verified, gender, salary, cancel } from "@Assets";
import {
  AtSign,
  Briefcase,
  Building2,
  Link,
  Linkedin,
  MapPin,
  PhoneCall,
  Plus,
  Video,
  X,
} from "lucide-react";
import QuickLinks from "./QuickLinks";
import { renderCard, renderSkillsSection, renderListSection } from "./Helper/ProfileHelper";
import EditForm from "./Helper/EditForm";
import SkillsEditor from "./Helper/SkillsEditor";
import ListEditor from "./Helper/ListEditor";
import UploadCVButton from "@Components/Shared/UploadCVButton";
import UploadImageButton from "@Components/Shared/PostJob/UploadImageButton";
import { useAppContext } from "@Context/App.context";
import httpServiceObj from "@Services/ApiHandler.service";
import PreferenceEditor from "./Helper/PreferenceEditor";
import { toTitleCase } from "@Utils/Titlecase.utils";
import ResponsibilityEditor, { Responsibility } from "./Helper/ResponsibilityEditor";
import secureStorage from "@Utils/SecureStorage.utils";
import { NormalizedUser } from "@Utils/NormalizeUser";
import { SecureStorageKeyEnum } from "@Enums/SecureStorage.enum";
import { verify } from "crypto";
import { toast } from "react-toastify";
import { getToastOptions } from "lib-worko-ui";
import ExperienceEditor from "./Helper/ExperienceEditor";
import AchievementsEditor from "./Helper/AchievementsEditor";
import SocialLinksEditor from "./Helper/SocialLinksEditor";
import VideoInterviewModal from "../../../../Modals/SharedModals/Interview/VideoInterviewModal";
import EducationEditor from "./Helper/EducationEditor";
import { InterviewDto } from "@TypesAndConstants/Interview.dto";
import InterviewDetailedViewModal from "@Components/Modals/SharedModals/Interview/InterviewDetailedViewModal";
import CorporateRequestsModal from "@Components/Modals/SharedModals/Interview/CorporateRequestsModal";
import Modal from "@Components/Shared/Modal";
import interviewServiceObj from "@Services/Interview.service";
import { useQuery } from "@tanstack/react-query";

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
  formData,
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
    onEdit,
  });
};

const Profile = () => {
  // State for user data
  const [user, setUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [detailsData, setDetailsData] = useState<any>(null);
  const [educationData, setEducationData] = useState<any>(null);
  const [experienceData, setExperienceData] = useState<any>(null);
  const [multipleCandidateExperience, setMultipleCandidateExperience] = useState<any>(null);
  const [allCandidateExperience, setAllCandidateExperience] = useState<any>(null);
  const [achievementData, setAchievementData] = useState<any>(null);
  const [skillsData, setSkillsData] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  const [preferenceData, setPreferenceData] = useState<any>(null);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profileData?.data?.name || user?.name || "");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedGender, setEditedGender] = useState("");
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [initiateVideoInterview, setInitiateVideoInterview] = useState<boolean>(false);
  const [viewInterviewModal, setViewInterviewModalOpen] = useState<{
    isOpen: boolean;
    data: InterviewDto;
  }>({ isOpen: false, data: {} as InterviewDto });
  const [viewCorporateRequestsModal, setViewCorporateRequestsModal] = useState<{
    isOpen: boolean;
    interview: InterviewDto | null;
  }>({ isOpen: false, interview: null });

  const [isEditingEducation, setIsEditingEducation] = useState(false);
  const [editedEducation, setEditedEducation] = useState<{
    collage: string;
    degree: string;
    passingYear: number | null;
  }>({ collage: "", degree: "", passingYear: null });

  const { setUserDetails, userDetails } = useAppContext();

  // Fetch interviews
  const fetchInterviews = async (): Promise<InterviewDto[]> => {
    if (!userDetails?.email) throw new Error("User email not found");

    const { response, error } = await interviewServiceObj.fetchInterviewList(userDetails.email);

    if (error) throw error;
    return response || [];
  };

  const { data: interviews = [], isLoading: isLoadingInterviews } = useQuery({
    queryKey: ["interviews", userDetails?.email],
    queryFn: fetchInterviews,
    enabled: !!userDetails?.email,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // Calculate interview button states
  const getInterviewButtonState = () => {
    const pendingInterviews = interviews.filter(
      (interview) => interview.status === "PENDING" || interview.status === "IN_PROGRESS"
    );

    const completedInterviews = interviews.filter(
      (interview) => interview.status === "COMPLETED" || interview.status === "CLOSED"
    );

    // Check if any completed/closed interview exists within last 3 months
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const hasRecentCompletedInterview = completedInterviews.some((interview) => {
      const interviewDate = new Date(interview.updatedAt || interview.createdAt);
      return interviewDate > threeMonthsAgo;
    });

    // If there's a completed interview within 3 months, only show View Details button
    if (hasRecentCompletedInterview) {
      return {
        showInitiate: false,
        showContinue: false,
        showViewDetails: true,
        showViewRequests: false,
        buttonText: "",
        pendingInterview: null,
        hasRecentInterview: true,
      };
    }

    // No pending interviews and no recent completed interviews
    if (pendingInterviews.length === 0) {
      return {
        showInitiate: true,
        showContinue: false,
        showViewDetails: completedInterviews.length > 0,
        showViewRequests: false,
        buttonText: "Initiate Video Interview",
        pendingInterview: null,
      };
    }

    // Find oldest pending interview
    const oldestPending = [...pendingInterviews].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )[0];

    const questionsAttempted =
      oldestPending.interviewHistory?.filter((history) => history.chunkUploadStatus === "UPLOADED")
        .length || 0;

    // Check if should show "View Requests" button
    const shouldShowViewRequests =
      oldestPending.status === "PENDING" &&
      (!oldestPending.interviewHistory || oldestPending.interviewHistory.length === 0) &&
      oldestPending.requestedBy &&
      oldestPending.requestedBy.length > 0;

    // If no questions attempted, show as "Initiate" but internally continue
    if (questionsAttempted === 0 && oldestPending.status === "PENDING") {
      return {
        showInitiate: true,
        showContinue: false,
        showViewDetails: completedInterviews.length > 0,
        showViewRequests: shouldShowViewRequests,
        buttonText: "Initiate Video Interview",
        pendingInterview: oldestPending,
        shouldContinue: true,
      };
    }

    // If some questions attempted, show as "Continue"
    return {
      showInitiate: false,
      showContinue: true,
      showViewDetails: completedInterviews.length > 0,
      showViewRequests: false,
      buttonText: "Continue Interview",
      pendingInterview: oldestPending,
      shouldContinue: true,
    };
  };

  const handleInterviewAction = () => {
    const buttonState = getInterviewButtonState();
    const basePath = import.meta.env.APP_PROXY_DASH ? `/${import.meta.env.APP_PROXY_DASH}` : "";

    const openInterviewWindow = (relativePath: string) => {
      const interviewUrl = `${basePath}${relativePath}`;
      const newWindow = window.open(interviewUrl, "_blank");

      if (!newWindow || newWindow.closed || typeof newWindow.closed === "undefined") {
        toast.error("Popup blocked! Please allow popups for this site.");
      }
    };

    // If pending interview is a corporate request and has no interview history, always use new stage
    if (
      buttonState.pendingInterview &&
      buttonState.pendingInterview.status === "PENDING" &&
      buttonState.pendingInterview.requestedBy &&
      buttonState.pendingInterview.requestedBy.length > 0 &&
      (!buttonState.pendingInterview.interviewHistory || buttonState.pendingInterview.interviewHistory.length === 0)
    ) {
      openInterviewWindow(`/interview/new?stage=new`);
      return;
    }

    if (
      buttonState.shouldContinue &&
      buttonState.pendingInterview &&
      buttonState.pendingInterview.interviewHistory &&
      buttonState.pendingInterview.interviewHistory.length > 0
    ) {
      openInterviewWindow(`/interview/${buttonState.pendingInterview.id}?stage=continue`);
      return;
    }

    openInterviewWindow(`/interview/new?stage=new`);
  };

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
    salary: false,
    departments: false,
    industries: false,
    locations: false,
    roles: false,
    education: false,
    socials: false,
    profilePic: false,
  });

  // Helper function to set edit mode for a specific section
  const setEditMode = (section: string, value: boolean) => {
    setEditModeState((prev) => ({
      ...prev,
      [section]: value,
    }));
  };

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

      //combining both experience object and multiple experience array into one
      const combinedExperience = [
        // ...(userData.details[0].candidateExperience
        //   ? [{
        //       ...userData.details[0].candidateExperience,
        //       YOE: userData.details[0].YOE || ""
        //     }]
        //   : []),
        ...(userData.details[0].multipleCandidateExperience || []),
      ];

      // Set state with the fetched data
      setProfileData(userData.profile);
      setDetailsData(userData.details);
      setEducationData(userData.education);
      setExperienceData(userData.experience);
      setMultipleCandidateExperience(userData.multipleCandidateExperience);
      setAllCandidateExperience(combinedExperience);
      setSkillsData(userData.skills);
      setAchievementData(userData.achievement);
      setSocialLinks(userData.socialprofile);
      setPreferenceData(userData.preference || {});
      // console.log(userData)
    } catch (err: any) {
      console.error("Error fetching profile data:", err);
      setError(err.message || "Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // About section handlers
  const handleEditAbout = () => {
    setEditMode("about", true);
  };

  const handleCancelAbout = () => {
    setEditMode("about", false);
  };

  const handleSaveAbout = async (data: any) => {
    try {
      if (!user) return false;
      const success = await profileService.updateDetailsData(user.email, detailsData, {
        about: data.about,
      });
      // console.log(data.about)
      if (success) {
        // Update local state to reflect changes
        setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], about: data.about };
          return updatedData;
        });
        setEditMode("about", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update about section:", err);
      return false;
    }
  };

  const handleSaveName = async () => {
    if (!user) return;

    const success = await profileService.updateDetailsData2(user.email, detailsData, {
      name: editedName,
      location: editedLocation,
      gender: editedGender === "Male" ? "MALE" : editedGender === "Female" ? "FEMALE" : "OTHER",
    });
    if (success) {
      setProfileData((prev: any) => ({
        ...prev,
        data: {
          ...prev.data,
          name: editedName,
        },
      }));
      setDetailsData((prevData: any) => {
        const updatedData = [...prevData];
        updatedData[0] = { ...updatedData[0], location: editedLocation, gender: editedGender };
        return updatedData;
      });
      setUserDetails((prev: NormalizedUser | null) => {
        if (!prev) return prev;
        const updatedUser = { ...prev, fullName: editedName };
        secureStorage.setItem<NormalizedUser>(SecureStorageKeyEnum.LOGINDETAILS, updatedUser);
        return updatedUser;
      });
      setIsEditingName(false);
    } else {
      console.error("Failed to update name");
    }
  };
  // Educatin section handlers
  const handleEditEducation = () => {
    setEditMode("education", true);
  };

  const handleCancelEducation = () => {
    setEditMode("education", false);
  };

  const handleSaveEducation = async (data: any) => {
    if (!user) return false;
    try {
      const timestamp = new Date().toISOString();
      const success = await profileService.updateEducationData(user.email, data, null);
      // we are not checking for success here because backend is sending no response
      setEducationData(data);
      setEditMode("education", false);
      return true;
    } catch (error) {
      console.error("Error while saving education:", error);
      return false;
    }
  };

  //old education saving
  //   const handleSaveEducation = async () => {
  //   if (!user) return;
  //   // console.log(user.email, educationData, editedEducation);

  //   let success;
  //   try {
  //     const timestamp = new Date().toISOString();

  //     if (educationData[0]?.PK && educationData[0]?.SK) {
  //       // console.log("existing")
  //       success = await profileService.updateEducationData(
  //         user.email,
  //         {
  //           ...editedEducation,
  //           PK: educationData[0].PK,
  //           SK: educationData[0].SK,
  //           updatedAt: timestamp,
  //           createdAt:educationData[0].createdAt
  //         },
  //         null,
  //         0
  //       );
  //     } else {
  //       // console.log("new")
  //       success = await profileService.updateEducationData(
  //         user.email,
  //         {
  //           ...editedEducation,
  //         },
  //         null,
  //       );
  //     }

  //   // we are not checking for success here because backend is sending no response
  //   // if (!success) {
  //     setEducationData([{
  //       ...editedEducation,
  //       updatedAt: timestamp,
  //       ...(educationData[0]?.PK ? {} : { createdAt: timestamp }),
  //     }]);

  //     setIsEditingEducation(false);
  //     // } else {
  //     //     console.error("Failed to update education");
  //     //   }
  //     } catch (error) {
  //       console.error("Error while saving education:", error);
  //     }
  // };

  // handling otp
  // Send OTP (GET request)
  const handleSendPhoneOtp = async () => {
    if (!user || resendCooldown) return;
    try {
      const number = detailsData[0]?.number;
      const id = detailsData[0]?.id;

      if (!number || !id) throw new Error("Phone number or ID not available");

      const { response, error } = await httpServiceObj.get(
        `/user/${user.email}/request-otp`,
        true
        // { id }
      );

      if (error) throw new Error(error.message);

      // console.log("OTP sent successfully to",number);
      setShowPhoneOtpInput(true);
      setResendCooldown(true);
      setCountdown(30);
    } catch (err: any) {
      console.error("Failed to send OTP:", err.message);
    }
  };

  //contdown timer
  useEffect(() => {
    if (!resendCooldown) return;

    if (countdown === 0) {
      setResendCooldown(false);
      return;
    }

    const timerId = setTimeout(() => setCountdown(countdown - 1), 1000);

    return () => clearTimeout(timerId);
  }, [countdown, resendCooldown]);

  // Submit OTP (POST request)
  const handleVerifyPhoneOtp = async () => {
    if (!user) return;

    try {
      if (!otpValue) throw new Error("OTP is required");

      const payload = { otp: otpValue };

      const { response, error } = await httpServiceObj.post<{ verificationStatus: boolean }>(
        `/user/${user.email}/verify-otp`,
        payload,
        true
      );

      if (error) {
        toast.error("OTP verification failed. Please try again.", getToastOptions({}));
        throw new Error(error.message);
      }

      if (response?.verificationStatus) {
        const success = await profileService.updateDetailsData(user.email, detailsData, {
          isNumberVerified: true,
        });
        if (success) {
          setDetailsData((prevData: any) => {
            const updatedData = [...prevData];
            updatedData[0] = { ...updatedData[0], isNumberVerified: true };
            return updatedData;
          });
          toast.success("Phone number verified successfully!", getToastOptions({}));
          setShowPhoneOtpInput(false);
          setOtpValue("");
          setCountdown(0);
          setResendCooldown(false);
        }
      } else {
        toast.error("Invalid OTP. Please try again.", getToastOptions({}));
      }
    } catch (err: any) {
      console.error("OTP verification error:", err.message);
    }
  };

  // Work Experience handlers
  const handleEditWorkExperience = () => {
    setEditMode("workExperience", true);
  };

  const handleCancelWorkExperience = () => {
    setEditMode("workExperience", false);
  };

  const handleSaveWorkExperience = async (data: any) => {
    try {
      if (!user) return false;
      const updateData = {
        multipleCandidateExperience: data,
      };
      // console.log(updateData)

      const success = await profileService.updateDetailsData(user.email, detailsData, updateData);

      if (success) {
        setAllCandidateExperience(data);
        setEditMode("workExperience", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update work experience:", err);
      return false;
    }
  };

  // Core Skills handlers
  const handleEditCoreSkills = () => {
    setEditMode("coreSkills", true);
  };

  const handleCancelCoreSkills = () => {
    setEditMode("coreSkills", false);
  };

  const handleSaveCoreSkills = async (skills: any[]) => {
    try {
      if (!user) return false;

      const success = await profileService.updateSkillsData(
        user.email,
        skillsData,
        { coreSkills: skills },
        "coreSkills"
      );
      // console.log("handlesavecoreskills function", user.email,skillsData,skills,)
      if (success) {
        // Update local state to reflect changes
        setSkillsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], coreSkills: skills };
          return updatedData;
        });
        setEditMode("coreSkills", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update core skills:", err);
      return false;
    }
  };

  // Soft Skills handlers
  const handleEditSoftSkills = () => {
    setEditMode("softSkills", true);
  };

  const handleCancelSoftSkills = () => {
    setEditMode("softSkills", false);
  };

  const handleSaveSoftSkills = async (skills: any[]) => {
    try {
      if (!user) return false;

      const success = await profileService.updateSkillsData(
        user.email,
        skillsData,
        { softSkills: skills },
        "softSkills"
      );

      if (success) {
        // Update local state to reflect changes
        setSkillsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], softSkills: skills };
          return updatedData;
        });
        setEditMode("softSkills", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update soft skills:", err);
      return false;
    }
  };

  // Technical Skills handlers
  const handleEditTechnicalSkills = () => {
    setEditMode("technicalSkills", true);
  };

  const handleCancelTechnicalSkills = () => {
    setEditMode("technicalSkills", false);
  };

  const handleSaveTechnicalSkills = async (skills: any[]) => {
    try {
      if (!user) return false;

      const success = await profileService.updateSkillsData(
        user.email,
        skillsData,
        { technicalSkills: skills },
        "technicalSkills"
      );

      if (success) {
        // Update local state to reflect changes
        setSkillsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], technicalSkills: skills };
          return updatedData;
        });
        setEditMode("technicalSkills", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update technical skills:", err);
      return false;
    }
  };

  //preference handlers

  //Roles
  const handleEditRoles = () => {
    setEditMode("roles", true);
  };

  const handleCancelRoles = () => {
    setEditMode("roles", false);
  };

  const handleSaveRoles = async (roles: any[]) => {
    try {
      if (!user) return false;
      const success = await profileService.updatePreferenceData(
        user.email,
        preferenceData,
        { userPreferredRoles: roles },
        "userPreferredRoles"
      );

      if (success) {
        setPreferenceData((prevData: any) => ({
          ...prevData,
          userPreferredRoles: roles,
        }));
        setEditMode("roles", false);
      }
      return success;
    } catch (err) {
      console.error("Failed to update soft skills:", err);
      return false;
    }
  };

  //Industries
  const handleEditIndustries = () => {
    setEditMode("industries", true);
  };

  const handleCancelIndustries = () => {
    setEditMode("industries", false);
  };

  const handleSaveIndustries = async (industries: any[]) => {
    try {
      if (!user) return false;
      const success = await profileService.updatePreferenceData(
        user.email,
        preferenceData,
        { userPreferredIndustries: industries },
        "userPreferredIndustries"
      );

      if (success) {
        setPreferenceData((prevData: any) => ({
          ...prevData,
          userPreferredIndustries: industries,
        }));
        setEditMode("industries", false);
      }
      return success;
    } catch (err) {
      console.error("Failed to update soft skills:", err);
      return false;
    }
  };

  //Departments
  const handleEditDepartments = () => {
    setEditMode("departments", true);
  };

  const handleCancelDepartments = () => {
    setEditMode("departments", false);
  };

  const handleSaveDepartments = async (departments: any[]) => {
    try {
      if (!user) return false;
      const success = await profileService.updatePreferenceData(
        user.email,
        preferenceData,
        { userPreferredDepartments: departments },
        "userPreferredDepartments"
      );

      if (success) {
        setPreferenceData((prevData: any) => ({
          ...prevData,
          userPreferredDepartments: departments,
        }));
        setEditMode("departments", false);
      }
      return success;
    } catch (err) {
      console.error("Failed to update soft skills:", err);
      return false;
    }
  };

  //Locations
  const handleEditLocations = () => {
    setEditMode("locations", true);
  };

  const handleCancelLocations = () => {
    setEditMode("locations", false);
  };

  const handleSaveLocations = async (locations: any[]) => {
    console.log(preferenceData);
    try {
      if (!user) return false;
      const success = await profileService.updatePreferenceData(
        user.email,
        preferenceData,
        { userPreferredlocations: locations },
        "userPreferredlocations"
      );

      if (success) {
        setPreferenceData((prevData: any) => ({
          ...prevData,
          userPreferredlocations: locations,
        }));
        setEditMode("locations", false);
      }
      return success;
    } catch (err) {
      console.error("Failed to update soft skills:", err);
      return false;
    }
  };

  // Achievements handlers
  const handleEditAchievements = () => {
    setEditMode("achievements", true);
  };

  const handleCancelAchievements = () => {
    setEditMode("achievements", false);
  };

  const handleSaveAchievements = async (items: string[]) => {
    try {
      if (!user) return false;

      // Transform the items into achievement objects
      const achievements = items.map((item) => {
        const parts = item.split(" - ");
        const titlePart = parts[0] || "";

        let acquiredFrom = "";
        let achievDate = new Date();

        if (parts.length > 1) {
          const secondPart = parts[1] || "";
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
          achievDate,
        };
      });

      const success = await profileService.updateAchievementData(
        user.email,
        achievementData[0] || {},
        { achievements },
        "achievement"
      );

      if (success) {
        // Update local state to reflect changes
        setAchievementData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], achievements };
          return updatedData;
        });
        setEditMode("achievements", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update achievements:", err);
      return false;
    }
  };

  // Responsibilities handlers
  const handleEditResponsibilities = () => {
    setEditMode("responsibilities", true);
  };

  const handleCancelResponsibilities = () => {
    setEditMode("responsibilities", false);
  };

  const handleSaveResponsibilities = async (items: Responsibility[]) => {
    try {
      if (!user) return false;

      // Assuming profileService.updateAchievementData expects a similar shape
      const success = await profileService.updateDetailsData(user.email, detailsData[0], {
        responsibilities: items,
      });
      if (success) {
        // Update local state to reflect changes
        setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], responsibilities: items };
          return updatedData;
        });
        setEditMode("responsibilities", false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update responsibilities:", err);
      return false;
    }
  };

  // Social links handlers
  const handleEditSocials = () => {
    setEditMode("socials", true);
  };

  const handleCancelSocials = () => {
    setEditMode("socials", false);
  };

  const handleSaveSocials = async (social: string[]) => {
    console.log(social);
    try {
      if (!user) return false;

      const KNOWN_PLATFORMS = ["twitter", "github", "linkedin"];

      const mainPlatforms: Record<string, string[]> = {
        twitter: [],
        github: [],
        linkedin: [],
      };

      const otherPlatforms: Record<string, string[]> = {};

      social.forEach((entry) => {
        const [key, value] = entry.split(" - ");
        if (!key || !value) return;

        const platform = key.trim().toLowerCase();
        const url = value.trim();

        if (KNOWN_PLATFORMS.includes(platform)) {
          mainPlatforms[platform] = [url];
        } else {
          otherPlatforms[platform] = [url];
        }
      });
      const updatedData = {
        ...mainPlatforms,
        otherSocialPlatForms: otherPlatforms,
        PK: socialLinks[0]?.PK,
        SK: socialLinks[0]?.SK,
        createdAt: socialLinks[0]?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // console.log(updatedData,"updatedData")
      const success = await profileService.updateSocialData(user.email, updatedData);
      if (success) {
        setSocialLinks([updatedData]);
        setEditMode("socials", false);
      }
      return success;
    } catch (err) {
      console.error("Failed to update socials:", err);
      return false;
    }
  };

  // Salary handlers
  const handleEditSalary = () => {
    setEditMode("salary", true);
  };

  const handleCancelSalary = () => {
    setEditMode("salary", false);
  };

  const handleSaveSalary = async (data: any) => {
    try {
      if (!user) return false;
      const isNegotiable = data.isNoticePeriodNegotiable === "negotiable";
      const success = await profileService.updateDetailsData(user.email, detailsData, {
        CTC: data.CTC,
        ECTC: data.ECTC,
        noticePeriod: data.noticePeriod ? data.noticePeriod : 30,
        isNoticePeriodNegotiable: isNegotiable,
      });

      if (success) {
        setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = {
            ...updatedData[0],
            CTC: data.CTC,
            ECTC: data.ECTC,
            noticePeriod: data.noticePeriod ? data.noticePeriod : 30,
            isNoticePeriodNegotiable: isNegotiable,
          };
          return updatedData;
        });
        setEditMode("salary", false);
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

      const combinedExperience = [
        // ...(userData.details[0].candidateExperience
        //   ? [{
        //       ...userData.details[0].candidateExperience,
        //       YOE: userData.details[0].YOE || ""
        //     }]
        //   : []),
        ...(userData.details[0].multipleCandidateExperience || []),
      ];

      // Update all state variables with new data
      setProfileData(userData.profile);
      setDetailsData(userData.details);
      setEducationData(userData.education);
      setExperienceData(userData.experience);
      setMultipleCandidateExperience(userData.multipleCandidateExperience);
      setAllCandidateExperience(combinedExperience);
      setSkillsData(userData.skills);
      setAchievementData(userData.achievement);
      setSocialLinks(userData.socialprofile);
      setPreferenceData(userData.preference || {});
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error retrying data fetch:", err);
      setError(err.message || "Failed to load profile data");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (detailsData?.[0]?.name) {
      setEditedName(detailsData[0].name);
    }
  }, [detailsData]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );

  if (error)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="text-red-600 text-xl font-medium text-center">
          Error loading profile data
        </div>
        <button
          onClick={retryFetchData}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
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
      <div className="w-full flex">
        <div className="w-full flex-1 flex flex-col gap-3 text-left font-sans px-4 sm:p-4 lg:pt-0">
          {/* Profile Header Card */}
          {profileData && detailsData && educationData && (
            <div className="w-full relative rounded-3xl bg-white shadow-md overflow-hidden">
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between w-full p-4 sm:py-5 sm:px-8">
                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row w-full lg:flex-1">
                  {/* Profile Image */}
                  <div className="flex flex-col items-center mb-4 sm:mb-0">
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32 mb-4 sm:mb-0">
                      {/* Edit Icon */}
                      {editMode.profilePic ? (
                        <img
                          className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 cursor-pointer bg-white rounded-full p-1 shadow-md"
                          alt="Edit"
                          src={cancel}
                          onClick={() => setEditMode("profilePic", false)}
                        />
                      ) : (
                        <img
                          className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 cursor-pointer bg-white rounded-full p-1 shadow-md"
                          alt="Edit"
                          src={Group}
                          onClick={() => setEditMode("profilePic", true)}
                        />
                      )}

                {/* Avatar Image */}
                <img
                  className="w-full h-full object-cover rounded-full border-2"
                  alt="Profile"
                  src={
                    detailsData[0]?.profileImageAwsS3SignedUrl ||
                    "https://cdn.pixabay.com/photo/2017/02/23/13/05/avatar-2092113_1280.png"
                  }
                />
              </div>
              {editMode.profilePic &&
              <div className="mt-4 w-full">
                <UploadImageButton 
                detailsData={detailsData[0]}
                onUploadSuccess={(signedUrl) => {
                  setDetailsData((prev:any) => {
                    const updated = [...prev];
                    updated[0] = {
                      ...updated[0],
                      profileImageAwsS3SignedUrl: signedUrl,
                    };
                    return updated;
                  });
                  setEditMode('profilePic', false);
              }}
                />
              </div>
              }
              </div>
                  {/* Profile Info */}
                  <div className="sm:ml-6 lg:ml-8 space-y-2 flex-1">
                    <div className="flex items-center justify-center sm:justify-start">
                      {isEditingName ? (
                        <div className="flex flex-col justify-center items-center lg:flex-row lg:justify-start lg:items-center lg:flex-nowrap">
                          <div>
                            <input
                              type="text"
                              value={editedName}
                              onChange={(e) => setEditedName(e.target.value)}
                              className="text-xl sm:text-2xl font-semibold text-black border border-gray-300 rounded px-2 py-1"
                            />
                          </div>
                          <div className="flex mt-2 lg:mt-0 lg:ml-4">
                            <button
                              onClick={handleSaveName}
                              className="ml-2 text-blue-600 text-sm font-medium">
                              Save
                            </button>

                            <button
                              onClick={() => {
                                setEditedName(profileData?.data?.name || user?.name || "");
                                setEditedLocation(detailsData[0]?.location || "");
                                setEditedGender(detailsData[0]?.gender || "");
                                setIsEditingName(false);
                              }}
                              className="ml-2 text-gray-500 text-sm font-medium">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <h2 className="text-xl sm:text-2xl font-semibold text-black capitalize">
                            {profileData?.data?.name || user?.name || "User Name"}
                          </h2>
                          <img
                            className="ml-2 w-5 h-5 cursor-pointer"
                            alt="Edit"
                            src={Group}
                            onClick={() => {
                              setIsEditingName(true);
                              setEditedName(profileData?.data?.name || user?.name || "");
                              setEditedLocation(detailsData[0]?.location || "");
                              setEditedGender(detailsData[0]?.gender || "");
                            }}
                          />
                          {/* <img className="ml-2 w-5 h-5" alt="Verified" src={Group} /> */}
                        </>
                      )}
                    </div>

                    <div className="text-xs font-medium text-black text-center sm:text-left">
                      Profile last updated –{" "}
                      {detailsData[0].updatedAt
                        ? new Date(detailsData[0]?.updatedAt).toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })
                        : new Date().toLocaleDateString('en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                    </div>

                    {/* <div className="flex items-center justify-center sm:justify-start text-xs text-black gap-1.5 mt-2">
                    {isEditingEducation ? (
                      <>
                        <input
                          type="text"
                          value={editedEducation.collage}
                          onChange={(e) =>
                            setEditedEducation({ ...editedEducation, collage: e.target.value })
                          }
                          placeholder="College"
                        />
                        <input
                          type="text"
                          value={editedEducation.degree}
                          onChange={(e) =>
                            setEditedEducation({ ...editedEducation, degree: e.target.value })
                          }
                          placeholder="Degree"
                        />
                        <input
                          type="number"
                          min={1900}
                          max={new Date().getFullYear()}
                          value={editedEducation.passingYear ?? ""}
                          onChange={(e) =>
                            setEditedEducation({
                              ...editedEducation,
                              passingYear: e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="Passing Year"
                        />
                        <button onClick={handleSaveEducation}>Save</button>
                        <button
                        onClick={() => {
                          setEditedEducation({
                            collage: educationData[0]?.collage || "",
                            degree: educationData[0]?.degree || "",
                            passingYear: educationData[0]?.passingYear || null
                          });
                          setIsEditingEducation(false);
                        }}
                      >
                        Cancel
                      </button>
                      </>
                    ) : (
                      <>
                        <div>{educationData[0]?.collage || "College Name"}</div>
                        <div>{educationData[0]?.degree || "Degree Name"}</div>
                        <div>{educationData[0]?.passingYear || "Passing Year"}</div>
                        <img
                          className="w-3 h-3 cursor-pointer"
                          alt="Edit"
                          src={Group}
                          onClick={() => {
                          const edu = educationData[0] || {};
                          setEditedEducation({
                            collage: edu.collage || "",
                            degree: edu.degree || "",
                            passingYear: edu.passingYear || null
                          });
                          setIsEditingEducation(true);
                          }}
                        />
                      </>
                    )}
                    </div> */}

                    <div className="border border-gray-300 opacity-50 w-full my-4"></div>

                    {/* Contact Info Grid */}
                    <div className="grid grid-cols-[auto] sm:grid-cols-[150px_1fr] gap-x-4 gap-y-3 sm:gap-y-4 mt-2">
                      {[
                        {
                          icon: <MapPin strokeWidth={1.75} className="h-4 w-4" />,
                          text: isEditingName ? (
                            <input
                              type="text"
                              value={editedLocation}
                              onChange={(e) => setEditedLocation(e.target.value)}
                              className="border px-2 py-1 rounded text-sm w-full sm:w-auto font-semibold text-black"
                              placeholder="Location"
                            />
                          ) : (
                            toTitleCase(detailsData[0]?.location) || "Location"
                          ),
                        },
                        {
                          key: "phone",
                          icon: <PhoneCall strokeWidth={1.75} className="h-4 w-4" />,
                          text: showPhoneOtpInput ? (
                            <>
                              {/* Phone icon, number, and OTP input in one row */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm">
                                  {detailsData[0]?.number || "N/A"}
                                </span>
                                <input
                                  type="text"
                                  value={otpValue}
                                  maxLength={6}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    if (/^\d*$/.test(val)) {
                                      setOtpValue(val);
                                    }
                                  }}
                                  className="border px-2 py-1 rounded text-sm w-24"
                                  placeholder="Enter OTP"
                                />
                              </div>

                              {/* Confirm OTP, Resend, Cancel on a separate row */}
                              <div className="mt-2 flex items-center gap-4 flex-wrap">
                                <button
                                  className="text-xs font-medium text-green-600"
                                  onClick={handleVerifyPhoneOtp}>
                                  Confirm OTP
                                </button>
                                <button
                                  className="text-xs font-medium text-gray-600"
                                  onClick={handleSendPhoneOtp}
                                  disabled={resendCooldown}>
                                  {resendCooldown ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                                </button>
                                <button
                                  className="text-xs font-medium text-red-600"
                                  onClick={() => {
                                    setShowPhoneOtpInput(false);
                                    setOtpValue("");
                                  }}>
                                  Cancel
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-sm">
                                {detailsData[0]?.number || "Phone Number"}
                              </span>
                            </div>
                          ),
                          verify: !detailsData[0]?.isNumberVerified && !showPhoneOtpInput,
                          verified: detailsData[0]?.isNumberVerified,
                        },
                        {
                          icon: <img className="w-4 h-4" alt="Gender" src={gender} />,
                          text: isEditingName ? (
                            <select
                              value={editedGender}
                              onChange={(e) => setEditedGender(e.target.value)}
                              className="border px-2 py-1 rounded text-sm w-full sm:w-auto">
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          ) : (
                            toTitleCase(detailsData[0]?.gender) || "Add gender"
                          ),
                        },
                        {
                          icon: <AtSign strokeWidth={1.75} className="h-4 w-4" />,
                          text: detailsData[0]?.email || user?.email || "Email",
                          verify: !detailsData[0]?.isEmailVerified,
                          verified: detailsData[0]?.isEmailVerified,
                        },
                      ].map((item, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-center sm:justify-start">
                          {item.icon}
                          <span
                            className={`text-sm ml-1 overflow-hidden text-ellipsis whitespace-nowrap`}>
                            {item.text}
                          </span>

                          {item.verify && (
                            <button
                              className="text-xs font-medium text-blue-600 ml-1"
                              onClick={() => {
                                if (item.key === "phone") {
                                  handleSendPhoneOtp();
                                }
                              }}>
                              Verify
                            </button>
                          )}

                          {item.verified && (
                            <img className="w-4 h-4 ml-1" alt="Verified" src={verified} />
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
                      {detailsData[0]?.userCvFileName || detailsData[0]?.CV || "Resume.pdf"}
                    </div>
                    <a
                      href={detailsData[0]?.cvAwsS3SignedUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        !detailsData[0]?.cvAwsS3SignedUrl ? "cursor-not-allowed opacity-50" : ""
                      }>
                      <img
                        className="w-8 h-8 btn-sky shrink-0"
                        src={eyeIcon}
                        alt="View CV"
                      />
                    </a>
                  </div>

                  <UploadCVButton onUploadSuccess={() => fetchData()} />

                  {!isLoadingInterviews &&
                    (() => {
                      const buttonState = getInterviewButtonState();
                      return (
                        <>
                          {(buttonState.showInitiate || buttonState.showContinue) && (
                            <button
                              onClick={handleInterviewAction}
                              className="w-full h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white shadow-md border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors">
                              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="text-xs font-semibold">
                                {buttonState.buttonText}
                              </span>
                            </button>
                          )}
                          {buttonState.showViewRequests && buttonState.pendingInterview && (
                            <button
                              onClick={() =>
                                setViewCorporateRequestsModal({
                                  isOpen: true,
                                  interview: buttonState.pendingInterview,
                                })
                              }
                              className="w-full h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white shadow-md border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors">
                              <Building2 className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="text-xs font-semibold">View Requests</span>
                            </button>
                          )}
                          {buttonState.showViewDetails && (
                            <button
                              onClick={() => setInitiateVideoInterview(true)}
                              className="w-full h-10 rounded-xl flex items-center justify-center gap-2 cursor-pointer bg-white shadow-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors">
                              <Video className="h-4 w-4 sm:h-5 sm:w-5" />
                              <span className="text-xs font-semibold">View Interview Details</span>
                            </button>
                          )}
                        </>
                      );
                    })()}
                </div>
              </div>
            </div>
          )}

          {/* About Section */}
          {detailsData && (
            <div id="about">
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
                    required: true,
                  },
                ]}
                formData={{ about: detailsData[0]?.about || "" }}>
                <p className="text-sm text-gray-800 leading-relaxed">
                  {detailsData[0]?.about || "No information provided."}
                </p>
              </ProfileSection>
            </div>
          )}

          {/* Education */}
          <div id="education">
            {editMode.education ? (
              <EducationEditor
                title="Education"
                items={educationData}
                onSave={handleSaveEducation}
                onCancel={handleCancelEducation}
              />
            ) : (
              renderListSection({
                title: "Education",
                items: educationData,
                variant: "education",
                onEdit: handleEditEducation,
              })
            )}
          </div>

          {/* Work Experience */}
          <div id="experience">
            {editMode.workExperience ? (
              <ExperienceEditor
                title="Work experience"
                items={allCandidateExperience}
                onSave={handleSaveWorkExperience}
                onCancel={handleCancelWorkExperience}
              />
            ) : (
              renderListSection({
                title: "Work experience",
                items: allCandidateExperience,
                variant: "experience",
                onEdit: handleEditWorkExperience,
              })
            )}
          </div>

          {/* Skills Sections */}
          {skillsData && (
            <>
              {/* Core Skills */}
              <div id="core-skills">
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
                    onEdit: handleEditCoreSkills,
                  })
                )}
              </div>

              {/* Soft Skills */}
              <div id="soft-skills">
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
                    onEdit: handleEditSoftSkills,
                  })
                )}
              </div>

              {/* Technical Skills */}
              <div id="technical-skills">
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
                    onEdit: handleEditTechnicalSkills,
                  })
                )}
              </div>
            </>
          )}

          {/* Preference Sections */}
          {preferenceData && (
            <>
              {/* Roles*/}
              <div id="roles">
                {editMode.roles ? (
                  <PreferenceEditor
                    title="Roles I am looking for"
                    preference={preferenceData?.userPreferredRoles || []}
                    onSave={handleSaveRoles}
                    onCancel={handleCancelRoles}
                  />
                ) : (
                  renderSkillsSection({
                    title: "Roles I am looking for",
                    skills: preferenceData?.userPreferredRoles || [],
                    onEdit: handleEditRoles,
                  })
                )}
              </div>

              {/* industry*/}
              <div id="industry">
                {editMode.industries ? (
                  <PreferenceEditor
                    title="Industry preference"
                    preference={preferenceData?.userPreferredIndustries || []}
                    onSave={handleSaveIndustries}
                    onCancel={handleCancelIndustries}
                  />
                ) : (
                  renderSkillsSection({
                    title: "Industry preference",
                    skills: preferenceData?.userPreferredIndustries || [],
                    onEdit: handleEditIndustries,
                  })
                )}
              </div>

              {/* department*/}
              <div id="department">
                {editMode.departments ? (
                  <PreferenceEditor
                    title="Department preference"
                    preference={preferenceData?.userPreferredDepartments || []}
                    onSave={handleSaveDepartments}
                    onCancel={handleCancelDepartments}
                  />
                ) : (
                  renderSkillsSection({
                    title: "Department preference",
                    skills: preferenceData?.userPreferredDepartments || [],
                    onEdit: handleEditDepartments,
                  })
                )}
              </div>

              {/* locations*/}
              <div id="locations">
                {editMode.locations ? (
                  <PreferenceEditor
                    title="Location preference"
                    preference={preferenceData?.userPreferredlocations || []}
                    onSave={handleSaveLocations}
                    onCancel={handleCancelLocations}
                  />
                ) : (
                  renderSkillsSection({
                    title: "Location preference",
                    skills: preferenceData?.userPreferredlocations || [],
                    onEdit: handleEditLocations,
                  })
                )}
              </div>
            </>
          )}

          {/* Achievements */}
          <div id="achievements">
            {editMode.achievements ? (
              <AchievementsEditor
                title="Achievements"
                items={
                  (achievementData &&
                    achievementData[0]?.achievements?.map(
                      (achievement: any) =>
                        `${achievement.title} - ${achievement.acquiredFrom} (${new Date(
                          achievement.achievDate
                        ).getFullYear()})`
                    )) ||
                  []
                }
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
                        `${achievement.title} - ${achievement.acquiredFrom} (${new Date(
                          achievement.achievDate
                        ).getFullYear()})`
                    )) ||
                  [],
                onEdit: handleEditAchievements,
              })
            )}
          </div>

          {/* Responsibilities */}
          <div id="responsibilities">
            {editMode.responsibilities ? (
              <ResponsibilityEditor
                title="Responsibilities"
                items={(detailsData && detailsData[0]?.responsibilities) || []}
                onSave={handleSaveResponsibilities}
                onCancel={handleCancelResponsibilities}
              />
            ) : (
              renderListSection({
                title: "Responsibilities",
                items: (detailsData && detailsData[0]?.responsibilities) || [],
                onEdit: handleEditResponsibilities,
                variant: "responsibilities",
              })
            )}
          </div>

          {/* Social Links */}
          <div id="social-links">
            {editMode.socials ? (
              <SocialLinksEditor
                title="Social Links"
                itemsRaw={socialLinks && socialLinks[0] ? socialLinks[0] : null}
                onSave={handleSaveSocials}
                onCancel={handleCancelSocials}
              />
            ) : (
              renderListSection({
                title: "Social Links",
                variant: "socials",
                items: [
                  <div
                    key="social-links"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "13px",
                      alignItems: "center",
                    }}>
                    <Link className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                    {(() => {
                      const validLinks = (socialLinks || []).flatMap(
                        (item: Record<string, string[]>, index: number) => {
                          const links = Object.entries(item)
                            .filter(
                              ([key, value]) =>
                                ![
                                  "SK",
                                  "PK",
                                  "createdAt",
                                  "updatedAt",
                                  "otherSocialPlatForms",
                                ].includes(key) &&
                                value &&
                                value.length > 0 &&
                                value[0] &&
                                value[0] !== "undefined" &&
                                value[0].trim() !== ""
                            )
                            .map(([key, value]) => (
                              <a
                                key={`${index}-${key}`}
                                href={value[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "blue",
                                  textDecoration: "underline",
                                  textTransform: "capitalize",
                                }}>
                                {key}
                              </a>
                            ));

                          if (item.otherSocialPlatForms) {
                            links.push(
                              ...Object.entries(item.otherSocialPlatForms)
                                .filter(
                                  ([_, value]) =>
                                    value &&
                                    value.length > 0 &&
                                    value[0] &&
                                    value[0] !== "undefined" &&
                                    value[0].trim() !== ""
                                )
                                .map(([key, value]) => (
                                  <a
                                    key={`${index}-other-${key}`}
                                    href={value[0]}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "blue",
                                      textDecoration: "underline",
                                      textTransform: "capitalize",
                                    }}>
                                    {key}
                                  </a>
                                ))
                            );
                          }

                          return links;
                        }
                      );

                      return validLinks.length > 0 ? (
                        validLinks
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      );
                    })()}
                  </div>,
                ],
                onEdit: handleEditSocials,
              })
            )}
          </div>

          {/* Social Links */}
          {/* <div id="social-links">
          {editMode.socials ? (
            <SocialLinksEditor
              title="Social Links"
              items={
                socialLinks && socialLinks[0]
                  ? [
                      // top-level socials
                      ...Object.entries(socialLinks[0] as Record<string, unknown>)
                        .filter(
                          ([key, value]) =>
                            !["SK", "PK", "createdAt", "updatedAt", "otherSocialPlatForms"].includes(key) &&
                            Array.isArray(value) &&
                            value.length > 0 &&
                            typeof value[0] === "string" &&
                            value[0].trim() !== "" &&
                            value[0] !== "undefined"
                        )
                        .map(([key, value]) => `${key} - ${(value as string[])[0]}`),

                      // nested socials
                      ...(socialLinks[0].otherSocialPlatForms
                        ? Object.entries(socialLinks[0].otherSocialPlatForms as Record<string, unknown>)
                            .filter(
                              ([_, val]) =>
                                Array.isArray(val) &&
                                val.length > 0 &&
                                typeof val[0] === "string" &&
                                val[0].trim() !== "" &&
                                val[0] !== "undefined"
                            )
                            .map(([innerKey, innerVal]) => `${innerKey} - ${(innerVal as string[])[0]}`)
                        : []),
                    ]
                  : []
              }
              onSave={handleSaveSocials}
              onCancel={handleCancelSocials}
            />
          ) : (
            renderListSection({
              title: "Social Links",
              variant: "socials",
              items: [
                <div
                  key="social-links"
                  style={{ display: "flex", flexWrap: "wrap", gap: "16px", alignItems: "center" }}
                >
                  <Link strokeWidth={1.5} />
                  {(() => {
                    const validLinks = (socialLinks || []).flatMap((item: Record<string, string[]>, index:number) => {
                      const links = Object.entries(item)
                        .filter(
                          ([key, value]) =>
                            !["SK", "PK", "createdAt", "updatedAt", "otherSocialPlatForms"].includes(key) &&
                            value &&
                            value.length > 0 &&
                            value[0] &&
                            value[0] !== "undefined" &&
                            value[0].trim() !== ""
                        )
                        .map(([key, value]) => (
                          <a
                            key={`${index}-${key}`}
                            href={value[0]}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "blue",
                              textDecoration: "underline",
                              textTransform: "capitalize",
                            }}
                          >
                            {key}
                          </a>
                        ));

                      if (item.otherSocialPlatForms) {
                        links.push(
                          ...Object.entries(item.otherSocialPlatForms)
                            .filter(
                              ([_, value]) =>
                                value &&
                                value.length > 0 &&
                                value[0] &&
                                value[0] !== "undefined" &&
                                value[0].trim() !== ""
                            )
                            .map(([key, value]) => (
                              <a
                                key={`${index}-other-${key}`}
                                href={value[0]}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  color: "blue",
                                  textDecoration: "underline",
                                  textTransform: "capitalize",
                                }}
                              >
                                {key}
                              </a>
                            ))
                        );
                      }

                      return links;
                    });

                    return validLinks.length > 0 ? validLinks : <span className="text-gray-400">N/A</span>;
                  })()}
                </div>,
              ],
              onEdit: handleEditSocials,
            })
          )}
        </div> */}

          {/* Salary */}
          {detailsData && (
            <div id="salary-availability" className="scroll-mt-16">
              <ProfileSection
                title="Salary & Availability"
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
                    required: true,
                    min:0,
                    max:300,
                  },
                  {
                    name: "ECTC",
                    label: "Expected CTC (LPA)",
                    type: "number",
                    placeholder: "Enter expected CTC",
                    required: true,
                    min:0,
                    max:400,
                  },
                  {
                    name: "noticePeriod",
                    label: "Notice Period (in days)",
                    type: "select",
                    // placeholder: "Enter notice period",
                    options: [
                      { label: "Immediate", value: 0 },
                      { label: "15 Days", value: 15 },
                      { label: "30 Days", value: 30 },
                      { label: "45 Days", value: 45 },
                      { label: "60 Days", value: 60 },
                      { label: "90 Days", value: 90 },
                      { label: "120 Days", value: 120 },
                    ],
                    required: false,
                  },
                  {
                    name: "isNoticePeriodNegotiable",
                    label: "Is the notice period negotiable?",
                    type: "select",
                    options: [
                      { label: "Negotiable", value: "negotiable" },
                      { label: "Non-negotiable", value: "non-negotiable" },
                    ],
                    required: false,
                  },
                ]}
                formData={{
                  CTC: detailsData[0]?.CTC || "",
                  ECTC: detailsData[0]?.ECTC || "",
                  noticePeriod: detailsData[0]?.noticePeriod || "",
                  isNoticePeriodNegotiable: detailsData[0]?.isNoticePeriodNegotiable
                    ? "negotiable"
                    : "non-negotiable",
                }}>
                <div className="flex flex-col gap-4">
                  {/* Salary Info */}
                  <div className="flex flex-col sm:flex-row sm:flex-nowrap gap-6 sm:gap-20">
                    {[
                      { label: "Current CTC", value: `${detailsData[0]?.CTC || "0"} LPA` },
                      { label: "Expected CTC", value: `${detailsData[0]?.ECTC || "0"} LPA` },
                      // { label: "Notice Period", value: `${detailsData[0]?.noticePeriod || "30"} days` },
                      // { label: "Notice period Negotiable?", value: `${detailsData[0]?.isNoticePeriodNegotiable  || "Yes"}` },
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <img className="w-6 h-6" alt="Money" src={salary} />
                        <div>
                          <span className="font-medium">{item.label} - </span>
                          <span className="font-semibold text-blue-600">{item.value}</span>
                        </div>
                      </div>
                    ))}
                    {/* Notice Period Info */}
                    {detailsData ? (
                      <div className="flex items-center gap-4">
                        <img className="w-6 h-6" alt="Notice Period" src={salary} />
                        <div>
                          <span className="font-medium">Notice Period - </span>
                          <span className="font-semibold text-blue-600">
                            {detailsData[0]?.noticePeriod ?? "0"} days
                          </span>
                          <span className="ml-2 text-sm italic font-semibold text-blue-600">
                            (
                            {detailsData[0]?.isNoticePeriodNegotiable
                              ? "Negotiable"
                              : "Non-Negotiable"}
                            )
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-gray-500 italic">Loading notice period info...</div>
                    )}
                  </div>
                </div>
              </ProfileSection>
            </div>
          )}
          <VideoInterviewModal
            onClose={() => setInitiateVideoInterview(false)}
            isOpen={initiateVideoInterview}
            interviews={interviews}
            isLoading={isLoadingInterviews}
            handleViewDetails={(interview: InterviewDto) => {
              setInitiateVideoInterview(false);
              setViewInterviewModalOpen({ isOpen: true, data: interview });
            }}
          />

          {viewInterviewModal.isOpen && (
            <Modal
              isOpen={viewInterviewModal.isOpen}
              onClose={() =>
                setViewInterviewModalOpen({ isOpen: false, data: {} as InterviewDto })
              }>
              <InterviewDetailedViewModal
                userName={profileData?.data?.name || user?.name || "User"}
                interviewDetails={viewInterviewModal.data}
              />
            </Modal>
          )}
          <Modal
            isOpen={viewCorporateRequestsModal.isOpen}
            onClose={() => setViewCorporateRequestsModal({ isOpen: false, interview: null })}
            
            >
            <CorporateRequestsModal
              isOpen={viewCorporateRequestsModal.isOpen}
              onClose={() => setViewCorporateRequestsModal({ isOpen: false, interview: null })}
              interview={viewCorporateRequestsModal.interview}
            />
          </Modal>
        </div>
      </div>
    </div>
  );
};

export default Profile;
