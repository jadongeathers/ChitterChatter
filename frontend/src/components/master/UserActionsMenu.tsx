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
  
  // Handle click outside to close the menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);
  
  const toggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };
  
  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={toggleMenu}
        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-200"
        aria-label="User actions"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="19" r="1" />
        </svg>
      </button>
      
      {isOpen && (
        <div 
          className="absolute bottom-full right-0 mb-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-1" role="menu" aria-orientation="vertical">
            <button
              className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
              onClick={() => {
                onEditUser(user);
                setIsOpen(false);
              }}
            >
              Edit User
            </button>
            
            {user.is_student && (
              <button
                className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-100 focus:outline-none"
                onClick={() => {
                  onEditAccessGroup(user);
                  setIsOpen(false);
                }}
              >
                Change Access Group
              </button>
            )}
            
            <button
              className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100 focus:outline-none"
              onClick={() => {
                onDeleteUser(user);
                setIsOpen(false);
              }}
            >
              Delete User
            </button>
          </div>
        </div>
      )}
    </div>
  );
};