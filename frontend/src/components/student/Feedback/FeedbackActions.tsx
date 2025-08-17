import React from "react";
import { FileText, MessageSquare } from "lucide-react";

interface FeedbackActionsProps {
  chatStarted: boolean;
  chatLoading: boolean;
  onShowTranscript: () => void;
  onStartChat: () => void;
}

const FeedbackActions: React.FC<FeedbackActionsProps> = ({
  chatStarted,
  chatLoading,
  onShowTranscript,
  onStartChat
}) => {
  if (chatStarted) {
    return null;
  }

  return (
    <div className="border-t border-gray-100 px-6 py-6 mt-4">
      <div className="text-center mb-5">
        <h4 className="text-sm font-medium text-gray-700 mb-1">What would you like to do next?</h4>
        <p className="text-xs text-gray-500">Explore your conversation or get personalized insights</p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
        <button
          onClick={onShowTranscript}
          className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center justify-center text-sm font-medium"
        >
          <FileText className="w-4 h-4 mr-2" />
          View Conversation
        </button>
        
        <button
          onClick={onStartChat}
          disabled={chatLoading}
          className="px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center text-sm"
        >
          {chatLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          ) : (
            <MessageSquare className="w-4 h-4 mr-2" />
          )}
          {chatLoading ? "Starting..." : "Ask Questions"}
        </button>
      </div>
    </div>
  );
};

export default FeedbackActions;