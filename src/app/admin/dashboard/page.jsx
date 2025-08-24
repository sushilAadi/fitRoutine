"use client";
import React, { useEffect, useState, useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import AdminSidebar from "@/components/Sidebar/AdminSidebar";
import ButtonCs from "@/components/Button/ButtonCs";
import { 
  InstructorManagement, 
  UserManagement, 
  SystemSettings, 
  Analytics 
} from "@/features/admin";
import "./dashboard.css";

const AdminDashboard = () => {
  const { user, handleOpenClose } = useContext(GlobalContext);
  const [activeComponent, setActiveComponent] = useState('instructor-management');
  
  // Prevent body scroll when dashboard is mounted
  useEffect(() => {
    document.body.classList.add('dashboard-active');
    return () => {
      document.body.classList.remove('dashboard-active');
    };
  }, []);
  
  // Listen for sidebar navigation events
  useEffect(() => {
    const handleSidebarNavigation = (event) => {
      const { component } = event.detail;
      setActiveComponent(component);
    };
    
    window.addEventListener('admin-navigate', handleSidebarNavigation);
    
    return () => {
      window.removeEventListener('admin-navigate', handleSidebarNavigation);
    };
  }, []);

  const userRole = user?.publicMetadata?.role;
  
  // Component mapping
  const getActiveComponent = () => {
    switch (activeComponent) {
      case 'instructor-management':
        return <InstructorManagement />;
      case 'user-management':
        return <UserManagement />;
      case 'system-settings':
        return <SystemSettings />;
      case 'analytics':
        return <Analytics />;
      default:
        return <InstructorManagement />;
    }
  };

  // Check if user is admin or coach (both can manage instructors)
  if (userRole !== "admin" && userRole !== "coach") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            You don't have permission to access this page.
          </p>
          <ButtonCs 
            title="Go Back" 
            className="mt-6"
            onClick={handleOpenClose}
          >
            Go Back
          </ButtonCs>
        </div>
      </SecureComponent>
    );
  }

  return (
    <SecureComponent>
      <div className="min-h-screen bg-light">
        <AdminSidebar />
        
        {/* Main Content */}
        <div className="admin-content">
          {getActiveComponent()}
        </div>
      </div>
    </SecureComponent>
  );
};

export default AdminDashboard;