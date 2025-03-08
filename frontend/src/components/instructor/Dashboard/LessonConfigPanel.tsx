import React, { useState } from "react";

interface Lesson {
  id: number;
  title: string;
  objectives: string;
}

interface LessonConfigPanelProps {
  lessons: Lesson[];
}

const LessonConfigPanel: React.FC<LessonConfigPanelProps> = ({ lessons }) => {
  const [newLessonTitle, setNewLessonTitle] = useState("");
  const [newObjectives, setNewObjectives] = useState("");

  const handleAddLesson = () => {
    console.log("Adding lesson:", { newLessonTitle, newObjectives });
    setNewLessonTitle("");
    setNewObjectives("");
  };

  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Lesson Configuration</h2>
      <div className="space-y-2">
        {lessons.map((lesson) => (
          <div key={lesson.id} className="border p-2 rounded">
            <h3 className="font-medium">{lesson.title}</h3>
            <p className="text-gray-600">{lesson.objectives}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 space-y-2">
        <input
          type="text"
          placeholder="Lesson Title"
          value={newLessonTitle}
          onChange={(e) => setNewLessonTitle(e.target.value)}
          className="border rounded w-full p-2"
        />
        <textarea
          placeholder="Objectives"
          value={newObjectives}
          onChange={(e) => setNewObjectives(e.target.value)}
          className="border rounded w-full p-2"
        />
        <button
          onClick={handleAddLesson}
          className="bg-blue-500 text-white rounded px-4 py-2"
        >
          Add Lesson
        </button>
      </div>
    </div>
  );
};

export default LessonConfigPanel;
