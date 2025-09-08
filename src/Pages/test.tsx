import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Mic, MicOff, ChevronDown, Send, RotateCcw, AlertCircle } from 'lucide-react';
import { useSpeechRecognition } from '@Hooks/useSpeechSynthesis.hook';


interface FormData {
  reason: string;
  userComment: string;
}

const SpeechToTextForm: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<FormData>({
    defaultValues: {
      reason: '',
      userComment: '',
    },
    mode: 'onChange',
  });

  const selectedReason = watch('reason');
  const currentComment = watch('userComment');

  // Update form when speech recognition provides new text
  useEffect(() => {
    if (transcript && transcript.trim()) {
      setValue('userComment', transcript);
    }
  }, [transcript, setValue]);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', data);
      
      // Reset form after successful submission
      reset();
      resetTranscript();
      
      alert('Form submitted successfully!');
    } catch (err) {
      console.error('Submission error:', err);
      alert('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearTranscript = () => {
    resetTranscript();
    setValue('userComment', '');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Speech-to-Text Form
            </h1>
            <p className="text-gray-600">
              Fill out the form using your voice or by typing manually
            </p>
          </div>

          {/* Browser Support Status */}
          <div className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${
            isSupported 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className={`w-3 h-3 rounded-full ${
              isSupported ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`text-sm font-medium ${
              isSupported ? 'text-green-800' : 'text-red-800'
            }`}>
              {isSupported 
                ? 'Speech recognition is supported' 
                : 'Speech recognition is not supported in this browser'
              }
            </span>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Reason Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-800 mb-3">
                Reason for Rejection
              </label>
              <div className="relative">
                <select
                  {...register('reason', { required: 'Please select a reason' })}
                  className="w-full appearance-none rounded-xl border border-gray-300 bg-white p-4 pr-12 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Choose your reason for rejection
                  </option>
                  <option value="Salary Expectation Mismatch">
                    Salary Expectation Mismatch
                  </option>
                  <option value="Experience Expectation Mismatch">
                    Experience Expectation Mismatch
                  </option>
                  <option value="Educational Background Expectation Mismatch">
                    Educational Background Expectation Mismatch
                  </option>
                  <option value="Not From The Required Industry">
                    Not From The Required Industry
                  </option>
                  <option value="Position Went On Hold / Closed">
                    Position Went On Hold / Closed
                  </option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown 
                  size={20} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" 
                />
              </div>
              {errors.reason && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.reason.message}
                </p>
              )}
            </div>

            {/* Speech Recognition Section */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-semibold text-gray-800">
                  Comments & Feedback
                </label>
                {isSupported && transcript && (
                  <button
                    type="button"
                    onClick={handleClearTranscript}
                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw size={12} />
                    Clear
                  </button>
                )}
              </div>

              <div className="relative">
                <textarea
                  {...register('userComment', {
                    validate: (value) =>
                      selectedReason === 'other' && !value?.trim()
                        ? 'Please provide a comment when selecting "Other"'
                        : true,
                  })}
                  placeholder={
                    isSupported
                      ? 'Click the microphone to start dictating, or type your feedback manually...'
                      : 'Please type your feedback manually...'
                  }
                  className={`w-full h-32 rounded-xl border-2 p-4 text-sm resize-none transition-all duration-200 ${
                    isListening
                      ? 'border-blue-400 bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                      : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  } focus:outline-none`}
                  onFocus={() => {
                    if (isListening) {
                      stopListening();
                    }
                  }}
                />

                {/* Mic Button */}
                {isSupported && (
                  <button
                    type="button"
                    onClick={handleMicToggle}
                    disabled={!!error}
                    className={`
                      absolute bottom-4 right-4 w-10 h-10 rounded-full 
                      flex items-center justify-center transition-all duration-300
                      shadow-lg hover:shadow-xl transform hover:scale-105
                      ${isListening 
                        ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                        : 'bg-blue-500 hover:bg-blue-600'
                      }
                      ${error ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      text-white
                    `}
                  >
                    {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                  </button>
                )}
              </div>

              {/* Speech Recognition Status */}
              {isSupported && (
                <div className="mt-3 space-y-2">
                  {isListening && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Listening... Speak now
                      {interimTranscript && (
                        <span className="text-gray-500 italic">
                          "{interimTranscript}"
                        </span>
                      )}
                    </div>
                  )}
                  
                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle size={16} />
                      {error}
                    </div>
                  )}
                </div>
              )}

              {!isSupported && (
                <div className="mt-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 text-sm text-yellow-800">
                    <AlertCircle size={16} />
                    <span className="font-medium">Speech recognition not available</span>
                  </div>
                  <p className="text-xs text-yellow-700 mt-1">
                    This feature requires a modern browser and HTTPS connection. 
                    Please type your feedback manually.
                  </p>
                </div>
              )}

              {errors.userComment && (
                <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.userComment.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`
                w-full py-4 px-6 rounded-xl font-semibold text-white
                transition-all duration-200 transform hover:scale-[1.02]
                flex items-center justify-center gap-2 shadow-lg hover:shadow-xl
                ${isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                }
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send size={16} />
                  Submit Form
                </>
              )}
            </button>
          </form>

          {/* Instructions */}
          <div className="mt-8 p-6 bg-gray-50 rounded-xl">
            <h3 className="font-semibold text-gray-800 mb-3">How to use Speech-to-Text:</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Click the microphone button to start voice recording
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Speak clearly and at a normal pace
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Click the microphone again to stop recording
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                You can edit the transcribed text manually before submitting
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeechToTextForm;