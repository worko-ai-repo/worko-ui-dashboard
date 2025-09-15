import React, { useEffect, useState } from 'react';
import { Group, eyeIcon, verified, gender, salary,cancel } from "@Assets";
import {AtSign, Briefcase, Link, MapPin, PhoneCall, Plus, Video, X} from "lucide-react";
// import QuickLinks from "./QuickLinks";
import { renderCard, renderSkillsSection, renderListSection } from "./Helper/ProfileHelper";
import EditForm from './Helper/EditForm';
import UploadImageButton2 from '@Components/Shared/PostJob/UploadImageButton2';
import { useAppContext } from '@Context/App.context';
import httpServiceObj from '@Services/ApiHandler.service';
import { toTitleCase } from '@Utils/Titlecase.utils';
import secureStorage from '@Utils/SecureStorage.utils';
import { NormalizedUser } from '@Utils/NormalizeUser';
import { SecureStorageKeyEnum } from '@Enums/SecureStorage.enum';
import { verify } from 'crypto';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import ExperienceEditor from './Helper/ExperienceEditor';
import profileService from '@Components/Dashboard/Employee/Service/ProfileService';
import CurrentCompanyEditor from './Helper/CurrentCompanyEditor';


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
  const [allCandidateExperience, setAllCandidateExperience] = useState<any>(null);
  const [socialLinks, setSocialLinks] = useState<any>(null);
  

  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(profileData?.data?.name || user?.name || "");
  const [editedLocation, setEditedLocation] = useState("");
  const [editedGender, setEditedGender] = useState("");
  const [showPhoneOtpInput, setShowPhoneOtpInput] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [resendCooldown, setResendCooldown] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [onlyVerifyClicked, setOnlyVerifyClicked] = useState(false);
  const { setUserDetails } = useAppContext();


  // State for loading and error
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // State for edit mode
  const [editMode, setEditModeState] = useState<Record<string, boolean>>({
    about: false,
    workExperience: false,
    salary: false,
    departments: false,
    education:false,
    socials:false,
    profilePic:false,
    currentCompany:false,
  });

  // Helper function to set edit mode for a specific section
  const setEditMode = (section: string, value: boolean) => {
    setEditModeState(prev => ({
      ...prev,
      [section]: value
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
      console.log(userData)
      //combining both experience object and multiple experience array into one
        const combinedExperience = [
          // ...(userData.details[0].candidateExperience
          //   ? [{
          //       ...userData.details[0].candidateExperience,
          //       YOE: userData.details[0].YOE || ""
          //     }]
          //   : []),
          ...(userData.details[0].multipleCandidateExperience || [])
        ];

      // Set state with the fetched data
      setProfileData(userData.profile);
      setDetailsData(userData.details);
      setEducationData(userData.education);
      setExperienceData(userData.experience);
      setAllCandidateExperience(combinedExperience)
      setSocialLinks(userData.socialprofile)
      console.log(userData)
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
      console.log(data.about)
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

  const handleSaveName = async () => {
    if (!user) return;

    const success = await profileService.updateDetailsData2(
      user.email,
      detailsData,
      {
        name: editedName,
        location: editedLocation,
        gender: editedGender === "Male" ? "MALE" : editedGender === "Female" ? "FEMALE" : "OTHER",
      }
    );
    if (success) {
      setProfileData((prev: any) => ({
        ...prev,
        data: {
          ...prev.data,
          name: editedName,
        }
      }));
      setDetailsData((prevData: any) => {
        const updatedData = [...prevData];
        updatedData[0] = { ...updatedData[0], location: editedLocation, gender: editedGender, };
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
        true,
        // { id } 
      );

      if (error) throw new Error(error.message);

      console.log("OTP sent successfully to",number);
      setShowPhoneOtpInput(true);
      setResendCooldown(true);
      setCountdown(30);
    } catch (err:any) {
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
        toast.error("OTP verification failed. Please try again.",getToastOptions({}));
        throw new Error(error.message);
      }

      if (response?.verificationStatus) {
          const success = await profileService.updateDetailsData(
          user.email,
          detailsData,
          {isNumberVerified:true},
        );
        if(success){
          setDetailsData((prevData: any) => {
          const updatedData = [...prevData];
          updatedData[0] = { ...updatedData[0], isNumberVerified: true };
          return updatedData;
          });
          toast.success("Phone number verified successfully!",getToastOptions({}));
          setShowPhoneOtpInput(false);
          setOtpValue("");
          setCountdown(0);
          setResendCooldown(false);
        }
      } else {
        toast.error("Invalid OTP. Please try again.", getToastOptions({}));
      }

    } catch (err:any) {
      console.error("OTP verification error:", err.message);
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
      multipleCandidateExperience: data,
    };
      console.log(updateData)

      const success = await profileService.updateDetailsData(
        user.email,
        detailsData,
        updateData,
        true
      );

      if (success) {
        setAllCandidateExperience(data)
        setEditMode('workExperience', false);
      }

      return success;
    } catch (err) {
      console.error("Failed to update work experience:", err);
      return false;
    }
  };


  // handle current company
  const handleEditCurrentCompany = (e:any) => {
    if(e.target.innerText === "Verify"){
      setOnlyVerifyClicked(true)
    }
    setEditMode('currentCompany', true);
  };

  const handleSaveCurrentCompany = (updatedData:any) => {
    setExperienceData(updatedData);
    setEditMode('currentCompany', false);
    setOnlyVerifyClicked(false)
  };

  const handleCancelCurrentCompany = () => {
    setEditMode('currentCompany', false);
    setOnlyVerifyClicked(false)
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
          ...(userData.details[0].multipleCandidateExperience || [])
        ];

      // Update all state variables with new data
      setProfileData(userData.profile);
      setDetailsData(userData.details);
      setEducationData(userData.education);
      setExperienceData(userData.experience);
      setAllCandidateExperience(combinedExperience)
      setSocialLinks(userData.socialprofile)
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

      {/* <div className="hidden xl:block">
        <QuickLinks />
      </div> */}

      {/* Main Content */}
      <div className="w-full flex">
        <div className="w-full max-w-6xl flex flex-col gap-3 sm:gap-3 text-left font-sans p-4 sm:p-4 lg:pt-0">
          {/* Profile Header Card */}
          {profileData && detailsData && educationData && (
            <div className="w-full relative rounded-3xl bg-white shadow-md overflow-hidden">
              <div className="relative flex flex-col lg:flex-row lg:items-center justify-between w-full p-4 sm:py-5 sm:px-8">

                {/* Profile Section */}
                <div className="flex flex-col sm:flex-row w-full lg:flex-1">
                  {/* Profile Image */}
                <div className="flex flex-col items-center mb-4 sm:mb-0">  
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 lg:w-32 lg:h-32">
       
                {/* Edit Icon */}
                {editMode.profilePic
                ? <img
                  className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 cursor-pointer bg-white rounded-full p-1 shadow-md"
                  alt="Edit"
                  src={cancel}
                  onClick={() => setEditMode('profilePic', false)}
                />
              : <img
                  className="absolute top-1 right-1 w-6 h-6 sm:w-7 sm:h-7 cursor-pointer bg-white rounded-full p-1 shadow-md"
                  alt="Edit"
                  src={Group}
                  onClick={() => setEditMode('profilePic', true)}
                />}

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
                  <UploadImageButton2
                  detailsData={detailsData[0]}
                  onUploadSuccess={(url) => {
                    console.log("New image uploaded:", url);
                    fetchData()
                    setEditMode('profilePic', false)
                  }} />
                </div>
              }
              </div>
                  {/* Profile Info */}
                  <div className="sm:ml-6 lg:ml-8 space-y-2 flex-1">
                    <div className="flex items-center justify-center sm:justify-start">
                      {isEditingName ? (
                        <>
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="text-xl sm:text-2xl font-semibold text-black border border-gray-300 rounded px-2 py-1"
                          />
                          <button
                            onClick={handleSaveName}
                            className="ml-2 text-blue-600 text-sm font-medium"
                          >
                            Save
                          </button>

                          <button
                            onClick={() => {
                                setEditedName(profileData?.data?.name || user?.name || "");
                                setEditedLocation(detailsData[0]?.location || "");
                                setEditedGender(detailsData[0]?.gender || "");
                                setIsEditingName(false);
                              }}
                            className="ml-2 text-gray-500 text-sm font-medium"
                          >
                            Cancel
                          </button>
                        </>
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
                      {experienceData.length > 0 
                      ? <p>{toTitleCase(experienceData[0].companyName)} - {toTitleCase(experienceData[0].designation)}</p>
                      : "N/A"}
                    </div>
                    
                    <div className="border border-gray-300 opacity-50 w-full my-4"></div>

                    {/* Contact Info Grid */}
                    <div className="flex items-center gap-10 flex-wrap sm:flex-nowrap">
                      {[
                        {
                        key: "phone",
                        icon: <PhoneCall strokeWidth={1.75} className="h-4 w-4" />,
                        text: (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm">{detailsData[0]?.number || "Phone Number"}</span>

                        {showPhoneOtpInput && (
                          <>
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
                              className="border px-2 py-1 rounded text-sm w-full sm:w-24"
                              placeholder="Enter OTP"
                            />

                            <button
                              className="text-xs font-medium text-green-600"
                              onClick={handleVerifyPhoneOtp}
                            >
                              Confirm OTP
                            </button>
                            <button
                              className="text-xs font-medium text-gray-600"
                              onClick={handleSendPhoneOtp}
                              disabled={resendCooldown}
                            >
                              {resendCooldown ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                            </button>
                            <button
                              className="text-xs font-medium text-red-600"
                              onClick={() => {
                                setShowPhoneOtpInput(false);
                                setOtpValue("");
                              }}
                            >
                              Cancel
                            </button>
                          </>
                        )}
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
                              className="border px-2 py-1 rounded text-sm w-full sm:w-auto"
                            >
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
                          verify:!detailsData[0]?.isEmailVerified,
                          verified: detailsData[0]?.isEmailVerified,
                        },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center justify-center sm:justify-start">
                          {item.icon}
                          <span
                            className={`text-sm ml-1 overflow-hidden text-ellipsis whitespace-nowrap`}
                          >
                            {item.text}
                          </span>

                          {item.verify && (
                            <button
                              className="text-xs font-medium text-blue-600 ml-1"
                              onClick={()=>{
                                handleSendPhoneOtp()
                              }}
                            >
                              Verify
                            </button>
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
              </div>
            </div>
          )}

          {/* Current Company */}
        <div id="current-company">
          <div className="w-full rounded-3xl bg-white shadow p-6 sm:p-6 lg:p-8">
            <div className="flex flex-col gap-8">
              <div className="flex justify-between items-center">
                <div className="font-medium text-black">
                  Current Company
                </div>
                <button
                  onClick={handleEditCurrentCompany}
                  className="text-xs text-blue-600 whitespace-nowrap text-right min-w-[100px]"
                >
                  Change Company
                </button>
              </div>

              {experienceData[0] ? (
                <div className="flex flex-wrap gap-5 sm:gap-6 md:gap-10">
                  <p className="text-sm text-black font-semibold">
                    {toTitleCase(experienceData[0].designation)|| "N/A"} - {experienceData[0].companyName || "N/A"}
                  </p>
                  <p className="text-sm text-black">
                    <span className='font-semibold'>Department - </span> {toTitleCase(experienceData[0].department) || "N/A"}
                  </p>
                  <p className="text-sm text-black">
                    <span className='font-semibold'>Working Since - </span>{
                      (() => {
                        const months = experienceData[0]?.experienceInMonths;
                        if (months == null) return "N/A";
                        if (months < 12) return `${months} Month${months > 1 ? "s" : ""}`;
                        if (months === 12) return "1 Year";

                        const years = Math.floor(months / 12);
                        const remainingMonths = months % 12;

                        return `${years} Year${years > 1 ? "s" : ""}${
                          remainingMonths > 0 ? ` ${remainingMonths} Month${remainingMonths > 1 ? "s" : ""}` : ""
                        }`;
                      })()
                    }
                  </p>
                  <p className="text-sm text-black flex items-center">
                    @ {experienceData[0].emailId || "N/A"} {experienceData[0].isEmailVerified
                    ?<img
                    className="w-4 h-4 ml-1"
                    alt="Verified"
                    src={verified}
                    />
                    : <button onClick={handleEditCurrentCompany} className='ml-3 text-blue-600'>Verify</button>}
                  </p>
                </div>
              ) : (
                <p>N/A</p>
              )}
            </div>
          </div>

          {/* Drawer stays separate */}
          {editMode.currentCompany && (
            <CurrentCompanyEditor
              items={experienceData[0]}
              userDetails={detailsData}
              onSave={handleSaveCurrentCompany}
              onCancel={handleCancelCurrentCompany}
              onlyVerifyClicked={onlyVerifyClicked}
            />
          )}
        </div>


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
                  required: true
                }
              ]}
              formData={{ about: detailsData[0]?.about || "" }}
            >
              <p className="text-sm text-gray-800 leading-relaxed">
                {detailsData[0]?.about || "No information provided."}
              </p>
            </ProfileSection>
            </div>
          )}

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
                onEdit: handleEditWorkExperience
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;