// src/components/master/SectionManager.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { fetchWithAuth } from "@/utils/api";
import { Section } from '@/services/masterService';
import SectionDetailView from './SectionDetailView';
import EditSectionModal from './EditSectionModal';

interface SectionManagerProps {
  classId: number;
  termId: number;
  institutionId: number;
  institutionName: string;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const SectionManager: React.FC<SectionManagerProps> = ({ 
  classId, 
  termId,
  institutionId,
  institutionName,
  onSuccess, 
  onError 
}) => {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSectionCode, setNewSectionCode] = useState('');
  const [selectedSection, setSelectedSection] = useState<Section | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("sections"); // "sections" or "details"

  useEffect(() => {
    if (classId && termId) {
      loadSections();
    }
  }, [classId, termId]);

  const loadSections = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`/api/master/sections?class_id=${classId}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      // Filter sections for the current term
      const termSections = data.filter((section: Section) => section.term_id === termId);
      setSections(termSections);
      
      // Reset selection when loading new sections
      setSelectedSection(null);
      setActiveTab("sections");
    } catch (err) {
      onError('Failed to load sections');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSection = async () => {
    if (!newSectionCode.trim()) {
      onError('Section code is required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await fetchWithAuth('/api/master/sections', {
        method: 'POST',
        body: JSON.stringify({
          class_id: classId,
          term_id: termId,
          section_code: newSectionCode,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const newSection = await response.json();
      setSections([...sections, newSection]);
      setNewSectionCode('');
      setIsAddingNew(false);
      onSuccess('Section added successfully');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add section');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSectionSelect = (section: Section) => {
    setSelectedSection(section);
    setActiveTab("details");
  };

  const handleEditSection = () => {
    setShowEditModal(true);
  };

  const handleSectionUpdated = (updatedSection: Section) => {
    setSections(sections.map(s => s.id === updatedSection.id ? updatedSection : s));
    setSelectedSection(updatedSection);
    setShowEditModal(false);
    onSuccess('Section updated successfully');
  };

  const handleSectionDeleted = (deletedSection: Section) => {
    // Remove the section from the list
    setSections(sections.filter(s => s.id !== deletedSection.id));
    
    // Close the edit modal
    setShowEditModal(false);
    
    // Go back to the sections list
    setSelectedSection(null);
    setActiveTab("sections");
    
    onSuccess('Section deleted successfully');
  };

  if (isLoading && sections.length === 0) {
    return <div className="py-4">Loading sections...</div>;
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="mb-4">
        <TabsTrigger value="sections">Sections</TabsTrigger>
        {selectedSection && (
          <TabsTrigger value="details">Section Details</TabsTrigger>
        )}
      </TabsList>
      
      <TabsContent value="sections" className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.length === 0 ? (
            <p>No sections available for this class in the selected term. Add your first section.</p>
          ) : (
            sections.map(section => (
              <Card 
                key={section.id} 
                className="p-4 hover:border-blue-400 transition-colors cursor-pointer"
                onClick={() => handleSectionSelect(section)}
              >
                <h3 className="font-medium">Section {section.section_code}</h3>
                <p className="text-sm text-gray-500">
                  Click to manage users and details
                </p>
              </Card>
            ))
          )}
        </div>

        {isAddingNew ? (
          <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
            <h3 className="font-medium">Add New Section</h3>
            <Input
              type="text"
              placeholder="Section Code (e.g. A, B, 001)"
              value={newSectionCode}
              onChange={e => setNewSectionCode(e.target.value)}
            />
            <div className="flex space-x-2">
              <Button 
                onClick={handleAddSection} 
                disabled={isSubmitting || !newSectionCode.trim()}
              >
                {isSubmitting ? 'Adding...' : 'Save'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => setIsAddingNew(true)}>
            Add New Section
          </Button>
        )}
      </TabsContent>
      
      <TabsContent value="details">
        {selectedSection && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Section {selectedSection.section_code}
              </h2>
              <div className="space-x-2">
                <Button 
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                >
                  Edit Section
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setActiveTab("sections")}
                >
                  Back to Sections
                </Button>
              </div>
            </div>
            
            <SectionDetailView
              section={selectedSection}
              classId={classId}
              termId={termId}
              institutionId={institutionId}
              institutionName={institutionName}
              onSuccess={onSuccess}
              onError={onError}
              onReload={loadSections}
            />
          </div>
        )}
      </TabsContent>
      
      {/* Edit Section Modal */}
      {showEditModal && selectedSection && (
        <EditSectionModal
          section={selectedSection}
          onClose={() => setShowEditModal(false)}
          onSave={handleSectionUpdated}
          onDelete={handleSectionDeleted}
          onError={onError}
        />
      )}
    </Tabs>
  );
};

export default SectionManager;