import { Routes, Route } from "react-router-dom";
import SearchPrompt from "./SearchPrompt";
import SearchResults from "./SearchResults";

const SearchDB = () => {
  return (
    <Routes>
      <Route path="/" element={<SearchPrompt />} />
      <Route path="results" element={<SearchResults />} />
    </Routes>
  );
};

export default SearchDB;


// import React from "react";
// import SearchPrompt from "./SearchPrompt";
// import SearchResults from "./SearchResults";

// const SearchDB: React.FC = () => {
//   const [mode, setMode] = React.useState<"prompt" | "results">("prompt");
//   const [query, setQuery] = React.useState("");

//   const handleSearch = (q: string) => {
//     setQuery(q);
//     setMode("results");
//   };

//   const handleBack = () => {
//     setQuery("")
//     setMode("prompt");
//   };

//   return (
//     <div className="min-h-screen w-full bg-background p-8">
//       {mode === "prompt" ? (
//         <SearchPrompt onSubmit={handleSearch} />
//       ) : (
//         <SearchResults query={query} onBack={handleBack} />
//       )}
//     </div>
//   );
// };

// export default SearchDB;
