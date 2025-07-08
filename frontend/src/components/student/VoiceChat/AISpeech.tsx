import React, { useRef, useEffect } from "react";

interface AISpeechProps {
  stream: MediaStream | null;
  isPaused: boolean; // Add this prop
}

const AISpeech: React.FC<AISpeechProps> = ({ stream, isPaused }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // ✅ ADD THIS USEEFFECT TO CONTROL PAUSE/PLAY
  useEffect(() => {
    if (!audioRef.current) return;

    if (isPaused) {
      audioRef.current.pause();
    } else {
      // When un-pausing, we ask the browser to play the audio again.
      audioRef.current.play().catch(error => {
        console.error("Error attempting to play audio:", error);
      });
    }
  }, [isPaused]); // This effect runs whenever the 'isPaused' prop changes

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!stream || !canvasRef.current || isPaused) return; // Also pause visualizer
    const audioCtx = new AudioContext();
    const analyser = audioCtx.createAnalyser();
    const source = audioCtx.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");
    if (!canvasCtx) return;

    let animationFrameId: number;

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
      gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.9)');
      gradient.addColorStop(1, 'rgba(147, 197, 253, 1)');

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let posX = 0;

      for (let i = 0; i < bufferLength; i++) {
        let barHeight = (dataArray[i] / 255) * canvas.height * 0.8;
        barHeight = Math.max(barHeight, 2); 
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(posX, canvas.height - barHeight, barWidth - 1, barHeight);
        posX += barWidth;
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      source.disconnect();
      analyser.disconnect();
      // Only close the context if it's not already closed
      if (audioCtx.state !== 'closed') {
        audioCtx.close();
      }
    };
  }, [stream, isPaused]); // Add isPaused to stop/start the visualizer

  return (
    <div className="relative">
      <audio ref={audioRef} autoPlay style={{ display: "none" }} />
      
      <div className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm">
        <div className="flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            width={300} 
            height={60} 
            className="rounded" 
            style={{ display: 'block' }}
          />
        </div>
        
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className={`w-1.5 h-1.5 bg-blue-500 rounded-full ${!isPaused && 'animate-pulse'}`}></div>
            <span>{isPaused ? 'Paused' : 'Audio Waveform'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISpeech;