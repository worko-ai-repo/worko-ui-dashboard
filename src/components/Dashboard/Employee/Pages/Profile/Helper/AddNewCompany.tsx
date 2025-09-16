import httpServiceObj from "@Services/ApiHandler.service";
import { getToastOptions } from "@Utils/Toast.utils";
import { Send } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";

const AddNewCompany: React.FC<{
  onCancel: () => void;
  onSubmit: () => void;
  userDetails: any;
}> = ({ onCancel, onSubmit, userDetails }) => {
  const [visible, setVisible] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    linkedInPage: "",
    careerPage: "",
  });

  const [linkedInValid, setLinkedInValid] = useState(true);
  const [careerValid, setCareerValid] = useState(true);

  useEffect(() => {
    console.log(userDetails);
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const urlRegex = /^(https?:\/\/)[\w.-]+\.[\w]{2,}(\/.*)?$/;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (field === "linkedInPage") {
      setLinkedInValid(urlRegex.test(value));
    }
    if (field === "careerPage") {
      setCareerValid(urlRegex.test(value));
    }
  };

  const handleSubmit = async () => {
    const { companyName, linkedInPage, careerPage } = formData;

    if (!companyName.trim() || !linkedInPage.trim() || !careerPage.trim()) {
      toast.warn("Please fill all required fields.",getToastOptions());
      return;
    }

    if (!linkedInValid || !careerValid) {
      toast.warn("Please enter valid URLs.",getToastOptions());
      return;
    }
    const payload = {
      companyDetail: {
        carrierPage: careerPage,
        industry: "Industry",
        linkedIn: linkedInPage,
        name: companyName,
      },
      userName: userDetails[0]?.name,
      userEmail: userDetails[0]?.email,
      userType: "EMP",
    };
    try {
      const { response } = await httpServiceObj.post(`/company/request`, payload, true, {});

      if (response) {
        console.log(response);
        toast.success("Company added successfully", getToastOptions({}));
        onSubmit();
      }
    } catch (error) {
      console.log(error);
      toast.error("Error adding company", getToastOptions({}));
    }

    console.log("Submitting new company:", payload);
    onSubmit();
  };

  const isFormValid =
    formData.companyName.trim() &&
    linkedInValid &&
    careerValid &&
    formData.linkedInPage.trim() &&
    formData.careerPage.trim();

  return (
    <div
      className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${
        visible ? "bg-black bg-opacity-50" : "bg-black bg-opacity-0"
      }`}>
      <div
        className={`bg-white rounded-l-xl p-6 max-w-xl w-full shadow-lg flex flex-col h-[100vh] relative transform transition-transform duration-300 ease-in-out ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}>
        <h2 className="text-xl font-semibold mb-4">Add New Company</h2>

        <label className="text-sm font-medium mb-1">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter company name"
          className="border px-3 py-2 rounded-xl w-full mb-4"
          value={formData.companyName}
          onChange={(e) => handleChange("companyName", e.target.value)}
        />

        <label className="text-sm font-medium mb-1">
          LinkedIn Page <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          placeholder="https://linkedin.com/company/xyz"
          className={`px-3 py-2 rounded-xl w-full mb-4 border ${
            linkedInValid ? "border-gray-300" : "border-red-500"
          }`}
          value={formData.linkedInPage}
          onChange={(e) => handleChange("linkedInPage", e.target.value)}
        />

        <label className="text-sm font-medium mb-1">
          Career Page <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          placeholder="https://company.com/careers"
          className={`px-3 py-2 rounded-xl w-full mb-4 border ${
            careerValid ? "border-gray-300" : "border-red-500"
          }`}
          value={formData.careerPage}
          onChange={(e) => handleChange("careerPage", e.target.value)}
        />

        <div className="mt-auto flex gap-3 justify-center pt-6">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-colors ${
              isFormValid ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-400 cursor-not-allowed"
            }`}>
            <Send size={16} />
            <span className="text-sm font-medium">Submit</span>
          </button>

          <button onClick={onCancel} className="px-4 py-2 border border-gray-400 rounded-lg">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddNewCompany;
