import React from "react";
import { ChevronDown } from "lucide-react"

const BulkCVCheck: React.FC = () => {
    return (
        <div>
            {/* Tabs */}
            <div className="flex justify-center mb-6 border-gray-200">
                <button className="px-4 py-2 text-blue-600 border-b-2 border-blue-600 font-medium">
                    New screening
                </button>
                <button className="px-4 py-2 text-gray-700 ml-6">Screening list</button>
            </div>

            {/* Form */}
            <div className="space-y-6 bg-white rounded-xl p-6">
                <h2 className="text-lg text-start font-semibold text-gray-800">Bulk cv check</h2>

                {/* Dropdown */}
                <div className="px-8">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Choose Job description from dropdown
                    </label>
                    <div className="relative">
                        <select className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-500 cursor-pointer appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option>Choose from the posted jobs</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 cursor-pointer text-gray-500" />
                    </div>
                </div>

                {/* OR Divider */}
                <div className="text-center text-blue-600 font-medium">Or</div>

                {/* Text Area */}
                <div className="px-8">
                    <label className="block text-sm font-medium mb-1">
                        <span className="text-red-600">
                            *
                        </span>
                        <span>
                            Paste job description
                        </span>
                    </label>
                    <div className="relative">
                        <textarea
                            className="w-full h-60 p-4 rounded-md bg-[#EBEFF3] text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Write or paste here"
                        />
                        {/* Clipboard icon should go here in top-right corner of textarea */}
                        {/* Example: <ClipboardIcon className="absolute top-3 right-3 text-blue-600" /> */}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BulkCVCheck;
