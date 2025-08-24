"use client";
import React, { useContext, useState } from "react";
import { Card, List, ListItem, ListItemPrefix } from "@material-tailwind/react";
import { Offcanvas } from "react-bootstrap";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";
import logo from "@/assets/neeed.jpg";

const AdminSidebar = () => {
  const { handleOpenClose, fullName, user } = useContext(GlobalContext);
  const { signOut, openUserProfile } = useClerk();
  const { user: clerkUser } = useUser();
  const [showSidebar, setShowSidebar] = useState(false);
  const pathname = usePathname();
  
  const userRole = user?.publicMetadata?.role;

  const adminMenuItems = [
    { name: "Instructor Management", path: "/admin/dashboard", icon: "fa-solid fa-chalkboard-user" },
    ...(userRole === "admin" ? [
      { name: "User Management", path: "/admin/users", icon: "fa-solid fa-users" },
      { name: "System Settings", path: "/admin/settings", icon: "fa-solid fa-gear" },
      { name: "Analytics", path: "/admin/analytics", icon: "fa-solid fa-chart-bar" },
    ] : []),
  ];

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
        signOut();
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
                const isActive = pathname === item.path;
                return (
                  <Link
                    key={index}
                    href={item.path}
                    className="text-decoration-none text-dark"
                  >
                    <ListItem className={`px-3 py-2 my-1 rounded hover-bg-light ${isActive ? 'bg-light' : ''}`}>
                      <ListItemPrefix>
                        <i className={`${item.icon} me-3 ${isActive ? 'text-warning' : 'text-secondary'}`} />
                      </ListItemPrefix>
                      <span className={isActive ? "fw-bold" : "fw-normal"}>{item.name}</span>
                    </ListItem>
                  </Link>
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
              const isActive = pathname === item.path;
              return (
                <Link
                  key={index}
                  href={item.path}
                  className="text-decoration-none text-dark"
                  onClick={() => setShowSidebar(false)}
                >
                  <ListItem className={`px-3 py-2 my-1 rounded hover-bg-light ${isActive ? 'bg-light' : ''}`}>
                    <ListItemPrefix>
                      <i className={`${item.icon} me-3 ${isActive ? 'text-warning' : 'text-secondary'}`} />
                    </ListItemPrefix>
                    <span className={isActive ? "fw-bold" : "fw-normal"}>{item.name}</span>
                  </ListItem>
                </Link>
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

export default AdminSidebar;