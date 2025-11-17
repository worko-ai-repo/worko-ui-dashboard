import { useInterview } from "@Context/Interview.context";
import React, { useEffect, useRef } from "react";
import { AI_agent } from "@AssetsFolder/assets";
const InterviewAIAgent: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const animationRef = useRef<number | null>(null);
  const { isTranscribing, aiName } = useInterview();
  const isSpeaking = !isTranscribing;

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const SIZE = 400;
    const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
    const CENTER = SIZE / 2;
    const totalDots = 600;
    const dotRadius = 2;
    const margin = 2;
    const MAX_RADIUS = CENTER - margin - dotRadius;

    // Clear existing content
    svg.innerHTML = "";

    // Generate dots in golden spiral
    for (let i = 0; i < totalDots; i++) {
      const idx = i + 0.5;
      const frac = idx / totalDots;
      const r = Math.sqrt(frac) * MAX_RADIUS;
      const theta = idx * GOLDEN_ANGLE;
      const x = CENTER + r * Math.cos(theta);
      const y = CENTER + r * Math.sin(theta);

      // Create circle
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", x.toString());
      circle.setAttribute("cy", y.toString());
      circle.setAttribute("r", dotRadius.toString());
      circle.setAttribute("fill", "#3b82f6");
      circle.setAttribute("opacity", "0.3");
      circle.dataset.frac = frac.toString();
      circle.dataset.originalR = dotRadius.toString();

      svg.appendChild(circle);
    }
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = svgRef.current;
    const circles = svg.querySelectorAll("circle");
    const duration = 2000;

    if (isSpeaking) {
      let startTime: number | null = null;

      const animate = (timestamp: number): void => {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        const progress = (elapsed % duration) / duration;

        circles.forEach((circle) => {
          const fracStr = circle.dataset.frac;
          const originalRStr = circle.dataset.originalR;

          if (!fracStr || !originalRStr) return;

          const frac = parseFloat(fracStr);
          const originalR = parseFloat(originalRStr);

          const wavePhase = (frac + progress) % 1;
          const wave = Math.sin(wavePhase * Math.PI * 2);

          const scale = 0.5 + (wave * 0.5 + 0.5) * 1;
          const opacity = 0.3 + (wave * 0.5 + 0.5) * 0.7;

          circle.setAttribute("r", (originalR * scale).toString());
          circle.setAttribute("opacity", opacity.toString());

          const colorIntensity = Math.floor(59 + (wave * 0.5 + 0.5) * 88);
          circle.setAttribute("fill", `rgb(${colorIntensity}, ${130 + colorIntensity * 0.3}, 246)`);
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }

      circles.forEach((circle) => {
        const originalRStr = circle.dataset.originalR;
        if (!originalRStr) return;

        const originalR = parseFloat(originalRStr);
        circle.setAttribute("r", originalR.toString());
        circle.setAttribute("opacity", "0.3");
        circle.setAttribute("fill", "#3b82f6");
      });
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking]);

  return (
    <div
      className="ai-agent-container flex flex-col  items-center gap-4 p-6 rounded-lg bg-black border border-blue-200 shadow-lg"
      style={{
        position: "relative",
        isolation: "isolate",
        margin: "0 auto",
      }}>
      {/* Chat bubble header */}
      <div className="w-full flex items-center gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1">
          <div
            className={`w-2 h-2 mb-0.5 rounded-full ${
              isSpeaking ? "bg-blue-500 animate-pulse" : "bg-gray-400"
            }`}
          />
          <span className="text-sm font-semibold text-white">{aiName}</span>
          <span className="text-xs text-gray-200">(AI Interview Assistant)</span>
        </div>
      </div>

      {/* Glow effects when speaking */}
      {isSpeaking && (
        <>
          <div
            style={{
              position: "absolute",
              width: "192px",
              height: "192px",
              borderRadius: "9999px",
              background:
                "radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.2) 40%, transparent 70%)",
              filter: "blur(60px)",
              animation: "pulse 2s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "128px",
              height: "128px",
              borderRadius: "9999px",
              background:
                "radial-gradient(circle, rgba(147, 197, 253, 0.6) 0%, rgba(59, 130, 246, 0.3) 50%, transparent 70%)",
              filter: "blur(40px)",
              animation: "pulse 1.5s ease-in-out infinite",
              pointerEvents: "none",
            }}
          />
        </>
      )}

      {/* Spiral dot animation or AI agent image */}
      <div style={{ position: "relative", zIndex: 10 }}>
        {isSpeaking ? (
          <svg
            ref={svgRef}
            width="160"
            height="160"
            viewBox="0 0 400 400"
            style={{
              display: "block",
              filter: "drop-shadow(0 0 20px rgba(59, 130, 246, 0.5))",
              transition: "filter 0.3s ease",
            }}
          />
        ) : (
          <div
            style={{
              width: "160px",
              height: "160px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}>
            <img
              src={AI_agent}
              alt="AI Agent"
              style={{
                width: "160px",
                height: "200px",
                objectFit: "cover",
              }}
            />
          </div>
        )}
      </div>

      {/* Status indicator with message */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: isSpeaking ? "#dbeafe" : "#f3f4f6",
            padding: "8px 16px",
            borderRadius: "20px",
            border: isSpeaking ? "1px solid #93c5fd" : "1px solid #e5e7eb",
          }}>
          <div
          className="animate-pulse "
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "9999px",
              backgroundColor: isSpeaking ? "#3b82f6" : "red",
              animation: isSpeaking ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none",
              transform: isSpeaking ? "scale(1.25)" : "scale(1)",
              transition: "all 0.3s ease",
            }}
          />
          <span
            style={{
              color: isSpeaking ? "#1e40af" : "#6b7280",
              fontSize: "13px",
              fontWeight: 500,
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}>
            {isSpeaking ? `${aiName} is speaking...` : `${aiName} is listening...`}
          </span>
        </div>
      </div>

      {/* Add keyframes for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        /* Override global transition for SVG elements */
        .ai-agent-container svg,
        .ai-agent-container svg * {
          transition: none !important;
        }
        
        /* Keep transitions only for buttons and status indicator */
        .ai-agent-container button {
          transition: all 0.3s ease !important;
        }
      `}</style>
    </div>
  );
};

export default InterviewAIAgent;
