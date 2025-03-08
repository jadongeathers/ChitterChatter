import React from 'react';

interface UserFiltersProps {
  selectedInstitution: string;
  setSelectedInstitution: (value: string) => void;
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedSection: string;
  setSelectedSection: (value: string) => void;
  showStudents: boolean;
  setShowStudents: (value: boolean) => void;
  showInstructors: boolean;
  setShowInstructors: (value: boolean) => void;
  applyFilters: () => void;
  clearFilters: () => void;
  filteredCount: number;
}

export const UserFilters: React.FC<UserFiltersProps> = ({
  selectedInstitution,
  setSelectedInstitution,
  selectedClass,
  setSelectedClass,
  selectedSection,
  setSelectedSection,
  showStudents,
  setShowStudents,
  showInstructors,
  setShowInstructors,
  applyFilters,
  clearFilters,
  filteredCount
}) => {
  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
      <h2 className="font-bold mb-2">Filters</h2>
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Institution"
          value={selectedInstitution}
          onChange={(e) => setSelectedInstitution(e.target.value)}
          className="border p-2 flex-1"
        />
        <input
          type="text"
          placeholder="Class Name"
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="border p-2 flex-1"
        />
        <input
          type="text"
          placeholder="Section"
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="border p-2 flex-1"
        />
        <button 
          onClick={applyFilters} 
          className="bg-blue-500 text-white p-2 rounded"
        >
          Apply Filters
        </button>
        <button 
          onClick={clearFilters} 
          className="bg-gray-300 text-gray-700 p-2 rounded"
        >
          Clear
        </button>
      </div>
      
      {/* User type filters */}
      <div className="flex items-center gap-4">
        <span className="font-medium">Show:</span>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showStudents} 
            onChange={() => setShowStudents(!showStudents)}
            className="h-4 w-4"
          />
          <span>Students</span>
        </label>
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox" 
            checked={showInstructors} 
            onChange={() => setShowInstructors(!showInstructors)}
            className="h-4 w-4"
          />
          <span>Instructors</span>
        </label>
        
        <div className="text-sm text-gray-500 ml-4">
          {filteredCount} users shown
          {showStudents && !showInstructors && " (students only)"}
          {!showStudents && showInstructors && " (instructors only)"}
        </div>
      </div>
    </div>
  );
};