import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion } from "framer-motion";

interface CaseAnalytics {
  id: number;
  title: string;
  studentsUsed: number;
  avgTimeSpent: number; // in seconds
  completionRate: number; // percentage
}

// 🔹 Convert seconds to "X min Y sec" format
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} min ${remainingSeconds} sec`;
};

const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<CaseAnalytics[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        const response = await fetchWithAuth("/api/instructors/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics");
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) return <p></p>;

  return (
    <div className="p-6 space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-base text-gray-600 mt-1">
          Track student usage and engagement with practice cases.
        </p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      {/* Analytics Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Table className="w-full border border-gray-300 rounded-lg text-lg">
          <TableHeader className="bg-gray-100 text-lg font-bold text-black">
            <TableRow>
              <TableHead className="p-4 text-left">Practice Case</TableHead>
              <TableHead className="p-4 text-center">Students Used</TableHead>
              <TableHead className="p-4 text-center">Avg Time Spent</TableHead>
              <TableHead className="p-4 text-center">Completion Rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {analytics.length > 0 ? (
              analytics.map((entry) => (
                <TableRow key={entry.id} className="bg-white hover:bg-gray-100">
                  <TableCell className="p-4">{entry.title}</TableCell>
                  <TableCell className="p-4 text-center">{entry.studentsUsed}</TableCell>
                  <TableCell className="p-4 text-center">{formatTime(entry.avgTimeSpent)}</TableCell>
                  <TableCell className="p-4 text-center">{entry.completionRate}%</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="p-4 text-lg text-center text-gray-500">
                  No data available.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default Analytics;
