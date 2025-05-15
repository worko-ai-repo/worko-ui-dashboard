import React from 'react';
import { Clock, MessageSquare } from 'lucide-react';

const EventDetails: React.FC = () => {
  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="w-12 h-12 bg-yellow-400 rounded-full overflow-hidden mb-3">
          <img 
            src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-sm text-gray-500 mb-1 text-start">Account name</p>
        <h1 className="text-2xl font-bold text-start">Event title</h1>
      </div>
      
      <div className="flex items-center mb-4">
        <Clock size={16} className="text-gray-400 mr-2" />
        <span className="text-sm">30 min</span>
      </div>
      
      <div className="flex items-start">
        <MessageSquare size={16} className="text-gray-400 mr-2 mt-1" />
        <p className="text-sm text-start text-gray-600">
          Web conferencing details provided upon confirmation.
        </p>
      </div>
      
      <div className="flex mt-auto">
        <button className="text-sm text-blue-600 hover:text-blue-800 transition-colors duration-200">
          Cookie settings
        </button>
      </div>
    </div>
  );
};

export default EventDetails;