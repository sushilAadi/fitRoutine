"use client";
import React, { useContext } from "react";
import { Card, List, ListItem, ListItemPrefix } from "@material-tailwind/react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";
import logo from "@/assets/logo.jpg";

const Sidebar = () => {
  const { handleOpenClose, fullName, user, plansRefetch } =
    useContext(GlobalContext);
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

  

  if (userRole === "admin" || userRole === "coach") {
    menuItems.push({
      name: "Enrolled Clients",
      path: "/clients",
      icon: "fa-user-vneck-hair",
    });
  }

  return (
    <div className="h-full overflow-x-hidden overflow-y-auto">
      <Card className="w-full h-full p-3 bg-glass rounded-0">
        <div className="z-20 flex items-center justify-between px-4">
          <Image src={logo} alt="logo" width={45} height={45} />
          <i
            className="text-red-500 cursor-pointer fa-solid fa-xmark"
            onClick={handleOpenClose}
          />
        </div>
        <List className="font-semibold text-white">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.path}
              className="no-underline text-inherit"
            >
              <ListItem
                onClick={() => {
                  handleOpenClose();
                  item.onClick?.();
                }}
              >
                <ListItemPrefix>
                  <i
                    className={`fa-duotone ${item.icon} h-5 w-5 !mr-2 drop-shadow-lg`}
                  />
                </ListItemPrefix>
                {item.name}
              </ListItem>
            </Link>
          ))}
          <ListItem>
            <UserButton />
          </ListItem>
        </List>
      </Card>
    </div>
  );
};

export default Sidebar;
