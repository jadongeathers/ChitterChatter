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
import { fetchWithAuth } from "@/utils/api";

interface HeaderProps {
  currentRole: "student" | "instructor" | "master";
  userName: string;
  profilePicture: string;
  onProfilePictureChange?: (newPicture: string) => void;
}

const Header = ({ currentRole, userName, profilePicture, onProfilePictureChange }: HeaderProps) => {
  const navigate = useNavigate();
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

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleProfilePictureChange = async (pictureFile: string) => {
    if (isUpdating) return;
    
    try {
      setIsUpdating(true);
      setStatusMessage(null);
      
      const response = await fetchWithAuth("/api/auth/update-profile-picture", {
        method: "POST",
        body: JSON.stringify({ profile_picture: pictureFile }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update profile picture");
      }
      
      const data = await response.json();
      
      // Update local storage user data with new profile picture
      const userData = JSON.parse(localStorage.getItem("user") || "{}");
      userData.profile_picture = pictureFile;
      userData.profile_picture_url = data.profile_picture_url;
      localStorage.setItem("user", JSON.stringify(userData));
      
      // Call the callback if provided
      if (onProfilePictureChange) {
        onProfilePictureChange(pictureFile);
      }
      
      setStatusMessage({
        type: "success",
        message: "Profile picture updated",
      });
      
      // Clear success message after 3 seconds
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (error) {
      console.error("Error updating profile picture:", error);
      setStatusMessage({
        type: "error",
        message: "Failed to update profile picture",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const studentMenuItems = [
    { icon: Home, label: "Dashboard", path: "/dashboard" },
    { icon: MessageCircle, label: "Practice", path: "/practice" },
    { icon: BarChart2, label: "Progress", path: "/progress" },
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/feedback-help" },
  ];

  const instructorMenuItems = [
    { icon: Home, label: "Dashboard", path: "/instructor/dashboard" },
    { icon: FileText, label: "Lessons", path: "/instructor/lessons" },
    { icon: Users, label: "Students", path: "/instructor/students" },
    { icon: BarChart2, label: "Analytics", path: "/instructor/analytics" },
    { icon: Settings, label: "Settings", path: "/instructor/settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/instructor/feedback-help" },
  ];

  const masterMenuItems = [
    { icon: Home, label: "I Do Nothing", path: "/master/dashboard" },
  ];

  const menuItems = currentRole === "master" ? masterMenuItems : currentRole === "student" ? studentMenuItems : instructorMenuItems;

  // Parse the profilePicture URL to get just the filename
  const currentPicFileName = profilePicture.split("/").pop() || "blueberry.png";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 flex items-center bg-white border-b border-border px-4 z-20">
      <div className="flex justify-end items-center w-full gap-4">
        {/* Status Message (only shown when needed) */}
        {statusMessage && (
          <div
            className={`px-3 py-1 rounded-md text-sm ${
              statusMessage.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {statusMessage.message}
          </div>
        )}

        {/* Dropdown Menu */}
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

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-sm px-3 py-2 rounded-md border hover:bg-gray-100"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>

        {/* User Profile Section with Dropdown for Profile Picture Selection */}
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
                  onClick={() => handleProfilePictureChange(pic.file)}
                >
                  <div className="relative">
                    <img
                      src={`/images/profile-icons/${pic.file}`}
                      alt={pic.name}
                      title={pic.name} /* Show name on hover instead */
                      className="h-12 w-12 rounded-full object-cover border border-gray-200 hover:scale-110 transition-transform"
                      style={{ objectFit: "cover", objectPosition: "center" }}
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