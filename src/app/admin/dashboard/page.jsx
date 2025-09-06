"use client";
import React, { useEffect, useState, useContext, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import DashboardOverview from "@/features/admin/DashboardOverview";
import EnrollmentManagement from "@/app/admin/enrollments/page";
import ClientManagement from "@/app/admin/clients/page";
import FinancialReports from "@/app/admin/finance/page";
import WorkoutManagement from "@/app/admin/workouts/page";
import CommunicationCenter from "@/app/admin/communications/page";
import AnalyticsReports from "@/app/admin/analytics/page";
import SystemSettingsPage from "@/app/admin/settings/page";
import "./dashboard.css";

const AdminDashboardContent = () => {
  const { user, handleOpenClose } = useContext(GlobalContext);
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Get initial active component from URL params or default to dashboard-overview
  const [activeComponent, setActiveComponent] = useState(() => {
    return searchParams.get('page') || 'dashboard-overview';
  });
  
  // Prevent body scroll when dashboard is mounted
  useEffect(() => {
    document.body.classList.add('dashboard-active');
    return () => {
      document.body.classList.remove('dashboard-active');
    };
  }, []);
  
  // Listen for sidebar navigation events and update URL
  useEffect(() => {
    const handleSidebarNavigation = (event) => {
      const { component } = event.detail;
      setActiveComponent(component);
      
      // Update URL with current page
      const params = new URLSearchParams(searchParams.toString());
      params.set('page', component);
      router.replace(`/admin/dashboard?${params.toString()}`, { scroll: false });
    };
    
    window.addEventListener('admin-navigate', handleSidebarNavigation);
    
    return () => {
      window.removeEventListener('admin-navigate', handleSidebarNavigation);
    };
  }, [router, searchParams]);
  
  // Update activeComponent when URL params change (browser back/forward)
  useEffect(() => {
    const pageParam = searchParams.get('page');
    if (pageParam && pageParam !== activeComponent) {
      setActiveComponent(pageParam);
    }
  }, [searchParams, activeComponent]);

  const userRole = user?.publicMetadata?.role;
  
  // Component mapping
  const getActiveComponent = () => {
    switch (activeComponent) {
      case 'dashboard-overview':
        return <DashboardOverview />;
      case 'instructor-management':
        return <InstructorManagement />;
      case 'enrollment-management':
        return <EnrollmentManagement />;
      case 'client-management':
        return <ClientManagement />;
      case 'financial-reports':
        return <FinancialReports />;
      case 'workout-management':
        return <WorkoutManagement />;
      case 'communication-center':
        return <CommunicationCenter />;
      case 'analytics-reports':
        return <AnalyticsReports />;
      case 'system-settings':
        return <SystemSettingsPage />;
      // Legacy mappings for existing components
      case 'user-management':
        return <UserManagement />;
      case 'analytics':
        return <Analytics />;
      default:
        return <DashboardOverview />;
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

// Loading component for Suspense fallback
const DashboardLoading = () => (
  <SecureComponent>
    <div className="min-h-screen bg-light flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
      </div>
    </div>
  </SecureComponent>
);

// Main component wrapped with Suspense
const AdminDashboard = () => {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AdminDashboardContent />
    </Suspense>
  );
};

export default AdminDashboard;