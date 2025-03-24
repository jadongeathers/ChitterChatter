import React, { useState } from 'react';
import { fetchWithAuth } from "@/utils/api";

interface AddUserFormProps {
  selectedInstitution: string;
  selectedClass: string;
  selectedSection: string;
  onUserAdded: () => void;
  onError: (error: string) => void;
}

export const AddUserForm: React.FC<AddUserFormProps> = ({
  selectedInstitution: initialInstitution,
  selectedClass: initialClass,
  selectedSection: initialSection,
  onUserAdded,
  onError
}) => {
  // Form fields
  const [newEmail, setNewEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [institution, setInstitution] = useState(initialInstitution);
  const [className, setClassName] = useState(initialClass);
  const [section, setSection] = useState(initialSection);
  const [isStudent, setIsStudent] = useState<boolean>(true);
  const [accessGroup, setAccessGroup] = useState<string>("A");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update local state when props change
  React.useEffect(() => {
    setInstitution(initialInstitution);
  }, [initialInstitution]);

  React.useEffect(() => {
    setClassName(initialClass);
  }, [initialClass]);

  React.useEffect(() => {
    setSection(initialSection);
  }, [initialSection]);

  const addUser = async () => {
    if (!newEmail || !institution || !className || !section) {
      alert("Please fill in all required fields (email, institution, class, section).");
      return;
    }

    try {
      setIsSubmitting(true);
      
      console.log("Adding user with data:", {
        institution,
        class_name: className,
        section,
        email: newEmail,
        is_student: isStudent,
        first_name: firstName,
        last_name: lastName,
        access_group: isStudent ? accessGroup : "All"
      });
      
      const res = await fetchWithAuth("/api/master/add_student", {
        method: "POST",
        body: JSON.stringify({
          institution,
          class_name: className,
          section,
          email: newEmail,
          is_student: isStudent,
          first_name: firstName,
          last_name: lastName,
          access_group: isStudent ? accessGroup : "All" // Set access group based on user type
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server returned ${res.status}: ${res.statusText}`);
      }

      // Clear form fields
      setNewEmail("");
      setFirstName("");
      setLastName("");
      
      // Notify parent component
      onUserAdded();
      
    } catch (error) {
      console.error("Error adding user:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
      <h2 className="font-bold mb-2">Add User</h2>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <input
          type="email"
          placeholder="Email Address *"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="border p-2 col-span-3"
          required
        />
        
        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="border p-2"
        />
        
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="border p-2"
        />
        
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isStudent}
              onChange={() => setIsStudent(!isStudent)}
              className="h-5 w-5"
            />
            <span className="font-medium">{isStudent ? "Student" : "Instructor"}</span>
          </label>
          
          {isStudent && (
            <div className="flex items-center ml-4">
              <span className="mr-2 text-sm">Access Group:</span>
              <select
                value={accessGroup}
                onChange={(e) => setAccessGroup(e.target.value)}
                className="border p-1"
              >
                <option value="A">Group A</option>
                <option value="B">Group B</option>
                <option value="All">All Access</option>
                <option value="Normal">Normal Access</option>
              </select>
            </div>
          )}
        </div>
        
        <input
          type="text"
          placeholder="Institution *"
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          className="border p-2"
          required
        />
        
        <input
          type="text"
          placeholder="Class Name *"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="border p-2"
          required
        />
        
        <input
          type="text"
          placeholder="Section *"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          className="border p-2"
          required
        />
      </div>
      
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {initialInstitution && initialClass && initialSection ? (
            <span>
              Filters are applied: <strong>{initialInstitution}</strong>, <strong>{initialClass}</strong>, <strong>{initialSection}</strong>. 
              Edit fields above to add to a different location.
            </span>
          ) : (
            <span>* All fields marked with asterisk are required</span>
          )}
        </div>
        
        <button 
          onClick={addUser} 
          disabled={isSubmitting || !newEmail || !institution || !className || !section}
          className={`px-4 py-2 rounded font-medium ${
            isSubmitting || !newEmail || !institution || !className || !section
              ? 'bg-gray-300 text-gray-700'
              : 'bg-blue-500 text-white'
          }`}
        >
          {isSubmitting ? 'Adding...' : `Add ${isStudent ? "Student" : "Instructor"}`}
        </button>
      </div>
    </div>
  );
};