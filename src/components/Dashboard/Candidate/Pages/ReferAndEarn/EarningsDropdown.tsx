import { FunctionComponent } from 'react';

const EarningsDropdown: FunctionComponent = () => {
  return (
    <div className="w-full relative h-44 text-left text-sm text-white font-sans">
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          {/* Gradient background */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400" />
          
          {/* Top section with total earnings */}
          <div className="absolute top-5 left-6 flex flex-row items-center justify-start gap-8">
            <div className="font-semibold leading-5">Total earning:</div>
            <div className="w-28 rounded-lg bg-gray-100 border border-gray-300 h-8 flex items-center px-3 text-lg text-blue-600">
              <div className="flex items-center gap-0.5">
                <span className="text-blue-600 font-bold">Rs.</span>
                <div className="font-semibold leading-5">10,000</div>
              </div>
            </div>
          </div>
          
          {/* Middle section with potential earnings */}
          <div className="absolute top-20 left-6 flex flex-row items-center justify-start">
            <div className="flex flex-row items-center gap-4">
              <div className="font-semibold leading-5">Potential earning</div>
              <div className="w-28 rounded-lg bg-teal-300 border border-gray-300 h-8 flex items-center px-3 text-lg text-blue-700">
                <div className="flex items-center gap-0.5">
                  <span className="text-blue-700 font-bold">Rs.</span>
                  <div className="font-semibold leading-5">2,000</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom section with divider and expand button */}
          <div className="absolute bottom-4 left-6 right-6">
            <div className="border-t border-white w-full mb-1" />
            <div className="flex justify-center items-center text-xs">
              <div className="leading-5 mr-1">Expand</div>
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 9l-7 7-7-7" 
                />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EarningsDropdown;