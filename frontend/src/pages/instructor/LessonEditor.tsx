// File: src/pages/LessonEditor.tsx

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

const LessonEditor: React.FC = () => {
  const [content, setContent] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const practice_case_id = 123; // Replace this with actual ID logic if dynamic

  // Start a new conversation on mount
  useEffect(() => {
    const uid = JSON.parse(localStorage.getItem("user") || "{}")?.id;
    setUserId(uid);

    fetch("/api/conversation/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: uid, practice_case_id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.conversation_id) {
          setConversationId(data.conversation_id);
        }
      })
      .catch((err) => console.error("Error starting conversation:", err));
  }, []);

  const sendMessage = async (role: "user" | "assistant", text: string) => {
    if (!conversationId) return;
    await fetch(`/api/conversation/${conversationId}/save_message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, text }),
    });
  };

  const handleAISuggestion = async () => {
    try {
      await sendMessage("user", content);
      const res = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: content })
      });
      const data = await res.json();
      setSuggestion(data.suggestion);
      await sendMessage("assistant", data.suggestion);
    } catch (err) {
      console.error(err);
    }
  };

  const saveLesson = async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/lessons/${conversationId}/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content })
      });
      if (!res.ok) alert("Failed to save");
      else alert("Lesson saved!");
    } catch (err) {
      console.error(err);
    }
  };

  const endConversation = async () => {
    if (!conversationId) return;
    try {
      const res = await fetch(`/api/conversation/${conversationId}/end`, {
        method: "POST" });
      const data = await res.json();
      alert("AI Feedback: " + data.feedback);
    } catch (err) {
      console.error("Failed to end conversation", err);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-4">
        <h2 className="text-lg font-bold mb-4">Progress</h2>
        <ul className="space-y-2">
          <li className="text-green-600">✅ Basics</li>
          <li className="text-green-600">✅ Goals</li>
          <li className="text-green-600">✅ Key Items</li>
          <li>Situation</li>
          <li>Behavior</li>
          <li>Title</li>
          <li>Description</li>
          <li>Technical Settings</li>
        </ul>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 space-y-8">
        {error && <div className="text-red-500">{error}</div>}

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">SECTION NAME</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Brief description of the section goes here.</p>
          </div>
          <div className="w-48 bg-gray-200 rounded h-4">
            <div className="h-4 bg-green-500 w-1/3 rounded" />
          </div>
        </div>

        {/* AI Assistant */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded shadow border border-gray-200 dark:border-gray-700 space-y-4">
          <h2 className="font-semibold text-lg">AI Assistant</h2>
          <p>AI message goes here. Maybe it’s describing the situation a bit more…</p>

          <button onClick={() => alert("Example user question")}
                  className="px-4 py-2 bg-blue-500 text-white rounded">
            User message. Asking a question.
          </button>

          {suggestion && (
            <div className="bg-yellow-100 text-yellow-900 p-3 rounded flex justify-between items-center">
              {suggestion}
              <button
                className="ml-4 px-2 py-1 bg-yellow-300 rounded text-sm"
                onClick={() => setContent((prev) => `${prev}\n${suggestion}`)}>
                ✨ Add AI Suggestion
              </button>
            </div>
          )}

          <div className="flex space-x-2">
            <button className="bg-gray-200 px-4 py-2 rounded" onClick={handleAISuggestion}>Suggest ideas</button>
            <button className="bg-gray-200 px-4 py-2 rounded">Help me think</button>
          </div>

          <div className="flex items-center space-x-2">
            <input
              className="flex-1 border px-3 py-2 rounded"
              placeholder="Ask a question..."
            />
            <button className="px-3 py-2 bg-blue-500 text-white rounded">→</button>
          </div>
        </section>

        {/* Lesson Content Box */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded shadow border border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-lg mb-2">Lesson Content</h2>
          <textarea
            className="w-full h-32 p-3 border rounded text-black"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write here, or add AI suggestions..."
          />
          <div className="mt-4 space-x-2">
            <button className="bg-gray-200 px-4 py-2 rounded" onClick={() => setContent("")}>Clear</button>
            <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={saveLesson}>Add to Lesson</button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded" onClick={endConversation}>Finish + Get Feedback</button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LessonEditor;
