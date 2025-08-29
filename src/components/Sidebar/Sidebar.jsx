"use client";
import React, { useContext } from "react";
import { Card, List, ListItem, ListItemPrefix } from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";
import logo from "@/assets/neeed.jpg";

const Sidebar = () => {
  const { handleOpenClose, fullName, user, plansRefetch } =
    useContext(GlobalContext);
  const { signOut, openUserProfile } = useClerk();
  const { user: clerkUser } = useUser();
  const userRole = user?.publicMetadata?.role;
  const menuItems = [
    { name: "Home", path: "/", icon: "fa-house" },
    { name: "Create Plan", path: "/createPlanPage", icon: "fa-layer-plus" },
    { name: "My Drafts", path: "/draft", icon: "fa-regular fa-folder-open" },
    {
      name: "Saved Plan",
      path: "/SavedPlan",
      icon: "fa-floppy-disk",
      onClick: plansRefetch,
    },
    { name: "Health Report", path: "/healthReport", icon: "fa-notes-medical" },
    { name: "Angle", path: "/angle", icon: "fa-solid fa-angle" },
    { name: "Instructor", path: "/mentors", icon: "fa-solid fa-person-chalkboard" },
    {
      name: "My Enrollment",
      path: "/myEnrollment",
      icon: "fa-user-vneck-hair",
    },
    { name: "Join as Instructor", path: "/join", icon: "fa-solid fa-chalkboard-user" },
    { name: "Neeed FIT AI", path: "/AICoach", icon: "fa-duotone fa-solid fa-microchip-ai" },
    { name: "My Diet", path: "/diets", icon: "fa-duotone fa-solid fa-pan-food" },
    { name: "Profile", path: "/profile", icon: "fa-user-vneck-hair" },
  ];

  const accountItems = [
    { 
      name: "Manage Account", 
      action: () => {
        handleOpenClose();
        openUserProfile();
      }, 
      icon: "fa-gear" 
    },
    { 
      name: "Sign Out", 
      action: () => {
        handleOpenClose();
        signOut({ redirectUrl: window.location.origin });
      }, 
      icon: "fa-sign-out" 
    },
  ];

  

  if (userRole === "admin" || userRole === "coach") {
    menuItems.push({
      name: "Enrolled Clients",
      path: "/clients",
      icon: "fa-user-vneck-hair",
    });
  }

  // Admin-only menu items
  if (userRole === "admin") {
    menuItems.push({
      name: "Admin Dashboard",
      path: "/admin/dashboard", 
      icon: "fa-solid fa-shield-halved",
    });
  }

  return (
    <div className="flex flex-col h-full">
      <Card className="flex flex-col w-full h-full border-0 bg-glass rounded-0">
        {/* Header with logo and close button */}
        <div className="flex items-center justify-between p-4 border-b border-white/20 shrink-0">
          <Image src={logo} alt="logo" width={45} height={45} />
          <button
            className="flex items-center justify-center w-8 h-8 text-red-500 transition-colors duration-200 rounded-full hover:bg-red-500/20 focus:bg-red-500/20"
            onClick={handleOpenClose}
            aria-label="Close sidebar"
          >
            <i className="text-lg fa-solid fa-xmark" />
          </button>
        </div>

        {/* Navigation Menu - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <List className="p-2 font-semibold text-white">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                href={item.path}
                className="no-underline text-inherit"
              >
                <ListItem
                  className="px-3 py-2 my-1 transition-all duration-200 rounded-lg hover:bg-white/10 focus:bg-white/10 active:bg-white/20"
                  onClick={() => {
                    handleOpenClose();
                    item.onClick?.();
                  }}
                >
                  <ListItemPrefix>
                    <i
                      className={`fa-duotone ${item.icon} h-5 w-5 !mr-3 drop-shadow-lg`}
                    />
                  </ListItemPrefix>
                  <span className="text-sm font-medium">{item.name}</span>
                </ListItem>
              </Link>
            ))}
          </List>
        </div>
        
        {/* Account Section - Fixed at bottom */}
        <div className="border-t border-white/20 shrink-0">
          {/* User Profile Display */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <img
                src={clerkUser?.imageUrl || "https://www.aiscribbles.com/img/variant/large-preview/43289/?v=cbd7a5"}
                alt="Profile"
                className="w-10 h-10 border-2 rounded-full border-white/20"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {clerkUser?.fullName || "User"}
                </p>
                <p className="text-xs text-gray-300 truncate">
                  {clerkUser?.primaryEmailAddress?.emailAddress}
                </p>
              </div>
            </div>
          </div>
          
          {/* Account Actions */}
          <List className="p-2 font-semibold text-white">
            {accountItems.map((item, index) => (
              <ListItem
                key={index}
                className="p-3 my-1 transition-all duration-200 rounded-lg cursor-pointer hover:bg-white/10 focus:bg-white/10 active:bg-white/20"
                onClick={item.action}
              >
                <ListItemPrefix>
                  <i
                    className={`fa-duotone ${item.icon} h-5 w-5 !mr-3 drop-shadow-lg`}
                  />
                </ListItemPrefix>
                <span className="text-sm font-medium">{item.name}</span>
              </ListItem>
            ))}
          </List>
        </div>
      </Card>
    </div>
  );
};

export default Sidebar;
