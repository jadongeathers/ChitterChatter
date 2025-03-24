import React, { useState } from 'react';
import { User } from './types';
import { fetchWithAuth } from "@/utils/api";

interface EditAccessGroupModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: number, newAccessGroup: string) => void;
}

export const EditAccessGroupModal: React.FC<EditAccessGroupModalProps> = ({ 
  user, 
  onClose,
  onSave
}) => {
  const [newAccessGroup, setNewAccessGroup] = useState<string>(user.access_group || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateAccessGroup = async () => {
    if (!newAccessGroup) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const res = await fetchWithAuth(`/api/master/update_access_group/${user.id}`, {
        method: "PUT",
        body: JSON.stringify({
          access_group: newAccessGroup
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server returned ${res.status}: ${res.statusText}`);
      }

      onSave(user.id, newAccessGroup);
      
    } catch (error) {
      console.error("Error updating access group:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold mb-4">Change Access Group</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <p className="mb-4">
          Update access group for <span className="font-medium">{user.first_name} {user.last_name}</span>
        </p>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Access Group</label>
          <select
            value={newAccessGroup}
            onChange={(e) => setNewAccessGroup(e.target.value)}
            className="w-full border p-2 rounded"
            disabled={isSubmitting}
          >
            <option value="A">Group A</option>
            <option value="B">Group B</option>
            <option value="All">All Access</option>
            <option value="Normal">Normal Access</option>
          </select>
          
          <div className="mt-3 text-sm text-gray-600">
            <p><strong>Group A:</strong> Access from March 10 to March 30</p>
            <p><strong>Group B:</strong> Access from April 7 to April 27</p>
            <p><strong>All:</strong> Unlimited access (typically for instructors)</p>
            <p><strong>Normal:</strong> Access until April 27</p>
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200"
          >
            Cancel
          </button>
          <button 
            onClick={updateAccessGroup}
            disabled={isSubmitting || !newAccessGroup || newAccessGroup === user.access_group}
            className={`px-4 py-2 rounded ${
              isSubmitting || !newAccessGroup || newAccessGroup === user.access_group
                ? 'bg-gray-300 text-gray-700'
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};