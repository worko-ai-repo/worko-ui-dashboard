import { Search, X } from "lucide-react";
import React, { useCallback, useRef } from "react";

interface SearchBarProps {
  placeholder?:string;
  searchBarText: string | null;
  setSearchBarText: any;
  handleClick: (value?: string | null) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({placeholder, searchBarText, setSearchBarText, handleClick }) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const onClear = useCallback(() => {
    setSearchBarText(null);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    handleClick(null); // Trigger default API
  }, [setSearchBarText, handleClick]);

  return (
    <div className="flex flex-row w-full sm:flex-1 bg-white shadow-md rounded-xl overflow-hidden h-9">
      <div className="relative flex flex-1">
        {/* <i className=" fa-solid fa-magnifying-glass absolute z-10 top-4 left-3 text-gray-300 bc" /> */}
        <input
          type="text"
          ref={searchInputRef}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleClick();
            }
          }}
          placeholder={placeholder || "Search"}
          value={searchBarText ?? ""}
          onChange={(e) => setSearchBarText(e.target.value)}
          className="px-3 py-3 relative w-full outline-none bg-[#FAFAFA] text-xs focus:outline-none focus:ring-neutral-50"
        />
        {searchBarText && (
          <button onClick={onClear} className="scale-50 active:scale-[45%] absolute right-[0.1%] h-full w-fit">
            <X className="p-1 text-white bg-blue-600 rounded-full w-full h-full relative" />
          </button>
        )}
      </div>
      <button onClick={() => handleClick()} className="relative bg-blue-500 m-1 p-1 text-white rounded-lg">
        <Search className="h-5 w-auto"/>
      </button>
    </div>
  );
};

export default SearchBar;
