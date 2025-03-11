import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { fetchWithAuth } from '@/utils/api';

import { useNavigate } from "react-router-dom";


type SurveySection = 'confidence' | 'motivation' | 'attitudes';
type QuestionKey = string; // e.g., 'q1', 'q2', etc.
type LikertValue = '1' | '2' | '3' | '4' | '5' | '';

interface SurveyResponses {
  confidence: Record<QuestionKey, LikertValue>;
  motivation: Record<QuestionKey, LikertValue>;
  attitudes: Record<QuestionKey, LikertValue>;
  [key: string]: Record<QuestionKey, LikertValue>; // Add index signature
}

interface StudentSurveyProps {
  email: string;
  user: {
    id?: number;
    first_name?: string;
    last_name?: string;
    is_student?: boolean;
    access_group?: string;
  };
  onComplete: () => void;
  onSkip?: () => void;
}

const StudentSurvey: React.FC<StudentSurveyProps> = ({ 
  email, 
  user, 
  onComplete,
  onSkip
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<number>(0);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const navigate = useNavigate();

  
  // Initialize survey responses with empty values
  const [responses, setResponses] = useState<SurveyResponses>({
    // Confidence and anxiety section
    confidence: {
      q1: '', // I never feel quite sure of myself when speaking
      q2: '', // I don't worry about making mistakes
      q3: '', // I would feel comfortable around native speakers
      q4: '', // I would not be nervous speaking with native speakers
      q5: '', // I feel self-conscious speaking in front of other students
    },
    // Motivation section
    motivation: {
      q1: '', // I like using it
      q2: '', // I enjoy the challenge
      q3: '', // I think it's a good idea to know it
      q4: '', // Important for personal development
      q5: '', // I would feel ashamed if I couldn't speak with natives
      q6: '', // I need the course credit
      q7: '', // I was told to
    },
    // Attitudes section
    attitudes: {
      q1: '', // Studying is a waste of time
      q2: '', // Studying doesn't change anything
      q3: '', // Wouldn't bother me to take more classes
    }
  });

  // Define sections structure
  const sections = [
    {
      id: 'confidence',
      title: 'Question 1: Confidence and Comfort',
      description: 'Please rate your agreement with the following statements. Your target language is the language you are studying.',
      questions: [
        { key: 'q1', text: 'I never feel quite sure of myself when I am speaking in my target language.' },
        { key: 'q2', text: 'I don\'t worry about making mistakes when speaking in my target language.' },
        { key: 'q3', text: 'I would probably feel comfortable around native speakers of my target language.' },
        { key: 'q4', text: 'I would not be nervous speaking my target language with native speakers.' },
        { key: 'q5', text: 'I feel self-conscious about speaking my target language in front of other students.' }
      ]
    },
    {
      id: 'motivation',
      title: 'Question 2: Motivation',
      description: 'I am studying my target language because...',
      questions: [
        { key: 'q1', text: 'I like using it' },
        { key: 'q2', text: 'I enjoy the challenge of learning it' },
        { key: 'q3', text: 'I think it\'s a good idea to know it' },
        { key: 'q4', text: 'It is important for my personal development' },
        { key: 'q5', text: 'I would feel ashamed if I couldn\'t speak it with native speakers' },
        { key: 'q6', text: 'I need the course credit' },
        { key: 'q7', text: 'I was told to' }
      ]
    },
    {
      id: 'attitudes',
      title: 'Question 3: Attitudes',
      description: 'With regards to studying my target language, I think that:',
      questions: [
        { key: 'q1', text: 'Studying it is a waste of time' },
        { key: 'q2', text: 'Studying it doesn\'t change anything' },
        { key: 'q3', text: 'It wouldn\'t bother me to take more classes in my target language' }
      ]
    }
  ];

  // Check survey status on initial render
  useEffect(() => {
    const checkSurveyStatus = async () => {
      if (user.id) {
        try {
          const response = await fetchWithAuth(`/api/surveys/status/${user.id}`);
          
          if (response.ok) {
            const data = await response.json();
            if (data.completedSurveys?.includes('pre')) {
              // If already completed, notify parent component
              onComplete();
            }
          }
        } catch (err) {
          console.error('Error checking survey status:', err);
        }
      }
    };

    checkSurveyStatus();
  }, [user.id, onComplete]);

  // Calculate progress percentage based on completed sections
  const calculateProgress = () => {
    // Section 0 is not complete yet
    if (currentSection === 0 && !isCurrentSectionComplete()) return 0;
    // Section 0 is complete
    if (currentSection === 0 && isCurrentSectionComplete()) return 33;
    // Section 1 is not complete yet
    if (currentSection === 1 && !isCurrentSectionComplete()) return 33;
    // Section 1 is complete
    if (currentSection === 1 && isCurrentSectionComplete()) return 67;
    // Section 2 is not complete yet
    if (currentSection === 2 && !isCurrentSectionComplete()) return 67;
    // Section 2 is complete
    if (currentSection === 2 && isCurrentSectionComplete()) return 100;
    // Safety check
    return currentSection >= 3 ? 100 : 67;
  };

  // Check if current section is complete
  const isCurrentSectionComplete = () => {
    const sectionId = sections[currentSection].id as SurveySection;
    const sectionQuestions = sections[currentSection].questions;
    
    return sectionQuestions.every(q => responses[sectionId][q.key] !== '');
  };

  // Handle response change
  const handleResponseChange = (section: SurveySection, question: QuestionKey, value: LikertValue) => {
    setResponses(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [question]: value
      }
    }));
  };

  // Check if the entire form is complete
  const isFormComplete = (): boolean => {
    // Check if all questions have responses
    for (const section of sections) {
      const sectionId = section.id as SurveySection;
      for (const question of section.questions) {
        if (!responses[sectionId][question.key]) {
          return false;
        }
      }
    }
    return true;
  };

  // Navigate to next section
  const handleNextSection = () => {
    if (currentSection < sections.length - 1) {
      setCurrentSection(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  // Navigate to previous section
  const handlePrevSection = () => {
    if (currentSection > 0) {
      setCurrentSection(prev => prev - 1);
    }
  };

  // Handle exit request
  const handleExit = () => {
    setShowExitConfirm(true);
  };

  // Confirm exit - directly navigate to login page
  const confirmExit = () => {
    // Navigate to login page
    navigate('/login');
  };

  // Cancel exit
  const cancelExit = () => {
    setShowExitConfirm(false);
  };

  // Submit the survey
  const handleSubmit = async () => {
    if (!isFormComplete()) {
      setError('Please answer all questions before submitting.');
      return;
    }

    // We'll stay on section 2 but show 100% progress
    setIsSubmitting(true);
    setError(null);

    try {
      // Start the survey to check if it's already completed
      const startResponse = await fetchWithAuth('/api/surveys/start-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          survey_type: 'pre',
        }),
      });

      if (!startResponse.ok) {
        throw new Error('Failed to start survey');
      }
      
      const startData = await startResponse.json();
      
      // If survey is already completed, just notify the completion handler
      if (startData.completed) {
        onComplete();
        return;
      }

      // Submit the survey responses
      const submitResponse = await fetchWithAuth('/api/surveys/submit-responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          email,
          survey_type: 'pre',
          responses
        }),
      });

      const responseData = await submitResponse.json();
      console.log('Survey submission response:', responseData);

      if (!submitResponse.ok) {
        throw new Error('Failed to submit survey');
      }

      // Directly call onComplete to proceed to login flow
      onComplete();

    } catch (err) {
      console.error('Error submitting survey:', err);
      setError('Failed to submit survey. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If showing exit confirmation
  if (showExitConfirm) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-[500px] max-w-[95vw]">
          <CardHeader>
            <CardTitle className="text-center text-lg">Exit Survey?</CardTitle>
            <CardDescription className="text-center text-sm">
              Your responses won't be saved! 😞 You'll need to complete the survey later to use ChitterChatter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center text-sm">
            <p>Are you sure you want to exit the survey now?</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={cancelExit}
              size="sm"
            >
              Continue Survey
            </Button>
            <Button
              variant="destructive"
              onClick={confirmExit}
              size="sm"
            >
              Exit Survey
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  // If showing intro screen
  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="w-[500px] max-w-[95vw]">
          <CardHeader>
            <CardTitle className="text-center text-lg">Language Learning Survey</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>Thank you for your consent! Before we jump in, we will ask three questions to understand your learning experience and improve our platform. Your responses will remain confidential and will only be used for research purposes.</p>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleExit}
              size="sm"
            >
              Cancel
            </Button>
            <Button
              onClick={() => setShowIntro(false)}
              size="sm"
            >
              Begin Survey
            </Button>
          </CardFooter>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-[800px] max-w-[95vw]">
        <CardHeader>
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-lg">Language Learning Survey</CardTitle>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleExit}
            >
              Exit Survey
            </Button>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs mt-2">
              <span>Question {currentSection + 1} of {sections.length}</span>
              <span>
                {/* Display progress based on section completion status */}
                {(currentSection === 0 && !isCurrentSectionComplete()) ? '0' : 
                (currentSection === 0 && isCurrentSectionComplete()) ? '33' : 
                (currentSection === 1 && !isCurrentSectionComplete()) ? '33' : 
                (currentSection === 1 && isCurrentSectionComplete()) ? '67' : 
                (currentSection === 2 && !isCurrentSectionComplete()) ? '67' : 
                '100'}% Complete
            </span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardHeader>
        
        <CardContent className="max-h-[400px] overflow-y-auto pr-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={sections[currentSection].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h3 className="text-md font-semibold">{sections[currentSection].title}</h3>
              <p className="text-gray-600 mb-4 text-sm">{sections[currentSection].description}</p>
              
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr>
                      <th className="text-left pr-4 pb-4 w-2/5 text-sm font-semibold">Statement</th>
                      <th className="text-center pb-4 text-xs">
                        <div className="flex flex-col items-center font-semibold">
                          <span>Strongly</span>
                          <span>Disagree</span>
                        </div>
                      </th>
                      <th className="text-center pb-4 text-xs">
                        <div className="flex flex-col items-center font-semibold">
                          <span>Disagree</span>
                        </div>
                      </th>
                      <th className="text-center pb-4 text-xs">
                        <div className="flex flex-col items-center font-semibold">
                          <span>Neither Agree</span>
                          <span>nor Disagree</span>
                        </div>
                      </th>
                      <th className="text-center pb-4 text-xs">
                        <div className="flex flex-col items-center font-semibold">
                          <span>Agree</span>
                        </div>
                      </th>
                      <th className="text-center pb-4 text-xs">
                        <div className="flex flex-col items-center font-semibold">
                          <span>Strongly</span>
                          <span>Agree</span>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sections[currentSection].questions.map((question) => {
                      const sectionId = sections[currentSection].id as SurveySection;
                      return (
                        <tr key={question.key} className="border-t">
                          <td className="py-3 pr-4 text-sm">{question.text}</td>
                          {[1, 2, 3, 4, 5].map((value) => (
                            <td key={value} className="text-center py-3">
                              <div className="flex justify-center">
                                <input
                                  type="radio"
                                  name={`${sectionId}-${question.key}`}
                                  value={value.toString()}
                                  checked={responses[sectionId][question.key] === value.toString()}
                                  onChange={() => handleResponseChange(sectionId, question.key, value.toString() as LikertValue)}
                                  className="h-4 w-4 text-primary focus:ring-primary"
                                />
                              </div>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>

        <CardFooter className="flex justify-between border-t pt-4">
          <Button 
            variant="outline" 
            onClick={handlePrevSection}
            disabled={currentSection === 0 || isSubmitting}
            size="sm"
          >
            Previous
          </Button>
          
          <Button 
            onClick={handleNextSection} 
            disabled={isSubmitting || !isCurrentSectionComplete()}
            size="sm"
          >
            {currentSection < sections.length - 1 ? 'Next' : (isSubmitting ? 'Submitting...' : 'Submit Survey')}
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default StudentSurvey;