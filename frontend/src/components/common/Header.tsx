import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, MessageCircle, BarChart2, Settings, Users, FileText, LogOut, Check } from "lucide-react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/contexts/AuthContext";

interface HeaderProps {
  currentRole: "student" | "instructor" | "master";
  userName: string;
  profilePicture: string;
  onProfilePictureChange: (newPictureFile: string) => Promise<void>;
}

const Header = ({ currentRole, userName, profilePicture, onProfilePictureChange }: HeaderProps) => {
  const navigate = useNavigate();
  const { logout } = useAuth(); // Get the logout function from our context

  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const profilePicOptions = [
    { name: "Apple", file: "apple.png" },
    { name: "Blueberry", file: "blueberry.png" },
    { name: "Lemon", file: "lemon.png" },
    { name: "Lychee", file: "lychee.png" },
    { name: "Melon", file: "melon.png" },
    { name: "Orange", file: "orange.png" },
    { name: "Pear", file: "pear.png" },
    { name: "Plum", file: "plum.png" },
  ];

  // This is the corrected logout handler
  const handleLogout = () => {
    // 1. Call the context's logout function to clear global state and localStorage
    logout();
    
    // 2. Navigate to the landing page. This will now work reliably.
    navigate("/");
  };

  // This handler now calls the function passed down from Layout,
  // which is responsible for the API call and telling the context to refetch.
  const handleProfilePictureSelect = async (pictureFile: string) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    setStatusMessage(null);
    try {
      await onProfilePictureChange(pictureFile);
      
      setStatusMessage({ type: "success", message: "Picture updated!" });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update profile picture from header:", error);
      setStatusMessage({ type: "error", message: "Update failed" });
    } finally {
      setIsUpdating(false);
    }
  };

  const studentMenuItems = [
    { icon: Home, label: "Dashboard", path: "/student/dashboard" },
    { icon: MessageCircle, label: "Practice", path: "/student/practice" },
    { icon: BarChart2, label: "Progress", path: "/student/progress" },
    { icon: Settings, label: "Account Settings", path: "/student/settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/feedback-help" },
  ];

  const instructorMenuItems = [
    { icon: Home, label: "Dashboard", path: "/instructor/dashboard" },
    { icon: FileText, label: "Lessons", path: "/instructor/lessons" },
    { icon: Users, label: "Students", path: "/instructor/students" },
    { icon: BarChart2, label: "Analytics", path: "/instructor/analytics" },
    { icon: Settings, label: "Account Settings", path: "/instructor/settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/instructor/feedback-help" },
  ];

  const masterMenuItems = [
    { icon: Home, label: "Dashboard", path: "/master/dashboard" },
    { icon: FileText, label: "Classes", path: "/master/classes" },
  ];

  const menuItems = currentRole === "master" ? masterMenuItems : currentRole === "student" ? studentMenuItems : instructorMenuItems;
  const currentPicFileName = profilePicture.split("/").pop() || "blueberry.png";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center bg-white border-b border-border px-4 z-20">
      <div className="flex justify-end items-center w-full gap-4">
        {statusMessage && (
          <div
            className={`px-3 py-1 rounded-md text-sm transition-opacity duration-300 ${
              statusMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        <Select onValueChange={(path) => navigate(path)}>
          <SelectTrigger className="w-48 border rounded-md px-3 py-2 text-sm">
            <SelectValue placeholder="Menu" />
          </SelectTrigger>
          <SelectContent>
            {menuItems.map((item) => (
              <SelectItem key={item.label} value={item.path}>
                <div className="flex items-center gap-4">
                  <item.icon className="h-4 w-4" />
                  <span className="py-1">{item.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-1 rounded-md border bg-white hover:bg-gray-100">
              <span className="text-sm mr-1">{userName}</span>
              <img
                src={profilePicture}
                alt="User Avatar"
                className="h-8 w-8 rounded-full border border-gray-300 object-cover"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Profile Picture</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid grid-cols-4 gap-2 p-2">
              {profilePicOptions.map((pic) => (
                <DropdownMenuItem
                  key={pic.file}
                  className="p-2 flex justify-center items-center h-14 w-14 hover:bg-gray-100 rounded-md cursor-pointer"
                  onClick={() => handleProfilePictureSelect(pic.file)}
                  disabled={isUpdating}
                >
                  <div className="relative">
                    <img
                      src={`/images/profile-icons/${pic.file}`}
                      alt={pic.name}
                      title={pic.name}
                      className="h-12 w-12 rounded-full object-cover border border-gray-200 hover:scale-110 transition-transform"
                    />
                    {currentPicFileName === pic.file && (
                      <div className="absolute -top-1 -right-1 bg-primary text-white rounded-full p-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Header;