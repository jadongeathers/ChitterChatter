import React, { useEffect, useState, useRef } from "react";

interface TimerProps {
  minTime: number;
  maxTime: number;
  onTimeUp: () => void;
  onMinReached?: () => void;
  onWarning?: () => void;
  onTick?: (elapsed: number) => void;
  startTimer: boolean;
  isPaused?: boolean;
  totalPausedTime?: number;
}

const Timer: React.FC<TimerProps> = ({
  minTime,
  maxTime,
  onMinReached,
  onWarning,
  onTimeUp,
  onTick,
  startTimer,
  isPaused = false,
  totalPausedTime = 0,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // This effect now handles all timer logic based on props
    if (!startTimer) {
      // Reset everything if the timer shouldn't be running
      startTimeRef.current = null;
      setElapsed(0);
      setWarningShown(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    // If paused, just clear the interval and do nothing else
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    
    const updateTimer = () => {
      if (startTimeRef.current === null) return;
      
      const now = Date.now();
      const totalElapsedMs = now - startTimeRef.current;
      // ✅ FIX: The calculation now directly and reliably uses the prop from the parent
      const elapsedSeconds = Math.floor(totalElapsedMs / 1000) - totalPausedTime;
      
      setElapsed(Math.max(0, elapsedSeconds));
    };

    updateTimer(); // Update immediately on start or resume
    intervalRef.current = setInterval(updateTimer, 1000); // Set interval for subsequent ticks

    // Cleanup function to clear the interval
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer, isPaused, totalPausedTime]); // Re-run effect when any of these props change

  useEffect(() => {
    // This separate effect handles the side-effects of the elapsed time changing
    if (!startTimer) return;

    onTick?.(elapsed);

    if (elapsed >= minTime) {
      onMinReached?.();
    }

    if (!warningShown && maxTime - elapsed <= 30 && elapsed > 0) {
      onWarning?.();
      setWarningShown(true);
    }

    if (elapsed >= maxTime) {
      onTimeUp();
    }
  }, [elapsed, startTimer, minTime, maxTime, onMinReached, onWarning, onTimeUp, onTick, warningShown]);

  // Format the elapsed time as MM:SS
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

  return (
    <div className="text-lg font-bold">
      {formattedTime}
      {isPaused && <span className="ml-1 text-sm">⏸</span>}
    </div>
  );
};

export default Timer;