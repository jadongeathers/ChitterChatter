import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  Home,
  MessageCircle,
  BarChart2,
  Settings,
  Users,
  FileText,
} from "lucide-react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/contexts/AuthContext";

// Props interface is now simpler, only accepting optional className
interface SidebarProps {
  className?: string;
}

// Fix: More specific typing for icon components that accept className
type MenuItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  id: string;
};

// MenuItems helper component is fine as is.
const MenuItems = ({ items }: { items: MenuItem[] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <SidebarMenu className="flex flex-col">
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton asChild isActive={location.pathname.startsWith(item.path)}>
            <button
              className="flex w-full items-center text-left pl-4 py-6"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span className="text-base font-medium">{item.label}</span>
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

// 👇 --- THIS IS THE FIX --- 👇
// We explicitly type the component as a React Functional Component (React.FC)
// that accepts props of type SidebarProps. This resolves the TypeScript error.
const UpdatedSidebar: React.FC<SidebarProps> = ({ className }) => {
  const { role } = useAuth();

  // Define menu items
  const studentMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/student/dashboard", id: "home" },
    { icon: MessageCircle, label: "Practice", path: "/student/practice", id: "practice" },
    { icon: BarChart2, label: "Progress", path: "/student/progress", id: "progress" },
    { icon: Settings, label: "Account Settings", path: "/student/settings", id: "settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/feedback-help", id: "feedback-help" },
  ];

  const instructorMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/instructor/dashboard", id: "home" },
    { icon: FileText, label: "Lessons", path: "/instructor/lessons", id: "lessons" },
    { icon: Users, label: "Students", path: "/instructor/students", id: "students" },
    { icon: BarChart2, label: "Analytics", path: "/instructor/analytics", id: "analytics" },
    { icon: Settings, label: "Account Settings", path: "/instructor/settings", id: "settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/instructor/feedback-help", id: "feedback-help" },
  ];

  const masterMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/master/dashboard", id: "home" },
    { icon: FileText, label: "Manage Classes", path: "/master/classes", id: "classes" },
  ];
  
  // A guard clause to prevent rendering if the role isn't determined yet.
  if (!role) {
    return null;
  }

  let menuItems: MenuItem[] = [];
  if (role === "student") menuItems = studentMenuItems;
  else if (role === "instructor") menuItems = instructorMenuItems;
  else if (role === "master") menuItems = masterMenuItems;

  return (
    <Sidebar className={cn("w-64", className)}>
      <SidebarHeader className="flex flex-col items-center py-4">
        <img src="/images/logo2.png" alt="ChitterChatter Logo" className="h-20 mt-2 w-auto" />
        <div className="text-2xl tracking-wide text-primary font-logo font-semibold">
          ChitterChatter
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <MenuItems items={menuItems} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter />
    </Sidebar>
  );
};

export default UpdatedSidebar;