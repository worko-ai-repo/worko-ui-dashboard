import { logo_text } from '@AssetsFolder/assets'
import { ArrowRight, FileText, Mic, Search, Sparkles } from 'lucide-react';
import React from 'react'
import { useNavigate } from 'react-router-dom';

{/*job description button will have a dropdown */}

// interface SearchPromptProps {
//   onSubmit: (query: string) => void;
// }

const SearchPrompt : React.FC = () => {
  const [input, setInput] = React.useState("");
  const navigate = useNavigate();

  const suggestions = [
    "Please give me all the candidates by notice period and 5 years + experience",
    "Please give me all the candidates by notice period and 5 years + experience",
    "Please give me all the candidates by notice period and 5 years + experience",
    "Please give me all the candidates by notice period and 5 years + experience",
    "Please give me all the candidates by notice period and 5 years + experience",
  ];

    const handleSubmit = () => {
    if (!input.trim()) return;
    navigate(`/admin/aSearchDB/results?query=${encodeURIComponent(input.trim())}`);
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen w-full bg-background p-8">
      <div className="flex flex-col justify-center items-center text-center mb-8">
        <img src={logo_text} alt="worko_logo" className="h-20 w-auto" />
        <p className="text-muted-foreground text-sm">
          Find exactly who you're looking for, in seconds.
        </p>
      </div>

      {/* Search container */}
      <div className="w-full max-w-3xl">
        {/* Label tab */}
        <div className="relative flex">
          <div className="relative top-4 inline-flex items-start gap-2 bg-blue-600 text-white px-4 py-1.5 rounded-t-xl text-xs font-medium h-12">
            <Sparkles className="w-4 h-4" />
            <span>Who are you looking for</span>
          </div>
        </div>

        {/* Search card */}
        <div className="border border-border rounded-2xl shadow-sm bg-white">
          {/* Textarea section */}
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="please give me all the data by notice period"
              className="w-full h-36 resize-none px-4 py-3 pr-24 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none rounded-t-2xl"
            />
            {/* Mic + Arrow buttons */}
            <div className="absolute top-3 right-3 flex gap-2">
              <button className="p-2 rounded-md bg-muted hover:bg-muted/70 border bg-gray-200">
                <Mic className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={handleSubmit}
                className="p-2 rounded-md bg-blue-600 hover:bg-blue-700"
              >
                <ArrowRight className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Job description button (moved inside textarea area) */}
            <button className="absolute bottom-3 right-8 flex items-center gap-2 px-4 py-2 border border-border rounded-full text-xs bg-gray-50 hover:bg-gray-100 transition">
              <FileText className="w-4 h-4" />
              <span>Job description</span>
            </button>
          </div>

          {/* Suggestions */}
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
        </div>
      </div>
    </div>
  );
};

export default SearchPrompt ;
