
import React, { useState } from "react";
import NoDataPresent from "./NoDataPresent";
import { parseScorePoints } from "@Utils/DetailedAnalysis.utils";

interface ScorePoint {
  heading: string;
  detail?: string | null;
  type?: "positive" | "negative";
}

export interface ScorePointsModalProps {
  title: string;
  data: unknown;
  matchingScore: number;
  details?: boolean;
  showCloseButton?: boolean;
  onClose?: () => void;
}

const ScorePointsModal: React.FC<ScorePointsModalProps> = ({ title, data, matchingScore, details = true, showCloseButton = false, onClose }) => {
  
  if(!data) return <NoDataPresent />;
   const scorePoints: ScorePoint[] = parseScorePoints(data);

  return (
    <section className="rounded-md">
      <article className="w-full h-full">
        <div className="rounded-xl bg-slate-900/96 backdrop-blur-sm h-full w-full p-12 lg:p-14">
          {/* Title */}
          <header className="flex justify-center text-center">
            <h6 className="text-xl underline mt-2 text-gray-600 font-semibold">{title}</h6>
          </header>

          {/* Timeline Content */}
          <section className="mt-8 w-full">
            {details && (
              <div className="flex justify-center">
                <ol className={`relative ml-5 pl-5 border-l-2 ${title.toLowerCase().includes("rejected") ? "border-red-600" : "border-blue-600"}`}>
                  {scorePoints.map((point, index) => {
                    const isNegativeItem = point.type === "negative" || title.toLowerCase().includes("rejected");
                    const isPositiveItem = point.type === "positive";

                    return (
                      <li key={index} className="relative mb-6 last:mb-0">
                        {/* Timeline Marker */}
                        <span className={`absolute -left-7 top-2 w-3.5 h-3.5 rounded-full border-2 border-white z-10 ${isNegativeItem ? "bg-red-500" : isPositiveItem ? "bg-green-500" : "bg-blue-600"}`} />

                        {/* Timeline Content */}
                        <div className={`border ml-2.5 p-4 rounded-lg ${isNegativeItem ? "bg-red-500/10 border-l-4 border-red-500" : isPositiveItem ? "bg-green-500/10" : "bg-white/5"}`}>
                          <h5 className={`text-base font-semibold mb-1.5 ${isNegativeItem ? "text-red-500" : isPositiveItem ? "text-green-500" : "text-white"}`}>
                            {index + 1}. {point.heading}
                          </h5>
                          {point.detail && <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line m-0">{point.detail}</p>}
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </section>

          {/* Close Button */}
          {showCloseButton && (
            <footer className="mt-8 w-full flex justify-center">
              <button className="rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors duration-200 w-full lg:w-2/5 border-none text-base h-11 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900" onClick={onClose} tabIndex={-1}>
                Close
              </button>
            </footer>
          )}
        </div>
      </article>
    </section>
  );
};

export default ScorePointsModal;
