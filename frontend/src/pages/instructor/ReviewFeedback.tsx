import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2 } from "lucide-react";

interface FeedbackSection {
  label: string;
  isChecked: boolean;
  text: string;
}

const predefinedFeedbackSections: FeedbackSection[] = [
  {
    label: "Holistic Assessment",
    isChecked: false,
    text: "Provide feedback on the overall ability of the student to convey their message clearly and effectively, focusing on fluency and comprehension.",
  },
  {
    label: "Grammar and Syntax",
    isChecked: false,
    text: "Identify and correct any grammar or syntax errors. Suggest improvements for sentence structure where necessary.",
  },
  {
    label: "Word Choice",
    isChecked: false,
    text: "Provide suggestions on better vocabulary usage to enhance clarity and precision.",
  },
];

const ReviewFeedback: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const [feedbackSections, setFeedbackSections] = useState(predefinedFeedbackSections);
  const [customFeedback, setCustomFeedback] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Larger instructional prompt for AI
  const baseFeedbackPrompt = `You are an AI tutor--a Virtual Practice Partner (VPP)--that provides personalized feedback to students practicing their language skills. Use English to provide feedback. You should not make it clear that you are AI.
    To provide feedback, you will use the transcript that follows from a student-VPP interaction. Your responses should be anchored in the transcript.
    Your primary goal is to help students **improve proficiency, comfort, and confidence** in their target language.
    Provide feedback in a **constructive, supportive, and encouraging tone**. 
    If applicable, highlight both strengths and areas for improvement. Do not mention things that are not substantiated by the transcript.
    
    Below are the specific areas of feedback that the instructor has selected for this session. Be careful to include feedback on each of these areas (if applicable):
  `;

  // Fetch the existing feedback prompt from the backend
  useEffect(() => {
    const fetchFeedbackPrompt = async () => {
      try {
        const response = await fetchWithAuth(`/api/practice_cases/get_case/${caseId}`);
        if (!response.ok) throw new Error("Failed to fetch practice case");
        const data = await response.json();

        if (data.feedback_prompt) {
          parseFeedbackPrompt(data.feedback_prompt);
        }
      } catch (error) {
        console.error("Error fetching feedback prompt:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeedbackPrompt();
  }, [caseId]);

  // Parse the saved feedback prompt
  const parseFeedbackPrompt = (prompt: string) => {
    const updatedSections = feedbackSections.map((section) => ({
      ...section,
      isChecked: prompt.includes(section.text),
    }));

    setFeedbackSections(updatedSections);

    // Extract custom feedback from stored text
    const predefinedTexts = updatedSections.map((section) => section.text);
    const extractedCustomFeedback = prompt
      .replace(baseFeedbackPrompt, "")
      .split("\n\n")
      .filter((text) => !predefinedTexts.includes(text));

    setCustomFeedback(extractedCustomFeedback);
  };

  // Toggle a predefined section on or off
  const handleCheckboxChange = (index: number) => {
    const updatedSections = [...feedbackSections];
    updatedSections[index].isChecked = !updatedSections[index].isChecked;
    setFeedbackSections(updatedSections);
  };

  // Update custom feedback section
  const handleCustomFeedbackChange = (index: number, value: string) => {
    const updatedCustomFeedback = [...customFeedback];
    updatedCustomFeedback[index] = value;
    setCustomFeedback(updatedCustomFeedback);
  };

  // Remove a custom feedback section
  const handleRemoveCustomFeedback = (index: number) => {
    const updatedCustomFeedback = customFeedback.filter((_, i) => i !== index);
    setCustomFeedback(updatedCustomFeedback);
  };

  // Add a new custom feedback section
  const handleAddCustomFeedback = () => {
    setCustomFeedback([...customFeedback, ""]);
  };

  // Save the feedback prompt to the backend
  const handleSave = async () => {
    const selectedFeedback = feedbackSections
      .filter((section) => section.isChecked)
      .map((section) => section.text);

    const fullPrompt = [
      baseFeedbackPrompt,
      ...selectedFeedback,
      ...customFeedback,
    ]
      .filter((text) => text.trim() !== "")
      .join("\n\n");

    try {
      const response = await fetchWithAuth(`/api/practice_cases/update_case/${caseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback_prompt: fullPrompt,
        }),
      });

      if (!response.ok) throw new Error("Failed to save feedback prompt");

      alert("Feedback prompt saved successfully!");
    } catch (error) {
      console.error("Error saving feedback prompt:", error);
      alert("Failed to save feedback prompt.");
    }
  };

  if (isLoading) return <p></p>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Review & Customize Feedback Prompt</h1>
      <p className="text-gray-600">
        Select the elements of feedback you want to include and customize the content as needed.
      </p>
      <hr className="mt-4 border-t border-gray-300 mx-auto" />

      {/* Predefined Feedback Sections */}
      {feedbackSections.map((section, index) => (
        <div key={section.label} className="space-y-2">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={section.isChecked}
              onCheckedChange={() => handleCheckboxChange(index)}
            />
            <span className="text-md font-medium">{section.label}</span>
          </div>
          {section.isChecked && (
            <Textarea
              className="w-full h-24 p-4 bg-white border border-gray-300"
              value={section.text}
              onChange={(e) => {
                const updatedSections = [...feedbackSections];
                updatedSections[index].text = e.target.value;
                setFeedbackSections(updatedSections);
              }}
            />
          )}
        </div>
      ))}

      {/* Custom Feedback Sections */}
      <h2 className="text-xl font-semibold mt-6">Custom Feedback Sections</h2>
      {customFeedback.map((feedback, index) => (
        <div key={index} className="flex items-center space-x-2">
          <Textarea
            className="w-full h-24 p-4 bg-white border border-gray-300 mt-2"
            value={feedback}
            onChange={(e) => handleCustomFeedbackChange(index, e.target.value)}
            placeholder="Enter custom feedback..."
          />
          <Button
            className="mt-2 bg-red-500 text-white p-2"
            onClick={() => handleRemoveCustomFeedback(index)}
          >
            <Trash2 className="h-5 w-5" />
          </Button>
        </div>
      ))}
      <Button
        className="mt-4 bg-green-500 text-white"
        onClick={handleAddCustomFeedback}
      >
        Add Custom Feedback Section
      </Button>

      {/* Save Button */}
      <div className="flex space-x-4 mt-6">
        <Button onClick={handleSave} className="bg-blue-500 text-white">
          Save Feedback Prompt
        </Button>
      </div>
    </div>
  );
};

export default ReviewFeedback;
