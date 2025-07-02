// src/components/master/EditClassModal.tsx
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/utils/api";
import { Class } from '@/services/masterService';

interface EditClassModalProps {
  open: boolean;
  onClose: () => void;
  classItem: Class | null;
  onSuccess: (updatedClass: Class) => void;
  onError: (error: string) => void;
}

const EditClassModal: React.FC<EditClassModalProps> = ({
  open,
  onClose,
  classItem,
  onSuccess,
  onError
}) => {
  const [courseCode, setCourseCode] = useState('');
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (classItem) {
      setCourseCode(classItem.course_code);
      setTitle(classItem.title);
    }
  }, [classItem]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classItem) return;
    
    if (!courseCode.trim() || !title.trim()) {
      onError('Course code and title are required');
      return;
    }

    setLoading(true);

    try {
      const response = await fetchWithAuth(`/api/master/classes/${classItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course_code: courseCode.trim(),
          title: title.trim()
        }),
      });

      if (response.ok) {
        const updatedClass = await response.json();
        onSuccess(updatedClass);
        onClose();
      } else {
        const data = await response.json();
        onError(data.error || 'Failed to update class');
      }
    } catch (err) {
      onError('Failed to update class');
      console.error('Update class error:', err);
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
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="courseCode">Course Code *</Label>
            <Input
              id="courseCode"
              value={courseCode}
              onChange={(e) => setCourseCode(e.target.value)}
              placeholder="e.g., SPAN101"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Class Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Introduction to Spanish"
              required
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
              disabled={loading || !courseCode.trim() || !title.trim()}
            >
              {loading ? 'Updating...' : 'Update Class'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditClassModal;