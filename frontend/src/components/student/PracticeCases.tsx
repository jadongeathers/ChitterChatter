import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PracticeCaseCard from "./PracticeCaseCard"; 
import { fetchWithAuth } from "@/utils/api";

interface PracticeCase {
  id: number;
  title: string;
  description: string;
  min_time: number;
  max_time: number;
  completed?: boolean;
  accessible?: boolean;
  accessible_on?: string;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15
    }
  }
};

const PracticeCases = () => {
  const navigate = useNavigate();
  const [practiceCases, setPracticeCases] = useState<PracticeCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<PracticeCase | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPracticeCases = async () => {
      try {
        const response = await fetchWithAuth("/api/practice_cases/get_cases");
        if (!response.ok) throw new Error("Failed to fetch practice cases");
        const data: PracticeCase[] = await response.json();
        setPracticeCases(data);
      } catch (err) {
        console.error("Error fetching practice cases:", err);
        setError("Failed to load practice cases.");
      } finally {
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    fetchPracticeCases();
  }, []);

  return (
    <div>
      {isLoading ? (
        <div className="flex justify-center items-center h-32 text-lg font-semibold text-gray-500">
          Loading Practice Cases...
        </div>
      ) : practiceCases.length === 0 ? (
        <div className="text-center text-gray-600 text-lg font-medium">
          It looks like there are no cases published yet. Please wait for your instructor.
        </div>
      ) : (
        <motion.div 
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {practiceCases.map((practiceCase, index) => (
            <motion.div 
              key={practiceCase.id}
              variants={itemVariants}
              custom={index}
              layoutId={`case-${practiceCase.id}`}
            >
              <PracticeCaseCard
                practiceCase={practiceCase}
                onStart={(id) => navigate(`/practice/${id}`)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default PracticeCases;