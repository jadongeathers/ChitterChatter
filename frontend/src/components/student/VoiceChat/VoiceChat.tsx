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
import { CheckCircle } from "lucide-react";

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
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showNoAudioHint, setShowNoAudioHint] = useState(false);
  const [showIdlePrompt, setShowIdlePrompt] = useState(false);
  const wasAiSpeakingOnPauseRef = useRef(false);

  // New pause-related state
  const [isPaused, setIsPaused] = useState(false);
  const [pauseStartTime, setPauseStartTime] = useState<number | null>(null);
  const [totalPausedTime, setTotalPausedTime] = useState(0);

  const conversationIdRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const noAudioHintTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const idlePromptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Centralized function to clean up all media resources
  const clearNoAudioHintTimer = useCallback(() => {
    if (noAudioHintTimeoutRef.current) {
      clearTimeout(noAudioHintTimeoutRef.current);
      noAudioHintTimeoutRef.current = null;
    }
    setShowNoAudioHint(false);
  }, []);

  const startNoAudioHintTimer = useCallback(() => {
    clearNoAudioHintTimer();
    noAudioHintTimeoutRef.current = setTimeout(() => {
      console.warn("No AI audio detected after 10 seconds");
      setShowNoAudioHint(true);
    }, 10000);
  }, [clearNoAudioHintTimer]);

  const dismissNoAudioHint = useCallback(() => {
    console.log("User dismissed no-audio helper message");
    clearNoAudioHintTimer();
  }, [clearNoAudioHintTimer]);

  const clearIdlePromptTimer = useCallback(() => {
    if (idlePromptTimeoutRef.current) {
      clearTimeout(idlePromptTimeoutRef.current);
      idlePromptTimeoutRef.current = null;
    }
  }, []);

  const scheduleIdlePrompt = useCallback((delay = 10000) => {
    clearIdlePromptTimer();
    idlePromptTimeoutRef.current = setTimeout(() => {
      setShowIdlePrompt(true);
    }, delay);
  }, [clearIdlePromptTimer]);

  const dismissIdlePrompt = useCallback((shouldReschedule = false) => {
    clearIdlePromptTimer();
    setShowIdlePrompt(false);
    if (shouldReschedule) {
      scheduleIdlePrompt(20000);
    }
  }, [clearIdlePromptTimer, scheduleIdlePrompt]);

  const cleanupMediaResources = useCallback(() => {
    console.log("Cleaning up media resources...");

    clearNoAudioHintTimer();
    clearIdlePromptTimer();
    setShowIdlePrompt(false);

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
  }, [pc, localStream, remoteStream, clearNoAudioHintTimer, clearIdlePromptTimer]);

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

  const saveMessage = useCallback(async (role: string, text: string) => {
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
  }, []);

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
        dismissIdlePrompt(true);
        saveMessage("user", message.text);
      } else if (message.type === "assistant" && message.text) {
        setCurrentMessage(message.text);
        saveMessage("assistant", message.text);
      }
    },
    [dismissIdlePrompt, saveMessage]
  );

  const startSession = async () => {
    setIsModalOpen(false);
    setIsSessionStarted(true);
    setTimeElapsed(0);
    setStatus("Connecting...");
    setTotalPausedTime(0); // Reset pause time
    clearNoAudioHintTimer();
    setShowNoAudioHint(false);
    clearIdlePromptTimer();
    setShowIdlePrompt(false);

    try {
      const userId = await fetchUserId();
      const practiceCaseId = parseInt(id as string, 10);

      console.log("Starting voice conversation session", {
        practiceCaseId,
        userId,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
        timestamp: new Date().toISOString(),
      });

      const response = await fetchWithAuth("/api/conversations/conversation/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, practice_case_id: practiceCaseId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to start conversation");

      // compute numeric speed from the practiceCase setting
      const speed =
        typeof (practiceCase as any)?.speaking_speed_rate === "number"
          ? (practiceCase as any).speaking_speed_rate
          : mapSpeakingSpeedToRate((practiceCase as any)?.speaking_speed);

      conversationIdRef.current = data.conversation_id;
      const { client_secret } = await apiClient.createSession(userId, practiceCaseId, { speed });

      startNoAudioHintTimer();

      const handleRemoteStreamReady = (stream: MediaStream) => {
        console.log("Remote AI audio stream received", {
          tracks: stream.getAudioTracks().map((track) => ({
            id: track.id,
            label: track.label,
            muted: track.muted,
            enabled: track.enabled,
            readyState: track.readyState,
          })),
          timestamp: new Date().toISOString(),
        });
        clearNoAudioHintTimer();
        scheduleIdlePrompt(10000);
        setRemoteStream(stream);
        setStatus("Connected");
      };

      const { pc: peerConnection, dataChannel, localStream: stream } = await setupWebRTCConnection(
        client_secret,
        handleMessage,
        handleRemoteStreamReady
      );

      setLocalStream(stream);
      setPc(peerConnection);
      dataChannelRef.current = dataChannel; // Store data channel reference

      peerConnection.addEventListener("connectionstatechange", () => {
        console.log("Peer connection state changed", peerConnection.connectionState);
        if (peerConnection.connectionState === "connected") {
          setStatus("Connected");
        } else if (peerConnection.connectionState === "connecting") {
          setStatus("Connecting...");
        } else if (peerConnection.connectionState === "disconnected") {
          startNoAudioHintTimer();
          setStatus("Reconnecting...");
        } else if (peerConnection.connectionState === "failed") {
          clearNoAudioHintTimer();
          setStatus("Error");
          setError("The realtime connection dropped. Please refresh the page or try a different browser.");
        }
      });

      setStatus("Waiting for AI...");
    } catch (err) {
      console.error("Session error:", err);

      clearNoAudioHintTimer();

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
        
        // Show success message first
        setShowSuccessMessage(true);
        
        // Wait 2 seconds, then show feedback generation
        setTimeout(() => {
          setShowSuccessMessage(false);
          setIsWaitingForFeedback(true);
          
          // API call to end conversation
          fetchWithAuth(
            `/api/conversations/conversation/${conversationIdRef.current}/end`,
            { method: "POST" }
          )
          .then(response => response.json())
          .then(() => {
            // Navigate after a delay to let the feedback generation message show
            setTimeout(() => {
              navigate(`/feedback/${conversationIdRef.current}`);
            }, 2000);
          })
          .catch(err => {
            console.error("Error ending conversation:", err);
            // Navigate anyway after error
            setTimeout(() => {
              navigate(`/feedback/${conversationIdRef.current}`);
            }, 1000);
          });
          
        }, 2000);
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

  // --- NEW: pick the scenario image to show and pass it down ---
  const scenarioImageUrl = practiceCase?.image_url ?? null;

  // VoiceChat.tsx (top-level helper)
  const mapSpeakingSpeedToRate = (val?: 'slow' | 'normal' | 'fast'): number => {
    if (val === 'slow') return 0.9;   // min 0.25 allowed; pick what feels right
    if (val === 'fast') return 1.25;   // max 1.5 allowed
    return 1.0;                        // default
  };

  return (
    <>
      <StartSessionDialog
        open={isModalOpen}
        onOpenChange={handleModalClose}
        practiceCase={
          practiceCase
            ? { ...practiceCase, image_url: practiceCase.image_url ?? undefined }
            : null
        }
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

      {/* Success message */}
      <div className={`fixed inset-0 z-50 bg-black bg-opacity-20 flex items-center justify-center transition-opacity duration-500 ${showSuccessMessage ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: showSuccessMessage ? 1 : 0.8, opacity: showSuccessMessage ? 1 : 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <Card className="w-full max-w-md bg-white shadow-xl border-0">
            <CardContent className="p-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: showSuccessMessage ? 1 : 0 }}
                transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>
              <motion.h2 
                className="text-xl font-bold text-gray-800 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showSuccessMessage ? 1 : 0, y: showSuccessMessage ? 0 : 10 }}
                transition={{ delay: 0.3, duration: 0.3 }}
              >
                Conversation Successfully Ended!
              </motion.h2>
              <motion.p 
                className="text-gray-600"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: showSuccessMessage ? 1 : 0, y: showSuccessMessage ? 0 : 10 }}
                transition={{ delay: 0.4, duration: 0.3 }}
              >
                Great job! Your conversation has been recorded.
              </motion.p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {isTimeUp ? (
        <Card className="w-full max-w-md mx-auto p-6 text-center">
          <CardContent>
            <h2 className="text-lg font-semibold">Time's up! Submitting for evaluation...</h2>
          </CardContent>
        </Card>
      ) : isWaitingForFeedback ? (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-20 flex items-center justify-center transition-opacity duration-300">
          <Card className="w-full max-w-md bg-white shadow-lg">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold mb-2">Generating Your Feedback</h2>
              <p className="text-gray-600 mb-4">
                Let's take some time to look at the highlights of your conversation.
              </p>
              <div className="flex justify-center space-x-1 mt-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "600ms" }}></div>
              </div>
              <p className="text-gray-500 mt-2 text-sm">Please wait...</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        isSessionStarted && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: isExiting ? 0 : 1 }} 
          >
          <ConversationArea
            currentMessage={currentMessage}
            showHint={showHint}
            onToggleShowHint={() => setShowHint(!showHint)}
            stopSession={handleStopClick}
            status={status}
              error={error}
              practiceCase={practiceCase}
              remoteStream={remoteStream}
              timerMin={practiceCase?.min_time ?? 30}
              timerMax={practiceCase?.max_time ?? 300}
              timeElapsed={timeElapsed}
              onTimerUp={stopSession}
              canStop={minReached}
              onTick={setTimeElapsed}
              isEndingConversation={isEndingConversation}
              // New pause props
              isPaused={isPaused}
              onPause={pauseConversation}
              onResume={resumeConversation}
              totalPausedTime={totalPausedTime}
              // NEW: pass scenario image down
              scenarioImageUrl={scenarioImageUrl}
              connectionNotice={showNoAudioHint ? "Not hearing anything? Refresh the page or try switching to Chrome or Microsoft Edge." : null}
              onDismissConnectionNotice={dismissNoAudioHint}
              idlePrompt={showIdlePrompt ? "Try saying hello to get the conversation going." : null}
              onDismissIdlePrompt={() => dismissIdlePrompt(true)}
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
