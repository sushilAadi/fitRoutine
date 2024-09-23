'use client'
import React from "react";
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

const Sidebar = ({setOpenNav}) => {
  const [open, setOpen] = React.useState(0);
 
  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value);
  };
 
  return (
    <div className='overflow-y-auto h-full p-4'>
      <Card className="h-full w-full p-3 ">
        <div className=" px-4 flex justify-between items-center">
        <Image src={logo} alt="logo" width={46} height={46} />
        <i className="fa-solid fa-xmark text-red-500 cursor-pointer" onClick={setOpenNav}/>
        </div>
        <List>
          
          
          <ListItem>
            <ListItemPrefix>
            <i className="fa-solid fa-person-half-dress"></i>
            </ListItemPrefix>
            <Link href="/bodyparts" className="text-inherit no-underline" onClick={setOpenNav}>
              Body Parts
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
              <UserCircleIcon className="h-5 w-5" />
            </ListItemPrefix>
            <Link href="/customPlan" className="text-inherit no-underline" onClick={setOpenNav}>
              Custom Plan
            </Link>
          </ListItem>
          <ListItem>
            <ListItemPrefix>
              <Cog6ToothIcon className="h-5 w-5" />
            </ListItemPrefix>
            Profile
          </ListItem>
          <ListItem>
            <ListItemPrefix>
              <PowerIcon className="h-5 w-5" />
            </ListItemPrefix>
            Log Out
          </ListItem>
        </List>
      </Card>
    </div>
  );
}

export default Sidebar;