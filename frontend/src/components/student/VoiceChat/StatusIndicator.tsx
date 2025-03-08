// StatusIndicator.tsx
import React from "react";
import { motion } from "framer-motion";

interface StatusIndicatorProps {
  status: string;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({ status }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="absolute top-6 right-6"
    >
      <span
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
          status === "Connected"
            ? "bg-green-100 text-green-800"
            : status === "Error"
            ? "bg-red-100 text-red-800"
            : "bg-gray-100 text-gray-800"
        }`}
      >
        <span
          className={`w-2 h-2 rounded-full ${
            status === "Connected"
              ? "bg-green-500"
              : status === "Error"
              ? "bg-red-500"
              : "bg-gray-500"
          }`}
        />
        {status}
      </span>
    </motion.div>
  );
};

export default StatusIndicator;
