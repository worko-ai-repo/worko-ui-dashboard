import React, { useState } from 'react'
import HeaderDetails from '../Stats'
import SearchBar from '../SearchBar'
import FilterToggle from '../Filters';
import SortBy from '../SortBy';
import InterviewTable from './InterviewTable';

const Interview = () => {
    const [searchBarText, setSearchBarText] = useState<string | null>(null);
    
    return (
        <div className='flex flex-col gap-4'>
            <div className='flex-wrap flex gap-4'>
                <HeaderDetails />
            </div>
            <div className='flex sm:flex-row flex-col justify-between items-center gap-3'>
                <SearchBar
                    searchBarText={searchBarText}
                    setSearchBarText={setSearchBarText}
                    handleClick={() => console.log("Search clicked")}
                />
                <div className="flex gap-3 font-semibold w-full sm:w-auto justify-end">
                    <FilterToggle />
                    <SortBy />
                </div>
            </div>
            <InterviewTable />
        </div>
    )
}

export default Interview
