'use client'
import React, { useContext } from "react";
import {
  Card,
  Typography,
  List,
  ListItem,
  ListItemPrefix,
  
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
} from "@heroicons/react/24/solid";
import logo from "@/assets/logo.jpg";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";

const Sidebar = ({}) => {
  const {handleOpenClose,fullName} = useContext(GlobalContext)

  return (
    <div className='h-full p-4 overflow-x-hidden overflow-y-auto'>
      <Card className="w-full h-full p-3 ">
        <div className="flex items-center justify-between px-4 ">
            <Image src={logo} alt="logo" width={45} height={45} />
            <i className="text-red-500 cursor-pointer fa-solid fa-xmark" onClick={handleOpenClose}/>
        </div>
        <List>
          
          
          <ListItem>
            <ListItemPrefix>
            <i className="fa-sharp-duotone fa-solid fa-skeleton-ribs"></i>
            </ListItemPrefix>
            <Link href="/bodyparts" className="no-underline text-inherit" onClick={handleOpenClose}>
              Body Parts
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
              <UserCircleIcon className="h-5 w-5 !mr-2" />
            </ListItemPrefix>
            <Link href="/createPlanPage" className="no-underline text-inherit" onClick={handleOpenClose}>
              Create Plan
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-regular fa-floppy-disk !mr-2"></i>
            </ListItemPrefix>
            <Link href="/SavedPlan" className="no-underline text-inherit" onClick={handleOpenClose}>
              Saved Plan
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
              <Cog6ToothIcon className="h-5 w-5 !mr-2"  />
            </ListItemPrefix>
            Profile
          </ListItem>
          <ListItem>
            <UserButton />
          </ListItem>
        </List>
      </Card>
    </div>
  );
}

export default Sidebar;