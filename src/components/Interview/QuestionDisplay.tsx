import { useEffect, useRef, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@Components/ui/card";
import { MessageSquare, Volume2 } from "lucide-react";

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
    <Card className="mb-6 bg-white border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-xl text-black">
              {isCrossQuestion ? "Follow-up Question" : "Interview Question"}
            </CardTitle>
          </div>
          <Volume2 className="w-5 h-5 text-gray-600" />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-lg leading-relaxed text-black">{question}</p>
      </CardContent>
    </Card>
  );
};
