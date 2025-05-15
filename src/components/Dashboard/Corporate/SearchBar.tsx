import React from 'react'

interface SearchBarProps {
    searchBarText: string | null;
    setSearchBarText: React.Dispatch<React.SetStateAction<string | null>>;
    handleClick: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
    searchBarText,
    setSearchBarText,
    handleClick,
}) => {
    return (
        <div className="flex flex-row w-full bg-white shadow-md rounded-[15px] overflow-hidden max-w-7xl">
            <input
                type="text"
                placeholder="Search"
                value={searchBarText ?? ''}
                onChange={(e) => setSearchBarText(e.target.value)}
                className="px-4 py-3 w-full outline-none bg-[#FAFAFA] text-sm"
            />
            <button
                onClick={handleClick}
                className="bg-gradient-to-t from-[#316BFF] to-[#5FC9FF] text-white px-6 py-0 rounded-[15px] rounded-l-none">
                Search
            </button>
        </div>
    )
}

export default SearchBar
