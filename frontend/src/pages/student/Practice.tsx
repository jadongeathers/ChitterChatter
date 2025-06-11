import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PracticeCases from '@/components/student/PracticeCases';
import StudentClassAwareLayout from '@/components/student/StudentClassAwareLayout';
import { useStudentClass } from '@/contexts/StudentClassContext';

const Practice = () => {
  const { selectedClass } = useStudentClass();

  const getPageDescription = () => {
    if (selectedClass) {
      return `Select a practice case to start a conversation with your virtual practice partner.`;
    }
    return "Select a practice case to start a conversation with your virtual practice partner.";
  };

  return (
    <StudentClassAwareLayout
      title="Practice Cases"
      description={getPageDescription()}
    >
      {/* ✅ Render Practice Cases below */}
      <Routes>
        <Route index element={<PracticeCases />} />
      </Routes>
    </StudentClassAwareLayout>
  );
};

export default Practice;

