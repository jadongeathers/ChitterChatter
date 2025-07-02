import React, { useEffect, useState, useRef } from "react";

interface TimerProps {
  minTime: number;
  maxTime: number;
  onTimeUp: () => void;
  onMinReached?: () => void;
  onWarning?: () => void;
  onTick?: (elapsed: number) => void;
  startTimer: boolean;
}

const Timer: React.FC<TimerProps> = ({
  minTime,
  maxTime,
  onMinReached,
  onWarning,
  onTimeUp,
  onTick,
  startTimer,
}) => {
  const [elapsed, setElapsed] = useState(0);
  const [warningShown, setWarningShown] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!startTimer) {
      // Reset when timer is stopped
      startTimeRef.current = null;
      setElapsed(0);
      setWarningShown(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Set start time when timer begins
    if (startTimeRef.current === null) {
      startTimeRef.current = Date.now();
    }

    const updateTimer = () => {
      if (startTimeRef.current === null) return;
      
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTimeRef.current) / 1000);
      
      setElapsed(prevElapsed => {
        // Only update if the elapsed time has actually changed
        if (prevElapsed === elapsedSeconds) return prevElapsed;
        
        console.log("elapsed:", elapsedSeconds);

        // Notify when minimum time is reached
        if (prevElapsed < minTime && elapsedSeconds >= minTime) {
          console.log("Timer: minimum time reached");
          onMinReached && onMinReached();
        }

        // Show warning if only 30 seconds remain
        if (!warningShown && maxTime - elapsedSeconds <= 30) {
          console.log("Timer: warning! Only 30 seconds remain.");
          onWarning && onWarning();
          setWarningShown(true);
        }

        // When maxTime is reached, call onTimeUp and stop the timer
        if (elapsedSeconds >= maxTime) {
          console.log("Timer: max time reached");
          onTimeUp();
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return maxTime;
        }

        return elapsedSeconds;
      });
    };

    // Update immediately
    updateTimer();

    // Set up interval
    intervalRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTimer, minTime, maxTime, onMinReached, onWarning, onTimeUp, warningShown]);

  // Separate effect to notify parent after elapsed state updates
  useEffect(() => {
    if (onTick) {
      onTick(elapsed);
    }
  }, [elapsed, onTick]);

  // Format the elapsed time as MM:SS
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const formattedTime = `${minutes}:${seconds < 10 ? "0" + seconds : seconds}`;

  return <div className="text-lg font-bold">{formattedTime}</div>;
};

export default Timer;