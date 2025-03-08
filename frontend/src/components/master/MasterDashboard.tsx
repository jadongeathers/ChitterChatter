import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchWithAuth } from "@/utils/api";
import { UserFilters } from "./UserFilters";
import { AddUserForm } from "./AddUserForm";
import { UserList } from "./UserList";
import { EditAccessGroupModal } from "./EditAccessGroupModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { User, ClassGroup } from "./types";

const MasterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [groupedUsers, setGroupedUsers] = useState<ClassGroup[]>([]);
  
  // Filter state
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [showStudents, setShowStudents] = useState(true);
  const [showInstructors, setShowInstructors] = useState(true);
  
  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [showEditAccessModal, setShowEditAccessModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [showDeleteUserModal, setShowDeleteUserModal] = useState(false);
  
  // UI state
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  /** Check if the user is a master */
  useEffect(() => {
    const checkMasterStatus = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetchWithAuth("/api/master/check");

        if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);

        const data = await res.json();
        setIsMaster(data.is_master);

        if (!data.is_master) {
          alert("You do not have permission to access this page.");
          navigate("/");
        }
      } catch (error) {
        console.error("Error checking master status:", error);
        setError("Failed to verify access.");
      } finally {
        setLoading(false);
      }
    };

    checkMasterStatus();
  }, [navigate]);

  /** Fetch all users on component mount */
  useEffect(() => {
    if (!isMaster) return;
    
    fetchUsers();
  }, [isMaster]);

  /** Apply user type filters whenever filter settings or users change */
  useEffect(() => {
    applyUserTypeFilters();
  }, [users, showStudents, showInstructors]);

  /** Process filtered users into grouped structure */
  useEffect(() => {
    const grouped = groupUsers(filteredUsers);
    setGroupedUsers(grouped);
  }, [filteredUsers]);

  /** Clear success message after 3 seconds */
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  /** Apply user type filters without re-fetching data */
  const applyUserTypeFilters = () => {
    let filtered = [...users];
    
    // Filter by user type
    if (!showStudents) filtered = filtered.filter(user => !user.is_student);
    if (!showInstructors) filtered = filtered.filter(user => user.is_student);
    
    setFilteredUsers(filtered);
  };

  /** Fetch users based on filters */
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build the URL with any filters that are set
      let url = '/api/master/students';
      const params = new URLSearchParams();
      
      if (selectedInstitution) {
        params.append('institution', selectedInstitution);
      }
      
      if (selectedClass) {
        params.append('class_name', selectedClass);
      }
      
      if (selectedSection) {
        params.append('section', selectedSection);
      }
      
      // Add parameters to URL if there are any
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const res = await fetchWithAuth(url);
    
      if (!res.ok) throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    
      const data = await res.json();
      setUsers(data);
      setFilteredUsers(data);
      
      console.log(`Fetched ${data.length} users`);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to load users.");
    } finally {
      setLoading(false);
    }
  };

  /** Groups users by institution → class → section */
  const groupUsers = (users: User[]): ClassGroup[] => {
    const grouped: Record<string, Record<string, Record<string, User[]>>> = {};

    users.forEach((user) => {
      // Handle potential null/undefined values
      const institution = user.institution || 'Unassigned';
      const class_name = user.class_name || 'Unassigned';
      const section = user.section || 'Unassigned';
      
      if (!grouped[institution]) {
        grouped[institution] = {};
      }
      if (!grouped[institution][class_name]) {
        grouped[institution][class_name] = {};
      }
      if (!grouped[institution][class_name][section]) {
        grouped[institution][class_name][section] = [];
      }

      grouped[institution][class_name][section].push(user);
    });

    return Object.entries(grouped).map(([institution, classes]) => ({
      institution,
      classes: Object.entries(classes).map(([class_name, sections]) => ({
        class_name,
        sections: Object.entries(sections).map(([section, students]) => ({
          section,
          students,
        })),
      })),
    }));
  };

  /** Handle successful user addition */
  const handleUserAdded = () => {
    setSuccessMessage("User added successfully");
    fetchUsers();
  };

  /** Apply filters and fetch users */
  const applyFilters = () => {
    fetchUsers();
  };

  /** Clear all filters */
  const clearFilters = () => {
    setSelectedInstitution("");
    setSelectedClass("");
    setSelectedSection("");
    fetchUsers();
  };

  /** Handle opening the edit access group modal */
  const handleEditAccessGroup = (user: User) => {
    setEditingUser(user);
    setShowEditAccessModal(true);
  };

  /** Handle opening the edit user modal */
  const handleEditUser = (user: User) => {
    setUserToEdit(user);
    setShowEditUserModal(true);
  };

  /** Handle opening the delete user modal */
  const handleDeleteUser = (user: User) => {
    setUserToDelete(user);
    setShowDeleteUserModal(true);
  };

  /** Handle successful access group update */
  const handleAccessGroupUpdated = (userId: number, newAccessGroup: string) => {
    // Update local state to reflect change
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, access_group: newAccessGroup } 
          : user
      )
    );

    setSuccessMessage(`Access group updated to "${newAccessGroup}"`);
    setShowEditAccessModal(false);
    setEditingUser(null);
  };

  /** Handle successful user information update */
  const handleUserUpdated = (userId: number, updatedUser: Partial<User>) => {
    // Update local state to reflect changes
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId 
          ? { ...user, ...updatedUser } 
          : user
      )
    );

    setSuccessMessage("User information updated successfully");
    setShowEditUserModal(false);
    setUserToEdit(null);
  };

  /** Handle successful user deletion */
  const handleUserDeleted = (userId: number) => {
    // Remove user from local state
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    
    setSuccessMessage("User deleted successfully");
    setShowDeleteUserModal(false);
    setUserToDelete(null);
  };

  if (loading && !users.length) {
    return <div className="p-6">Loading master dashboard...</div>;
  }

  if (!isMaster) {
    return (
      <div className="p-6">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <h2 className="font-bold">Access Denied</h2>
          <p>You do not have permission to access the Master Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Master Dashboard</h1>
        <p className="text-gray-600 mt-1">Manage users by institution, class, and section.</p>
        {error && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mt-4">
            <p>{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mt-4">
            <p>{successMessage}</p>
          </div>
        )}
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      <UserFilters 
        selectedInstitution={selectedInstitution}
        setSelectedInstitution={setSelectedInstitution}
        selectedClass={selectedClass}
        setSelectedClass={setSelectedClass}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        showStudents={showStudents}
        setShowStudents={setShowStudents}
        showInstructors={showInstructors}
        setShowInstructors={setShowInstructors}
        applyFilters={applyFilters}
        clearFilters={clearFilters}
        filteredCount={filteredUsers.length}
      />

      <AddUserForm 
        selectedInstitution={selectedInstitution}
        selectedClass={selectedClass}
        selectedSection={selectedSection}
        onUserAdded={handleUserAdded}
        onError={setError}
      />

      <UserList 
        groupedUsers={groupedUsers}
        loading={loading}
        onEditAccessGroup={handleEditAccessGroup}
        onEditUser={handleEditUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* Modals */}
      {showEditAccessModal && editingUser && (
        <EditAccessGroupModal 
          user={editingUser}
          onClose={() => setShowEditAccessModal(false)}
          onSave={handleAccessGroupUpdated}
        />
      )}
      
      {showEditUserModal && userToEdit && (
        <EditUserModal 
          user={userToEdit}
          onClose={() => setShowEditUserModal(false)}
          onSave={handleUserUpdated}
        />
      )}
      
      {showDeleteUserModal && userToDelete && (
        <DeleteUserModal 
          user={userToDelete}
          onClose={() => setShowDeleteUserModal(false)}
          onDelete={handleUserDeleted}
        />
      )}
    </div>
  );
};

export default MasterDashboard;