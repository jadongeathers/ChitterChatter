// src/pages/master/UsersPage.tsx
import React, { useState, useEffect } from "react";
import { AddUserForm } from "@/components/master/AddUserForm";
import { UserList } from "@/components/master/UserList";
import { fetchWithAuth } from "@/utils/api";
import { ClassGroup, User } from "@/components/master/types";

export default function UsersPage() {
  const [groupedUsers, setGroupedUsers] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // Placeholder filters passed to AddUserForm
  const [selectedInstitution] = useState("");
  const [selectedClass] = useState("");
  const [selectedSection] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchWithAuth("/api/master/students")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch users");
        return res.json();
      })
      .then((data) => setGroupedUsers(data))
      .catch((err) => {
        console.error(err);
        setError("Could not load users.");
      })
      .finally(() => setLoading(false));
  }, [refreshKey]);

  const handleEditUser = (user: User) => {
    alert(`Edit user: ${user.email}`);
  };

  const handleEditAccessGroup = (user: User) => {
    alert(`Edit access group for: ${user.email}`);
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Delete ${user.email}?`)) {
      fetchWithAuth(`/api/master/delete_user/${user.id}`, { method: "DELETE" })
        .then((res) => {
          if (!res.ok) throw new Error("Failed to delete user");
          setRefreshKey((k) => k + 1);
        })
        .catch((err) => {
          console.error(err);
          alert("Delete failed");
        });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Users</h1>

      {error && <div className="text-red-600 mb-4">{error}</div>}

      <AddUserForm
        selectedInstitution={selectedInstitution}
        selectedClass={selectedClass}
        selectedSection={selectedSection}
        onUserAdded={() => setRefreshKey((k) => k + 1)}
        onError={(msg) => setError(msg)}
      />

      <UserList
        groupedUsers={groupedUsers}
        loading={loading}
        onEditUser={handleEditUser}
        onEditAccessGroup={handleEditAccessGroup}
        onDeleteUser={handleDeleteUser}
      />
    </div>
  );
}
