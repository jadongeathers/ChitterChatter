import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  accessible_on: string;
  system_prompt: string;
  voice: string; // New field for voice selection
  language_code: string; // New field for language code
}

// Language mapping for OpenAI transcription
const languageCodeMap: Record<string, string> = {
  "English": "en",
  "Spanish": "es",
  "French": "fr",
  "German": "de",
  "Italian": "it",
  "Portuguese": "pt",
  "Dutch": "nl",
  "Russian": "ru",
  "Japanese": "ja",
  "Chinese": "zh",
  "Korean": "ko",
  "Arabic": "ar",
  // Add more languages as needed
};

// OpenAI voice options
const voiceOptions = [
  { id: "alloy", name: "Alloy" },
  { id: "echo", name: "Echo" },
  { id: "fable", name: "Fable" },
  { id: "onyx", name: "Onyx" },
  { id: "nova", name: "Nova" },
  { id: "shimmer", name: "Shimmer" },
  { id: "verse", name: "Verse" }
];

// Helper function to format a date as YYYY-MM-DDTHH:mm in local time
const formatLocalDateTime = (dateStr: string): string => {
    const date = new Date(dateStr);
    const pad = (n: number): string => n.toString().padStart(2, "0");
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1); // months are 0-indexed
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };  

const ReviewCase: React.FC<{ isNew?: boolean }> = ({ isNew = false }) => {
  const { caseId } = useParams<{ caseId: string }>();
  const [practiceCase, setPracticeCase] = useState<PracticeCase | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Editable Sections
  const [language, setLanguage] = useState("");
  const [languageCode, setLanguageCode] = useState("en"); // Default to English
  const [situationInstructions, setSituationInstructions] = useState("");
  const [curricularGoals, setCurricularGoals] = useState("");
  const [keyItems, setKeyItems] = useState("");
  const [behavioralGuidelines, setBehavioralGuidelines] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [instructorNotes, setInstructorNotes] = useState("");
  const [voice, setVoice] = useState("verse"); // Default voice

  useEffect(() => {
    if (isNew) {
      // Initialize empty fields for new practice case
      setPracticeCase({
        id: 0, // This will be auto-assigned by the backend upon saving
        title: "",
        description: "",
        min_time: 0,
        max_time: 0,
        accessible_on: "",
        system_prompt: "",
        voice: "verse", // Default voice
        language_code: "en", // Default language code
      });
      setIsLoading(false);
      return;
    }
  
    // Fetch the existing case if it's not new
    const fetchPracticeCase = async () => {
      try {
        const response = await fetchWithAuth(`/api/practice_cases/get_case/${caseId}`);
        if (!response.ok) throw new Error("Failed to fetch practice case");
        const data = await response.json();
        setPracticeCase(data);
        parseSystemPrompt(data.system_prompt);
        
        // Set voice if it exists in the data, otherwise use default
        if (data.voice) {
          setVoice(data.voice);
        }
        
        // Set language code if it exists in the data, otherwise use default
        if (data.language_code) {
          setLanguageCode(data.language_code);
        }
      } catch (error) {
        console.error("Error loading practice case:", error);
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchPracticeCase();
  }, [caseId, isNew]);
  
  // Update language code when language changes
  useEffect(() => {
    // Check if language exists in the map
    if (language && languageCodeMap[language]) {
      setLanguageCode(languageCodeMap[language]);
    }
  }, [language]);

  const parseSystemPrompt = (prompt: string) => {
    const languageRegex = /practice their (.*?) skills/;
    const situationRegex = /1\. \*\*Situation Instructions\*\*:\s*([\s\S]*?)\n\s*2\. \*\*Curricular Goals\*\*:/;
    const goalsRegex = /2\. \*\*Curricular Goals\*\*:\s*Your responses should align with the following curricular goals:\s*([\s\S]*?)\n\s*3\. \*\*Key Items to Use\*\*:/;
    const keyItemsRegex = /3\. \*\*Key Items to Use\*\*:\s*Incorporate the following key items into your responses:\s*([\s\S]*?)\n\s*4\. \*\*Behavioral Guidelines\*\*:/;
    const behaviorRegex = /4\. \*\*Behavioral Guidelines\*\*:\s*Respond in a manner consistent with the following behavioral guidelines:\s*([\s\S]*?)\s*Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:/;
    const proficiencyRegex = /Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:\s*([\s\S]*?)\n\s*5\. \*\*Instructor Notes\*\*:/;
    const instructorNotesRegex = /5\. \*\*Instructor Notes\*\*:\s*([\s\S]*)$/;
  
    // Update state variables
    const extractedLanguage = (prompt.match(languageRegex)?.[1] || "").trim();
    setLanguage(extractedLanguage);
    setSituationInstructions((prompt.match(situationRegex)?.[1] || "").trim());
    setCurricularGoals((prompt.match(goalsRegex)?.[1] || "").trim());
    setKeyItems((prompt.match(keyItemsRegex)?.[1] || "").trim());
    setBehavioralGuidelines((prompt.match(behaviorRegex)?.[1] || "").trim());
    setProficiencyLevel((prompt.match(proficiencyRegex)?.[1] || "").trim());
    setInstructorNotes((prompt.match(instructorNotesRegex)?.[1] || "").trim());
    
    // Set language code based on extracted language
    if (extractedLanguage && languageCodeMap[extractedLanguage]) {
      setLanguageCode(languageCodeMap[extractedLanguage]);
    }
  };
  
  const handleSave = async () => {
    if (
        !practiceCase?.title ||
        !practiceCase?.description ||
        !language ||
        !situationInstructions ||
        !curricularGoals ||
        !behavioralGuidelines ||
        !proficiencyLevel ||
        practiceCase?.min_time == null ||
        practiceCase?.max_time == null ||  
        !practiceCase?.accessible_on
    ) {
        alert("Please fill in all required fields.");
        return;
    }
    const updatedPrompt = `
        Your goal is to make an environment for students to practice their ${language} skills. You are a real human with the exact background, personality, and characteristics described below.

        You must NEVER break character. Respond exactly as the real person you're portraying would in this situation.

        Allow the student to lead the conversation. Your role is to respond naturally, not to guide or direct the interaction.

        Your responses should be concise and conversational. Avoid long, detailed explanations unless specifically asked.

        Your first response should never ask the student how you can help or what they need assistance with. You are a real person in a specific situation. You should always respond as your character would in a real-life version of this scenario.

        If the student has a beginner proficiency level, use simpler vocabulary and speak more slowly, but remain in character (e.g., speak patiently and clearly if that fits your character). 
        If the student has an intermediate proficiency level, use moderate complexity in your speech while remaining in character.
        If the student has an advanced proficiency level, speak naturally as your character would.

        When the conversation begins, immediately assume your character role. 

        1. **Situation Instructions**:
        ${situationInstructions}

        2. **Curricular Goals**:
        Your responses should align with the following curricular goals:
        ${curricularGoals}

        3. **Key Items to Use**:
        Incorporate the following key items into your responses:
        ${keyItems}

        4. **Behavioral Guidelines**:
        Respond in a manner consistent with the following behavioral guidelines:
        ${behavioralGuidelines}

        Using the guidance above, adjust your speech, vocabulary, and pacing according to the student's proficiency level:
        ${proficiencyLevel}

        5. **Instructor Notes**:
        ${instructorNotes}
    `.trim();

    try {
      const endpoint = isNew
        ? "/api/practice_cases/add_case"
        : `/api/practice_cases/update_case/${caseId}`;

      const method = isNew ? "POST" : "PUT";

      const response = await fetchWithAuth(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: practiceCase.title,
          description: practiceCase.description,
          system_prompt: updatedPrompt,
          min_time: Math.floor(practiceCase.min_time),
          max_time: Math.floor(practiceCase.max_time),
          accessible_on: practiceCase.accessible_on,
          voice: voice,
          language_code: languageCode,
        }),
      });

      if (!response.ok) throw new Error("Failed to update practice case");

      alert("Practice case updated successfully!");
      navigate("/instructor/lessons");
    } catch (error) {
      console.error("Error updating practice case:", error);
    }
  };

  const handleCancel = () => {
    navigate("/instructor/lessons");
  };

  const handleDelete = async () => {
    if (isNew) {
        handleCancel();
        return;
    }

    if (!window.confirm("Are you sure you want to delete this practice case? This action cannot be undone.")) {
      return;
    }
  
    try {
      const response = await fetchWithAuth(`/api/practice_cases/delete_case/${caseId}`, {
        method: "DELETE",
      });
  
      if (!response.ok) throw new Error("Failed to delete practice case");
  
      alert("Practice case deleted successfully!");
      navigate("/instructor/lessons");
    } catch (error) {
      console.error("Error deleting practice case:", error);
    }
  };

  if (isLoading) return <p></p>;
  if (!practiceCase && !isNew) return <p>Practice case not found.</p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Review & Edit Case</h1>
      <hr className="mt-6 border-t border-gray-300 mx-auto" />

      {/* Editable Title */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Practice Case Title</div>
        <p className="text-sm text-gray-600 mb-2">Provide a descriptive title for this practice case.</p>
        <input
            type="text"
            className="w-full p-4 rounded-lg bg-white border border-gray-300 text-base"
            value={practiceCase?.title || ""}
            onChange={(e) =>
            setPracticeCase((prev) =>
                prev ? { ...prev!, title: e.target.value } : null
            )
            }
            required
        />
        </label>
  
      {/* Editable Description */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Practice Case Description</div>
        <p className="text-sm text-gray-600 mb-2">Provide a detailed description of the practice case that students can read before starting.</p>
        <Textarea
            className="w-full h-40 p-4 text-md bg-white border border-gray-300"
            value={practiceCase?.description || ""}
            onChange={(e) =>
            setPracticeCase((prev) =>
                prev ? { ...prev, description: e.target.value } : null
            )
            }
            required
        />
        </label>

      {/* Min Time (Editable in Minutes) */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Minimum Time (in minutes)</div>
        <input
            type="number"
            min={1}
            max={30}
            className="w-full p-4 rounded-lg bg-white border border-gray-300 text-base"
            value={practiceCase ? Math.floor(practiceCase.min_time / 60) : 0} // Display in minutes
            onChange={(e) => {
            const minutes = Number(e.target.value);
            setPracticeCase((prev) =>
                prev
                ? { ...prev, min_time: Math.floor(minutes * 60) } // Save as integer seconds
                : null
            );
            }}
        />
        </label>

      {/* Max Time (Editable in Minutes) */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Maximum Time (in minutes)</div>
        <input
            type="number"
            min={1}
            max={30}
            className="w-full p-4 rounded-lg bg-white border border-gray-300 text-base"
            value={practiceCase ? Math.floor(practiceCase.max_time / 60) : 0} // Display in minutes
            onChange={(e) => {
            const minutes = Number(e.target.value);
            setPracticeCase((prev) =>
                prev
                ? { ...prev, max_time: Math.floor(minutes * 60) } // Save as integer seconds
                : null
            );
            }}
        />
        </label>

      {/* Accessible On */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Accessible On</div>
        <p className="text-sm text-gray-600 mb-2">
            Set the date and time when the students can access this practice case.
        </p>
        <input
        type="datetime-local"
        className="w-full p-4 rounded-lg bg-white border border-gray-300 text-base"
        value={
            practiceCase?.accessible_on
            ? formatLocalDateTime(practiceCase.accessible_on)
            : ""
        }
        onChange={(e) =>
            setPracticeCase((prev) =>
            prev ? { ...prev, accessible_on: e.target.value } : null
            )
        }
        />

        </label>

      <hr className="mt-6 border-t border-gray-300 mx-auto" />

      {/* Voice Selection */}
      <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Voice Selection</div>
        <p className="text-sm text-gray-600 mb-2">Select the OpenAI voice to use for this practice case.</p>
        <Select
          value={voice}
          onValueChange={(value) => {
            setVoice(value);
          }}
        >
          <SelectTrigger className="w-full p-3 rounded-lg bg-white border border-gray-300">
            <SelectValue placeholder="Select a voice" />
          </SelectTrigger>
          <SelectContent>
            {voiceOptions.map((voiceOption) => (
              <SelectItem key={voiceOption.id} value={voiceOption.id}>
                {voiceOption.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {/* Editable Sections */}
        {/* Language Selection */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Target Language</div>
        <p className="text-sm text-gray-600 mb-2">Specify the language students will practice during this session.</p>
        <Select
          value={language}
          onValueChange={(value) => {
            setLanguage(value);
            if (languageCodeMap[value]) {
              setLanguageCode(languageCodeMap[value]);
            }
          }}
        >
          <SelectTrigger className="w-full p-3 rounded-lg bg-white border border-gray-300">
            <SelectValue placeholder="Select a language" />
          </SelectTrigger>
          <SelectContent>
            {Object.keys(languageCodeMap).map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="mt-2 text-sm text-gray-500">
          Language Code: {languageCode}
        </div>
        </label>

        {/* Proficiency Level Description */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Proficiency Level</div>
        <p className="text-sm text-gray-600 mb-2">Describe the overall proficiency level of the students to adjust difficulty accordingly.</p>
        <Textarea
            className="w-full h-40 p-4 text-md bg-white border border-gray-300"
            value={proficiencyLevel}
            onChange={(e) => setProficiencyLevel(e.target.value)}
        />
        </label>

        {/* Curricular Goals */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Curricular Goals</div>
        <p className="text-sm text-gray-600 mb-2">List the learning objectives that students should achieve during this practice.</p>
        <Textarea
            className="w-full h-40 p-4 bg-white border border-gray-300"
            value={curricularGoals}
            onChange={(e) => setCurricularGoals(e.target.value)}
        />
        </label>

        {/* Key Items to Use */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Key Items to Use</div>
        <p className="text-sm text-gray-600 mb-2">Include specific vocabulary, phrases, or expressions students should use or encounter.</p>
        <Textarea
            className="w-full h-40 p-4 text-md bg-white border border-gray-300"
            value={keyItems}
            onChange={(e) => setKeyItems(e.target.value)}
        />
        </label>

        <hr className="mt-6 border-t border-gray-300 mx-auto" />

        {/* Situation Instructions */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Situation Instructions</div>
        <p className="text-sm text-gray-600 mb-2">To help the virtual practice partner, describe the context or scenario in which the conversation will take place.</p>
        <Textarea
            className="w-full h-40 p-4 text-md bg-white border border-gray-300"
            value={situationInstructions}
            onChange={(e) => setSituationInstructions(e.target.value)}
        />
        </label>

        {/* Behavioral Guidelines */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Behavioral Guidelines</div>
        <p className="text-sm text-gray-600 mb-2">Define the tone, style, and cultural appropriateness for the conversation.</p>
        <Textarea
            className="w-full h-40 p-4 text-md bg-white border border-gray-300"
            value={behavioralGuidelines}
            onChange={(e) => setBehavioralGuidelines(e.target.value)}
        />
        </label>

        <hr className="mt-6 border-t border-gray-300 mx-auto" />

        {/* Instructor Notes */}
        <label className="block text-gray-800 mb-2">
        <div className="text-lg font-bold">Instructor Notes</div>
        <p className="text-sm text-gray-600 mb-2">Provide any additional instructions or notes specific to this practice case.</p>
        <Textarea
            className="w-full h-40 p-4 text-md bg-white border border-gray-300"
            value={instructorNotes}
            onChange={(e) => setInstructorNotes(e.target.value)}
        />
        </label>

        <div className="flex space-x-4">
            <Button onClick={handleSave} className="bg-blue-500 text-white">
                Save Changes
            </Button>
            <Button onClick={handleCancel} className="bg-gray-500 text-white">
                Cancel
            </Button>
            {!isNew && (
            <Button onClick={handleDelete} className="bg-red-500 text-white">
                Delete Practice Case
            </Button>
            )}
        </div>
    </div>
  );
};

export default ReviewCase;