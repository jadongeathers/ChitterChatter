import React, { useState } from 'react';
import { User } from './types';
import { fetchWithAuth } from '@/utils/api';

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSave: (userId: number, updatedUser: Partial<User>) => void;
}

export const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSave
}) => {
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    institution: user.institution || '',
    class_name: user.class_name || '',
    section: user.section || '',
    is_student: user.is_student
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const updateUser = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const res = await fetchWithAuth(`/api/master/update_user/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server returned ${res.status}: ${res.statusText}`);
      }

      onSave(user.id, formData);
      
    } catch (error) {
      console.error('Error updating user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasChanges = () => {
    return (
      formData.first_name !== user.first_name ||
      formData.last_name !== user.last_name ||
      formData.email !== user.email ||
      formData.institution !== user.institution ||
      formData.class_name !== user.class_name ||
      formData.section !== user.section ||
      formData.is_student !== user.is_student
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full p-6">
        <h3 className="text-xl font-bold mb-4">Edit User Information</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-2 rounded"
              disabled={isSubmitting}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="institution">Institution</label>
              <input
                type="text"
                id="institution"
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="class_name">Class</label>
              <input
                type="text"
                id="class_name"
                name="class_name"
                value={formData.class_name}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="section">Section</label>
              <input
                type="text"
                id="section"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className="w-full border p-2 rounded"
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_student"
              name="is_student"
              checked={formData.is_student}
              onChange={handleChange}
              className="h-4 w-4"
              disabled={isSubmitting}
            />
            <label className="text-sm font-medium" htmlFor="is_student">
              Is Student
            </label>
            <span className="text-xs text-gray-500">
              (Unchecked means instructor)
            </span>
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
            onClick={updateUser}
            disabled={isSubmitting || !hasChanges()}
            className={`px-4 py-2 rounded ${
              isSubmitting || !hasChanges()
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