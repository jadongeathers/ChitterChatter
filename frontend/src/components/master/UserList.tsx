import React from 'react';
import { ClassGroup, User } from './types';
import { UserActionsMenu } from './UserActionsMenu';

interface UserListProps {
  groupedUsers: ClassGroup[];
  loading: boolean;
  onEditAccessGroup: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

export const UserList: React.FC<UserListProps> = ({
  groupedUsers,
  loading,
  onEditAccessGroup,
  onEditUser,
  onDeleteUser
}) => {
  return (
    <div className="mt-6">
      <h2 className="font-bold text-xl mb-4">
        Users ({groupedUsers.flatMap(g => g.classes.flatMap(c => c.sections.flatMap(s => s.students))).length})
      </h2>
      
      {loading && <p className="text-gray-500">Refreshing user data...</p>}
      
      {!loading && groupedUsers.length === 0 && (
        <p className="text-gray-500">No users found. Try clearing your filters or adding new users.</p>
      )}
      
      {groupedUsers.length > 0 && (
        <div className="space-y-6">
          {groupedUsers.map((group) => (
            <div key={group.institution} className="border rounded-lg overflow-hidden">
              <div className="bg-gray-200 p-3 font-bold">{group.institution}</div>
              
              {group.classes.map((classGroup) => (
                <div key={`${group.institution}-${classGroup.class_name}`} className="border-t">
                  <div className="bg-gray-100 p-3 font-semibold">Class: {classGroup.class_name}</div>
                  
                  {classGroup.sections.map((sectionGroup) => (
                    <div key={`${group.institution}-${classGroup.class_name}-${sectionGroup.section}`} className="border-t">
                      <div className="bg-gray-50 p-2 pl-4 font-medium">Section: {sectionGroup.section}</div>
                      
                      <ul className="divide-y">
                        {sectionGroup.students.map((user) => (
                          <UserListItem 
                            key={user.id} 
                            user={user} 
                            onEditAccessGroup={onEditAccessGroup}
                            onEditUser={onEditUser}
                            onDeleteUser={onDeleteUser}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface UserListItemProps {
  user: User;
  onEditAccessGroup: (user: User) => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ 
  user, 
  onEditAccessGroup,
  onEditUser,
  onDeleteUser
}) => {
  return (
    <li className="p-3 pl-6 hover:bg-gray-50">
      <div className="flex justify-between">
        <div className="flex items-center">
          <span className="font-medium">
            {user.first_name} {user.last_name}
            {!user.first_name && !user.last_name && (
              <span className="italic text-gray-500">Unregistered</span>
            )}
          </span>
          
          <span className={`ml-3 px-2 py-1 text-xs rounded-full ${
            user.is_student ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
          }`}>
            {user.is_student ? "Student" : "Instructor"}
          </span>
          
          {user.access_group && (
            <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
              user.access_group === "A" ? "bg-green-100 text-green-700" :
              user.access_group === "B" ? "bg-yellow-100 text-yellow-700" :
              "bg-red-100 text-red-700"
            }`}>
              Group {user.access_group}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-gray-500">{user.email}</div>
          
          <UserActionsMenu 
            user={user}
            onEditAccessGroup={onEditAccessGroup}
            onEditUser={onEditUser}
            onDeleteUser={onDeleteUser}
          />
        </div>
      </div>
    </li>
  );
};