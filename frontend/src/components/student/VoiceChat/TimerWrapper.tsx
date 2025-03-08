import React from "react";
import Timer from "./Timer";
import { Clock } from "lucide-react";

interface TimerWrapperProps {
  minTime: number;
  maxTime: number;
  onTimeUp: () => void;
  onTick?: (elapsed: number) => void;
  startTimer: boolean; // New prop
}

const TimerWrapper: React.FC<TimerWrapperProps> = ({ minTime, maxTime, onTimeUp, onTick, startTimer }) => {
  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="w-30 h-16 bg-white rounded flex items-center justify-between px-4">
        <Clock className="w-6 h-6 mr-2 text-gray-600" />
        <div className="text-lg font-semibold text-gray-700">
          <Timer 
            minTime={minTime} 
            maxTime={maxTime} 
            onTimeUp={onTimeUp} 
            onTick={onTick}  // Pass the onTick callback
            startTimer={startTimer} // Pass the startTimer flag
          />
        </div>
      </div>
    </div>
  );
};

export default TimerWrapper;
