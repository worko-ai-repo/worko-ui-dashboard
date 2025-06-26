import React, { useEffect, useRef, useState } from "react";

export type OptionType = {
  label: string;
  value: any;
};

type Props = {
  label: string;
  options: OptionType[];
  selected: OptionType[];
  onChange: (updated: OptionType[]) => void;
  maxSelections?: number;
};

export default function MultiSelectDropdownWithChips({ label, options, selected, onChange, maxSelections }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSelect = (option: OptionType) => {
    const exists = selected.some((s) => JSON.stringify(s.value) === JSON.stringify(option.value));
    if (!exists && maxSelections && selected.length >= maxSelections) return;

    const updated = exists ? selected.filter((s) => JSON.stringify(s.value) !== JSON.stringify(option.value)) : [...selected, option];

    onChange(updated);
  };

  const handleRemove = (option: OptionType) => {
    onChange(selected.filter((s) => JSON.stringify(s.value) !== JSON.stringify(option.value)));
  };

  const filteredOptions = options.filter((opt) => opt.label.toLowerCase().includes(searchText.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-sm font-medium text-gray-700">{label}</label>

      <div className="bg-gray-100 p-2 rounded-xl h-[138px] overflow-auto no-scrl no-scrl-web cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {selected.map((tag, i) => (
            <span key={i} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              {tag.label}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(tag);
                }}>
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Dropdown with search */}
      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-hidden">
          <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="Search..." className="w-full px-3 py-2 border-b border-gray-200 text-sm outline-none" />
          <div className="max-h-48 overflow-y-auto no-scrl no-scrl-web">
            {filteredOptions.length === 0 && <div className="px-4 py-2 text-sm text-gray-500">No matching options</div>}
            {filteredOptions.map((option, idx) => {
              const isSelected = selected.some((s) => JSON.stringify(s.value) === JSON.stringify(option.value));
              return (
                <div key={idx} className={`px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 ${isSelected ? "bg-blue-100" : ""}`} onClick={() => handleSelect(option)}>
                  {option.label}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
