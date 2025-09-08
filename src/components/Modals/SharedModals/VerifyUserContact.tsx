import { ApplicantDetails } from "@Interfaces/CorporateDashboard.dto";
import httpServiceObj from "@Services/ApiHandler.service";
import { BadgeCheck, Check } from "lucide-react";
import React, { useState } from "react";

interface VerifyUserContactProps {
  type: "EMAIL" | "MOBILE" | "COMPANY_EMAIL";
  user: ApplicantDetails ;
  onClose: () => void;
  refetch: () => void;
}

const VerifyUserContact = ({ type, user, onClose, refetch }: VerifyUserContactProps) => {
  const [inputValue, setInputValue] = useState(
    type === "EMAIL"
      ? (user as ApplicantDetails).email || ""
      : type === "MOBILE"
      ? (user as ApplicantDetails).number || ""
      : (user as ApplicantDetails).companyEmailId || ""
  );
  const [succesModalOpen, setSuccesModalOpen] = useState(false);

  /**
   * HandleUserVerificationMutation
   *
   * @description This function handles the mutation to verify a user's email or mobile number based on the provided type. It constructs the payload and logs the data to the console.
   */
  const handleVerifyUserMutation = async () => {
    try {
      let payload = {};
      switch (type) {
        case "EMAIL":
          payload = { isNumberVerified: inputValue };
          break;
        case "MOBILE":
          payload = { isNumberVerified: true };
          break;
        case "COMPANY_EMAIL":
          payload = { companyEmail: inputValue };
          break;
        default:
          console.error("Invalid type");
          return;
      }
      const {response , error } = await httpServiceObj.patch(
        `/user/${user.email}/details`,
        payload,
        true,
        {},
        false,
        "BASE")
      if(error || !response){
        throw new Error("Failed to verify user");
      }
      setSuccesModalOpen(true);
      refetch();
      onClose();
    } catch (error) {
      console.error("Error verifying user:", error);
    }
  };

  if (succesModalOpen) {
    return (
      <div className="text-left mx-5 my-10 ">
        <BadgeCheck className="w-8 h-8 bg-green-500 text-white rounded-full mx-auto mb-4" />
        <p className="text-xs mb-4 text-center">
          {type === "EMAIL" ? "Email" : type === "MOBILE" ? "Mobile" : "Company Email"} is verified
          successfully!
        </p>
      </div>
    );
  }

  return (
    <div className="text-left m-0 ">
      <h2 className="text-xl font-semibold mb-4">
        Verify {type === "EMAIL" ? "Email" : type === "MOBILE" ? "Mobile" : "Company Email"}
      </h2>
      <div className="">
        <label className="m-0">
          {type === "EMAIL" ? "Email" : type === "MOBILE" ? "Phone No." : "Company Email"}
        </label>
        <input
          type={type === "EMAIL" || type === "COMPANY_EMAIL" ? "email" : "tel"}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded mt-1 text-sm"
        />
        <div className=" mt-5   flex gap-1 px-10  justify-center items-center  ">
          <button
            type="submit"
            onClick={() => {
              handleVerifyUserMutation();
            }}
            className="btn_secondary flex-1  ">
            <Check className="w-4 h-4 mr-2 inline-block  " />
            Yes
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn_t1 h-fit flex-1 border-blue-500 text-blue-500">
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyUserContact;
