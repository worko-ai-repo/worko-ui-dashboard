import React from "react";

interface NeoToggleProps {
    buttonOne: {
        label: string;
        icon: React.ReactNode;
    };
    buttonTwo: {
        label: string;
        icon: React.ReactNode;
    };
    isChecked: boolean; // Make it controlled
    onToggle: (isChecked: boolean) => void;
}

const NeoToggle: React.FC<NeoToggleProps> = ({ buttonOne, buttonTwo, isChecked, onToggle }) => {
    const handleToggle = (checked: boolean) => {
        onToggle(checked);
    };

    return (
        <div>
            <label className="relative inline-flex cursor-pointer">
                <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={isChecked}
                    onChange={(e) => handleToggle(e.target.checked)}
                />

                {/* Toggle Container */}
                <div
                    className="relative flex rounded-2xl p-1 shadow-neomorphism"
                    style={{ backgroundColor: "#eeeeee" }}
                >
                    {/* Button One */}
                    <div
                        className={`
                            relative flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 ease-in-out
                            ${!isChecked ? "shadow-neomorphism-inset text-blue-600" : "text-gray-500 hover:text-gray-600"}
                        `}
                        style={{ backgroundColor: "#eeeeee" }}
                    >
                        {buttonOne.icon}
                        <span className="font-medium text-sm whitespace-nowrap">{buttonOne.label}</span>
                    </div>

                    {/* Button Two */}
                    <div
                        className={`
                            relative flex items-center gap-2 px-5 py-2 rounded-xl transition-all duration-300 ease-in-out
                            ${isChecked ? "shadow-neomorphism-inset text-blue-600" : "text-gray-500 hover:text-gray-600"}
                        `}
                        style={{ backgroundColor: "#eeeeee" }}
                    >
                        {buttonTwo.icon}
                        <span className="font-medium text-sm whitespace-nowrap">{buttonTwo.label}</span>
                    </div>
                </div>
            </label>
        </div>
    );
};

export default NeoToggle;