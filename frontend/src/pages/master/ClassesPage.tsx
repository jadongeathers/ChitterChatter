// src/pages/ClassesPage.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { fetchWithAuth } from "@/utils/api";
import InstitutionSelector from '@/components/master/InstitutionSelector';
import TermSelector from '@/components/master/TermSelector';
import ClassSelector from '@/components/master/ClassSelector';
import SectionManager from '@/components/master/SectionManager';
import EditInstitutionModal from '@/components/master/EditInstitutionModal';
import EditTermModal from '@/components/master/EditTermModal';
import EditClassModal from '@/components/master/EditClassModal';
import { Institution, Term, Class } from '@/services/masterService';
import { Edit3, Trash2 } from 'lucide-react';

const ClassesPage: React.FC = () => {
  const navigate = useNavigate();
  const [isMaster, setIsMaster] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Selected entity state
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);

  // Edit modal states
  const [editInstitutionModalOpen, setEditInstitutionModalOpen] = useState(false);
  const [editTermModalOpen, setEditTermModalOpen] = useState(false);
  const [editClassModalOpen, setEditClassModalOpen] = useState(false);

  // Refresh triggers for child components
  const [refreshInstitutions, setRefreshInstitutions] = useState(0);
  const [refreshTerms, setRefreshTerms] = useState(0);
  const [refreshClasses, setRefreshClasses] = useState(0);

  useEffect(() => {
    const checkMasterStatus = async () => {
      try {
        setLoading(true);
        // Check if user is a master - either via API or localStorage
        const isMasterUser = localStorage.getItem('is_master') === 'true';
        
        if (!isMasterUser) {
          try {
            // Double-check with the API if available
            const response = await fetchWithAuth("/api/master/check");
            if (response.ok) {
              const data = await response.json();
              setIsMaster(data.is_master);
              if (!data.is_master) {
                navigate('/login?redirect=/master/classes');
              }
            } else {
              navigate('/login?redirect=/master/classes');
            }
          } catch (err) {
            navigate('/login?redirect=/master/classes');
          }
        } else {
          setIsMaster(true);
        }
      } catch (err) {
        setError('Failed to verify access');
        console.error('Error checking master status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkMasterStatus();
  }, [navigate]);

  // Reset downstream selections when parent selection changes
  const handleInstitutionSelect = (institution: Institution) => {
    setSelectedInstitution(institution);
    setSelectedTerm(null);
    setSelectedClass(null);
  };

  const handleTermSelect = (term: Term) => {
    setSelectedTerm(term);
    setSelectedClass(null);
  };

  const handleClassSelect = (cls: Class) => {
    setSelectedClass(cls);
  };

  // Handle success messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Delete handlers
  const handleDeleteInstitution = async () => {
    if (!selectedInstitution) return;
    
    if (!confirm(`Are you sure you want to delete the institution "${selectedInstitution.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/master/institutions/${selectedInstitution.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Institution deleted successfully');
        setSelectedInstitution(null);
        setSelectedTerm(null);
        setSelectedClass(null);
        setRefreshInstitutions(prev => prev + 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete institution');
      }
    } catch (err) {
      setError('Failed to delete institution');
      console.error('Delete institution error:', err);
    }
  };

  const handleDeleteTerm = async () => {
    if (!selectedTerm) return;
    
    if (!confirm(`Are you sure you want to delete the term "${selectedTerm.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/master/terms/${selectedTerm.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Term deleted successfully');
        setSelectedTerm(null);
        setSelectedClass(null);
        setRefreshTerms(prev => prev + 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete term');
      }
    } catch (err) {
      setError('Failed to delete term');
      console.error('Delete term error:', err);
    }
  };

  const handleDeleteClass = async () => {
    if (!selectedClass) return;
    
    if (!confirm(`Are you sure you want to delete the class "${selectedClass.course_code} - ${selectedClass.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/master/classes/${selectedClass.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Class deleted successfully');
        setSelectedClass(null);
        setRefreshClasses(prev => prev + 1);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete class');
      }
    } catch (err) {
      setError('Failed to delete class');
      console.error('Delete class error:', err);
    }
  };

  // Edit success handlers
  const handleInstitutionEditSuccess = (updatedInstitution: Institution) => {
    setSelectedInstitution(updatedInstitution);
    setSuccessMessage('Institution updated successfully');
    setRefreshInstitutions(prev => prev + 1);
  };

  const handleTermEditSuccess = (updatedTerm: Term) => {
    setSelectedTerm(updatedTerm);
    setSuccessMessage('Term updated successfully');
    setRefreshTerms(prev => prev + 1);
  };

  const handleClassEditSuccess = (updatedClass: Class) => {
    setSelectedClass(updatedClass);
    setSuccessMessage('Class updated successfully');
    setRefreshClasses(prev => prev + 1);
  };

  if (loading) {
    return <div className="p-6">Loading class management...</div>;
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
        <h1 className="text-2xl font-bold">Class Management</h1>
        <p className="text-gray-600 mt-1">Manage institutions, terms, classes, and sections for ChitterChatter.</p>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && (
          <Alert variant="default" className="bg-green-100 border-green-400 text-green-700 mt-4">
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        <hr className="mt-6 border-t border-gray-300 mx-auto" />
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Institutions</CardTitle>
                <CardDescription>
                  Select an institution or add a new one
                </CardDescription>
              </div>
              {selectedInstitution && (
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditInstitutionModalOpen(true)}
                  >
                    <Edit3 className="h-4 w-4 mr-1" />
                    Edit Institution
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleDeleteInstitution}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Institution
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <InstitutionSelector 
              onSelect={handleInstitutionSelect} 
              onSuccess={(message) => setSuccessMessage(message)}
              onError={(message) => setError(message)}
              key={refreshInstitutions}
            />
          </CardContent>
        </Card>
        
        {selectedInstitution && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Terms for {selectedInstitution.name}</CardTitle>
                  <CardDescription>
                    Select a term or add a new one
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {selectedTerm && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditTermModalOpen(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit Term
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDeleteTerm}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Term
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setSelectedInstitution(null)}>
                    Change Institution
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TermSelector 
                institutionId={selectedInstitution.id} 
                onSelect={handleTermSelect}
                onSuccess={(message) => setSuccessMessage(message)}
                onError={(message) => setError(message)}
                key={refreshTerms}
              />
            </CardContent>
          </Card>
        )}
        
        {selectedInstitution && selectedTerm && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Classes for {selectedTerm.name}</CardTitle>
                  <CardDescription>
                    Select a class or add a new one
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  {selectedClass && (
                    <>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setEditClassModalOpen(true)}
                      >
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit Class
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDeleteClass}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete Class
                      </Button>
                    </>
                  )}
                  <Button variant="outline" onClick={() => setSelectedTerm(null)}>
                    Change Term
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ClassSelector 
                institutionId={selectedInstitution.id}
                termId={selectedTerm.id}
                onSelect={handleClassSelect}
                onSuccess={(message) => setSuccessMessage(message)}
                onError={(message) => setError(message)}
                key={refreshClasses}
              />
            </CardContent>
          </Card>
        )}
        
        {selectedInstitution && selectedTerm && selectedClass && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sections for {selectedClass.course_code} - {selectedClass.title}</CardTitle>
                  <CardDescription>
                    Manage sections for this class
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setSelectedClass(null)}>
                    Change Class
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <SectionManager 
                classId={selectedClass.id} 
                termId={selectedTerm.id}
                institutionId={selectedInstitution.id}
                institutionName={selectedInstitution.name}
                onSuccess={(message) => setSuccessMessage(message)}
                onError={(message) => setError(message)}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Modals */}
      <EditInstitutionModal
        open={editInstitutionModalOpen}
        onClose={() => setEditInstitutionModalOpen(false)}
        institution={selectedInstitution}
        onSuccess={handleInstitutionEditSuccess}
        onError={(message) => setError(message)}
      />

      <EditTermModal
        open={editTermModalOpen}
        onClose={() => setEditTermModalOpen(false)}
        term={selectedTerm}
        onSuccess={handleTermEditSuccess}
        onError={(message) => setError(message)}
      />

      <EditClassModal
        open={editClassModalOpen}
        onClose={() => setEditClassModalOpen(false)}
        classItem={selectedClass}
        onSuccess={handleClassEditSuccess}
        onError={(message) => setError(message)}
      />
    </div>
  );
};

export default ClassesPage;