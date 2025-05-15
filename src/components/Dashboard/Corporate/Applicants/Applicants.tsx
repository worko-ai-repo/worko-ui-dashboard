import { useEffect, useState } from 'react';
import FilterToggle from '../Filters';
import BulkOption from '@Components/Dashboard/Corporate/Bulk';
import ApplicationTable from './ApplicantsTable';
import HeaderDetails from '../Stats';
import SearchBar from '../SearchBar';
import httpServiceObj from '@Services/ApiHandler.service';

const stats = [
    { label: 'Total Applicants', value: 106 },
    { label: 'Rejected', value: 90 },
    { label: 'Reviewed', value: 20 },
    { label: 'New Applicants', value: 10 },
    { label: 'Hired', value: 90 },
];

const tabs = ["All", "Hired", "Joined"] as const;


const Applicants = () => {
    const [activeTab, setActiveTab] = useState<"All" | "Hired" | "Joined">("All");
    const [searchBarText, setSearchBarText] = useState<string | null>(null);

    const fetchApplicants = async () => {
        const params = new URLSearchParams({
            pageSize: '25',
            companyId: '01JM1WBGBZK51B951XBRBG8NKX',
            userType: 'corporate-admin',
          });
        const { response, error } = await httpServiceObj.get(`https://api.dev.worko.work/job-application?${params.toString()}`, true, {}, true);
        console.log(response);
    }
    
    useEffect(() => {
        fetchApplicants();
    }, []);

    return (
        <div>
            <div className='flex flex-col sm:flex-col gap-4 sm:gap-[35px]'>
                <div className="flex flex-col gap-[35px]">
                    <div className="grid grid-cols-[auto_auto_auto_auto_auto_2fr_2fr] gap-4">
                        <HeaderDetails />
                        <div className="bg-white shadow-md rounded-xl px-7 text-xs gap-2 py-4 text-center flex flex-col">
                            <span className='text-sm text-[#64748B]'>
                                Job Url
                            </span>
                            <input
                                type="text"
                                placeholder='Job url'
                                className='px-3 py-1 rounded-lg text-[#C0B7B7] border'
                            />
                        </div>
                        <div className='flex flex-col gap-2 bg-white rounded-xl px-7 py-4 shadow-md'>
                            <span className='text-sm text-[#64748B] text-nowrap'>Job Status</span>
                            <span className='text-2xl text-blue-500 font-semibold'>Hiring</span>
                        </div>
                    </div>

                    <div className='flex flex-col sm:flex-row justify-between items-center gap-3'>
                        {/* Search Bar */}
                        <SearchBar
                            searchBarText={searchBarText}
                            setSearchBarText={setSearchBarText}
                            handleClick={() => console.log('Search clicked')}
                        />

                        <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
                            <FilterToggle />
                            <BulkOption />
                        </div>
                    </div>
                </div>
                <div className="flex justify-center gap-[57px]">
                    {tabs.map((tab) => (
                        <button
                            key={tab}
                            className={`pb-2 border-b-2 text-sm ${activeTab === tab
                                ? "border-blue-500 text-blue-700 font-semibold"
                                : "border-transparent text-gray-500"
                                }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab === 'All' ? 'All' : tab === 'Hired' ? 'Hired' : 'Joined'}
                        </button>
                    ))}
                </div>
                <ApplicationTable
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                />
            </div>
        </div>
    )
}

export default Applicants
