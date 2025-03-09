// websocket.ts

interface MessageCallback {
  (message: { type: string; text: string; is_final?: boolean }): void;
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
  sessionId: string,
  onMessage: MessageCallback,
  onRemoteStream: (stream: MediaStream) => void
): Promise<{ pc: RTCPeerConnection; dataChannel: RTCDataChannel, localStream: MediaStream }> => {
  try {
    console.log("Setting up WebRTC connection...");
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });

    // Instead of creating and appending an audio element,
    // we use the onRemoteStream callback.
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

    // Before sending the offer
    console.log("SDP being sent:", offer.sdp);

    // Connect to the WebSocket with the session ID
    const wsUrl = `wss://api.openai.com/v1/realtime/sessions/${sessionId}/ws`;
    console.log("Connecting to WebSocket:", wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    // Create a promise to handle the WebSocket connection and SDP exchange
    const connectionPromise = new Promise<void>((resolve, reject) => {
      // Set timeout for connection
      const connectionTimeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, 10000);
      
      ws.onopen = () => {
        console.log("WebSocket connection opened");
        clearTimeout(connectionTimeout);
        
        // Send the SDP offer over the WebSocket
        ws.send(JSON.stringify({
          type: "offer",
          sdp: offer.sdp
        }));
      };
      
      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message:", data);
          
          if (data.type === "answer" && data.sdp) {
            const answer: RTCSessionDescriptionInit = {
              type: "answer",
              sdp: data.sdp
            };
            await pc.setRemoteDescription(answer);
            console.log("Remote description set with answer from WebSocket");
            resolve();
          }
        } catch (err) {
          console.error("Error handling WebSocket message:", err);
          reject(err);
        }
      };
      
      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        clearTimeout(connectionTimeout);
        reject(error);
      };
      
      ws.onclose = (event) => {
        console.log(`WebSocket closed with code ${event.code} and reason ${event.reason}`);
        if (connectionTimeout) {
          clearTimeout(connectionTimeout);
          reject(new Error(`WebSocket closed: ${event.reason}`));
        }
      };
    });
    
    // Wait for the connection to be established
    await connectionPromise;
    console.log("Connection established");

    return { pc, dataChannel, localStream };
  } catch (error) {
    console.error("Error setting up WebRTC:", error);
    throw error;
  }
};