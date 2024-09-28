'use client'
import React from "react";
import {
  Navbar,
  Typography,
  IconButton,
  Button,
  Menu,
  MenuHandler,
  MenuList,
  MenuItem,
} from "@material-tailwind/react";
import {
  UserCircleIcon,
  Cog6ToothIcon,
  InboxIcon,
  PowerIcon,
  Bars3Icon,
} from "@heroicons/react/24/solid";
import Link from "next/link";
import Image from "next/image";
import logo from "@/assets/logo.jpg";

const NavbarComponent = ({setOpenNav}) => {
  return (
    <div className="px-4">
      <div className="flex items-center justify-between ">
        <Typography
          as="a"
          href="#"
          variant="h6"
          className="mr-4 cursor-pointer py-1.5"
        >
          <Image src={logo} alt="logo" width={46} height={46} />
        </Typography>
        <div className="hidden lg:block">
        <ul className="mb-4 mt-2 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="/bodyparts" className="text-inherit no-underline">
          Body Parts
        </Link>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="/createPlanPage" className="text-inherit no-underline">
          Create Plan
        </Link>
      </Typography>
      <Typography
        as="li"
        variant="small"
        color="blue-gray"
        className="p-1 font-normal"
      >
        <Link href="/SavedPlan" className="text-inherit no-underline">
          Saved Plan
        </Link>
      </Typography>
      
    </ul>
        </div>
        <IconButton
          variant="text"
          className="ml-auto h-6 w-6 text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
          ripple={false}
          onClick={setOpenNav}
        >
          <Bars3Icon className="h-6 w-6" />
        </IconButton>
      </div>
    </div>
  );
}

// ... NavList and MobileNav components (see below)

export default NavbarComponent;