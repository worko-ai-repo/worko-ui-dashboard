import React, { useEffect, useRef, useState } from 'react';
import httpServiceObj from '@Services/ApiHandler.service';
import { toast } from 'react-toastify';
import { getToastOptions } from 'lib-worko-ui';
import { Plus, Send } from 'lucide-react';
import AddNewCompany from './AddNewCompany'

interface ApiDetails {
  verificationStatus: boolean;
}

type CurrentCompanyEditorProps = {
  items: any;
  onSave: (updatedData: any) => void;
  onCancel: () => void;
  userDetails?: any;
  onlyVerifyClicked:boolean
};

interface CompanyFormData {
  companyName: string;
  designation: string;
  department: string;
  experienceInMonths: number | string;
  emailId: string;
}

interface Company {
  aboutCompany:string,
  id: string;
  name: string;
  carrierPage:string;
  industry:string;
  isDeleted:boolean;
  isVerified:boolean;
  teamSize:number;
}

interface CompanyAPIResponse {
  data: Company[];
  pagination: {
    count: number;
    pageSize: number;
    queriedCount: number;
    sortOrder: string;
    timesQueried: number;
  };
}

const CurrentCompanyEditor: React.FC<CurrentCompanyEditorProps> = ({ items, onSave, onCancel, userDetails,onlyVerifyClicked }) => {
  const [formData, setFormData] = useState<CompanyFormData>({
  companyName: '',
  designation: '',
  department: '',
  experienceInMonths: '',
  emailId: '',
});
  const [suggestions, setSuggestions] = useState<Company[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectionMade, setSelectionMade] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [emailValid, setEmailValid] = useState(true);
  const [hashed, setHashed] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otp, setOtp] = useState('');
  const [showAddCompanyForm, setShowAddCompanyForm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  
useEffect(() => {
  // console.log(onlyVerifyClicked,items)
  if (onlyVerifyClicked && items) {
    setFormData({
      companyName: items.companyName || '',
      designation: items.designation || '',
      department: items.department || '',
      experienceInMonths: items.experienceInMonths || '',
      emailId: items.emailId || '',
    });
  }
}, [items, onlyVerifyClicked]);


  useEffect(() => {
  const delayDebounce = setTimeout(() => {
    if (formData.companyName.trim() && !selectionMade) {
      fetchCompanies(formData.companyName);
    } else {
      setSuggestions([]);
    }
  }, 250);

  return () => clearTimeout(delayDebounce);
}, [formData.companyName, selectionMade]);

  const fetchCompanies = async (query:string) => {
    try {
      // const {response} = await httpServiceObj.get(`/company?companyName=${query}&isVerified=0`,true,{});
      const {response} = await httpServiceObj.get(`/company?companyName=${query}`,true,{});
      // console.log(response)
      const typedResponse = response as CompanyAPIResponse;
      setSuggestions(typedResponse.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };
  
    const handleChange = (field: string, value: string) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setSelectionMade(false);
        if (field === 'emailId') {
        setEmailVerified(false);
        validateEmail(value);
        }
    };

    const handleSuggestionClick = (company:Company) => {
      // console.log(company.name)
      setFormData({ ...formData, companyName: company.name });
      setSelectionMade(true); 
      setSelectedCompany(company)
      setShowSuggestions(false);
      setSuggestions([]); 
    };

    const validateEmail = (emailId: string) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailId);
        setEmailValid(isValid);
    };
    const personalEmailDomains = [
      'gmail.com',
      'google.com',
      'yahoo.com',
      'hotmail.com',
      'outlook.com',
      'aol.com',
      'icloud.com',
      'mail.com',
      'protonmail.com',
      'live.com',
      'msn.com',
    ];

    const isPersonalEmail = (emailId: string) => {
      const domain = emailId.split('@')[1]?.toLowerCase();
      return personalEmailDomains.includes(domain);
    };

    const handleVerifyEmail = async () => {
    if (!formData.emailId || !emailValid) {
        toast.error('Please enter a valid email to verify.', getToastOptions({}));
        return;
    }

    if (isPersonalEmail(formData.emailId)) {
      toast.error('Personal emails are not allowed', getToastOptions({}));
      return;
    }
    // if (formData.emailId === items.emailId && emailVerified) {
    //     toast.error('Cannot re-verify same email.', getToastOptions({}));
    //     return;
    // }
    setVerifyingEmail(true);
    // console.log(selectedCompany,"selected company")
    const id = selectedCompany?.id
    if(!id){
      toast.error("No company selected. Choose from the dropdown or add a new one.",getToastOptions({}))
      setVerifyingEmail(false)
      return
    }
    // console.log(items)
    try {
          const payload = [{
          PK: items?.PK? items.PK : "",
          SK: items?.SK? items.SK : "",
          companyId: id,
          companyName: formData.companyName,
          department: formData.department,
          designation: formData.designation,
          emailId: formData.emailId,
          experienceInMonths: formData.experienceInMonths,
          isCurrent: true
        }]
        // console.log(payload)
        await httpServiceObj.post(`/user/${userDetails[0].email}/experience`,payload,true)

        // below i added settimeout so that post gets enough time just an extra step so that post doesnt fail
        await new Promise(res => setTimeout(res, 400));
          
        const { response } = await httpServiceObj.get(`/user/${userDetails[0].email}/experience`, true);
        // console.log(response)
        if (!Array.isArray(response) || response.length === 0) {
          toast.error("No experience data returned.", getToastOptions({}));
          setVerifyingEmail(false);
          return;
        }

        const str = response[0].SK;
        const parts = str.split("#");
        const hashvalue = parts[parts.length - 1];
        setHashed(hashvalue)
        if(response){
          const {response,error} = await httpServiceObj.get(`/user/${userDetails[0].email}/experience/${hashvalue}/request-otp`,true,{})
          if(response){
                setShowOtpInput(true);
                toast.success("OTP sent to your email!", getToastOptions({}));
              }
        }else{
        toast.error("Cannot Send Otp right now",getToastOptions({}))
      }
    } catch (err) {
      console.error('Verification failed:', err);
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleSubmit = async () => {
    const { companyName, department, designation, experienceInMonths, emailId } = formData;

    if (!companyName || !department || !designation || !experienceInMonths || !emailId) {
    toast.error('Please fill all fields.', getToastOptions({}));
    return;
    }

    // if (!emailVerified) {
    //   toast.error('Please verify your email before saving.',getToastOptions({}));
    //   return;
    // }

    try {
      setLoading(true);
      const {response} = await httpServiceObj.post(`/user/${userDetails[0].email}/experience/${hashed}/verify-otp`,{otp:otp},true);
      
      const data = response as ApiDetails; 
      // console.log(data,"data")
      if (data?.verificationStatus) {
        setEmailVerified(true);
        toast.success('Email verified!',getToastOptions({}));
        // console.log([formData])
        onSave([{ ...formData, isEmailVerified: true }]);
      }else{
        toast.error('OTP Verification failed',getToastOptions({}));
      }
    } catch (err) {
      toast.error('OTP Verification failed:',getToastOptions({}));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      onMouseDown={(e) => {
        if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
          // reset();
          onCancel();
        }
      }}
      className={`fixed inset-0 z-[80] flex justify-end transition-opacity duration-300 ${
      visible ? "bg-black bg-opacity-50" : "bg-black bg-opacity-0"
    }`}>
    <div 
    ref={modalRef}
    className={`bg-white rounded-l-xl p-6 max-w-xl w-full shadow-lg flex flex-col h-[100vh] relative transform transition-transform duration-300 ease-in-out ${
        visible ? "translate-x-0" : "translate-x-full"
      } overflow-y-auto`}>
        <h2 className="text-xl font-semibold mb-4">Edit Current Company</h2>

        {/* Company Name */}
          <div>
            <label className="text-sm font-medium mb-1">
              Company Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Enter company name"
                className="border px-3 py-2 rounded-xl w-full mb-3"
                value={formData.companyName}
                onChange={(e) => {
                  handleChange('companyName', e.target.value);
                  setShowSuggestions(true); // Show dropdown when typing
                }}
                onFocus={() => setShowSuggestions(true)} // Show dropdown on focus
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Hide after small delay
              />

              {formData.companyName?.trim() && !selectionMade && showSuggestions && (
                <ul className="border bg-white rounded shadow-md absolute w-full z-10 max-h-60 overflow-y-auto">
                  {suggestions.map((company, idx) => (
                    <li
                      key={idx}
                      className="block w-full px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onMouseDown={() => handleSuggestionClick(company)}
                    >
                      {company.name}
                    </li>
                  ))}
                      <li
                      className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer border-t"
                      onClick={() => setShowAddCompanyForm(true)}
                    >
                      <Plus className="w-4 h-4 text-gray-500" />
                      <span>Add new company</span>
                    </li>
                </ul>
              )}
            </div>
          </div>

        {/* Job Title */}
        <label className="text-sm font-medium mb-1">
          Job Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter job title"
          className="border px-3 py-2 rounded-xl w-full mb-3"
          value={formData.designation || ''}
          onChange={(e) => handleChange('designation', e.target.value)}
        />

        {/* Department */}
        <label className="text-sm font-medium mb-1">
          Department <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="Enter department"
          className="border px-3 py-2 rounded-xl w-full mb-3"
          value={formData.department || ''}
          onChange={(e) => handleChange('department', e.target.value)}
        />

        {/* Working Since */}
        <label className="text-sm font-medium mb-1">
          Working Since (in Months) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          min={0}
          placeholder="E.g. 12"
          className="border px-3 py-2 rounded-xl w-full mb-3"
          value={formData.experienceInMonths || ''}
          onChange={(e) => handleChange('experienceInMonths', e.target.value)}
        />

        <label className="text-sm font-medium mb-1">
          Email ID <span className="text-red-500">*</span>
        </label>
        <div className="relative mb-3">
          <input
            type="email"
            placeholder="Enter official company email"
            className={`border px-3 py-2 rounded-xl w-full pr-20 ${
              !emailValid && formData.emailId ? 'border-red-500' : ''
            }`}
            value={formData.emailId || ''}
            onChange={(e) => handleChange('emailId', e.target.value)}
            disabled={emailVerified}
          />
          <span
            className={`absolute right-3 top-2.5 text-sm font-medium ${
              emailVerified
                ? 'text-green-600'
                : verifyingEmail
                ? 'text-gray-400'
                : 'text-blue-600 cursor-pointer'
            }`}
            onClick={!emailVerified && !verifyingEmail ? handleVerifyEmail : undefined}
          >
            {verifyingEmail ? 'Verifying...' : emailVerified ? 'Verified' : 'Verify'}
          </span>
          {showOtpInput && (
            <div className="mt-2">
              <label className="text-sm font-medium mb-1">Enter OTP</label>
              <input
                type="text"
                maxLength={6}
                pattern="\d{6}"
                placeholder="- - - - - -"
                className="border px-3 py-2 rounded-xl w-full text-center tracking-widest text-xl mb-3"
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                }}
                inputMode="numeric"
              />
            </div>
          )}
          {/* Save & Cancel */}
          <div className="mt-auto flex gap-3 justify-center pt-6">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading || otp.length < 6}
            className={`flex items-center gap-2 px-3 py-2 text-white rounded-lg transition-colors
              ${
                loading || otp.length !== 6
                  ? 'bg-gray-400 cursor-not-allowed hover:bg-gray-400'
                  : 'bg-blue-500 hover:bg-blue-600'
              }
            `}
          >
            <Send size={16} />
            <span className="text-sm font-medium">
              {loading ? 'Submitting...' : 'Submit'}
            </span>
          </button>

            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-400 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
      {showAddCompanyForm && (
        <AddNewCompany
          userDetails={userDetails}
          onCancel={() => setShowAddCompanyForm(false)}
          onSubmit={() => setShowAddCompanyForm(false)}
        />
      )}
    </div>
  );
};

export default CurrentCompanyEditor;
