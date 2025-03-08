import React from "react";

interface Conversation {
  id: number;
  transcript: string;
  date: string;
}

interface AnonymizedConversationsProps {
  conversations: Conversation[];
}

const AnonymizedConversations: React.FC<AnonymizedConversationsProps> = ({ conversations }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold">Anonymized Conversations</h2>
      <div className="space-y-3 mt-4">
        {conversations.map((conversation) => (
          <div key={conversation.id} className="border p-3 rounded">
            <p className="text-gray-500 text-sm">Date: {conversation.date}</p>
            <p className="text-gray-800">{conversation.transcript}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AnonymizedConversations;
