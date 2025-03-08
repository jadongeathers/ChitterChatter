import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PracticeCases from '@/components/student/PracticeCases';

const Practice = () => {
  return (
    <div className="p-6 space-y-6">
      {/* ✅ Header  */}
      <div>
        <h1 className="text-2xl font-header tracking-tight">Practice Cases</h1>
        <p className="text-muted-foreground mt-1">
        Select a practice case to start a conversation with your virtual practice partner.
        </p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </div>

      {/* ✅ Render Practice Cases below */}
      <Routes>
        <Route index element={<PracticeCases />} />
      </Routes>
    </div>
  );
};

export default Practice;
