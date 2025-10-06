// websocket.ts

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

const waitForIceGatheringComplete = (
  pc: RTCPeerConnection,
  timeoutMs = 4000
): Promise<RTCSessionDescriptionInit> => {
  if (pc.iceGatheringState === "complete" && pc.localDescription) {
    return Promise.resolve(pc.localDescription);
  }

  return new Promise((resolve, reject) => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      pc.removeEventListener("icecandidate", onCandidate);
      pc.removeEventListener("icegatheringstatechange", onStateChange);
      if (timeout) {
        clearTimeout(timeout);
      }
    };

    const finish = () => {
      const localDescription = pc.localDescription;
      if (localDescription) {
        cleanup();
        resolve(localDescription);
      } else {
        cleanup();
        reject(new Error("ICE gathering completed without a local description."));
      }
    };

    const onCandidate = (event: RTCPeerConnectionIceEvent) => {
      if (!event.candidate) {
        finish();
      }
    };

    const onStateChange = () => {
      if (pc.iceGatheringState === "complete") {
        finish();
      }
    };

    pc.addEventListener("icecandidate", onCandidate);
    pc.addEventListener("icegatheringstatechange", onStateChange);

    if (timeoutMs > 0) {
      timeout = setTimeout(() => {
        cleanup();
        if (pc.localDescription) {
          resolve(pc.localDescription);
        } else {
          reject(new Error("Timed out waiting for ICE gathering to complete."));
        }
      }, timeoutMs);
    }
  });
};

