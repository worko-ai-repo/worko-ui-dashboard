import React, { FC } from 'react';

interface UnderConstructionProps {
	text?:string;
	path?:string;
}

const UnderConstruction: FC<UnderConstructionProps>= ({text,path}) => {
	return (
			<div className="w-full flex flex-col items-center justify-center min-h-screen ">
				<h1 className="text-5xl text-blue-500 font-bold mb-8 animate-pulse">Coming Soon</h1>
				<p className="text-blue-500 text-lg mb-8">
					{text?.trim() 
					? text?.trim()
					: "We're working hard to bring you something amazing. Stay tuned!"}
				</p>
				<button 
				className="btn_t1 bg-blue-500 border text-white" 
				onClick={() => window.location.href = path?.trim() ? path?.trim() : '/'}
				>
					Back to Home
				</button>
			</div>
		
	);
};

export default UnderConstruction;
