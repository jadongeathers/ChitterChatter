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

    const response = await fetch("https://api.openai.com/v1/realtime", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${clientSecret}`,
        "Content-Type": "application/sdp",
      },
      body: offer.sdp,
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const answerSdp = await response.text();
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
