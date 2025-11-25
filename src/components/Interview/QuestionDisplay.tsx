import { useEffect, useRef, useState } from "react";
import { MessageSquare, Mic, Volume2, VolumeX } from "lucide-react";
import { useInterview } from "@Context/Interview.context";

interface QuestionDisplayProps {
  question: string;
  isCrossQuestion?: boolean;
  onQuestionStartSpeaking?: () => void;
  onQuestionEndSpeaking?: () => void;
  onStartListening?: () => void;
}

// Preferred voice configuration - Primary voice that works best
const PREFERRED_VOICE_NAME: string = "Google हिन्दी"; // Primary preferred voice

// Helper function to get the best available voice
const getBestVoice = (): SpeechSynthesisVoice | null => {
  if (!("speechSynthesis" in window)) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Priority 1: Use preferred voice by exact name match (primary voice)
  if (PREFERRED_VOICE_NAME && PREFERRED_VOICE_NAME.trim() !== "") {
    const preferredVoice = voices.find(
      (voice) => voice.name === PREFERRED_VOICE_NAME || voice.voiceURI === PREFERRED_VOICE_NAME
    );
    if (preferredVoice) {
      return preferredVoice;
    }
  }

  // Priority 2: Fallback to female voices (often sound more natural for TTS)
  const femaleVoice = voices.find(
    (voice) =>
      voice.name.toLowerCase().includes("female") ||
      voice.name.toLowerCase().includes("zira") ||
      voice.name.toLowerCase().includes("hazel") ||
      voice.name.toLowerCase().includes("arya") ||
      voice.name.toLowerCase().includes("neha")
  );

  if (femaleVoice) return femaleVoice;

  // Priority 3: Natural/Neural voices (usually better quality)
  const neuralVoice =
    voices.find((voice) => voice.name.toLowerCase().includes("neural")) ||
    voices.find((voice) => voice.name.toLowerCase().includes("premium")) ||
    voices.find((voice) => voice.name.toLowerCase().includes("natural"));

  if (neuralVoice) return neuralVoice;

  // Priority 4: Indian English voices
  const indianVoice = voices.find(
    (voice) =>
      voice.lang.toLowerCase().includes("in") ||
      voice.name.toLowerCase().includes("india") ||
      voice.name.toLowerCase().includes("indian")
  );

  if (indianVoice) return indianVoice;

  // Priority 5: English voices (any variant)
  const englishVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith("en"));

  if (englishVoice) return englishVoice;

  // Fallback: Default voice
  return voices[0];
};

export const QuestionDisplay = ({
  question,
  isCrossQuestion,
  onQuestionStartSpeaking,
  onQuestionEndSpeaking,
  onStartListening,
}: QuestionDisplayProps) => {
  const lastSpokenQuestionRef = useRef<string>("");
  const onStartRef = useRef(onQuestionStartSpeaking);
  const onEndRef = useRef(onQuestionEndSpeaking);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [voicesLoaded, setVoicesLoaded] = useState(!("speechSynthesis" in window));
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { isTranscribing, transcript, aiName } = useInterview();

  // Load voices when component mounts
  useEffect(() => {
    const loadVoices = () => {
      if ("speechSynthesis" in window) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setSelectedVoice(getBestVoice());
          setVoicesLoaded(true);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      if (!voicesLoaded) {
        setSelectedVoice(getBestVoice());
        setVoicesLoaded(true);
      }
    }, 1000);

    // Load voices immediately
    loadVoices();

    // Some browsers load voices asynchronously
    if ("speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      window.clearTimeout(timeoutId);
      if ("speechSynthesis" in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [voicesLoaded]);

  // Update refs when callbacks change
  useEffect(() => {
    onStartRef.current = onQuestionStartSpeaking;
    onEndRef.current = onQuestionEndSpeaking;
  }, [onQuestionStartSpeaking, onQuestionEndSpeaking]);

  useEffect(() => {
    // Only speak if the question has changed and hasn't been spoken yet
    if (
      question &&
      voicesLoaded &&
      isNarrationEnabled &&
      question !== lastSpokenQuestionRef.current &&
      "speechSynthesis" in window
    ) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(question);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;

      // Set the selected voice if available
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        // Set language to match voice locale for better pronunciation
        utterance.lang = selectedVoice.lang;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        onStartRef.current?.();
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        onEndRef.current?.();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
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
        setIsSpeaking(false);
      }
    };
  }, [question, selectedVoice, isNarrationEnabled]);

  const toggleNarration = () => {
    if ("speechSynthesis" in window) {
      if (isSpeaking) {
        // Stop current speech
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        onEndRef.current?.();
      }

      const newNarrationState = !isNarrationEnabled;
      setIsNarrationEnabled(newNarrationState);

      // If narration is being disabled, start listening mode
      if (!newNarrationState && onStartListening) {
        // Small delay to ensure speech has fully stopped
        setTimeout(() => {
          onStartListening();
        }, 100);
      }
    }
  };

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
            {/* Narration Toggle Button */}
            <button
              onClick={toggleNarration}
              className="ml-2 p-1.5 rounded-full hover:bg-gray-200 transition-colors"
              title={isNarrationEnabled ? "Disable narration" : "Enable narration"}>
              {isNarrationEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-600" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-500" />
              )}
            </button>
          </div>
          <div className="bg-blue-100 text-gray-900 rounded-2xl rounded-tl-none px-4 py-1 border border-blue-200 shadow-sm">
            <p className="text-sm text-gray-500 font-semibold text-left leading-relaxed">
              {question}
            </p>
            {!isTranscribing && isSpeaking && isNarrationEnabled && (
              <div className="flex items-center gap-2 mt-1 pt-1 border-t border-blue-200">
                <Volume2 className="w-3 h-3 text-blue-600" />
                <span className="text-xs text-blue-600 font-medium">AI is speaking</span>
              </div>
            )}
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
