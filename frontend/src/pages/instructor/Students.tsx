import React, { useState, useEffect } from "react";
import { fetchWithAuth } from "@/utils/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, UserPlus, X, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

interface Student {
  id: number;
  name: string;
  email?: string;
  sessionsCompleted: number;
  lastActive: string;
}

const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
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

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await fetchWithAuth("/api/instructors/students/engagement");
      if (!response.ok) throw new Error("Failed to fetch students");
      const data = await response.json();

      // Sort by last name, then first name
      const sortedStudents = data.sort((a: Student, b: Student) => {
        const [lastA, firstA] = a.name.split(" ").reverse();
        const [lastB, firstB] = b.name.split(" ").reverse();
        return lastA.localeCompare(lastB) || firstA.localeCompare(firstB);
      });

      setStudents(sortedStudents);
    } catch (error) {
      console.error("Error fetching students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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
      const response = await fetchWithAuth("/api/instructors/students/add", {
        method: "POST",
        body: JSON.stringify({
          email: newStudentEmail,
          first_name: newStudentFirstName,
          last_name: newStudentLastName,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to add student");
      }

      // Check if it was a reactivation or new addition
      if (data.reactivated) {
        setSuccessMessage(`${data.student.name || data.student.email} has been reactivated in your class.`);
      } else {
        setSuccessMessage(`${data.student.name || data.student.email} has been added to your class.`);
      }
      
      // Add the new/reactivated student to the list
      setStudents((prev) => {
        // If the student was reactivated, they might already be in the list, so filter them out first
        const filteredList = prev.filter(s => s.id !== data.student.id);
        return [...filteredList, data.student].sort((a, b) => {
          const [lastA, firstA] = a.name.split(" ").reverse();
          const [lastB, firstB] = b.name.split(" ").reverse();
          return lastA.localeCompare(lastB) || firstA.localeCompare(firstB);
        });
      });
      
      // Reset form and close dialog
      setNewStudentEmail("");
      setNewStudentFirstName("");
      setNewStudentLastName("");
      setIsAddDialogOpen(false);
      
    } catch (error) {
      console.error("Error adding student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveStudent = async () => {
    if (!studentToRemove) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await fetchWithAuth(`/api/instructors/students/remove/${studentToRemove.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove student");
      }

      setSuccessMessage(`${studentToRemove.name} has been removed from your class.`);

      // Remove the student from the list
      setStudents((prev) => prev.filter((s) => s.id !== studentToRemove.id));
      
      // Close dialog
      setIsConfirmDialogOpen(false);
      setStudentToRemove(null);
      
    } catch (error) {
      console.error("Error removing student:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && students.length === 0) return <p></p>;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <p className="text-base text-gray-600 mt-1">Monitor student engagement and track participation</p>
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4">
          {successMessage}
        </div>
      )}

      {/* Action Area */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-gray-700">Total Students: <span className="font-semibold">{students.length}</span></p>
        </div>
        
        {/* Add Student Button */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus size={18} />
              <span>Add Student</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Student</DialogTitle>
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
                <RefreshCcw size={18} className="mt-0.5 flex-shrink-0" />
                <span>
                  If this student already exists in the system but isn't assigned to a class, 
                  they'll be automatically reactivated in your class without creating a duplicate account.
                </span>
              </div>
              <p className="text-sm text-gray-500">
                * Student will need to complete registration to access the platform.
              </p>
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
              >
                {isSubmitting ? "Adding..." : "Add Student"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Confirm Remove Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Remove Student</DialogTitle>
            </DialogHeader>
            
            <div className="py-4">
              <p>
                Are you sure you want to remove{" "}
                <span className="font-semibold">{studentToRemove?.name}</span> from your class?
              </p>
              <p className="text-sm text-gray-500 mt-2">
                This action will remove the student's access to your class materials,
                but their account and progress will be preserved.
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
      </div>

      {/* Student Table */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
        <Table className="w-full border border-gray-300 rounded-lg text-lg">
          <TableHeader className="bg-gray-100 text-lg">
            <TableRow>
              <TableHead className="p-4 text-left">Student</TableHead>
              <TableHead className="p-4 text-center">Sessions Completed</TableHead>
              <TableHead className="p-4 text-center">Last Active</TableHead>
              <TableHead className="p-4 text-center w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length > 0 ? (
              students.map((student) => {
                const [lastName, firstName] = student.name.split(" ").reverse();
                const displayName = lastName && firstName ? `${lastName}, ${firstName}` : student.name;
                
                return (
                  <TableRow key={student.id} className="bg-white hover:bg-gray-50">
                    <TableCell className="p-4 text-lg">{displayName}</TableCell>
                    <TableCell className="p-4 text-lg text-center">{student.sessionsCompleted}</TableCell>
                    <TableCell className="p-4 text-lg text-center">{student.lastActive}</TableCell>
                    <TableCell className="p-4 text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setStudentToRemove(student);
                          setIsConfirmDialogOpen(true);
                        }}
                        title="Remove student"
                      >
                        <X size={18} className="text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="p-4 text-lg text-center text-gray-500">
                  No students found. Add students to your class to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  );
};

export default Students;