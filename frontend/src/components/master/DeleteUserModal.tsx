import React, { useState } from 'react';
import { User } from './types';
import { fetchWithAuth } from '@/utils/api';

interface DeleteUserModalProps {
  user: User;
  onClose: () => void;
  onDelete: (userId: number) => void;
}

export const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  user,
  onClose,
  onDelete
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const deleteUser = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      const res = await fetchWithAuth(`/api/master/delete_user/${user.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server returned ${res.status}: ${res.statusText}`);
      }

      onDelete(user.id);
      
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
  const displayName = fullName || user.email;
  const confirmationPhrase = "delete user";
  const isConfirmed = confirmText.toLowerCase() === confirmationPhrase;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6">
        <h3 className="text-xl font-bold text-red-600 mb-4">Delete User</h3>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <p className="mb-4">
            Are you sure you want to delete <span className="font-semibold">{displayName}</span>?
          </p>
          
          <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
            <p className="font-medium">Warning!</p>
            <p>This action cannot be undone. The user will be permanently removed from the system.</p>
            <p className="mt-2">All associated data will be lost, including:</p>
            <ul className="list-disc list-inside ml-2">
              <li>User profile information</li>
              <li>Session history</li>
              <li>Participation records</li>
            </ul>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm">
              Type "{confirmationPhrase}" to confirm:
            </label>
            <input
              type="text"
              id="confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full border p-2 rounded"
              disabled={isSubmitting}
              placeholder={confirmationPhrase}
            />
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
            onClick={deleteUser}
            disabled={isSubmitting || !isConfirmed}
            className={`px-4 py-2 rounded ${
              isSubmitting || !isConfirmed
                ? 'bg-gray-300 text-gray-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isSubmitting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};