export const setupWebRTCConnection = async (
  clientSecret: string,
  onMessage: MessageCallback,
  onRemoteStream: (stream: MediaStream) => void
): Promise<{ pc: RTCPeerConnection; dataChannel: RTCDataChannel; localStream: MediaStream }> => {
  try {
    console.log("Setting up WebRTC connection...");
    console.log("Browser:", navigator.userAgent);

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    // Track pause state
    let isPaused = false;
    let pausedAudioQueue: any[] = [];

    // Track remote stream reception
    let remoteStreamReceived = false;

    // Monitor ICE connection state
    pc.oniceconnectionstatechange = () => {
      const state = pc.iceConnectionState;
      if (state === 'failed') {
        console.error("❌ ICE connection failed - likely network/firewall issue");
      } else if (state === 'connected') {
        console.log("🔌 ICE connection established");
      }
    };

    // Monitor peer connection state
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      if (state === 'failed') {
        console.error("❌ Peer connection failed");
      } else if (state === 'connected') {
        console.log("🔗 Peer connection established");
      }
    };

    // Monitor ICE gathering state
    pc.onicegatheringstatechange = () => {
      if (pc.iceGatheringState === 'complete') {
        console.log("🧊 ICE gathering complete");
      }
    };

    // Log ICE candidates as they're discovered
    pc.onicecandidate = () => {};

    // Incoming audio with enhanced logging
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        const audioTracks = stream.getAudioTracks();
        console.log(`✅ Remote stream received with ${audioTracks.length} audio track(s)`);
        remoteStreamReceived = true;
        onRemoteStream(stream);
      } else {
        console.error("❌ ontrack fired but no streams received");
      }
    };

    // Timeout for remote stream
    setTimeout(() => {
      if (!remoteStreamReceived) {
        console.error("❌ DIAGNOSTIC: No remote audio stream received after 10 seconds");
        console.error("This could indicate:");
        console.error("1. Network/firewall blocking WebRTC traffic");
        console.error("2. Browser extensions blocking connections");
        console.error("3. VPN interfering with peer connections");
        console.error("4. OpenAI API issues");
        console.error("Current ICE state:", pc.iceConnectionState);
        console.error("Current connection state:", pc.connectionState);
      }
    }, 10000);

    // Microphone
    let localStream: MediaStream;
    try {
      localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    } catch (err) {
      console.error("🚨 Microphone access denied:", err);
      throw new Error("Microphone access was denied. Please allow microphone permissions in your browser.");
    }

    // Data channel
    const dataChannel = pc.createDataChannel("oai-events");
    dataChannel.onopen = () => console.log("✅ Data channel opened");
    dataChannel.onclose = () => console.log("❌ Data channel closed");

    dataChannel.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as OpenAIMessage;

        if (isPaused) {
          if (message.type.includes("audio") || message.type.includes("speaking")) {
            pausedAudioQueue.push(message);
            return;
          }
        }

        // User speech transcription
        if (message.type === "conversation.item.input_audio_transcription.completed" && message.transcript) {
          console.log("📝 User Speech Transcription:", message.transcript);
          onMessage({ type: "speech", text: message.transcript, is_final: true });
        }

        // Assistant response text
        if (
          message.type === "response.output_item.done" &&
          message.item?.role === "assistant" &&
          message.item?.content?.[0]?.transcript
        ) {
          console.log("🤖 AI Response:", message.item.content[0].transcript);
          onMessage({ type: "assistant", text: message.item.content[0].transcript, is_final: true });
        }

        // Speaking state
        if (message.type === "response.output_audio.speaking") {
          onMessage({ type: "assistant", text: "", is_speaking: true });
        }
        if (message.type === "response.output_audio.speaking_done") {
          onMessage({ type: "assistant", text: "", is_speaking: false });
        }
      } catch (err) {
        console.error("❌ Error parsing message:", err);
      }
    };

    // Pause control plumbing
    const handlePauseControl = (paused: boolean) => {
      isPaused = paused;

      if (paused) {
        console.log("🔇 Conversation paused - muting audio tracks");
        localStream.getAudioTracks().forEach((track) => (track.enabled = false));
        try {
          if (dataChannel.readyState === "open") {
            dataChannel.send(JSON.stringify({ type: "conversation.pause", timestamp: Date.now() }));
          }
        } catch (error) {
          console.warn("Could not send pause signal to OpenAI:", error);
        }
      } else {
        console.log("🔊 Conversation resumed - unmuting audio tracks");
        localStream.getAudioTracks().forEach((track) => (track.enabled = true));
        try {
          if (dataChannel.readyState === "open") {
            dataChannel.send(JSON.stringify({ type: "conversation.resume", timestamp: Date.now() }));
          }
        } catch (error) {
          console.warn("Could not send resume signal to OpenAI:", error);
        }
        console.log(`Clearing ${pausedAudioQueue.length} queued messages`);
        pausedAudioQueue = [];
      }
    };

    // Expose pause control
    (dataChannel as any).pauseControl = handlePauseControl;

    // Create and send offer
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const localDescription = await waitForIceGatheringComplete(pc);
    const { sdp } = localDescription;

    if (!sdp) {
      throw new Error("Failed to create SDP offer");
    }

    // Realtime API (WebRTC SDP exchange)
    const baseUrl = "https://api.openai.com/v1/realtime";
    // Keep model consistent with your backend; either use the dated one or plain preview
    const model = "gpt-realtime";

    console.log(`Connecting to ${baseUrl}?model=${model}`);
    if (offer.sdp) {
      console.log("SDP offer ready to send:", offer.sdp.substring(0, 100) + "...");
    }

    // tiny retry helper
    const postSdp = async (): Promise<Response> => {
      return fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${clientSecret}`,
          "Content-Type": "application/sdp",
          "OpenAI-Beta": "realtime=v1", // <-- add this back
        },
        body: sdp,
      });
    };

    let response = await postSdp();

    // brief retry on 500s
    if (response.status >= 500) {
      const rid = response.headers.get("x-request-id");
      const body = await response.clone().text().catch(() => "");
      console.warn("OpenAI 5xx on SDP POST. Will retry shortly.", { status: response.status, rid, bodySnippet: body.slice(0, 200) });
      await new Promise(r => setTimeout(r, 600));
      response = await postSdp();
    }

    if (!response.ok) {
      const rid = response.headers.get("x-request-id");
      const body = await response.clone().text().catch(() => "");
      console.error(`OpenAI API error response: ${response.status} ${response.statusText} (x-request-id: ${rid ?? "n/a"})`, body);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // IMPORTANT: read the body ONCE
    const answerSdp = await response.text();
    console.log("Received SDP answer:", answerSdp.substring(0, 100) + "...");

    const answer: RTCSessionDescriptionInit = { type: "answer", sdp: answerSdp };
    await pc.setRemoteDescription(answer);
    console.log("Connection established");

    return { pc, dataChannel, localStream };
  } catch (error) {
    console.error("Error setting up WebRTC:", error);
    throw error;
  }
};
