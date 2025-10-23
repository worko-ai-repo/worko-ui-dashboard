import { useState } from "react";

export default function TagInput({ label, tags, onAddTag, onRemoveTag,required }: { label: string; tags: string[]; onAddTag: (tag: string) => void; onRemoveTag?: (tag: string) => void ,required?:boolean }) {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      onAddTag(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="no-scrl no-scrl-web">
      <label className=" mb-5  text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500">*</span>}</label>
      <div className="mt-3 bg-gray-100 rounded-xl p-2 min-h-[133px] flex flex-col justify-between no-scrl no-scrl-web">
        {/* Tags container */}
        {tags && (
          <div className="  flex flex-wrap gap-2 max-h-[60px] overflow-y-auto no-scrl no-scrl-web ">
            {tags.map((tag, i) => (
              <span key={i} className="bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 max-w-[33.3%] cursor-pointer "
              data-tooltip-id="my-tooltip" data-tooltip-content={tag} data-tooltip-place="top"  data-tooltip-delay-show={500} data-tooltip-delay-hide={500}
              >
                <span className="truncate">{tag}</span>
                {onRemoveTag && (
                  <button onClick={() => onRemoveTag(tag)} className="text-white text-xs hover:text-gray-200 flex-shrink-0">
                    ×
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
        {/* Input takes full width on next line */}
        <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent rounded-xl  border-2 text-sm px-3 py-3" placeholder="Add more" />
      </div>
    </div>
  );
}
