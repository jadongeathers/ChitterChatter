import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiClient } from "../../../services/apiClient";
import { setupWebRTCConnection } from "../../../services/websocket";
import StartSessionDialog from "./StartSessionDialog";
import ConversationArea from "./ConversationArea";
import { Card, CardContent } from "@/components/ui/card";
import { fetchWithAuth } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";

interface PracticeCase {
  id: number;
  institution: string;
  class_name: string;
  description: string;
  system_prompt: string;
  image_url?: string;
  min_time: number; // in seconds
  max_time: number; // in seconds
}

const VoiceChat: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [status, setStatus] = useState<string>("Idle");
  const [error, setError] = useState<string | null>(null);
  const [pc, setPc] = useState<RTCPeerConnection | null>(null);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isSessionStarted, setIsSessionStarted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(true);
  const [practiceCase, setPracticeCase] = useState<PracticeCase | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isWaitingForFeedback, setIsWaitingForFeedback] = useState(false);
  const [loadingDots, setLoadingDots] = useState(".");
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [minReached, setMinReached] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [userRole, setUserRole] = useState<"student" | "instructor" | null>(null);
  const [showConversationArea, setShowConversationArea] = useState(true);
  const [isEndingConversation, setIsEndingConversation] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const wasAiSpeakingOnPauseRef = useRef(false);

  // New pause-related state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  const conversationIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);

  // Centralized function to clean up all media resources
  const cleanupMediaResources = useCallback(() => {
    console.log("Cleaning up media resources...");
    
    // Close peer connection and stop all tracks
    if (pc) {
      pc.getSenders().forEach((sender) => {
        if (sender.track) {
          sender.track.stop();
          console.log(`Stopped sender ${sender.track.kind} track:`, sender.track.label);
        }
      });
      pc.getReceivers().forEach((receiver) => {
        if (receiver.track) {
          receiver.track.stop();
          console.log(`Stopped receiver ${receiver.track.kind} track:`, receiver.track.label);
        }
      });
      pc.close();
      setPc(null);
    }

    // Stop local stream tracks (microphone/camera)
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped local ${track.kind} track:`, track.label);
      });
      setLocalStream(null);
    }

    // Stop remote stream tracks
    if (remoteStream) {
      remoteStream.getTracks().forEach((track) => {
        track.stop();
        console.log(`Stopped remote ${track.kind} track:`, track.label);
      });
      setRemoteStream(null);
    }

    // Clear data channel reference
    dataChannelRef.current = null;
  }, [pc, localStream, remoteStream]);

  // Function to pause/resume microphone
  const toggleMicrophone = (enable: boolean) => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = enable;
      });
    }
  };

  // Function to send pause/resume signal via WebRTC
  const sendPauseSignal = async (paused: boolean) => {
    try {
      if (dataChannelRef.current && (dataChannelRef.current as any).pauseControl) {
        (dataChannelRef.current as any).pauseControl(paused);
        console.log(`Sent ${paused ? 'pause' : 'resume'} signal via WebRTC`);
      }
    } catch (error) {
      console.error('Error sending pause signal:', error);
    }
  };

  // Pause conversation function
  const pauseConversation = async () => {
    if (isPaused) return;
    
    setIsPaused(true);
    setPauseStartTime(Date.now());
    
    // Disable microphone
    toggleMicrophone(false);
    
    // Send pause signal to backend
    await sendPauseSignal(true);
    
    setStatus("Paused");
    console.log("Conversation paused");
  };

  // Resume conversation function
  const resumeConversation = async () => {
    if (!isPaused) return;
    
    // Calculate pause duration and add to total
    if (pauseStartTime) {
      const pauseDuration = Math.floor((Date.now() - pauseStartTime) / 1000);
      setTotalPausedTime(prev => prev + pauseDuration);
      setPauseStartTime(null);
    }
    
    setIsPaused(false);
    
    // Re-enable microphone
    toggleMicrophone(true);
    
    // Send resume signal to backend
    await sendPauseSignal(false);
    
    setStatus("Connected");
    console.log("Conversation resumed");
  };

  // Monitor authentication status changes (logout detection)
  useEffect(() => {
    if (!isAuthenticated && isSessionStarted) {
      console.log("User logged out during session, cleaning up media resources");
      cleanupMediaResources();
      setIsSessionStarted(false);
      setStatus("Disconnected");
    }
  }, [isAuthenticated, isSessionStarted, cleanupMediaResources]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      console.log("Component unmounting, cleaning up media resources");
      cleanupMediaResources();
    };
  }, [cleanupMediaResources]);

  // Fetch the user's role
  const fetchUserRole = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/me");
      const userData = await response.json();
      if (!response.ok) {
        throw new Error(userData.error || "Failed to fetch user data");
      }
      setUserRole(userData.is_student ? "student" : "instructor");
    } catch (err) {
      console.error("Error fetching user role:", err);
    }
  };

  // Confirmation modal states
  const [isStopModalOpen, setIsStopModalOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleModalClose = (open: boolean) => {
    if (!open) {
      // Clean up media resources when modal closes without starting session
      if (!isSessionStarted) {
        cleanupMediaResources();
      }
      if (userRole === "instructor") {
        navigate("/instructor/lessons");
      } else {
        navigate("/student/practice");
      }
    }
  };

  // Fetch the practice case details.
  useEffect(() => {
    const fetchPracticeCase = async () => {
      try {
        const response = await fetchWithAuth(`/api/practice_cases/get_cases`);
        const data = await response.json();
        const currentCase = data.find(
          (c: PracticeCase) => c.id === parseInt(id as string, 10)
        );
        if (currentCase) {
          setPracticeCase(currentCase);
        }
      } catch (error) {
        console.error("Error fetching practice case:", error);
      }
    };

    if (id) {
      fetchPracticeCase();
    }
  }, [id]);

  useEffect(() => {
    fetchUserRole();
  }, []);

  // Handle dynamic loading animation for feedback
  useEffect(() => {
    if (isWaitingForFeedback) {
      const interval = setInterval(() => {
        setLoadingDots((prev) =>
          prev === "." ? ".." : prev === ".." ? "..." : "."
        );
      }, 500);
  
      return () => clearInterval(interval);
    }
  }, [isWaitingForFeedback]);

  useEffect(() => {
    if (practiceCase && timeElapsed >= practiceCase.max_time) {
      setIsTimeUp(true);
      setTimeout(stopSession, 3000);
    }
  }, [timeElapsed, practiceCase]);

  useEffect(() => {
    if (practiceCase) {
      if (timeElapsed >= practiceCase.min_time) {
        setMinReached(true);
      } else {
        setMinReached(false);
      }
    }
  }, [timeElapsed, practiceCase]);

  const fetchUserId = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/me");
      const userData = await response.json();
      if (!response.ok) {
        throw new Error(userData.error || "Failed to fetch user data");
      }
      return userData.id;
    } catch (err) {
      console.error("Error fetching user ID:", err);
      throw new Error("Failed to retrieve user ID");
    }
  };  

  // Handle incoming messages from OpenAI.
  const handleMessage = useCallback(
    (message: { type: string; text: string; is_final?: boolean; is_speaking?: boolean }) => {
      if (!conversationIdRef.current) return;

      // Track the AI's speaking state
      if (typeof message.is_speaking === "boolean") {
        setIsAiSpeaking(message.is_speaking);
      }

      // Handle saving user and assistant messages
      if (message.type === "speech") {
        saveMessage("user", message.text);
      } else if (message.type === "assistant" && message.text) {
        setCurrentMessage(message.text);
        saveMessage("assistant", message.text);
      }
    },
    [] // Keep dependencies minimal
  );

  const saveMessage = async (role: string, text: string) => {
    if (!conversationIdRef.current) return;
    try {
      const response = await fetchWithAuth(
        `/api/conversations/conversation/${conversationIdRef.current}/save_message`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, text }),
        }
      );
      if (!response.ok) throw new Error("Failed to save message");
    } catch (err) {
      console.error("Error saving message:", err);
    }
  };

  const startSession = async () => {
    setIsModalOpen(false);
    setIsSessionStarted(true);
    setTimeElapsed(0);
    setStatus("Connecting...");
    setTotalPausedTime(0); // Reset pause time
  
    try {
      const userId = await fetchUserId();
      const practiceCaseId = parseInt(id as string, 10);
  
      const response = await fetchWithAuth("/api/conversations/conversation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, practice_case_id: practiceCaseId }),
      });
  
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start conversation");
  
      conversationIdRef.current = data.conversation_id;
      const { client_secret } = await apiClient.createSession(userId, practiceCaseId);
      const { pc: peerConnection, dataChannel, localStream: stream } = await setupWebRTCConnection(
        client_secret,
        handleMessage,
        (stream) => setRemoteStream(stream)
      );
  
      setLocalStream(stream);
      setPc(peerConnection);
      dataChannelRef.current = dataChannel; // Store data channel reference
  
      setStatus("Connected");
    } catch (err) {
      console.error("Session error:", err);
  
      // Clean up any partially created resources on error
      cleanupMediaResources();
  
      // Specific microphone access error handling
      if (err instanceof Error && err.message.includes("Microphone access was denied")) {
        setError("Microphone access not enabled! Please enable microphone access and refresh your browser.");
      } else {
        setError(err instanceof Error ? err.message : "Failed to start session");
      }
  
      setStatus("Error");
      setIsSessionStarted(false);
    }
  };
  
  const stopSession = async () => {
    setIsEndingConversation(true);

    await new Promise(resolve => setTimeout(resolve, 100)); // Ensure UI updates before API call

    // Use centralized cleanup function
    cleanupMediaResources();
    
    if (conversationIdRef.current) {
      // Begin exit animation for the conversation area
      setIsExiting(true);
      setTimeout(async () => {
        setShowConversationArea(false);
        setIsEndingConversation(false);
        setIsWaitingForFeedback(true);
        try {
          const response = await fetchWithAuth(
            `/api/conversations/conversation/${conversationIdRef.current}/end`,
            { method: "POST" }
          );
          await response.json();
          // Keep the waiting view visible and delay navigation for a smooth transition
          setTimeout(() => {
            navigate(`/feedback/${conversationIdRef.current}`);
          }, 1000); // additional delay to let the waiting view settle
        } catch (err) {
          console.error("Error ending conversation:", err);
        }
      }, 600); // Duration matches the exit animation
    }    
  };

  const cancelSession = async () => {
    // Use centralized cleanup function
    cleanupMediaResources();

    // Ensure conversationIdRef.current exists before making a request
    if (conversationIdRef.current) {
      try {
        const response = await fetchWithAuth(`/api/conversations/conversation/${conversationIdRef.current}/end`, {
          method: "POST",
        });

        if (!response.ok) throw new Error("Failed to update conversation end time");
        
        console.log("Conversation canceled successfully.");
      } catch (error) {
        console.error("Error canceling conversation:", error);
      }
    }
    
    // Add a small delay to ensure user sees the "Ending conversation" message
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Redirect user based on role
    if (userRole === "instructor") {
      navigate("/instructor/lessons");
    } else {
      navigate("/student/practice");
    }
  };

  const handleStopClick = () => {
    if (timeElapsed < (practiceCase?.min_time ?? 30)) {
      setIsStopModalOpen(true);
    } else {
      stopSession();
    }
  };

  return (
    <>
      <StartSessionDialog
        open={isModalOpen}
        onOpenChange={handleModalClose}
        practiceCase={practiceCase}
        onStart={startSession}
      />

      {/* Ending conversation notification - pop-up card style */}
      <div className={`fixed inset-0 z-50 bg-black bg-opacity-20 flex items-center justify-center transition-opacity duration-300 ${isEndingConversation ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <Card className="w-full max-w-sm bg-white shadow-lg">
          <CardContent className="p-6 text-center">
            <h2 className="text-lg font-semibold mb-2">Ending conversation</h2>
            <div className="flex justify-center space-x-1 mt-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
            </div>
            <p className="text-gray-500 mt-2">Please wait...</p>
          </CardContent>
        </Card>
      </div>

      {isTimeUp ? (
        <Card className="w-full max-w-md mx-auto p-6 text-center">
          <CardContent>
            <h2 className="text-lg font-semibold">Time's up! Submitting for evaluation...</h2>
          </CardContent>
        </Card>
      ) : isWaitingForFeedback ? (
        <Card className="w-full max-w-md mx-auto p-6 text-center">
          <CardContent>
            <h2 className="text-lg font-semibold">Waiting for feedback</h2>
            <span>{loadingDots}</span>
          </CardContent>
        </Card>
      ) : (
        isSessionStarted && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: isExiting ? 0 : 1 }} 
            className="min-h-screen flex flex-col items-center justify-center p-6"
          >
            <ConversationArea
              currentMessage={currentMessage}
              showHint={showHint}
              onToggleShowHint={() => setShowHint(!showHint)}
              stopSession={handleStopClick}
              status={status}
              error={error}
              remoteStream={remoteStream}
              timerMin={practiceCase?.min_time ?? 30}
              timerMax={practiceCase?.max_time ?? 300}
              timeElapsed={timeElapsed}
              onTimerUp={stopSession}
              canStop={minReached}
              onTick={(elapsed) => {
                console.log("VoiceChat received elapsed:", elapsed);
                setTimeElapsed(elapsed);
              }}
              isEndingConversation={isEndingConversation}
              // New pause props
              isPaused={isPaused}
              onPause={pauseConversation}
              onResume={resumeConversation}
              totalPausedTime={totalPausedTime}
            />
          </motion.div>
        )
      )}

      {error && error.includes("Microphone access not enabled") && (
        <Card className="w-full max-w-md mx-auto p-6 text-center bg-red-100">
          <CardContent>
            <h2 className="text-lg font-semibold text-red-600">Microphone Access Not Enabled</h2>
            <p className="mt-2 text-red-500">
              Please enable microphone access and refresh your browser.
            </p>
          </CardContent>
        </Card>
      )}

      {isStopModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }} 
            animate={{ opacity: 1, scale: 1 }} 
            exit={{ opacity: 0, scale: 0.8 }} 
            className="bg-white rounded-lg p-6 shadow-lg max-w-sm w-full"
          >
            <h2 className="text-xl font-bold text-center mb-4">Confirm End Conversation</h2>
            <p className="mb-4 text-center">
              You haven't reached the minimum time. If you leave now, you won't receive feedback and will be redirected to the dashboard.
            </p>
            <div className="flex justify-center space-x-2">
              <button 
                onClick={() => setIsStopModalOpen(false)} 
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setIsStopModalOpen(false);
                  // Set ending state immediately on button click
                  setIsEndingConversation(true);
                  cancelSession();
                }}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Confirm
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default VoiceChat;