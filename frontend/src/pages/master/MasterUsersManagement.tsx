import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { fetchWithAuth } from "@/utils/api";
import { 
  Users, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX,
  Mail,
  Download,
  Upload,
  Plus
} from "lucide-react";
import { AddUserDialog } from "@/components/master/AddUserDialog";

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  institution: string;
  is_student: boolean;
  is_instructor: boolean;
  is_master: boolean;
  is_registered: boolean;
  created_at: string;
  last_login?: string;
}

interface EditUserData {
  first_name: string;
  last_name: string;
  email: string;
  institution: string;
  is_student: boolean;
  is_instructor: boolean;
  is_master: boolean;
}

const MasterUsersManagement: React.FC = () => {
  const navigate = useNavigate();
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<EditUserData>({
    first_name: "",
    last_name: "",
    email: "",
    institution: "",
    is_student: false,
    is_instructor: false,
    is_master: false
  });
  const [isAddUserDialogOpen, setIsAddUserDialogOpen] = useState(false);

  useEffect(() => {
    const checkMasterStatus = async () => {
      try {
        const response = await fetchWithAuth("/api/master/check");
        if (response.ok) {
          const data = await response.json();
          setIsMaster(data.is_master);
          if (!data.is_master) {
            navigate('/login?redirect=/master/users');
          }
        } else {
          navigate('/login?redirect=/master/users');
        }
      } catch (err) {
        console.error('Error checking master status:', err);
        setError('Failed to verify access');
      }
    };

    checkMasterStatus();
  }, [navigate]);

  useEffect(() => {
    if (isMaster) {
      fetchUsers();
    }
  }, [isMaster]);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetchWithAuth("/api/master/users?include_unregistered=true");
      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else {
        throw new Error('Failed to fetch users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.institution.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(user => {
        switch (roleFilter) {
          case "student":
            return user.is_student;
          case "instructor":
            return user.is_instructor && !user.is_master;
          case "master":
            return user.is_master;
          default:
            return true;
        }
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case "registered":
            return user.is_registered;
          case "pending":
            return !user.is_registered;
          default:
            return true;
        }
      });
    }

    setFilteredUsers(filtered);
  };

  const getUserRole = (user: User): { text: string; variant: "default" | "secondary" | "destructive" } => {
    if (user.is_master) {
      return { text: "Master", variant: "destructive" };
    }
    if (user.is_student) {
      return { text: "Student", variant: "default" };
    }
    if (user.is_instructor) {
      return { text: "Instructor", variant: "secondary" };
    }
    return { text: "User", variant: "default" };
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditUserData({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      institution: user.institution,
      is_student: user.is_student,
      is_instructor: user.is_instructor,
      is_master: user.is_master
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetchWithAuth(`/api/master/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editUserData),
      });

      if (response.ok) {
        await fetchUsers();
        setEditDialogOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error('Failed to update user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetchWithAuth(`/api/master/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
        setDeleteDialogOpen(false);
        setSelectedUser(null);
      } else {
        throw new Error('Failed to delete user');
      }
    } catch (err) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user');
    }
  };

  const handleResendInvite = async (user: User) => {
    try {
      const response = await fetchWithAuth(`/api/master/users/${user.id}/resend-invite`, {
        method: 'POST',
      });

      if (response.ok) {
        setError(null);
        // Could add a success toast here
      } else {
        throw new Error('Failed to resend invite');
      }
    } catch (err) {
      console.error('Error resending invite:', err);
      setError('Failed to resend invite');
    }
  };

  const exportUsers = () => {
    const csvContent = [
      ['Name', 'Email', 'Institution', 'Role', 'Status', 'Created At'].join(','),
      ...filteredUsers.map(user => [
        `${user.first_name} ${user.last_name}`,
        user.email,
        user.institution,
        getUserRole(user).text,
        user.is_registered ? 'Registered' : 'Pending',
        new Date(user.created_at).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="p-6">Loading users...</div>;
  }

  if (!isMaster) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            You do not have permission to access this page.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <AddUserDialog 
        isOpen={isAddUserDialogOpen} 
        onOpenChange={setIsAddUserDialogOpen}
        onSuccess={fetchUsers}
      />

      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage all users, roles, and permissions in the system.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsAddUserDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
          <Button onClick={exportUsers} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </header>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="student">Students</SelectItem>
                <SelectItem value="instructor">Instructors</SelectItem>
                <SelectItem value="master">Masters</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="registered">Registered</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Users ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Institution</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>

                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const role = getUserRole(user);
                  return (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.first_name} {user.last_name}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.institution}</TableCell>
                      <TableCell>
                        <Badge variant={role.variant}>{role.text}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_registered ? "default" : "outline"}>
                          {user.is_registered ? "Registered" : "Pending"}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {!user.is_registered && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResendInvite(user)}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Make changes to the user's information and roles.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name</Label>
                <Input
                  id="first_name"
                  value={editUserData.first_name}
                  onChange={(e) => setEditUserData({...editUserData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name</Label>
                <Input
                  id="last_name"
                  value={editUserData.last_name}
                  onChange={(e) => setEditUserData({...editUserData, last_name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editUserData.email}
                onChange={(e) => setEditUserData({...editUserData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="institution">Institution</Label>
              <Input
                id="institution"
                value={editUserData.institution}
                onChange={(e) => setEditUserData({...editUserData, institution: e.target.value})}
              />
            </div>
            <div className="space-y-3">
              <Label>Roles</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_student"
                  checked={editUserData.is_student}
                  onCheckedChange={(checked) => 
                    setEditUserData({...editUserData, is_student: !!checked})
                  }
                />
                <Label htmlFor="is_student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_instructor"
                  checked={editUserData.is_instructor}
                  onCheckedChange={(checked) => 
                    setEditUserData({...editUserData, is_instructor: !!checked})
                  }
                />
                <Label htmlFor="is_instructor">Instructor</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_master"
                  checked={editUserData.is_master}
                  onCheckedChange={(checked) => 
                    setEditUserData({...editUserData, is_master: !!checked})
                  }
                />
                <Label htmlFor="is_master">Master Admin</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveUser}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {selectedUser?.first_name} {selectedUser?.last_name}? 
              This action cannot be undone and will remove all their data from the system.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MasterUsersManagement;