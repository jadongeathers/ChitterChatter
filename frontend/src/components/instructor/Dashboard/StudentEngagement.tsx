import React from "react";

interface Student {
  id: number;
  name: string;
  sessionsCompleted: number;
  lastActive: string;
}

interface StudentEngagementProps {
  engagementData: Student[];
}

const StudentEngagement: React.FC<StudentEngagementProps> = ({ engagementData }) => {
  return (
    <div className="p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-lg font-semibold">Student Engagement</h2>
      <table className="w-full mt-4 border-collapse">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Student</th>
            <th className="border p-2">Sessions Completed</th>
            <th className="border p-2">Last Active</th>
          </tr>
        </thead>
        <tbody>
          {engagementData.length === 0 ? (
            <tr>
              <td colSpan={3} className="border p-2 text-center text-gray-500">
                No student data available.
              </td>
            </tr>
          ) : (
            engagementData.map((student) => (
              <tr key={student.id} className="text-center">
                <td className="border p-2">{student.name}</td>
                <td className="border p-2">{student.sessionsCompleted}</td>
                <td className="border p-2">{student.lastActive}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudentEngagement;
