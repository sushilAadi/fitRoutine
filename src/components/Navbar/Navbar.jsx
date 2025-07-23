'use client'
import React, { useContext } from "react";
import {
  Typography,
  IconButton,

} from "@material-tailwind/react";
import {
  Bars3Icon,
  XMarkIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.jpg";
import {
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton
} from '@clerk/nextjs'
import { GlobalContext } from "@/context/GloablContext";
import { useRouter, usePathname } from "next/navigation";

const NavbarComponent = () => {
  const {handleOpenClose,show} = useContext(GlobalContext)
  const pathname = usePathname();
  
  // Hide on home page since profile image handles sidebar opening
  if (pathname === '/' || pathname === '/healthReport') {
    return null;
  }
  console.log(pathname,"pathname")

  return (
    <>
    {!show && <IconButton
      variant="filled"
      className="w-12 h-12 text-gray-500 "
      ripple={false}
      onClick={handleOpenClose}
    >
      {show ? (
        <XMarkIcon className="w-6 h-6" />
      ) : (
        <Bars3Icon className="w-6 h-6" />
      )}
    </IconButton>}
      
    </>
    
  );
}

// ... NavList and MobileNav components (see below)

export default NavbarComponent;