// src/components/master/AddUserToSectionForm.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { fetchWithAuth } from "@/utils/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Search, User as UserIcon, Mail, Building } from "lucide-react";

interface AddUserToSectionFormProps {
  sectionId: number;
  institutionId: number;
  institutionName: string;
  onSuccess: () => void;
  onError: (message: string) => void;
  onCancel: () => void;
}

type UserRole = 'student' | 'instructor' | 'ta';

interface ExistingUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  institution?: string;
  is_student: boolean;
  is_registered: boolean;
}

const AddUserToSectionForm: React.FC<AddUserToSectionFormProps> = ({
  sectionId,
  institutionId,
  institutionName,
  onSuccess,
  onError,
  onCancel
}) => {
  // Form state
  const [addType, setAddType] = useState<'existing' | 'new'>('existing');
  const [role, setRole] = useState<UserRole>('student');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingUsers, setExistingUsers] = useState<ExistingUser[]>([]);

  // Load existing users when switching to existing mode
  useEffect(() => {
    if (addType === 'existing') {
      loadExistingUsers();
    }
  }, [addType]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return existingUsers;
    
    const query = searchQuery.toLowerCase();
    return existingUsers.filter(user => 
      user.email.toLowerCase().includes(query) ||
      user.first_name.toLowerCase().includes(query) ||
      user.last_name.toLowerCase().includes(query) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(query)
    );
  }, [searchQuery, existingUsers]);

  const loadExistingUsers = async () => {
    try {
      setIsLoading(true);
      // Filter by institution and include unregistered users who might need to be enrolled
      const params = new URLSearchParams({
        institution: institutionName,
        include_unregistered: 'true'
      });
      
      const response = await fetchWithAuth(`/api/master/users?${params}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const users = await response.json();
      setExistingUsers(users);
    } catch (err) {
      onError('Failed to load existing users');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const checkEmailExists = async (email: string): Promise<boolean> => {
    if (!email) return false;
    
    try {
      const response = await fetchWithAuth(`/api/master/check-email?email=${encodeURIComponent(email)}`);
      return response.status === 200;
    } catch (err) {
      console.error("Error checking email:", err);
      return false;
    }
  };

  const handleUserTypeChange = (checked: boolean) => {
    const newType = checked ? 'new' : 'existing';
    setAddType(newType);
    
    // Clear form state when switching
    setSelectedUserId(null);
    setEmail('');
    setFirstName('');
    setLastName('');
    setEmailError(null);
    
    // If switching to existing and there was an email error, use that email to search
    if (!checked && emailError && email) {
      setSearchQuery(email);
    }
  };

  const handleUserSelect = (userId: string) => {
    const id = Number(userId);
    setSelectedUserId(id);
    
    // Find the selected user to pre-populate search if needed
    const selectedUser = existingUsers.find(u => u.id === id);
    if (selectedUser) {
      setSearchQuery(`${selectedUser.first_name} ${selectedUser.last_name} (${selectedUser.email})`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      if (addType === 'existing') {
        if (!selectedUserId) {
          onError('Please select a user');
          return;
        }
        
        // Add existing user to section
        const response = await fetchWithAuth('/api/master/enrollments', {
          method: 'POST',
          body: JSON.stringify({
            user_id: selectedUserId,
            section_id: sectionId,
            role: role
          }),
        });
        
        if (!response.ok) {
          if (response.status === 409) {
            onError('This user is already enrolled in this section');
            return;
          }
          
          let errorMsg = "Failed to enroll user";
          try {
            const errorData = await response.json();
            errorMsg = errorData.error || `Server returned ${response.status}`;
          } catch (parseError) {
            errorMsg = `Server error: ${response.statusText}`;
          }
          throw new Error(errorMsg);
        }
        
      } else {
        // Add new user
        if (!email || !firstName || !lastName) {
          onError('All fields are required');
          return;
        }
        
        // Check if email already exists
        const emailExists = await checkEmailExists(email);
        if (emailExists) {
          setEmailError('This email is already registered. Please use "Existing User" instead.');
          setAddType('existing');
          setSearchQuery(email);
          setIsSubmitting(false);
          return;
        }
        
        // First create the user
        const createUserResponse = await fetchWithAuth('/api/master/add_user', {
          method: 'POST',
          body: JSON.stringify({
            email,
            first_name: firstName,
            last_name: lastName,
            access_group: "Normal",
            institution: institutionName
          }),
        });
        
        if (createUserResponse.status === 409) {
          setEmailError('This email is already registered. Please use "Existing User" instead.');
          setAddType('existing');
          setSearchQuery(email);
          setIsSubmitting(false);
          return;
        }

        if (!createUserResponse.ok) {
          let errorMsg = "Failed to create user";
          try {
            const errorData = await createUserResponse.json();
            errorMsg = errorData.error || `Server returned ${createUserResponse.status}`;
          } catch (parseError) {
            errorMsg = `Server error: ${createUserResponse.statusText}`;
          }
          throw new Error(errorMsg);
        }
        
        const newUser = await createUserResponse.json();
        
        // Then enroll the new user in the section
        const enrollResponse = await fetchWithAuth('/api/master/enrollments', {
          method: 'POST',
          body: JSON.stringify({
            user_id: newUser.id,
            section_id: sectionId,
            role: role
          }),
        });
        
        if (!enrollResponse.ok) {
          let errorMsg = "Failed to enroll user";
          try {
            const errorData = await enrollResponse.json();
            errorMsg = errorData.error || `Server returned ${enrollResponse.status}`;
          } catch (parseError) {
            errorMsg = `Server error: ${enrollResponse.statusText}`;
          }
          throw new Error(errorMsg);
        }
      }
      
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add user to section');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedUserId(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {/* User Type Toggle */}
        <div className="flex items-center justify-between">
          <Label>Add User Type</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="existing-user" className="cursor-pointer">Existing User</Label>
            <Switch
              id="user-type-switch"
              checked={addType === 'new'}
              onCheckedChange={handleUserTypeChange}
            />
            <Label htmlFor="new-user" className="cursor-pointer">New User</Label>
          </div>
        </div>
        
        {/* Role Selection */}
        <div className="space-y-2">
          <Label>Role</Label>
          <RadioGroup 
            value={role} 
            onValueChange={(value) => setRole(value as UserRole)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="student" id="role-student" />
              <Label htmlFor="role-student">Student</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="instructor" id="role-instructor" />
              <Label htmlFor="role-instructor">Instructor</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ta" id="role-ta" />
              <Label htmlFor="role-ta">Teaching Assistant</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Existing User Selection */}
        {addType === 'existing' ? (
          <div className="space-y-3">
            <Label htmlFor="existing-user">Select User</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                id="user-search"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {searchQuery && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                  onClick={clearSearch}
                >
                  ×
                </Button>
              )}
            </div>
            
            {/* User Selection */}
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No users found matching your search' : 'No users found'}
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {filteredUsers.slice(0, 50).map(user => (
                  <Card 
                    key={user.id}
                    className={`p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedUserId === user.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => handleUserSelect(user.id.toString())}
                  >
                    <div className="flex items-center space-x-3">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">
                            {user.first_name} {user.last_name}
                          </span>
                          {/* Show role based on enrollments, or "No Role" if no enrollments */}
                          {user.is_student ? (
                            <Badge variant="secondary">Student</Badge>
                          ) : user.is_registered ? (
                            <Badge variant="outline">Instructor</Badge>
                          ) : (
                            <Badge variant="outline" className="text-gray-600">No Role</Badge>
                          )}
                          {!user.is_registered && (
                            <Badge variant="outline" className="text-orange-600 border-orange-200">
                              Unregistered
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{user.email}</span>
                          </div>
                          {user.institution && (
                            <div className="flex items-center space-x-1">
                              <Building className="h-3 w-3" />
                              <span>{user.institution}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {filteredUsers.length > 50 && (
                  <div className="p-2 text-center text-sm text-gray-500">
                    Showing first 50 results. Try searching to narrow down.
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* New User Form */
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                className={emailError ? "border-red-500" : ""}
                required
              />
              {emailError && (
                <p className="text-red-500 text-sm">{emailError}</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first-name">First Name</Label>
                <Input
                  id="first-name"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="last-name">Last Name</Label>
                <Input
                  id="last-name"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Institution</Label>
              <Input
                value={institutionName}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">User will be associated with this institution</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          disabled={
            isSubmitting || 
            (addType === 'existing' && !selectedUserId) || 
            (addType === 'new' && (!email || !firstName || !lastName))
          }
        >
          {isSubmitting ? 'Adding...' : 'Add User'}
        </Button>
      </div>
    </form>
  );
};

export default AddUserToSectionForm;