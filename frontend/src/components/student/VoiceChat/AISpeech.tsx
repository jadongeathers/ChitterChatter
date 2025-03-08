import React, { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

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
      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 1.2;
      let posX = 0;

      for (let i = 0; i < bufferLength; i++) {
        let barHeight = dataArray[i] / 5;
        barHeight = Math.min(barHeight, canvas.height);
        canvasCtx.fillStyle = `rgb(50, 120, 255)`;
        canvasCtx.fillRect(posX, canvas.height - barHeight, barWidth, barHeight);
        posX += barWidth + 1;
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
    // Removed padding from Card and used inline styles for exact sizing.
    <Card style={{ width: "260px", height: "60px" }} className="border flex justify-center items-center">
      {/* Only one level of padding is applied here (10px) */}
      <CardContent
        className="flex justify-center items-center"
        style={{ padding: "5px", width: "100%", height: "100%" }}
        >
        <audio ref={audioRef} autoPlay style={{ display: "none" }} />
        <canvas ref={canvasRef} width={250} height={50} className="rounded-md" />
        </CardContent>
    </Card>
  );
};

export default AISpeech;
