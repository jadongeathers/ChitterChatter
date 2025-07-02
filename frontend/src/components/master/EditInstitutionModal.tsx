// src/components/master/EditInstitutionModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/utils/api";
import { Institution } from '@/services/masterService';

interface EditInstitutionModalProps {
  open: boolean;
  onClose: () => void;
  institution: Institution | null;
  onSuccess: (updatedInstitution: Institution) => void;
  onError: (error: string) => void;
}

const EditInstitutionModal: React.FC<EditInstitutionModalProps> = ({
  open,
  onClose,
  institution,
  onSuccess,
  onError
}) => {
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (institution) {
      setName(institution.name);
      setLocation(institution.location || '');
    }
  }, [institution]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!institution) return;
    
    if (!name.trim()) {
      onError('Institution name is required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth(`/api/master/institutions/${institution.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          location: location.trim()
        }),
      });

      if (response.ok) {
        const updatedInstitution = await response.json();
        onSuccess(updatedInstitution);
        onClose();
      } else {
        const data = await response.json();
        onError(data.error || 'Failed to update institution');
      }
    } catch (err) {
      onError('Failed to update institution');
      console.error('Update institution error:', err);
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
          <DialogTitle>Edit Institution</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Institution Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter institution name"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Enter location (optional)"
              disabled={loading}
            />
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
              disabled={loading || !name.trim()}
            >
              {loading ? 'Updating...' : 'Update Institution'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditInstitutionModal;