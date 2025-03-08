import React from "react";

interface PerformanceData {
  date: string;
  averageScore: number;
}

interface PerformanceTrendsProps {
  performanceData: PerformanceData[];
}

const PerformanceTrends: React.FC<PerformanceTrendsProps> = ({ performanceData }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold">Performance Trends</h2>
    </div>
  );
};

export default PerformanceTrends;
