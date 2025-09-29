import React, { useEffect, useRef, useState } from "react";

/**
 * Small water-globe loader:
 * - svg viewBox 0..200; rendered at ~48px
 * - unique clipId to avoid collisions
 * - water level updated every 5s by +20% (smooth transform transition)
 */
const WaterFillLoader: React.FC = () => {
  const [progress, setProgress] = useState<number>(0); // 0..100
  const idRef = useRef<string>(
    "wf-" + Math.random().toString(36).slice(2, 9)
  );

  useEffect(() => {
    // increase by 20% every 5s until 100%
    const interval = window.setInterval(() => {
      setProgress((p) => {
        const next = Math.min(p + 20, 100);
        if (next >= 100) {
          window.clearInterval(interval);
        }
        return next;
      });
    }, 5000);

    return () => window.clearInterval(interval);
  }, []);

  // SVG coordinate helpers
  const viewSize = 200; // svg viewbox size
  const waterHeight = (progress / 100) * viewSize; // px
  // We will translate the whole water-group up by (viewSize - waterHeight)
  const translateY = Math.round(viewSize - waterHeight); // px
  const clipId = `${idRef.current}-clip`;

  return (
    <div className="flex items-center gap-3 border border-red-700 rounded-3xl p-4">
      <svg
        viewBox={`0 0 ${viewSize} ${viewSize}`}
        width="48"
        height="48"
        className="relative"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        {/* outer border ring */}
        <defs>
          <clipPath id={clipId}>
            <circle cx="100" cy="100" r="90" />
          </clipPath>
          <filter id={`${idRef.current}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.08" />
          </filter>
        </defs>

        {/* background globe (subtle) */}
        <circle cx="100" cy="100" r="90" fill="#ffffff" opacity="0.02" />

        {/* border ring (visible) */}
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="#3b82f6"
          strokeWidth="7"
          fill="none"
          style={{ filter: `url(#${idRef.current}-shadow)` }}
        />

        {/* Clipped water area - we'll move this group vertically to simulate fill level */}
        <g clipPath={`url(#${clipId})`}>
          {/* this group is translated vertically to set visible water height; transitioned for smooth motion */}
          <g
            className="water-group"
            style={{
              transform: `translateY(${translateY}px)`,
              transition: "transform 4.6s cubic-bezier(.2,.8,.2,1)",
            }}
          >
            {/* solid water block (fills entire svg; the group translation reveals the correct portion) */}
            <rect x="0" y="0" width={viewSize} height={viewSize} fill="#3b82f6" />

            {/* Waves on top of the water block. We'll animate these horizontally; they sit near the top of the block. */}
            <g
              className="waves"
              style={{
                // small upward offset so the visible wave sits at the surface
                transform: `translateY(${ -18 }px)`,
              }}
            >
              {/* Wave 1 */}
              <g className="wave wave-1" style={{ transformOrigin: "0 0" }}>
                <path
                  d="M -100 30 
                     C -70 10 -30 10 20 30 
                     C 70 50 110 50 160 30 
                     C 210 10 250 10 300 30 
                     V 120 H -100 Z"
                  fill="#60a5fa"
                  opacity="0.95"
                />
              </g>

              {/* Wave 2 (slower, slight offset) */}
              <g className="wave wave-2" style={{ transformOrigin: "0 0" }}>
                <path
                  d="M -100 40 
                     C -70 20 -30 20 20 40 
                     C 70 60 110 60 160 40 
                     C 210 20 250 20 300 40 
                     V 120 H -100 Z"
                  fill="#93c5fd"
                  opacity="0.7"
                />
              </g>
            </g>
          </g>
        </g>

        {/* Optional small inner glossy highlight */}
        <ellipse cx="85" cy="75" rx="30" ry="10" fill="white" opacity="0.03" />

        {/* (No text inside - percentage will be outside per your request) */}
        {/* End SVG */}

        {/* Inline CSS for wave horizontal motion */}
        <style>{`
          /* animate horizontal translation of each wave group (only translateX) */
          .wave-1 {
            animation: wf-move-1 3.6s linear infinite;
          }
          .wave-2 {
            animation: wf-move-2 5.2s linear infinite;
          }
          @keyframes wf-move-1 {
            0% { transform: translateX(0); }
            100% { transform: translateX(-140px); }
          }
          @keyframes wf-move-2 {
            0% { transform: translateX(0); }
            100% { transform: translateX(-220px); }
          }
        `}</style>
      </svg>

      {/* Percentage outside (to the right) */}
      <div className="text-blue-600 font-semibold text-sm select-none">
        {progress}% done
      </div>
    </div>
  );
};

export default WaterFillLoader;
