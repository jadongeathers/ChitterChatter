import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, GraduationCap } from 'lucide-react';

const PendingEnrollment: React.FC = () => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logout */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div className="flex items-center space-x-2">
            <GraduationCap className="h-6 w-6 text-blue-600" />
            <span className="font-semibold text-gray-900">ChitterChatter</span>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Log Out</span>
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl text-gray-900">
              Welcome, {user?.first_name || 'User'}!
            </CardTitle>
            <CardDescription className="pt-2 text-base">
              Your account is active and ready to go.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 text-sm leading-relaxed">
                You are not yet enrolled in any courses for the current term. Once an administrator assigns you to a course, your dashboard will become available here.
              </p>
            </div>
            
            <p className="text-gray-600 text-sm">
              If you believe this is an error, please contact your system administrator or instructor for assistance.
            </p>
            
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Logged in as: {user?.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingEnrollment;