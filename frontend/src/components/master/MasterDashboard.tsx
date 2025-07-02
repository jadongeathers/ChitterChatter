import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { fetchWithAuth } from "@/utils/api";
import { Users, School, BookOpen, GraduationCap, Plus, Settings } from "lucide-react";

interface DashboardStats {
  total_users: number;
  total_students: number;
  total_instructors: number;
  total_institutions: number;
  total_classes: number;
  total_sections: number;
}

interface RecentUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  institution: string;
  is_student: boolean;
  is_registered: boolean;
}

const MasterDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [isMaster, setIsMaster] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);

  useEffect(() => {
    const checkMasterStatus = async () => {
      try {
        const response = await fetchWithAuth("/api/master/check");
        if (response.ok) {
          const data = await response.json();
          setIsMaster(data.is_master);
          if (!data.is_master) {
            navigate('/login?redirect=/master/dashboard');
          }
        } else {
          navigate('/login?redirect=/master/dashboard');
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
      fetchDashboardData();
    }
  }, [isMaster]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch basic stats
      const [usersResponse, institutionsResponse] = await Promise.all([
        fetchWithAuth("/api/master/users"),
        fetchWithAuth("/api/master/institutions")
      ]);

      if (!usersResponse.ok || !institutionsResponse.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const users = await usersResponse.json();
      const institutions = await institutionsResponse.json();

      // Calculate stats
      const totalStudents = users.filter((u: RecentUser) => u.is_student).length;
      const totalInstructors = users.filter((u: RecentUser) => !u.is_student).length;

      setStats({
        total_users: users.length,
        total_students: totalStudents,
        total_instructors: totalInstructors,
        total_institutions: institutions.length,
        total_classes: 0, // We'll need to add this endpoint if needed
        total_sections: 0  // We'll need to add this endpoint if needed
      });

      // Get most recent users (last 5)
      const sortedUsers = users
        .sort((a: RecentUser, b: RecentUser) => b.id - a.id)
        .slice(0, 5);
      setRecentUsers(sortedUsers);

    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading master dashboard...</div>;
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Master Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Overview and quick actions for ChitterChatter administration.
        </p>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </header>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              onClick={() => navigate('/master/classes')}
              className="h-auto p-4 flex flex-col items-start"
              variant="outline"
            >
              <School className="h-6 w-6 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Manage Classes</div>
                <div className="text-sm text-muted-foreground">
                  Add institutions, terms, classes, and sections
                </div>
              </div>
            </Button>

            <Button 
              onClick={() => navigate('/master/classes')}
              className="h-auto p-4 flex flex-col items-start"
              variant="outline"
            >
              <Plus className="h-6 w-6 mb-2" />
              <div className="text-left">
                <div className="font-semibold">Add Users</div>
                <div className="text-sm text-muted-foreground">
                  Create and enroll users in sections
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats.total_users}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <GraduationCap className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Students</p>
                  <p className="text-2xl font-bold">{stats.total_students}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Instructors</p>
                  <p className="text-2xl font-bold">{stats.total_instructors}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <School className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Institutions</p>
                  <p className="text-2xl font-bold">{stats.total_institutions}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Users */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Users</CardTitle>
          <CardDescription>
            Latest users added to the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      {user.first_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.institution}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={user.is_student ? "default" : "secondary"}>
                      {user.is_student ? "Student" : "Instructor"}
                    </Badge>
                    <Badge variant={user.is_registered ? "default" : "outline"}>
                      {user.is_registered ? "Registered" : "Pending"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No users found. Start by adding some users to the system.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MasterDashboard;