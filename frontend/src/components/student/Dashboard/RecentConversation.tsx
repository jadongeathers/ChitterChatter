// components/student/Dashboard/RecentConversation.tsx
import React from "react";

export interface Message {
  role: string;
  content: string;
}

interface RecentConversationProps {
  messages: Message[];
}

const RecentConversation: React.FC<RecentConversationProps> = ({ messages }) => {
    const MessageBubble = ({ message }: { message: Message }) => {
        const isUser = message.role === "user";
        return (
          <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
            <div
              className={`max-w-3/4 p-3 rounded-lg shadow-md transition duration-200 ease-in-out transform hover:scale-[1.02] ${
                isUser
                  ? "bg-blue-50 hover:bg-blue-100"  // Red apple variant for the user
                  : "bg-green-50 hover:bg-green-100"  // Golden pear variant for the partner
              }`}
            >
              <span className="text-sm font-medium">
                {isUser ? "You" : "Partner"}
              </span>: {message.content}
            </div>
          </div>
        );
      };      

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-2">Recent Conversation</h2>
      <div className="h-80 overflow-y-auto p-8 border rounded-lg bg-white shadow-md">
        {messages.length > 0 ? (
            messages.map((msg, index) => <MessageBubble key={index} message={msg} />)
        ) : (
            <p className="text-center text-gray-500">No recent conversations. Select a practice case to get started!</p>
        )}
      </div>
    </div>
  );
};

export default RecentConversation;
