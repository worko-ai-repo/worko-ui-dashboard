import { ChevronDown, Send, X } from "lucide-react";
import { useState } from "react";

const HelpModal = ({ isOpen, onClose }: {isOpen:any, onClose:any}) => {
    const [isClosing, setIsClosing] = useState(false);
  
    const handleClose = () => {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 300);
    };
  
    if (!isOpen && !isClosing) return null;
  
    return (
      <div className="fixed inset-0 z-50 pointer-events-none">
        <div className="absolute top-4 right-4 pointer-events-auto">
          <div 
            className={`w-[500px] bg-white rounded-2xl p-6 space-y-4 font-sans shadow-2xl border ${
              isClosing 
                ? 'animate-slide-out' 
                : 'animate-slide-in'
            }`}

          >
            {/* Close button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-black">
                How can we help you?
              </h2>
              <button 
                onClick={handleClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            {/* Form Fields */}
            <div className="space-y-4">
              {/* Choose your reason dropdown */}
              <div className="relative">
                <div className="w-full h-12 border border-black rounded-xl flex items-center px-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-600 flex-1">Choose your reason</span>
                  <ChevronDown className="w-5 h-5 text-black" />
                </div>
              </div>
              
              {/* Request header dropdown */}
              <div className="relative">
                <div className="w-full h-12 border border-black rounded-xl flex items-center px-4 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
                  <span className="text-sm text-gray-600 flex-1">Request header</span>
                  <ChevronDown className="w-5 h-5 text-black" />
                </div>
              </div>
              
              {/* Text area */}
              <div className="relative">
                <textarea 
                  className="w-full h-20 bg-gray-100 rounded-xl p-4 text-sm resize-none border-none outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Write in details"
                />
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="flex justify-start pt-2">
              <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-semibold text-sm tracking-wide transition-colors">
                <Send className="w-4 h-4" />
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  export default HelpModal;