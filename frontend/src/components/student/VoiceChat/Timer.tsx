import React, { useEffect, useState } from "react";

interface TimerProps {
  minTime: number;
  maxTime: number;
  onTimeUp: () => void;
  onMinReached?: () => void;
  onWarning?: () => void;
  onTick?: (elapsed: number) => void;
  startTimer: boolean; // New prop to control starting the timer
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

  useEffect(() => {
    // Only start the timer if startTimer is true
    if (!startTimer) return;

    const intervalId = setInterval(() => {
      setElapsed((prevElapsed) => {
        const nextElapsed = prevElapsed + 1;
        console.log("elapsed:", nextElapsed);

        // Notify when minimum time is reached
        if (prevElapsed < minTime && nextElapsed >= minTime) {
          console.log("Timer: minimum time reached");
          onMinReached && onMinReached();
        }

        // Show warning if only 30 seconds remain
        if (!warningShown && maxTime - nextElapsed <= 30) {
          console.log("Timer: warning! Only 30 seconds remain.");
          onWarning && onWarning();
          setWarningShown(true);
        }

        // When maxTime is reached, call onTimeUp and stop the timer
        if (nextElapsed >= maxTime) {
          console.log("Timer: max time reached");
          onTimeUp();
          clearInterval(intervalId);
          return maxTime;
        }

        return nextElapsed;
      });
    }, 1000);

    return () => clearInterval(intervalId);
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
