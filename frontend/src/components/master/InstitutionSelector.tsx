// src/components/master/InstitutionSelector.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchWithAuth } from "@/utils/api";
import { Institution } from '@/services/masterService';

interface InstitutionSelectorProps {
  onSelect: (institution: Institution) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const InstitutionSelector: React.FC<InstitutionSelectorProps> = ({ 
  onSelect, 
  onSuccess, 
  onError 
}) => {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newInstitutionName, setNewInstitutionName] = useState('');
  const [newInstitutionLocation, setNewInstitutionLocation] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadInstitutions();
  }, []);

  const loadInstitutions = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth('/api/master/institutions');
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setInstitutions(data);
    } catch (err) {
      onError('Failed to load institutions');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddInstitution = async () => {
    if (!newInstitutionName.trim()) return;
    
    try {
      setIsSubmitting(true);
      const response = await fetchWithAuth('/api/master/institutions', {
        method: 'POST',
        body: JSON.stringify({
          name: newInstitutionName,
          location: newInstitutionLocation || undefined
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const newInstitution = await response.json();
      setInstitutions([...institutions, newInstitution]);
      setNewInstitutionName('');
      setNewInstitutionLocation('');
      setIsAddingNew(false);
      onSuccess('Institution added successfully');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add institution');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && institutions.length === 0) {
    return <div className="py-4">Loading institutions...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {institutions.map(institution => (
          <Card 
            key={institution.id} 
            className="p-4 hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => onSelect(institution)}
          >
            <h3 className="font-medium">{institution.name}</h3>
            {institution.location && <p className="text-sm text-gray-500">{institution.location}</p>}
          </Card>
        ))}
      </div>

      {isAddingNew ? (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <h3 className="font-medium">Add New Institution</h3>
          <Input
            type="text"
            placeholder="Institution Name"
            value={newInstitutionName}
            onChange={e => setNewInstitutionName(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Location (optional)"
            value={newInstitutionLocation}
            onChange={e => setNewInstitutionLocation(e.target.value)}
          />
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddInstitution} 
              disabled={isSubmitting || !newInstitutionName.trim()}
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
          Add New Institution
        </Button>
      )}
    </div>
  );
};

export default InstitutionSelector;