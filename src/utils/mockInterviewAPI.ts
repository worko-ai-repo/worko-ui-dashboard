export interface InterviewAPIResponse {
    nextQuestion: string | null;
    crossQuestion?: string | null;
    isFinal: boolean;
    acknowledgement?: string;
    transcripts?: Array<{ question: string; answer: string; timestamp: number }>;
  }
  
  const questions = [
    "Tell me about yourself.",
    "Describe a recent project you worked on.",
    "What was the biggest challenge you faced in your career?",
    "Why should we hire you?",
    "Where do you see yourself in five years?",
    "What are your greatest strengths and weaknesses?",
    "Tell me about a time you demonstrated leadership.",
    "How do you handle pressure and tight deadlines?",
  ];
  
  const crossQuestions = [
    "Can you elaborate on that?",
    "What was the outcome of that situation?",
    "How did that experience shape your approach?",
    "What would you do differently?",
    "Can you give me a specific example?",
  ];
  
  const closingMessages = [
    "Thank you for your time today. We'll be in touch soon.",
    "That concludes our interview. We appreciate you taking the time to speak with us.",
    "Thank you for sharing your experiences with us today.",
    "We've covered everything we needed. Thank you for your thoughtful responses.",
    "That wraps up our conversation. We'll reach out with next steps.",
  ];
  
  let questionIndex = 0;
  let currentAskedQuestion = '';
  const storedTranscripts: Array<{ question: string; answer: string; timestamp: number }> = [];
  
  export const mockInterviewAPI = (
    transcript?: string,
    timestamp?: number
  ): InterviewAPIResponse => {
    if (transcript && timestamp !== undefined && currentAskedQuestion) {
      storedTranscripts.push({
        question: currentAskedQuestion,
        answer: transcript,
        timestamp,
      });
    }
  
    const shouldAddCrossQuestion = Math.random() > 0.7;
    const crossQ = shouldAddCrossQuestion
      ? crossQuestions[Math.floor(Math.random() * crossQuestions.length)]
      : null;
  
    const acknowledgement =
      timestamp && timestamp > 13 * 60 * 1000
        ? "We're nearing the end of your interview."
        : "";
  
    if (questionIndex >= questions.length) {
      return {
        nextQuestion: null,
        isFinal: true,
        acknowledgement:
          closingMessages[Math.floor(Math.random() * closingMessages.length)],
        transcripts: storedTranscripts,
      };
    }
  
    const nextQuestion = questions[questionIndex];
    questionIndex++;
  
    if (crossQ && questionIndex < questions.length) {
      currentAskedQuestion = crossQ;
      return {
        nextQuestion: crossQ,
        crossQuestion: crossQ,
        isFinal: false,
        acknowledgement,
      };
    }
  
    const isFinal = questionIndex >= questions.length;
    currentAskedQuestion = nextQuestion;
  
    return {
      nextQuestion: isFinal ? null : nextQuestion,
      isFinal,
      acknowledgement: isFinal
        ? closingMessages[Math.floor(Math.random() * closingMessages.length)]
        : acknowledgement,
      transcripts: isFinal ? storedTranscripts : undefined,
    };
  };
  
  export const resetInterviewAPI = () => {
    questionIndex = 0;
    currentAskedQuestion = '';
    storedTranscripts.length = 0;
  };
  