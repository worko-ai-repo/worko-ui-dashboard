import { useEffect, useRef, useCallback } from "react";
import { MessageSquare, Mic, Volume2 } from "lucide-react";
import { useInterview } from "@Context/Interview.context";

interface QuestionDisplayProps {
  question: string;
  isCrossQuestion?: boolean;
  onQuestionStartSpeaking?: () => void;
  onQuestionEndSpeaking?: () => void;
}

export const QuestionDisplay = ({
  question,
  isCrossQuestion,
  onQuestionStartSpeaking,
  onQuestionEndSpeaking,
}: QuestionDisplayProps) => {
  const lastSpokenQuestionRef = useRef<string>("");
  const onStartRef = useRef(onQuestionStartSpeaking);
  const onEndRef = useRef(onQuestionEndSpeaking);
  const { isTranscribing, transcript, aiName } = useInterview();

  // Update refs when callbacks change
  useEffect(() => {
    onStartRef.current = onQuestionStartSpeaking;
    onEndRef.current = onQuestionEndSpeaking;
  }, [onQuestionStartSpeaking, onQuestionEndSpeaking]);

  useEffect(() => {
    // Only speak if the question has changed and hasn't been spoken yet
    if (question && question !== lastSpokenQuestionRef.current && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onstart = () => {
        onStartRef.current?.();
      };

      utterance.onend = () => {
        onEndRef.current?.();
      };

      utterance.onerror = () => {
        onEndRef.current?.();
      };

      // Small delay to ensure proper speech synthesis
      setTimeout(() => {
        window.speechSynthesis.speak(utterance);
        // Mark this question as spoken immediately
        lastSpokenQuestionRef.current = question;
      }, 300);
    }

    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [question]); // Only depend on question, not the callbacks

  return (
    <div className="flex flex-col gap-1 h-[300px] max-h-[300px] overflow-y-auto pb-4">
      {/* AI Message Bubble */}
      <div className="flex justify-start ">
        <div className="max-w-2xl">
          <div className="flex items-end gap-2 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                <MessageSquare className="w-3 h-3 text-white" />
              </div>
              <span className="text-xs font-semibold text-gray-700">{aiName}</span>
            </div>
          </div>
          <div className="bg-blue-100 text-gray-900 rounded-2xl rounded-tl-none px-4 py-1 border border-blue-200 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold text-left leading-relaxed">{question}</p>
            {!isTranscribing && <div className="flex items-center gap-2 mt-1 pt-1 border-t border-blue-200">
              <Volume2 className="w-3 h-3 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">AI is speaking</span>
            </div>}
          </div>
          <span className="text-xs text-left text-gray-500 mt-1 block">
            {isCrossQuestion ? "Follow-up Question" : "Interview Question"}
          </span>
        </div>
      </div>

      {/* User Transcript Bubble */}
      {isTranscribing && transcript && (
        <div className="flex justify-end">
          <div className="max-w-2xl text-right">
            <div className="flex items-end gap-2 mb-1 justify-end">
              <span className="text-xs font-semibold text-gray-700">You</span>
            </div>
            <div className="bg-green-100 text-gray-900 rounded-2xl rounded-tr-none px-4 py-3 border border-green-200 shadow-sm">
              <div className="flex items-end gap-2">
                <div className="p-1.5 bg-green-200 rounded-full mt-0.5 flex-shrink-0">
                  <Mic className="w-3 h-3 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-600 mb-1">Live Transcript</p>
                  <p className="text-xs text-gray-700 font-medium leading-relaxed ">{transcript}</p>
                </div>
              </div>
            </div>
            <span className="text-xs text-gray-500 mt-1 block text-right">Recording...</span>
          </div>
        </div>
      )}
    </div>
  );
};
