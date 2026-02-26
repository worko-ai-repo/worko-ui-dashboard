import { useState } from 'react';
import WithdrawDialog from './WithdrawDialog';

  
  const EarningsCard = () => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showDialog, setShowDialog] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  if (!isExpanded) {
    // Collapsed state
    return (
      <div className="w-full max-w-sm mx-auto relative rounded-2xl p-6 text-white font-medium" style={{background: 'linear-gradient(-44.59deg, #316bff, #5fc9ff)'}}>
        <div className="space-y-4">
          {/* Total earning */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Total earning:</span>
            <div className="border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-1" style={{backgroundColor: '#f6f6f6', borderColor: '#c0b7b7'}}>
              
              <span className="font-semibold text-lg" style={{color: '#316bff'}}>Rs. 10,000</span>
            </div>
          </div>

          {/* Potential earning */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Potential earning:</span>
            <div className="border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-1" style={{backgroundColor: '#57e1e1', borderColor: '#c0b7b7'}}>
              
              <span className="font-semibold text-lg" style={{color: '#0048ff'}}>Rs. 2,000</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-white/50 mt-6 pt-3">
          <button 
            onClick={toggleExpanded}
            className="flex items-center justify-center w-full hover:opacity-80 transition-opacity duration-200"
          >
            <span className="text-sm mr-2">Expand</span>
            <svg 
              width="15" 
              height="8" 
              viewBox="0 0 15 8" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-300"
            >
              <path d="M1 1L7.5 7L14 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  // Expanded state
  return (
    <div className="w-full max-w-sm mx-auto relative rounded-2xl p-6 text-white font-medium" style={{background: 'linear-gradient(-44.59deg, #316bff, #5fc9ff)'}}>
      <div className="space-y-4">
        {/* Total earning */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Total earning:</span>
          <div className="border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-1" style={{backgroundColor: '#f6f6f6', borderColor: '#c0b7b7'}}>
            
            <span className="font-semibold text-lg" style={{color: '#316bff'}}>Rs. 10,000</span>
          </div>
        </div>

        {/* Withdrawal amount */}
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">
            <div>Withdrawal</div>
            <div>amount:</div>
          </div>
          <div className="border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-1" style={{backgroundColor: '#f6f6f6', borderColor: '#c0b7b7'}}>
            
            <span className="font-semibold text-lg" style={{color: '#316bff'}}>Rs. 2,000</span>
          </div>
        </div>

        {/* Pending amount */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Pending amount:</span>
          <div className="border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-1" style={{backgroundColor: '#f6f6f6', borderColor: '#c0b7b7'}}>
            
            <span className="font-semibold text-lg" style={{color: '#316bff'}}>Rs. 2,000</span>
          </div>
        </div>

        {/* Withdraw button */}
        <div className="flex justify-center pt-2">
          <button 
          // onClick={()=>setShowDialog(true)}
          className="text-black font-semibold px-6 py-2 rounded-lg shadow-lg hover:opacity-90 transition-opacity duration-200 border-transparent" style={{backgroundColor: '#fff', borderColor: 'rgba(0, 0, 0, 0)'}}>
            Withdraw
          </button>
        </div>

        {/* Divider */}
        <div className="border-t border-white/50 pt-3">
          <button 
            onClick={toggleExpanded}
            className="flex items-center justify-center w-full hover:opacity-80 transition-opacity duration-200"
          >
            <span className="text-sm mr-2">Collapse</span>
            <svg 
              width="15" 
              height="8" 
              viewBox="0 0 15 8" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform duration-300 rotate-180"
            >
              <path d="M1 1L7.5 7L14 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Potential earning */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">Potential earning</span>
          <div className="border border-gray-300 rounded-lg px-3 py-1 flex items-center gap-1" style={{backgroundColor: '#57e1e1', borderColor: '#c0b7b7'}}>
            
            <span className="font-semibold text-lg" style={{color: '#0048ff'}}>Rs. 2,000</span>
          </div>
        </div>
      </div>
              <WithdrawDialog
        isOpen={showDialog}
        onClose={() => setShowDialog(false)}
        // referral={selectedReferral}
        // statusData={statusData}
      />
    </div>
  );
};

export default EarningsCard;