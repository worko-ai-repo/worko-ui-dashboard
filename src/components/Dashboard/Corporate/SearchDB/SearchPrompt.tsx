import { ArrowRight, Mic, MicOff, RotateCcw, Search, Sparkles } from 'lucide-react';
import Dropdown from './Dropdown';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logo_text } from '@AssetsFolder/assets';
import { useSpeechRecognition } from '@Hooks/useSpeechSynthesis.hook';
import JobDropdown from './JobDropdown';
import { useAppContext } from '@Context/App.context';
import httpServiceObj from '@Services/ApiHandler.service';

const SearchPrompt: React.FC = () => {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"jobs" | "prompt">("jobs");
  const [jobsList,setJobsList] = useState([]);
  const [isFetchingJobs,setIsFetchingJobs] = useState(false);
  const { userDetails } = useAppContext();

  useEffect(()=>{
    const fetchJobs = async() =>{
    setIsFetchingJobs(true)
    const params = {
      pageSize: 200,
      sortOrder: "desc",
      dashboard: "CORPORATE",
      userRole: "corporate-recruiter",
      status: "PUBLISHED",
      companyId: userDetails?.companyId,
      corporateRecruiterUserId: userDetails?.id,
    }

    try {
      const {response} = await httpServiceObj.get<any>(`/job`,true,params,false,"JOB")
      if(response?.data){
        setJobsList(response.data)
      }
      setIsFetchingJobs(false)
    } catch (error) {
      console.log(error)
    }
  }
  fetchJobs()
  },[])
  // const jobsList = [
  //   { label: "Full-Stack", value: "full-stack" },
  //   { label: "Half-Stack", value: "half-stack" },
  //   { label: "Frontend", value: "frontend" },
  //   { label: "Backend", value: "backend" },
  //   { label: "DevOps", value: "devops" },
  //   { label: "UI/UX", value: "ui-ux" },
  //   { label: "Data Engineer", value: "data-engineer" },
  //   { label: "AI/ML", value: "ai-ml" },
  //   { label: "QA Tester", value: "qa-tester" },
  //   ];

  const navigate = useNavigate();
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

    useEffect(() => {
      if (transcript && transcript.trim()) {
        setInput(transcript);
      }
    }, [transcript]);


  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleClearTranscript = () => {
    resetTranscript();
    setInput('');
  };


  const suggestions = [
    "Show candidates with 3+ years of experience available to join in less than 30 days",
    "Find frontend developers skilled in React and TypeScript with immediate availability",
    "Search for candidates with strong communication and client-facing experience",
    "List backend engineers from product-based companies with 5+ years of experience",
    "Give me profiles of DevOps or cloud engineers who can relocate within India",
  ];

  const handleSubmit = () => {
    if (!input.trim()) return;
    // console.log(mode,input)
    navigate(`/corporate/aSearchDB/results?${mode}=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="flex flex-col justify-start items-center min-h-screen w-full bg-background">
      <div className="flex flex-col justify-center items-center text-center mb-8">
        <img src={logo_text} alt="worko_logo" className="h-20 w-auto" />
        <p className="text-muted-foreground text-sm">
          Find exactly who you're looking for, in seconds.
        </p>
      </div>

      <div className="w-full max-w-3xl">
        <div className="relative flex">
          <div className="relative top-4 inline-flex items-start gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-t-xl text-xs font-medium h-12 z-0">
            <Sparkles className="w-4 h-4" />
            <span>Who are you looking for</span>
          </div>
        </div>

        <div className="border border-border rounded-2xl shadow-sm bg-white z-9999">
        <div className={`relative border border-border ${mode === "jobs" ? "rounded-2xl" : "rounded-t-2xl"} shadow-sm bg-white`}>
  {mode === "prompt" ? (
    <textarea
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handleSubmit();
        }
      }}
      placeholder="Write your prompt here..."
      className="w-full h-36 resize-none px-4 py-3 pr-24 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none rounded-2xl"
    />
  ) : (
  <div className="flex items-center gap-2 px-4 py-3 w-full">
    <div className="flex-1">
      <JobDropdown
        jobsList={jobsList}
        input={input}
        setInput={setInput}
        handleSubmit={handleSubmit}
      />
    </div>
    <button
      disabled={true}
      onClick={handleSubmit}
      className="p-2 rounded-md bg-blue-600 hover:bg-blue-700"
    >
      <ArrowRight className="w-5 h-5 text-white" />
    </button>
      <Dropdown
        mode={mode}
        setMode={setMode}
        onSubmit={handleSubmit}
        setInput={setInput}
      />
  </div>
  )}

  {/* Mic + Arrow buttons (only in prompt mode) */}
  {mode !== "jobs" && (
    <div className="absolute top-3 right-3 flex gap-2 items-center">
      {isSupported && (
        <button
          type="button"
          onClick={handleMicToggle}
          disabled={!!error}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition duration-300 text-white shadow-md hover:shadow-lg ${
            isListening ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-blue-500 hover:bg-blue-600"
          } ${error ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isListening ? <MicOff size={16} /> : <Mic size={16} />}
        </button>
      )}
      <button
        disabled={true}
        onClick={handleSubmit}
        className="p-2 rounded-md bg-blue-600 hover:bg-blue-700"
      >
        <ArrowRight className="w-5 h-5 text-white" />
      </button>
    </div>
  )}

  {/* Listening indicator */}
  {isSupported && isListening && (
    <div className="mt-2 text-sm text-blue-600 flex justify-center items-center gap-2">
      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      Listening... Speak now
    </div>
  )}

      {/* Dropdown placement for prompt mode (bottom right) */}
      {mode === "prompt" && (
        <div className="absolute bottom-3 right-3">
          <Dropdown
            mode={mode}
            setMode={setMode}
            onSubmit={handleSubmit}
            // jobsList={jobsList}
            setInput={setInput}
          />
        </div>
      )}
    </div>

         {mode==="prompt" &&
          <div className="border-t border-border divide-y divide-border">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setInput(suggestion)}
                className="w-full flex items-center gap-3 px-5 py-3 text-left text-xs text-foreground hover:bg-gray-50 transition"
              >
                <Search className="w-4 h-4 text-muted-foreground" />
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
          }
        </div>
      </div>
    </div>
  );
};

export default SearchPrompt;
