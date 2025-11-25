import { useEffect, useState } from "react";

interface SmallGaugeProps {
  score?: number; // Score between 0 and 100
  size?: number; // Size of the gauge (default: 60)
  strokeWidth?: number; // Stroke width of the gauge
}

const SmallGauge: React.FC<SmallGaugeProps> = ({ score, size = 60, strokeWidth = 6 }) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (score !== undefined) {
      setTimeout(() => setProgress(score), 200); // Smooth animation delay
    }
  }, [score]);

  const radius = size / 2 - strokeWidth * 2; // Circle size
  const circumference = 2 * Math.PI * radius; // Full circle length
  const offset = circumference - (progress / 100) * circumference; // Animation logic

  // Determine stroke color based on score
  const getColor = () => {
    if (progress <= 25) return "#ef4444"; // Red
    if (progress <= 50) return "#f97316"; // Orange
    if (progress <= 75) return "#3b82f6"; // Blue
    return "#22c55e"; // Green
  };

  // If score is undefined, show --/--
  if (score === undefined) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-gray-100"
        style={{ width: size, height: size }}>
        <span className="text-xs font-semibold text-gray-400">--/--</span>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}>
      {/* Background Circle */}
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Animated Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      {/* Score Text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-semibold text-gray-900">{Math.round(progress)}%</span>
      </div>
    </div>
  );
};

export default SmallGauge;
