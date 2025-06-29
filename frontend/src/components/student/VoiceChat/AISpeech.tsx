import React, { useRef, useEffect } from "react";

interface AISpeechProps {
  stream: MediaStream | null;
}

const AISpeech: React.FC<AISpeechProps> = ({ stream }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (audioRef.current && stream) {
      audioRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    if (!stream || !canvasRef.current) return;
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

    const draw = () => {
      requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      
      // Clear canvas with a subtle background
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Create gradient for bars
      const gradient = canvasCtx.createLinearGradient(0, canvas.height, 0, 0);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)'); // Blue-500 with opacity
      gradient.addColorStop(0.5, 'rgba(96, 165, 250, 0.9)'); // Blue-400
      gradient.addColorStop(1, 'rgba(147, 197, 253, 1)'); // Blue-300

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let posX = 0;

      for (let i = 0; i < bufferLength; i++) {
        let barHeight = (dataArray[i] / 255) * canvas.height * 0.8; // Normalize and scale
        barHeight = Math.max(barHeight, 2); // Minimum height for visual appeal
        
        canvasCtx.fillStyle = gradient;
        canvasCtx.fillRect(
          posX, 
          canvas.height - barHeight, 
          barWidth - 1, // Small gap between bars
          barHeight
        );
        posX += barWidth;
      }
    };

    draw();

    return () => {
      source.disconnect();
      analyser.disconnect();
      audioCtx.close();
    };
  }, [stream]);

  return (
    <div className="relative">
      <audio ref={audioRef} autoPlay style={{ display: "none" }} />
      
      {/* Waveform Container */}
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
        
        {/* Audio indicator */}
        <div className="flex items-center justify-center mt-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Audio Waveform</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AISpeech;