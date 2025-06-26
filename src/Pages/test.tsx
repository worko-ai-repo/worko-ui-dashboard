// JobCardGrid.tsx
import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";

import React from "react";
export default function JobCardGrid() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div>
      {[1, 2, 3].map((id) => (
        <motion.div
          layoutId={`card-${id}`}
          key={id}
          className="p-4 m-2 bg-white rounded shadow cursor-pointer"
          onClick={() => setSelectedId(String(id))}
        >
          <h3 className="font-semibold">Job {id}</h3>
          <p className="text-sm text-gray-500">Click to expand</p>
        </motion.div>
      ))}

      {selectedId && (
        <JobDetail id={selectedId} onClose={() => setSelectedId(null)} />
      )}
    </div>
  );
}

const JobDetail: React.FC<{ id: string; onClose: () => void }> = ({ id, onClose }) => {
  return (
    <AnimatePresence>
      <motion.div
        layoutId={`card-${id}`}
        className="fixed inset-0 flex items-center justify-center z-50"
      >
        <motion.div
          className="bg-white p-6 rounded-xl shadow-xl w-[400px] relative"
          layoutId={`card-${id}`}
        >
          <h2 className="text-xl font-bold mb-2">Job {id} Details</h2>
          <p className="text-gray-600 mb-4">
            This is the expanded view of job {id}.
          </p>
          <button
            className="absolute top-2 right-2 text-sm text-gray-500 hover:text-gray-800"
            onClick={onClose}
          >
            Close
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


