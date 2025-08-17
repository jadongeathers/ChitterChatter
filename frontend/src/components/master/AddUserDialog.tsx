import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { fetchWithAuth } from '@/utils/api';
import { Loader2 } from 'lucide-react';

interface AddUserDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSuccess: () => void;
}

interface Institution {
  id: number;
  name: string;
}

export const AddUserDialog: React.FC<AddUserDialogProps> = ({ isOpen, onOpenChange, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [isMaster, setIsMaster] = useState(false);
  const [institution, setInstitution] = useState<string | undefined>();
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const fetchInstitutions = async () => {
        try {
          const response = await fetchWithAuth('/api/master/institutions');
          if (!response.ok) throw new Error('Failed to load institutions.');
          const data = await response.json();
          setInstitutions(data);
        } catch (err: any) { 
          setError(err.message);
        }
      };
      fetchInstitutions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isMaster) {
      setInstitution(undefined);
    }
  }, [isMaster]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName || !lastName || !email) {
      setError('Name and email fields are required.');
      return;
    }
    if (!isMaster && !institution) {
      setError('An institution must be selected for non-master users.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetchWithAuth('/api/master/add_user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          is_master: isMaster,
          institution: isMaster ? null : institution,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add user.');
      }
      
      resetForm();
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setIsMaster(false);
    setInstitution(undefined);
    setError(null);
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) resetForm();
    onOpenChange(open);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new user account. Non-master users will need to be enrolled in sections to get student/instructor roles.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="first-name" className="text-right">First Name</Label>
              <Input 
                id="first-name" 
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)} 
                className="col-span-3"
                placeholder="Enter first name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="last-name" className="text-right">Last Name</Label>
              <Input 
                id="last-name" 
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)} 
                className="col-span-3"
                placeholder="Enter last name"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className="col-span-3"
                placeholder="Enter email address"
              />
            </div>
            
            <div className="flex items-center space-x-2 justify-end mt-2">
              <Label htmlFor="master-switch">Master Administrator</Label>
              <Switch 
                id="master-switch" 
                checked={isMaster} 
                onCheckedChange={setIsMaster} 
              />
            </div>
            
            {!isMaster && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="institution" className="text-right">Institution</Label>
                <Select value={institution} onValueChange={setInstitution}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select an institution" />
                  </SelectTrigger>
                  <SelectContent>
                    {institutions.map((inst) => (
                      <SelectItem key={inst.id} value={inst.name}>
                        {inst.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {isMaster && (
              <div className="col-span-4 text-sm text-muted-foreground text-center p-3 bg-muted rounded-md">
                Master users don't need an institution and will have full administrative access.
              </div>
            )}
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              Create User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};