// src/components/master/EditTermModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/utils/api";
import { Term } from '@/services/masterService';

interface EditTermModalProps {
  open: boolean;
  onClose: () => void;
  term: Term | null;
  onSuccess: (updatedTerm: Term) => void;
  onError: (error: string) => void;
}

const EditTermModal: React.FC<EditTermModalProps> = ({
  open,
  onClose,
  term,
  onSuccess,
  onError
}) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (term) {
      setName(term.name);
      setCode(term.code);
      setStartDate(term.start_date);
      setEndDate(term.end_date);
    }
  }, [term]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!term) return;
    
    if (!name.trim() || !code.trim() || !startDate || !endDate) {
      onError('All fields are required');
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      onError('Start date must be before end date');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth(`/api/master/terms/${term.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim(),
          start_date: startDate,
          end_date: endDate
        }),
      });

      if (response.ok) {
        const updatedTerm = await response.json();
        onSuccess(updatedTerm);
        onClose();
      } else {
        const data = await response.json();
        onError(data.error || 'Failed to update term');
      }
    } catch (err) {
      onError('Failed to update term');
      console.error('Update term error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Term</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Term Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Fall 2024"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">Term Code *</Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g., F24"
              required
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date *</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">End Date *</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !name.trim() || !code.trim() || !startDate || !endDate}
            >
              {loading ? 'Updating...' : 'Update Term'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditTermModal;