// constants/characterLimits.ts
export const CHARACTER_LIMITS = {
  // Basic info
  title: 150,
  description: 600,
  
  // Learning objectives  
  proficiency_level: 600,
  curricular_goals: 800,
  key_items: 600,
  notes_for_students: 600,
  
  // Scenario setup - these are the critical ones for image generation
  situation_instructions: 800,    // Most important, give more space
  cultural_context: 600,          // Important but can be more concise
  behavioral_guidelines: 800,     // Character personality needs detail
  
  // Other
  feedback_prompt: 600,
  target_language: 50
};

// Utility function to get character count color
export const getCharacterCountColor = (current: number, max: number): string => {
  const percentage = (current / max) * 100;
  if (percentage >= 95) return 'text-red-600 font-medium';
  if (percentage >= 80) return 'text-yellow-600';
  return 'text-gray-500';
};

// Character counter component that only shows when focused
export interface CharacterCounterProps {
  current: number;
  max: number;
  isVisible: boolean;
  className?: string;
}

export const CharacterCounter: React.FC<CharacterCounterProps> = ({ 
  current, 
  max, 
  isVisible,
  className = "" 
}) => {
  if (!isVisible) return null;
  
  const percentage = (current / max) * 100;
  const colorClass = getCharacterCountColor(current, max);
  
  return (
    <div className={`text-xs flex items-center justify-between transition-opacity duration-200 ${className}`}>
      <span className={colorClass}>
        {current}/{max} characters
      </span>
      {percentage >= 95 && (
        <span className="text-red-600 font-medium">
          Almost at limit!
        </span>
      )}
      {percentage >= 80 && percentage < 95 && (
        <span className="text-yellow-600">
          Getting close
        </span>
      )}
    </div>
  );
};