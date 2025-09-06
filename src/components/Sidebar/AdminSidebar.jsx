"use client";
import React, { useContext, useState, useEffect, Suspense } from "react";
import { Card, List, ListItem, ListItemPrefix } from "@material-tailwind/react";
import { Offcanvas } from "react-bootstrap";
import Image from "next/image";
import { useClerk, useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { GlobalContext } from "@/context/GloablContext";
import logo from "@/assets/neeed.jpg";

const AdminSidebarContent = () => {
  const { user } = useContext(GlobalContext);
  const { signOut, openUserProfile } = useClerk();
  const { user: clerkUser } = useUser();
  const searchParams = useSearchParams();
  const [showSidebar, setShowSidebar] = useState(false);
  
  // Get initial active component from URL params
  const [activeComponent, setActiveComponent] = useState(() => {
    return searchParams.get('page') || 'dashboard-overview';
  });
  
  const userRole = user?.publicMetadata?.role;

  // Listen for admin navigation events to keep sidebar active state in sync
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
  
  // Sync with URL parameters changes (browser back/forward)
  useEffect(() => {
    const pageParam = searchParams.get('page') || 'dashboard-overview';
    if (pageParam !== activeComponent) {
      setActiveComponent(pageParam);
    }
  }, [searchParams, activeComponent]);

  const adminMenuItems = [
    // 📊 DASHBOARD OVERVIEW - HIGH PRIORITY
    { 
      name: "Dashboard Overview", 
      component: "dashboard-overview", 
      icon: "fa-solid fa-chart-line",
      priority: "HIGH" 
    },
    
    // ✅ EXISTING - Already Working
    { 
      name: "Instructor Management", 
      component: "instructor-management", 
      icon: "fa-solid fa-chalkboard-user" 
    },
    
    // ✅ EXISTING - Already Working
    { 
      name: "Enrollment Management", 
      component: "enrollment-management", 
      icon: "fa-solid fa-user-plus" 
    },
    
    // 👥 CLIENT MANAGEMENT - NEW HIGH PRIORITY
    { 
      name: "Client Management", 
      component: "client-management", 
      icon: "fa-solid fa-users",
      priority: "HIGH"
    },
    
    // 💰 FINANCIAL DASHBOARD - NEW HIGH PRIORITY
    { 
      name: "Financial Reports", 
      component: "financial-reports", 
      icon: "fa-solid fa-chart-pie",
      priority: "HIGH"
    },
    
    // 💪 WORKOUT MANAGEMENT - NEW MEDIUM PRIORITY
    { 
      name: "Workout Management", 
      component: "workout-management", 
      icon: "fa-solid fa-dumbbell",
      priority: "MEDIUM"
    },
    
    // 📢 COMMUNICATION CENTER - NEW MEDIUM PRIORITY
    { 
      name: "Communication Center", 
      component: "communication-center", 
      icon: "fa-solid fa-bullhorn",
      priority: "MEDIUM"
    },
    
    // Admin-only sections
    ...(userRole === "admin" ? [
      // 📊 ANALYTICS & REPORTS - MEDIUM PRIORITY
      { 
        name: "Analytics & Reports", 
        component: "analytics-reports", 
        icon: "fa-solid fa-chart-bar",
        priority: "MEDIUM"
      },
      
      // ⚙️ SYSTEM SETTINGS - LOW PRIORITY
      { 
        name: "System Settings", 
        component: "system-settings", 
        icon: "fa-solid fa-gear",
        priority: "LOW"
      }
    ] : []),
  ];
  
  const handleMenuClick = (component) => {
    // Dispatch custom event for component navigation
    const event = new CustomEvent('admin-navigate', {
      detail: { component }
    });
    window.dispatchEvent(event);
    setShowSidebar(false); // Close mobile menu
  };

  const accountItems = [
    { 
      name: "Manage Account", 
      action: () => {
        setShowSidebar(false);
        openUserProfile();
      }, 
      icon: "fa-gear" 
    },
    { 
      name: "Sign Out", 
      action: () => {
        setShowSidebar(false);
        signOut({ redirectUrl: window.location.origin });
      }, 
      icon: "fa-sign-out" 
    },
  ];

  const toggleSidebar = () => setShowSidebar(!showSidebar);

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-primary text-white rounded-lg shadow-lg d-lg-none"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Desktop Sidebar */}
      <div className="d-none d-lg-block position-fixed top-0 start-0 h-100" style={{ width: "280px", zIndex: 1040 }}>
        <Card className="h-100 border-0 bg-white shadow-lg rounded-0">
          {/* Header */}
          <div className="p-4 border-bottom">
            <div className="d-flex align-items-center">
              <Image src={logo} alt="logo" width={45} height={45} />
              <h4 className="ms-3 mb-0 text-primary">
                {userRole === "admin" ? "Admin Panel" : "Instructor Panel"}
              </h4>
            </div>
          </div>

          {/* Navigation Menu - Scrollable */}
          <div className="flex-grow-1 overflow-auto">
            <List className="p-2">
              {adminMenuItems.map((item, index) => {
                const isActive = activeComponent === item.component;
                return (
                  <div
                    key={index}
                    className="text-decoration-none text-dark"
                    onClick={() => handleMenuClick(item.component)}
                    style={{ cursor: 'pointer' }}
                  >
                    <ListItem className={`px-3 py-2 my-1 rounded hover-bg-light ${isActive ? 'bg-light' : ''}`}>
                      <ListItemPrefix>
                        <i className={`${item.icon} me-3 ${isActive ? 'text-warning' : 'text-secondary'}`} />
                      </ListItemPrefix>
                      <span className={isActive ? "fw-bold" : "fw-normal"}>{item.name}</span>
                    </ListItem>
                  </div>
                );
              })}
            </List>
          </div>
          
          {/* Account Section - Fixed at bottom */}
          <div className="border-top">
            {/* User Profile Display */}
            <div className="p-4 border-bottom">
              <div className="d-flex align-items-center">
                <img
                  src={clerkUser?.imageUrl || "https://www.aiscribbles.com/img/variant/large-preview/43289/?v=cbd7a5"}
                  alt="Profile"
                  className="rounded-circle border"
                  width="40"
                  height="40"
                />
                <div className="ms-3 flex-grow-1 min-width-0">
                  <p className="mb-0 fw-medium text-truncate">
                    {clerkUser?.fullName || "User"}
                  </p>
                  <small className="text-muted text-truncate d-block">
                    {clerkUser?.primaryEmailAddress?.emailAddress}
                  </small>
                  <small className={`badge ${userRole === "admin" ? "bg-danger" : "bg-success"}`}>
                    {userRole === "admin" ? "Admin" : "Coach"}
                  </small>
                </div>
              </div>
            </div>
            
            {/* Account Actions */}
            <List className="p-2">
              {accountItems.map((item, index) => (
                <ListItem
                  key={index}
                  className="px-3 py-2 my-1 rounded cursor-pointer hover-bg-light"
                  onClick={item.action}
                >
                  <ListItemPrefix>
                    <i className={`fas ${item.icon} text-secondary me-3`} />
                  </ListItemPrefix>
                  <span className="fw-medium">{item.name}</span>
                </ListItem>
              ))}
            </List>
          </div>
        </Card>
      </div>

      {/* Mobile Sidebar */}
      <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} placement="start">
        <Offcanvas.Header closeButton className="border-bottom">
          <div className="d-flex align-items-center">
            <Image src={logo} alt="logo" width={35} height={35} />
            <Offcanvas.Title className="ms-2 text-primary">
              {userRole === "admin" ? "Admin Panel" : "Instructor Panel"}
            </Offcanvas.Title>
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          {/* Navigation Menu */}
          <List className="p-2">
            {adminMenuItems.map((item, index) => {
              const isActive = activeComponent === item.component;
              return (
                <div
                  key={index}
                  className="text-decoration-none text-dark"
                  onClick={() => handleMenuClick(item.component)}
                  style={{ cursor: 'pointer' }}
                >
                  <ListItem className={`px-3 py-2 my-1 rounded hover-bg-light ${isActive ? 'bg-light' : ''}`}>
                    <ListItemPrefix>
                      <i className={`${item.icon} me-3 ${isActive ? 'text-warning' : 'text-secondary'}`} />
                    </ListItemPrefix>
                    <span className={isActive ? "fw-bold" : "fw-normal"}>{item.name}</span>
                  </ListItem>
                </div>
              );
            })}
          </List>
          
          {/* User Profile */}
          <div className="mt-auto border-top p-3">
            <div className="d-flex align-items-center mb-3">
              <img
                src={clerkUser?.imageUrl || "https://www.aiscribbles.com/img/variant/large-preview/43289/?v=cbd7a5"}
                alt="Profile"
                className="rounded-circle border"
                width="40"
                height="40"
              />
              <div className="ms-3">
                <p className="mb-0 fw-medium">
                  {clerkUser?.fullName || "User"}
                </p>
                <small className="text-muted">
                  {clerkUser?.primaryEmailAddress?.emailAddress}
                </small>
                <div>
                  <small className={`badge ${userRole === "admin" ? "bg-danger" : "bg-success"}`}>
                    {userRole === "admin" ? "Admin" : "Coach"}
                  </small>
                </div>
              </div>
            </div>
            
            {/* Account Actions */}
            <List className="p-0">
              {accountItems.map((item, index) => (
                <ListItem
                  key={index}
                  className="px-3 py-2 my-1 rounded cursor-pointer hover-bg-light"
                  onClick={item.action}
                >
                  <ListItemPrefix>
                    <i className={`fas ${item.icon} text-secondary me-3`} />
                  </ListItemPrefix>
                  <span className="fw-medium">{item.name}</span>
                </ListItem>
              ))}
            </List>
          </div>
        </Offcanvas.Body>
      </Offcanvas>

      {/* Content Wrapper for Desktop */}
      <style jsx global>{`
        @media (min-width: 992px) {
          .admin-content {
            margin-left: 280px;
          }
        }
        
        .hover-bg-light:hover {
          background-color: rgba(0,0,0,0.05) !important;
        }
      `}</style>
    </>
  );
};

// Loading component for Suspense fallback
const SidebarLoading = () => (
  <div className="sidebar-loading p-4">
    <div className="animate-pulse">
      <div className="h-8 bg-gray-300 rounded mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
        <div className="h-4 bg-gray-300 rounded"></div>
      </div>
    </div>
  </div>
);

// Main component wrapped with Suspense
const AdminSidebar = () => {
  return (
    <Suspense fallback={<SidebarLoading />}>
      <AdminSidebarContent />
    </Suspense>
  );
};

export default AdminSidebar;