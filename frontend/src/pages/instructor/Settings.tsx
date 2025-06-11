import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { toast } from "sonner";
import { fetchWithAuth } from "@/utils/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { 
  User, 
  Shield, 
  Key, 
  Bell, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle,
  Settings
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      damping: 15,
    },
  },
};

// Form schemas
const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
});

const passwordSchema = z.object({
  current_password: z.string().min(1, "Current password is required"),
  new_password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  confirm_password: z.string().min(1, "Please confirm your password"),
}).refine(data => data.new_password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"], 
});

interface InstructorUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_student: boolean;
  is_master: boolean;
  created_at: string;
  last_login: string | null;
  profile_picture?: string;
  profile_picture_url?: string;
}

const InstructorSettings: React.FC = () => {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<InstructorUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Profile form
  const profileForm = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
    },
  });

  // Password form
  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      current_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const response = await fetchWithAuth("/api/auth/me");
        
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const userData = await response.json();
        setUserInfo(userData);
        
        // Set form defaults with user data
        profileForm.reset({
          first_name: userData.first_name,
          last_name: userData.last_name,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to fetch user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle profile update
  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      const response = await fetchWithAuth("/api/auth/update-profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      
      const result = await response.json();
      setUserInfo(prev => prev ? { ...prev, ...data } : null);
      
      toast.success("Your profile has been updated successfully.");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile. Please try again.");
    }
  };

  // Handle password change
  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      const response = await fetchWithAuth("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          current_password: data.current_password,
          new_password: data.new_password,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to change password");
      }
      
      passwordForm.reset({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      
      toast.success("Your password has been changed successfully.");
    } catch (error: any) {
      console.error("Error changing password:", error);
      toast.error(error.message || "Failed to change password. Please try again.");
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    try {
      const response = await fetchWithAuth("/api/auth/deactivate-account", {
        method: "POST",
      });
      
      if (!response.ok) {
        throw new Error("Failed to deactivate account");
      }
      
      toast.success("Your account has been deactivated. You will be logged out.");
      
      // Redirect to logout or login page after short delay
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (error) {
      console.error("Error deactivating account:", error);
      toast.error("Failed to deactivate account. Please try again.");
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Handle notification preference
  const handleNotificationChange = async (checked: boolean) => {
    setNotifications(checked);
    try {
      // Use existing preferences endpoint
      const response = await fetchWithAuth("/api/auth/update-preferences", {
        method: "POST",
        body: JSON.stringify({
          email_notifications: checked
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update notification preferences");
      }
      
      toast.success(checked ? "Notifications enabled" : "Notifications disabled", {
        description: "Your preference has been saved."
      });
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      toast.error("Failed to update notification preferences");
      // Revert UI state if the API call fails
      setNotifications(!checked);
    }
  };

  // Helper functions
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getAccountAge = () => {
    if (!userInfo?.created_at) return 0;
    const created = new Date(userInfo.created_at);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getAccountStatus = () => {
    return userInfo?.is_master ? "Administrator" : "Instructor";
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading account settings...</span>
      </div>
    );
  }

  return (
    <motion.div 
      className="w-full px-6 py-6 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">
            Manage your account information, security, and preferences
          </p>
        </div>

        {/* Account Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-blue-900">
                    {userInfo?.first_name} {userInfo?.last_name}
                  </div>
                  <div className="text-sm text-blue-700">Account Holder</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 p-2 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-green-900">{getAccountStatus()}</div>
                  <div className="text-sm text-green-700">Account Type</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-900">{getAccountAge()}</div>
                  <div className="text-sm text-purple-700">Days Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="bg-orange-600 p-2 rounded-lg">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-lg font-bold text-orange-900">
                    {userInfo?.last_login ? formatDate(userInfo.last_login) : 'Today'}
                  </div>
                  <div className="text-sm text-orange-700">Last Login</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Profile Settings */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <User className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Profile Information</CardTitle>
                  <CardDescription className="text-gray-600">
                    Update your personal information and display preferences
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={profileForm.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your first name" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your last name" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <FormLabel className="text-sm font-medium text-gray-700">Email Address</FormLabel>
                    <div className="flex items-center space-x-3">
                      <Input
                        type="email"
                        value={userInfo?.email || ""}
                        disabled
                        className="h-10 bg-gray-50 text-gray-500"
                      />
                      <Badge variant="outline" className="text-xs">
                        Verified
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">Email address cannot be changed</p>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Update Profile
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Settings */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Security Settings</CardTitle>
                  <CardDescription className="text-gray-600">
                    Manage your password and account security
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <FormField
                    control={passwordForm.control}
                    name="current_password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter your current password" {...field} className="h-10" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={passwordForm.control}
                      name="new_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Enter new password" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">Confirm New Password</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Confirm new password" {...field} className="h-10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• At least 8 characters long</li>
                      <li>• Contains uppercase and lowercase letters</li>
                      <li>• Contains at least one number</li>
                    </ul>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                      Change Password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Preferences */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-0 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-gray-900">Preferences</CardTitle>
                  <CardDescription className="text-gray-600">
                    Customize your experience and notification settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <Bell className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Email Notifications</h4>
                      <p className="text-sm text-gray-500">
                        Receive email notifications about platform updates and important announcements
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={notifications}
                    onCheckedChange={handleNotificationChange}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants}>
          <Card className="shadow-lg border-red-200 bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="bg-red-600 p-2 rounded-lg">
                  <Trash2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-red-700">Danger Zone</CardTitle>
                  <CardDescription className="text-gray-600">
                    Irreversible actions that will affect your account permanently
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <div className="space-y-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="font-medium text-red-900 mb-2">Account Deactivation</h4>
                  <p className="text-sm text-red-700 mb-4">
                    Deactivating your account will remove your access to the platform. Your data will be retained 
                    for research purposes, but your personal information will be anonymized.
                  </p>
                  <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        Deactivate Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will deactivate your access to the platform. Your data will be retained for research purposes, but your personal information will be anonymized. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                          Yes, deactivate my account
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default InstructorSettings;