// components/student/Dashboard/LatestAIFeedback.tsx
import React from "react";

interface LatestAIFeedbackProps {
  feedback: string | null;
}

const LatestAIFeedback: React.FC<LatestAIFeedbackProps> = ({ feedback }) => {
  const formatFeedback = (feedback: string) =>
    feedback.split(/\*\*(.*?)\*\*/).map((part, index) =>
      index % 2 === 0 ? part : <strong className="font-bold" key={index}>{part}</strong>
    );

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Latest AI Feedback</h2>
      <div className="p-4 border rounded-lg shadow-sm bg-white">
        {feedback ? (
          <div className="prose prose-sm max-w-none whitespace-pre-line">
            {formatFeedback(feedback)}
          </div>
        ) : (
          <p className="text-center text-gray-500">No feedback available</p>
        )}
      </div>
    </div>
  );
};

export default LatestAIFeedback;
