// src/components/master/SectionDetailView.tsx
import React, { useState, useEffect } from 'react';
import { fetchWithAuth } from "@/utils/api";
import { Section } from '@/services/masterService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AddUserToSectionForm from './AddUserToSectionForm';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url: string;
  is_student: boolean;
  role?: string; // role in the enrollment (student, instructor, TA)
  enrollment_id?: number;
}

interface SectionDetailViewProps {
  section: Section;
  classId: number;
  termId: number;
  institutionId: number;
  institutionName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
  onReload: () => void;
}

const SectionDetailView: React.FC<SectionDetailViewProps> = ({
  section,
  classId,
  termId,
  institutionId,
  institutionName,
  onSuccess,
  onError,
  onReload
}) => {
  const [enrolledUsers, setEnrolledUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddUserForm, setShowAddUserForm] = useState(false);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    loadEnrolledUsers();
  }, [section.id]);

  const loadEnrolledUsers = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`/api/master/section-enrollments?section_id=${section.id}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setEnrolledUsers(data);
    } catch (err) {
      onError('Failed to load enrolled users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveUser = async (userId: number) => {
    if (!confirm("Are you sure you want to remove this user from the section?")) {
      return;
    }
  
    try {
      // Use the composite key format for the endpoint
      const response = await fetchWithAuth(`/api/master/enrollments/${userId}/${section.id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      // Update the UI by removing this user
      setEnrolledUsers(enrolledUsers.filter(u => u.id !== userId));
      onSuccess('User removed from section');
    } catch (err) {
      onError('Failed to remove user');
      console.error(err);
    }
  };

  const handleUserAdded = () => {
    loadEnrolledUsers();
    setShowAddUserForm(false);
    onSuccess('User added to section');
  };

  // Filter users by role for the tabs
  const students = enrolledUsers.filter(user => user.role === 'student');
  const instructors = enrolledUsers.filter(user => user.role === 'instructor');
  const teachingAssistants = enrolledUsers.filter(user => user.role === 'ta');

  if (isLoading && enrolledUsers.length === 0) {
    return <div className="py-4">Loading section details...</div>;
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="students">
              Students ({students.length})
            </TabsTrigger>
            <TabsTrigger value="instructors">
              Instructors ({instructors.length})
            </TabsTrigger>
            <TabsTrigger value="tas">
              Teaching Assistants ({teachingAssistants.length})
            </TabsTrigger>
          </TabsList>
          
          <Button onClick={() => setShowAddUserForm(!showAddUserForm)}>
            {showAddUserForm ? 'Cancel' : 'Add User'}
          </Button>
        </div>
        
        {showAddUserForm && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Add User to Section</CardTitle>
            </CardHeader>
            <CardContent>
              <AddUserToSectionForm
                sectionId={section.id}
                institutionId={institutionId}
                institutionName={institutionName}
                onSuccess={handleUserAdded}
                onError={onError}
                onCancel={() => setShowAddUserForm(false)}
              />
            </CardContent>
          </Card>
        )}

        <TabsContent value="students" className="mt-6">
          {students.length === 0 ? (
            <p>No students enrolled in this section.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map(user => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  onRemove={() => handleRemoveUser(user.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="instructors" className="mt-6">
          {instructors.length === 0 ? (
            <p>No instructors assigned to this section.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {instructors.map(user => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  onRemove={() => handleRemoveUser(user.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="tas" className="mt-6">
          {teachingAssistants.length === 0 ? (
            <p>No teaching assistants assigned to this section.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teachingAssistants.map(user => (
                <UserCard 
                  key={user.id} 
                  user={user} 
                  onRemove={() => handleRemoveUser(user.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// User card component
const UserCard: React.FC<{ user: User; onRemove: () => void }> = ({ user, onRemove }) => {
  return (
    <Card className="p-4">
      <div className="flex items-center space-x-4">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200">
          {user.profile_picture_url && (
            <img 
              src={user.profile_picture_url} 
              alt={`${user.first_name}'s profile`} 
              className="h-full w-full object-cover"
            />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium">{user.first_name} {user.last_name}</h4>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={onRemove}>
          Remove
        </Button>
      </div>
    </Card>
  );
};

export default SectionDetailView;