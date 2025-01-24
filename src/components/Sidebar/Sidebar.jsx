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
} from "@heroicons/react/24/solid";
import logo from "@/assets/logo.jpg";
import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { GlobalContext } from "@/context/GloablContext";

const Sidebar = ({}) => {
  const {handleOpenClose,fullName,user,plansRefetch} = useContext(GlobalContext)
  

  const userRole = user?.publicMetadata?.role
  
  return (
    <div className='h-full overflow-x-hidden overflow-y-auto '>
      <Card className="w-full h-full p-3 bg-glass rounded-0 ">
        <div className="z-20 flex items-center justify-between px-4 ">
            <Image src={logo} alt="logo" width={45} height={45} />
            <i className="text-red-500 cursor-pointer fa-solid fa-xmark hambergerMenu" onClick={handleOpenClose}/>
        </div>
        <List className="font-semibold text-white">
          
          
          {/* <ListItem>
            <ListItemPrefix>
            <i className="fa-sharp-duotone fa-solid fa-skeleton-ribs"></i>
            </ListItemPrefix>
            <Link href="/bodyparts" className="no-underline text-inherit" onClick={handleOpenClose}>
              Body Parts
            </Link>
          </ListItem> */}
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-house h-5 w-5 !mr-2 drop-shadow-lg "/>
              
            </ListItemPrefix>
            <Link href="/" className="no-underline text-inherit" onClick={handleOpenClose}>
              Home
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-solid fa-layer-plus h-5 w-5 !mr-2 drop-shadow-lg"></i>
              
            </ListItemPrefix>
            <Link href="/createPlanPage" className="no-underline text-inherit" onClick={handleOpenClose}>
              Create Plan
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-thin fa-floppy-disk h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/SavedPlan" className="no-underline text-inherit" onClick={()=>{handleOpenClose();plansRefetch()}}>
              Saved Plan
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-solid fa-notes-medical h-5 w-5 !mr-2 drop-shadow-lg"></i>
              
            </ListItemPrefix>
            <Link href="/healthReport" className="no-underline text-inherit" onClick={handleOpenClose}>
              Health Report
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-user-vneck-hair h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/profile" className="no-underline text-inherit" onClick={handleOpenClose}>
              Profile
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-user-vneck-hair h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/angle" className="no-underline text-inherit" onClick={handleOpenClose}>
              Angle
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-user-vneck-hair h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/mentors" className="no-underline text-inherit" onClick={handleOpenClose}>
            Instructor
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-user-vneck-hair h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/myEnrollment" className="no-underline text-inherit" onClick={handleOpenClose}>
              My Enrollment
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-user-vneck-hair h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/join" className="no-underline text-inherit" onClick={handleOpenClose}>
              Join as Instructor
            </Link>
          </ListItem>
          {(userRole === "admin" || userRole === "coach") &&
            <ListItem>
            <ListItemPrefix>
            <i className="fa-duotone fa-light fa-user-vneck-hair h-5 w-5 !mr-2 drop-shadow-lg"></i>
            </ListItemPrefix>
            <Link href="/clients" className="no-underline text-inherit" onClick={handleOpenClose}>
              Enrolled Clients
            </Link>
          </ListItem>
          }
          
          <ListItem>
            <UserButton />
          </ListItem>
        </List>
      </Card>
    </div>
  );
}

export default Sidebar;