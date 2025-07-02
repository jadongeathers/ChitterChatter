import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  AlertCircle, 
  UserPlus, 
  X, 
  RefreshCcw, 
  Users, 
  Activity, 
  Calendar,
  Search,
  SortAsc,
  Download,
  Mail,
  TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import ClassAwareLayout from "@/components/instructor/ClassAwareLayout";
import { useClass } from "@/contexts/ClassContext";

interface Student {
  id: number;
  name: string;
  email?: string;
  sessionsCompleted: number;
  lastActive: string;
  lastLoginTimestamp?: string;
}

const Students: React.FC = () => {
  const { selectedClass, apiParams, classDisplayName } = useClass();
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null);
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentFirstName, setNewStudentFirstName] = useState("");
  const [newStudentLastName, setNewStudentLastName] = useState("");
  const [dialogMessage, setDialogMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // New filter and search states
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filterBy, setFilterBy] = useState("all");

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const queryString = apiParams.toString();
      const url = `/api/instructors/students/engagement${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetchWithAuth(url);
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();

      setStudents(data);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and sort students
  const filterAndSortStudents = () => {
    let filtered = [...students];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply activity filter
    if (filterBy === "active") {
      filtered = filtered.filter(student => student.sessionsCompleted > 0);
    } else if (filterBy === "inactive") {
      filtered = filtered.filter(student => student.sessionsCompleted === 0);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "name":
          const [lastA, firstA] = a.name.split(" ").reverse();
          const [lastB, firstB] = b.name.split(" ").reverse();
          return lastA.localeCompare(lastB) || firstA.localeCompare(firstB);
        case "sessions":
          return b.sessionsCompleted - a.sessionsCompleted;
          case "recent":
            return new Date(b.lastLoginTimestamp || 0).getTime() - new Date(a.lastLoginTimestamp || 0).getTime();
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  };

  useEffect(() => {
    fetchStudents();
  }, [selectedClass]);

  useEffect(() => {
    filterAndSortStudents();
  }, [students, searchTerm, sortBy, filterBy]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  const handleAddStudent = async () => {
    if (!newStudentEmail) {
      setDialogMessage("Email is required");
      return;
    }

    setIsSubmitting(true);
    setDialogMessage("");

    try {
      const requestBody: any = {
        email: newStudentEmail,
        first_name: newStudentFirstName,
        last_name: newStudentLastName,
      };

      if (selectedClass) {
        requestBody.section_id = selectedClass.section_id;
      }

      const response = await fetchWithAuth("/api/instructors/students/add", {
        method: "POST",
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to add student");
      }

      if (data.reactivated) {
        setSuccessMessage(`${data.student.name || data.student.email} has been reactivated in your class.`);
      } else {
        setSuccessMessage(`${data.student.name || data.student.email} has been added to your class.`);
      }
      
      setStudents((prev) => {
        const filteredList = prev.filter(s => s.id !== data.student.id);
        return [...filteredList, data.student];
      });
      
      setNewStudentEmail("");
      setNewStudentFirstName("");
      setNewStudentLastName("");
      setIsAddDialogOpen(false);
      
    } catch (error) {
      console.error("Error adding student:", error);
      setDialogMessage(error instanceof Error ? error.message : "Failed to add student");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    setIsSubmitting(true);
    
    try {
      const queryString = selectedClass ? `?section_id=${selectedClass.section_id}` : '';
      const response = await fetchWithAuth(`/api/instructors/students/remove/${studentToRemove.id}${queryString}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove student");
      }

      setSuccessMessage(`${studentToRemove.name} has been removed from your class.`);
      setStudents((prev) => prev.filter((s) => s.id !== studentToRemove.id));
      setIsConfirmDialogOpen(false);
      setStudentToRemove(null);
      
    } catch (error) {
      console.error("Error removing student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportToCSV = () => {
    // Prepare CSV data
    const headers = ['Name', 'Email', 'Sessions Completed', 'Last Active'];
    const csvData = [
      headers,
      ...filteredStudents.map(student => [
        student.name,
        student.email || '',
        student.sessionsCompleted.toString(),
        student.lastActive
      ])
    ];
  
    // Convert to CSV string
    const csvContent = csvData
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
  
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      
      // Generate filename with class name and date
      const className = selectedClass ? `${selectedClass.course_code}_` : '';
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      link.setAttribute('download', `${className}students_${date}.csv`);
      
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Helper functions
  const getPageDescription = () => {
    if (selectedClass) {
      return `Monitor student engagement and track participation for ${selectedClass.course_code}`;
    }
    return "Monitor student engagement and track participation across all your classes";
  };

  const getActiveStudents = () => {
    return students.filter(student => student.sessionsCompleted > 0).length;
  };

  const getAverageSessionsPerStudent = () => {
    if (students.length === 0) return 0;
    const totalSessions = students.reduce((sum, student) => sum + student.sessionsCompleted, 0);
    return Math.round((totalSessions / students.length) * 10) / 10;
  };

  const getEngagementRate = () => {
    if (students.length === 0) return 0;
    return Math.round((getActiveStudents() / students.length) * 100);
  };

  const getStudentCountText = () => {
    const totalCount = students.length;
    const filteredCount = filteredStudents.length;
    
    if (searchTerm || filterBy !== "all") {
      return `${filteredCount} of ${totalCount} students`;
    }
    
    if (selectedClass) {
      return `${totalCount} students in ${selectedClass.course_code}`;
    }
    return `${totalCount} total students`;
  };

  const formatDisplayName = (name: string) => {
    const [lastName, firstName] = name.split(" ").reverse();
    return lastName && firstName ? `${lastName}, ${firstName}` : name;
  };

  return (
    <ClassAwareLayout
      title="Students"
      description={getPageDescription()}
    >
      {/* Success Message */}
      {successMessage && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-6"
        >
          {successMessage}
        </motion.div>
      )}

      {/* Enhanced Stats Overview */}
      <div className="mb-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">{students.length}</div>
                <div className="text-xs sm:text-sm text-blue-700">Total Students</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">{getActiveStudents()}</div>
                  <div className="text-xs sm:text-sm text-green-700">Active Students</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-900">
                    {getEngagementRate()}%
                  </div>
                  <div className="text-xs sm:text-sm text-orange-700">
                    Engagement Rate
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-900">{getAverageSessionsPerStudent()}</div>
                  <div className="text-xs sm:text-sm text-purple-700">Avg Sessions</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter Controls */}
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1 w-full lg:w-auto">
              {/* Search */}
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-3">
                <Select value={filterBy} onValueChange={setFilterBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Students</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-36">
                    <SortAsc className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name A-Z</SelectItem>
                    <SelectItem value="sessions">Most Sessions</SelectItem>
                    <SelectItem value="recent">Recently Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="outline" 
              className="flex items-center gap-2 w-full sm:w-auto"
              onClick={exportToCSV}
            >
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </Button>
              
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                    <UserPlus size={16} />
                    <span>Add Student</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      Add Student {selectedClass && `to ${selectedClass.course_code}`}
                    </DialogTitle>
                  </DialogHeader>
                  
                  {dialogMessage && (
                    <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-700">
                      <AlertCircle size={18} className="mt-0.5" />
                      <span>{dialogMessage}</span>
                    </div>
                  )}
                  
                  <div className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="student@example.com"
                        value={newStudentEmail}
                        onChange={(e) => setNewStudentEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="First Name"
                          value={newStudentFirstName}
                          onChange={(e) => setNewStudentFirstName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Last Name"
                          value={newStudentLastName}
                          onChange={(e) => setNewStudentLastName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md flex items-start gap-2 text-blue-700 text-sm">
                      <RefreshCcw size={16} className="mt-0.5 flex-shrink-0" />
                      <span>
                        If this student already exists, they'll be reactivated in your class automatically.
                      </span>
                    </div>
                  </div>
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddStudent}
                      disabled={isSubmitting || !newStudentEmail}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {isSubmitting ? "Adding..." : "Add Student"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Results Summary */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 font-medium">{getStudentCountText()}</span>
              {selectedClass && (
                <Badge variant="outline" className="text-xs">
                  {selectedClass.section_code} • {selectedClass.term?.name}
                </Badge>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Enhanced Student Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <Card className="shadow-lg border-0 bg-white">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/50">
                  <TableHead className="p-4 text-left font-semibold">Student</TableHead>
                  <TableHead className="p-4 text-center font-semibold">Sessions</TableHead>
                  <TableHead className="p-4 text-center font-semibold">Last Active</TableHead>
                  <TableHead className="p-4 text-center font-semibold w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span>Loading students...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredStudents.length > 0 ? (
                  filteredStudents.map((student, index) => (
                    <motion.tr
                      key={student.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <TableCell className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="bg-blue-100 p-2 rounded-full">
                            <Users className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{formatDisplayName(student.name)}</div>
                            {student.email && (
                              <div className="text-sm text-gray-500">{student.email}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <Badge 
                          variant="secondary" 
                          className={`${student.sessionsCompleted > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {student.sessionsCompleted}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4 text-center text-sm text-gray-600">
                        {student.lastActive}
                      </TableCell>
                      <TableCell className="p-4 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {student.email && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => window.open(`mailto:${student.email}`)}
                              title="Send email"
                              className="h-8 w-8"
                            >
                              <Mail size={14} className="text-blue-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setStudentToRemove(student);
                              setIsConfirmDialogOpen(true);
                            }}
                            title="Remove student"
                            className="h-8 w-8"
                          >
                            <X size={14} className="text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="p-8 text-center text-gray-500">
                      <div className="space-y-2">
                        <Users className="h-12 w-12 mx-auto text-gray-300" />
                        <div className="text-lg font-medium">
                          {searchTerm || filterBy !== "all" ? "No students match your filters" : "No students enrolled"}
                        </div>
                        <div className="text-sm">
                          {searchTerm || filterBy !== "all" ? (
                            <Button
                              variant="link"
                              onClick={() => {
                                setSearchTerm("");
                                setFilterBy("all");
                              }}
                              className="p-0"
                            >
                              Clear filters to see all students
                            </Button>
                          ) : (
                            "Add students to get started"
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {/* Confirm Remove Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p>
              Are you sure you want to remove{" "}
              <span className="font-semibold">{studentToRemove?.name}</span> from{" "}
              {selectedClass ? `${selectedClass.course_code}` : 'your class'}?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This will remove their access to class materials, but their account and progress will be preserved.
            </p>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsConfirmDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleRemoveStudent}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Removing..." : "Remove Student"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ClassAwareLayout>
  );
};

export default Students;