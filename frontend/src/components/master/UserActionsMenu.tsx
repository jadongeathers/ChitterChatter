import React, { useState, useRef, useEffect } from 'react';
import { User } from './types';

interface UserActionsMenuProps {
  user: User;
  onEditAccessGroup: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export const UserActionsMenu: React.FC<UserActionsMenuProps> = ({
  user,
  onEditAccessGroup,
  onEditUser,
  onDeleteUser
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="p-1 rounded-full hover:bg-gray-200"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="User actions"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 py-1 border">
          <button
            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => {
              onEditUser(user);
              setIsOpen(false);
            }}
          >
            Edit User Information
          </button>
          
          {user.is_student && (
            <button
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                onEditAccessGroup(user);
                setIsOpen(false);
              }}
            >
              Change Access Group
            </button>
          )}
          
          <button
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            onClick={() => {
              onDeleteUser(user);
              setIsOpen(false);
            }}
          >
            Delete User
          </button>
        </div>
      )}
    </div>
  );
};