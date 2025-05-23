import React, { useState } from "react";
import { Send } from "lucide-react";

const RequestDocumentModal = () => {
    const [documents, setDocuments] = useState([""]);

    const handleAddField = () => {
        setDocuments([...documents, ""]);
    };

    const handleChange = (index: number, value: string) => {
        const newDocs = [...documents];
        newDocs[index] = value;
        setDocuments(newDocs);
    };

    const handleSubmit = () => {
        console.log("Requested Documents:", documents);
        // Add form submission logic here
    };

    return (
        <div className="w-full h-full">
            <h2 className="text-lg font-semibold mb-4">Request for document</h2>

            <div className="h-[90%] flex flex-col justify-between">
                <div>
                    {documents.map((doc, index) => (
                        <div key={index} className="mb-4">
                            {index === 0 && (
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <span className="text-red-500 mr-1">*</span>Document name
                                </label>
                            )}
                            <input
                                type="text"
                                value={doc}
                                onChange={(e) => handleChange(index, e.target.value)}
                                placeholder="Write document name here"
                                className="w-full px-4 py-2 rounded-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    ))}

                    <button
                        type="button"
                        onClick={handleAddField}
                        className="text-blue-600 text-sm font-medium mb-6 flex items-center gap-1"
                    >
                        <span className="text-xl leading-none">+</span> Add document
                    </button>
                </div>

                <button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700 w-fit text-white px-3 py-2 rounded-lg flex justify-center items-center gap-2"
                >
                    <Send size={16} />
                    Request
                </button>
            </div>
        </div>
    );
};

export default RequestDocumentModal;
