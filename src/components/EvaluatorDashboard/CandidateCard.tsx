import React from "react";
import {
  FileText,
  Play,
  Linkedin,
  Github,
  Globe,
  Building2,
  Briefcase,
  Calendar,
  Mail,
  Video,
  SendIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { toTitleCase } from "@Utils/Titlecase.utils";
import { formatObjectForDisplay } from "@Utils/FormatText.utils";

interface CandidateCardProps {
  item: any;
  onViewCV?: (req?: any,cand?:any) => void;
  onSubmitFeedback?: (req?: any,cand?:any) => void;
  onViewFeedback?: (req?: any,cand?:any) => void;
  onViewInterview?: (interviewDetails: any, name: string) => void;

  expandedCard: string | null;
  expandedSection: "about" | "worko" | "note" | null;
  setExpandedCard: (id: string | null) => void;
  setExpandedSection: (section: "about" | "worko" | "note" | null) => void;
  setJobApplicationIdFromChild : (data:string) => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({
  item,
  onViewCV,
  onSubmitFeedback,
  onViewFeedback,
  onViewInterview,
  expandedCard,
  expandedSection,
  setExpandedCard,
  setExpandedSection,
  setJobApplicationIdFromChild,
}) => {
  const details = item.details;
  const candidate = item.candidate || {};
  const application = item.application || {};
  const social = candidate.social || {};
  const interviewDetails = item.interviewDetails || null;
  const isAlreadyRequested = item.isAlreadyRequested || false;
  const cardId = item.request.id;
  const evaluationDate = application?.statusTracker?.slice().reverse().find((item:any) => item.newStatus === "UNDER_EVALUATION")?.actionDate;
  const formattedEvaluationDate = evaluationDate? new Date(evaluationDate).toLocaleString("en-GB", {timeZone:"Asia/Kolkata",}): "N/A";
  // Determine if this card is the one expanded globally
  const isThisCardOpen = expandedCard === cardId;

  // Toggle a specific section inside this card
  const toggleExpand = (section: "about" | "worko" | "note") => {
    if (isThisCardOpen && expandedSection === section) {
      setExpandedSection(null);
      setExpandedCard(null);
    } else {
      setExpandedCard(cardId);
      setExpandedSection(section);
    }
  };

  const getPlainPreviewText = () => {
  let data = application.scoreDetails || application.rejectionFeedbackBySystem;

  if (!data) return "No feedback provided.";

  if (Array.isArray(data)) {
    return data.map(d => `${d.heading}: ${d.detail}`).join(" ");
  }

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);

      const parts: string[] = [];

      if (parsed?.RecruiterNote) {
        parts.push(parsed.RecruiterNote);
      }

      if (Array.isArray(parsed?.Strengths)) {
        parts.push(...parsed.Strengths);
      }

      if (Array.isArray(parsed?.AreasOfConcern)) {
        parts.push(...parsed.AreasOfConcern);
      }

      return parts.length > 0
        ? parts.join(" ")
        : "No feedback provided.";
    } catch (err) {
      console.error("Preview JSON parse failed:", err);
      return "No feedback provided.";
    }
  }

  return "No feedback provided.";
  };

  const renderWorkoContent = () => {
  let data = application.scoreDetails || application.rejectionFeedbackBySystem;

  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data);
      const converted: any[] = [];

      if (parsed.RecruiterNote) {
        converted.push({
          heading: "Recruiter Note",
          detail: parsed.RecruiterNote,
        });
      }

      if (Array.isArray(parsed.Strengths)) {
        converted.push({
          heading: "Strengths",
          detail: parsed.Strengths.join("\n• "),
        });
      }

      if (Array.isArray(parsed.AreasOfConcern)) {
        converted.push({
          heading: "Areas Of Concern",
          detail: parsed.AreasOfConcern.join("\n• "),
        });
      }

      data = converted;
    } catch {}
  }

  if (Array.isArray(data)) {
    return (
      <div className="space-y-4">
        {data.map((score, index) => (
          <div key={index} className="flex items-start gap-3">
            <div
              className="mt-2 w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: "#316BFF" }}
            />
            <div className="text-slate-800">
              <span className="font-semibold">{score.heading}</span> —{" "}
              {score.detail}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <p className="whitespace-pre-line">
      {data || "No feedback provided."}
    </p>
  );
  };

  const hasValidInterview =
    interviewDetails &&
    interviewDetails.interviewHistory &&
    interviewDetails.interviewHistory.length > 0;

  const socialIcons: any = {
    linkedin: (
      <div className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-600">
        <Linkedin className="w-4 h-4 text-blue-600" />
      </div>
    ),
    github: (
      <div className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-600">
        <Github className="w-4 h-4 text-blue-600" />
      </div>
    ),
    website: (
      <div className="w-7 h-7 flex items-center justify-center rounded-full border border-blue-600">
        <Globe className="w-4 h-4 text-blue-600" />
      </div>
    ),
  };

  const renderExpandIcon = (open: boolean) =>
    open ? (
      <ChevronUp className="w-4 h-4 text-slate-600 cursor-pointer" />
    ) : (
      <ChevronDown className="w-4 h-4 text-slate-600 cursor-pointer" />
    );

  return (
    <div className="bg-white rounded-xl shadow border border-slate-200 p-6 space-y-3">
        
    {/* Header */}
    <div className="flex flex-wrap justify-between gap-4">

    {/* Left side */}
    <div className="flex gap-4 min-w-[250px] flex-1">
        <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
            <img className="w-16 h-16" src={candidate?.profileImageAwsS3SignedUrl} alt="" />
        </div>

        <div className="flex-1">
        {/* Name + Dates on the SAME ROW */}
        <div className="flex flex-wrap justify-between items-center w-full">
            <h2 className="text-left text-[20px] font-semibold text-slate-900">
            {candidate?.name ? toTitleCase(candidate.name) : "Candidate"}
            </h2>

            {/* Dates */}
            <div className="flex items-center gap-3 text-[12px] text-slate-600">
            <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-800">Application:</span>
                {application?.createdAt
                ? new Date(application.createdAt).toLocaleString("en-GB", {
                    timeZone: "Asia/Kolkata",
                    })
                : "N/A"}
            </div>

            <span className="text-slate-400">•</span>

            <div className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-slate-500" />
                <span className="font-medium text-slate-800">Evaluation Sent:</span>
                {formattedEvaluationDate?? "N/A"}
            </div>
            </div>
        </div>

        {/* Company */}
        {application?.companyName && (
            <p className="flex items-center gap-1 text-left text-[12px] text-slate-600">
            <Building2 className="w-4 h-4 text-slate-500" />
            {application?.companyName}
            </p>
        )}

        {/* Role */}
        {details?.jobTitle && (
            <p className="flex items-center gap-1 text-left text-[12px] text-slate-600">
            <Briefcase className="w-4 h-4 text-slate-500" />
            {details.jobTitle}
            </p>
        )}

        {/* Social Icons */}
        <div className="flex gap-3 mt-2">
            {Object.entries(social)
            .filter(([key, val]: [string, any]) => Array.isArray(val) && val[0]?.trim())
            .map(([key, val]: [string, any]) => (
                <a key={key} href={val[0]} target="_blank">
                {socialIcons[key.toLowerCase()] || socialIcons["website"]}
                </a>
            ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-2">
            <button
            onClick={() => onViewCV?.(item.request, item.candidate)}
            className="p-2 bg-[#316BFF] text-white rounded-lg flex items-center gap-2 text-[10px]"
            >
            <FileText className="w-4 h-4" />
            View CV
            </button>

            {hasValidInterview && !isAlreadyRequested && (
            <button
                onClick={() =>
                onViewInterview?.(interviewDetails, candidate.name || "")
                }
                className="p-2 bg-red-600 text-white rounded-lg flex items-center gap-2 text-[10px]"
            >
                <Video className="w-4 h-4" />
                View Video Interview
            </button>
            )}

            {item.request?.evaluationResponseId ? (
            <button
                onClick={() => onViewFeedback?.(item.request, item.candidate)}
                className="p-2 bg-green-600 text-white rounded-lg text-[10px]"
            >
                View Feedback
            </button>
            ) : (
            <button
                onClick={() => onSubmitFeedback?.(item.request, item.candidate)}
                className="p-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-[10px]"
            >
                <SendIcon className="w-4 h-4" />
                Submit Feedback
            </button>
            )}
        {item.canViewInterview && (
        <button
          onClick={() =>{
            onViewInterview?.(interviewDetails, candidate.name || "")
            setJobApplicationIdFromChild(item?.request?.jobApplicationId)
          }
          }
          className="p-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 text-[10px]"
        >
          View Interview
        </button>
        )}
        </div>
        </div>
    </div>
    </div>


      {/* ----------------------------- */}
      {/* About Section */}
      {/* ----------------------------- */}
      <hr />
      <div onClick={() => toggleExpand("about")} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:cursor-pointer">
        <div className="flex justify-between items-center">
          <h3 className="text-left text-[13px] font-semibold text-slate-800">
            About
          </h3>

          <div>
            {renderExpandIcon(isThisCardOpen && expandedSection === "about")}
          </div>
        </div>

        <p
          className={`text-left text-[12px] text-slate-700 ${
            isThisCardOpen && expandedSection === "about"
              ? ""
              : "line-clamp-1"
          }`}
        >
          {candidate?.about || "N/A"}
        </p>
      </div>

      {/* ----------------------------- */}
      {/* Worko Feedback */}
      {/* ----------------------------- */}
      <div onClick={() => toggleExpand("worko")} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 hover:cursor-pointer">
        <div  className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-slate-800">
              Worko Feedback
            </span>
            {Number(application?.matchingScore) > 0 &&
            <span className="text-[12px] bg-yellow-200 px-2 py-[2px] rounded text-slate-800 font-semibold">
              ⭐ {application.matchingScore}/100
            </span>
            }
          </div>

          <div>
            {renderExpandIcon(isThisCardOpen && expandedSection === "worko")}
          </div>
        </div>

        <div className="text-left text-[12px] text-slate-700">
        {isThisCardOpen && expandedSection === "worko" ? (
            renderWorkoContent()
        ) : (
            <p className="line-clamp-1">
            {getPlainPreviewText()}
            </p>
        )}
        </div>
      </div>

      {/* ----------------------------- */}
      {/* Recruiter's Note */}
      {/* ----------------------------- */}
      <div onClick={() => toggleExpand("note")} className="bg-blue-50 border border-blue-200 rounded-lg p-3 hover:cursor-pointer">
        <div className="flex justify-between items-center">
          <h3 className="text-left text-[13px] font-semibold text-slate-800">
            Recruiter's Note
          </h3>

          <div>
            {renderExpandIcon(isThisCardOpen && expandedSection === "note")}
          </div>
        </div>

        <p
          className={`text-left text-[12px] text-slate-700 ${
            isThisCardOpen && expandedSection === "note"
              ? ""
              : "line-clamp-1"
          }`}
        >
          {details?.hrDetailedFeedback ||
            "No feedback provided."}
        </p>
      </div>

      {/* ----------------------------- */}
      {/* Scores */}
      {/* ----------------------------- */}
      {hasValidInterview && !isAlreadyRequested && (
        <div className="bg-cyan-100 border rounded-lg p-3">
          <h3 className="text-left text-[13px] font-semibold text-gray-700">
            Scores:
          </h3>

          <div className="flex flex-wrap gap-4">
            {formatObjectForDisplay(
              interviewDetails?.scoreBreakdown || {}
            ).map(({ label, value }, index) => (
              <div key={index}>
                <span className="text-[13px] font-semibold text-gray-600 mr-2">
                  {label}:
                </span>
                <span className="text-[12px] text-blue-500 font-semibold">
                  {value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default CandidateCard;