import { RecorderStatus } from "@Components/Interview/RecorderStatus";
import { IntroCard } from "@Components/Interview/IntroCard";
import { useInterview } from "../../../context/Interview.context";
import { logo_text } from "@AssetsFolder/assets";


const InterviewIntro = () => {
  const { isRecording, isTranscribing } = useInterview();

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="w-full bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <img src={logo_text} alt="Worko" className="h-8 sm:h-10 md:h-12 object-contain" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <RecorderStatus isRecording={isRecording} isTranscribing={isTranscribing} />
        <IntroCard />
      </div>
    </div>
  );
};

export default InterviewIntro;
