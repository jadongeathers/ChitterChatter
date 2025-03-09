// websocket.ts
import { fetchWithAuth } from "@/utils/api";

interface MessageCallback {
  (message: { type: string; text: string; is_final?: boolean; is_speaking?: boolean }): void;
}

interface OpenAIMessage {
  type: string;
  event_id: string;
  text?: string;
  transcript?: string;
  audio_start_ms?: number;
  audio_end_ms?: number;
  item?: {
    id: string;
    role: string;
    content: Array<{
      type: string;
      text?: string;
      transcript?: string;
    }>;
  };
}

export const setupWebRTCConnection = async (
  clientSecret: string,
  onMessage: MessageCallback,
  onRemoteStream: (stream: MediaStream) => void
): Promise<{ pc: RTCPeerConnection; dataChannel: RTCDataChannel, localStream: MediaStream }> => {
  try {
    console.log("Setting up WebRTC connection...");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Handle incoming audio stream from OpenAI
    pc.ontrack = (event) => {
      console.log("Received audio track");
      if (event.streams && event.streams[0]) {
        onRemoteStream(event.streams[0]);
      }
    };

    // Handle microphone setup
    let localStream: MediaStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Add tracks to the WebRTC connection
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    } catch (err) {
      console.error("🚨 Microphone access denied:", err);
      throw new Error(
        "Microphone access was denied. Please allow microphone permissions in your browser."
      );
    }

    // Set up data channel for OpenAI responses
    const dataChannel = pc.createDataChannel("oai-events");
    dataChannel.onopen = () => console.log("✅ Data channel opened");
    dataChannel.onclose = () => console.log("❌ Data channel closed");

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as OpenAIMessage;
        console.log("Message type:", message.type);
        console.log(message);

        // Handle transcription message:
        if (
          message.type === "conversation.item.input_audio_transcription.completed" &&
          message.transcript
        ) {
          console.log("📝 User Speech Transcription:", message.transcript);
          onMessage({
            type: "speech",
            text: message.transcript,
            is_final: true,
          });
        }

        // Handle assistant response:
        if (
          message.type === "response.output_item.done" &&
          message.item?.role === "assistant" &&
          message.item?.content?.[0]?.transcript
        ) {
          console.log("🤖 AI Response:", message.item.content[0].transcript);
          onMessage({
            type: "assistant",
            text: message.item.content[0].transcript,
            is_final: true,
          });
        }
        
        // Handle speaking state
        if (message.type === "response.output_audio.speaking") {
          onMessage({
            type: "assistant",
            text: "",
            is_speaking: true
          });
        }
        
        if (message.type === "response.output_audio.speaking_done") {
          onMessage({
            type: "assistant",
            text: "",
            is_speaking: false
          });
        }
      } catch (err) {
        console.error("❌ Error parsing message:", err);
      }
    };

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    if (!offer.sdp) {
      throw new Error("Failed to create SDP offer");
    }

    // Direct connection to OpenAI's Realtime API
    // This is the correct URL format according to OpenAI's documentation
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    
    console.log(`Connecting to ${baseUrl}?model=${model}`);
    console.log("SDP offer ready to send:", offer.sdp.substring(0, 100) + "...");

    const response = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error response:", errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const answerSdp = await response.text();
    console.log("Received SDP answer:", answerSdp.substring(0, 100) + "...");
    
    const answer: RTCSessionDescriptionInit = {
      type: "answer",
      sdp: answerSdp,
    };

    await pc.setRemoteDescription(answer);
    console.log("Connection established");

    return { pc, dataChannel, localStream };
  } catch (error) {
    console.error("Error setting up WebRTC:", error);
    throw error;
  }
};