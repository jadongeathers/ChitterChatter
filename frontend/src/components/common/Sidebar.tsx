// Sidebar.tsx
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
} from "@/components/ui/sidebar"; // imported from shadcn/ui
import {
  Home,
  MessageCircle,
  BarChart2,
  Settings,
  Users,
  FileText,
  LogOut,
} from "lucide-react";
import { QuestionMarkCircledIcon } from "@radix-ui/react-icons";

interface SidebarProps {
  className?: string;
  currentRole: "student" | "instructor" | "master";
}

type MenuItem = {
  icon: React.ComponentType;
  label: string;
  path: string;
  id: string;
};

// Helper component for rendering menu items.
const MenuItems = ({ items }: { items: any[] }) => {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <SidebarMenu className="flex flex-col">
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton asChild isActive={location.pathname === item.path}>
            <button
              className="flex w-full items-center text-left pl-4 py-6"
              onClick={() => navigate(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span className="text-base font-medium">{item.label}</span> {/* ✅ Label is bigger */}
            </button>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
};

const UpdatedSidebar = ({ className, currentRole }: SidebarProps) => {
  const studentMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/", id: "home" },
    { icon: MessageCircle, label: "Practice", path: "/practice", id: "practice" },
    { icon: BarChart2, label: "Progress", path: "/progress", id: "progress" },
    { icon: Settings, label: "Settings", path: "/settings", id: "settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/feedback-help", id: "feedback-help" },
  ];

  const instructorMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/instructor", id: "home" },
    { icon: FileText, label: "Lessons", path: "/instructor/lessons", id: "lessons" },
    { icon: Users, label: "Students", path: "/instructor/students", id: "students" },
    { icon: BarChart2, label: "Analytics", path: "/instructor/analytics", id: "analytics" },
    { icon: Settings, label: "Settings", path: "/instructor/settings", id: "settings" },
    { icon: QuestionMarkCircledIcon, label: "Help & Feedback", path: "/instructor/feedback-help", id: "feedback-help" },
  ];

  const masterMenuItems: MenuItem[] = [
    { icon: Home, label: "Dashboard", path: "/master/dashboard", id: "home" },
  ];

  // Determine which menu items to use based on currentRole
  let menuItems: MenuItem[] = [];
  if (currentRole === "student") {
    menuItems = studentMenuItems;
  } else if (currentRole === "instructor") {
    menuItems = instructorMenuItems;
  } else if (currentRole === "master") {
    menuItems = masterMenuItems;
  }

  // Regular sidebar for other roles
  return (
    <Sidebar className={cn("w-64", className)}>
      <SidebarHeader className="flex flex-col items-center py-4">
        {/* Logo Image */}
        <img
          src="/images/logo2.png"
          alt="ChitterChatter Logo"
          className="h-20 mt-2 w-auto"
        />

        <div className="text-2xl tracking-wide text-primary font-logo font-semibold">
          ChitterChatter
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <MenuItems items={menuItems} />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
      </SidebarFooter>
    </Sidebar>
  );
};

export default UpdatedSidebar;