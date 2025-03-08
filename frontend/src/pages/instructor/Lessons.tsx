import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { fetchWithAuth } from "@/utils/api";
import PracticeCaseCard from "@/components/instructor/PracticeCaseCard";
import { motion, AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  completed?: boolean;
}

const Lessons: React.FC = () => {
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPracticeCases = async () => {
      try {
        const response = await fetchWithAuth("/api/practice_cases/get_cases");
        if (!response.ok) throw new Error("Failed to fetch practice cases");
        const data: PracticeCase[] = await response.json();
        setPracticeCases(data);
      } catch (err) {
        console.error("Error fetching practice cases:", err);
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    fetchPracticeCases();
  }, []);

  // Navigate to the new case creation page
  const handleAddCase = () => {
    navigate("/instructor/review/new");
  };

  return (
    <div className="p-6 space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Lessons</h1>
        <p className="text-gray-600 mt-1">Manage and edit your practice cases</p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      {isLoading ? (
        <div className="flex justify-center items-center h-32 text-lg font-semibold text-gray-500">
          Loading Practice Cases...
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
        <AnimatePresence>
            {practiceCases.map((practiceCase) => (
            <PracticeCaseCard
                key={practiceCase.id}
                practiceCase={practiceCase}
            />
            ))}

            {/* Add a Case Card */}
            <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="flex"
            >
            <div
                onClick={handleAddCase}
                className="hover:shadow-lg transition-shadow cursor-pointer flex items-center justify-center border-2 border-dashed border-blue-400 rounded-lg p-6 h-full w-full"
            >
                <div className="flex flex-col items-center text-center space-y-2">
                <Plus className="h-12 w-12 text-blue-500" />
                <div className="text-lg font-medium text-blue-500">Add a Case</div>
                </div>
            </div>
            </motion.div>
        </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default Lessons;
