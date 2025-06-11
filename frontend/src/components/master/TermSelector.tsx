// src/components/master/TermSelector.tsx
import React, { useState, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fetchWithAuth } from "@/utils/api";
import { Term } from '@/services/masterService';

interface TermSelectorProps {
  institutionId: number;
  onSelect: (term: Term) => void;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

const TermSelector: React.FC<TermSelectorProps> = ({ 
  institutionId, 
  onSelect, 
  onSuccess, 
  onError 
}) => {
  const [terms, setTerms] = useState<Term[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newTerm, setNewTerm] = useState({
    name: '',
    code: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    if (institutionId) {
      loadTerms();
    }
  }, [institutionId]);

  const loadTerms = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWithAuth(`/api/master/terms?institution_id=${institutionId}`);
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setTerms(data);
    } catch (err) {
      onError('Failed to load terms');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewTerm(prev => ({ ...prev, [name]: value }));
  };

  const handleAddTerm = async () => {
    if (!newTerm.name || !newTerm.code || !newTerm.start_date || !newTerm.end_date) {
      onError('All fields are required');
      return;
    }
    
    try {
      setIsSubmitting(true);
      const response = await fetchWithAuth('/api/master/terms', {
        method: 'POST',
        body: JSON.stringify({
          ...newTerm,
          institution_id: institutionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server returned ${response.status}`);
      }
      
      const createdTerm = await response.json();
      setTerms([...terms, createdTerm]);
      setNewTerm({
        name: '',
        code: '',
        start_date: '',
        end_date: '',
      });
      setIsAddingNew(false);
      onSuccess('Term added successfully');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to add term');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && terms.length === 0) {
    return <div className="py-4">Loading terms...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {terms.length === 0 ? (
          <p>No terms available. Add your first term.</p>
        ) : (
          terms.map(term => (
            <Card 
              key={term.id} 
              className="p-4 hover:border-blue-400 transition-colors cursor-pointer"
              onClick={() => onSelect(term)}
            >
              <h3 className="font-medium">{term.name} ({term.code})</h3>
              <p className="text-sm text-gray-500">
                {new Date(term.start_date).toLocaleDateString()} - {new Date(term.end_date).toLocaleDateString()}
              </p>
            </Card>
          ))
        )}
      </div>

      {isAddingNew ? (
        <div className="bg-gray-50 p-4 rounded-lg border space-y-3">
          <h3 className="font-medium">Add New Term</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Input
              type="text"
              name="name"
              placeholder="Term Name (e.g. Fall 2025)"
              value={newTerm.name}
              onChange={handleInputChange}
            />
            <Input
              type="text"
              name="code"
              placeholder="Term Code (e.g. F25)"
              value={newTerm.code}
              onChange={handleInputChange}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <Input
                type="date"
                name="start_date"
                value={newTerm.start_date}
                onChange={handleInputChange}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <Input
                type="date"
                name="end_date"
                value={newTerm.end_date}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={handleAddTerm} 
              disabled={isSubmitting || !newTerm.name || !newTerm.code || !newTerm.start_date || !newTerm.end_date}
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
          Add New Term
        </Button>
      )}
    </div>
  );
};

export default TermSelector;