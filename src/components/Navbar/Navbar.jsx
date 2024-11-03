'use client'
import React, { useContext } from "react";
import {
  Typography,
  IconButton,

} from "@material-tailwind/react";
import {
  Bars3Icon,
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

const NavbarComponent = () => {
  const {handleOpenClose} = useContext(GlobalContext)

  return (
    <div className="px-4 ">
      <div className="flex items-center justify-between ">
        <Typography
          as="a"
          href="#"
          variant="h6"
          className="mr-4 cursor-pointer py-1.5"
        >
          <Image src={logo} alt="logo" width={46} height={46} className="mix-blend-multiply" />
        </Typography>
        <div className="hidden lg:block">
            <ul className="flex flex-col gap-2 mt-2 mb-4 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
              <Typography
                as="li"
                variant="small"
                color="blue-gray"
                className="p-1 font-normal"
              >
                <Link href="/bodyparts" className="no-underline text-inherit">
                  Body Parts
                </Link>
              </Typography>
              <Typography
                as="li"
                variant="small"
                color="blue-gray"
                className="p-1 font-normal"
              >
                <Link href="/createPlanPage" className="no-underline text-inherit">
                  Create Plan
                </Link>
              </Typography>
              <Typography
                as="li"
                variant="small"
                color="blue-gray"
                className="p-1 font-normal"
              >
                <Link href="/SavedPlan" className="no-underline text-inherit">
                  Saved Plan
                </Link>
              </Typography>

              <UserButton />

            </ul>
        </div>
        <IconButton
          variant="text"
          className="w-6 h-6 ml-auto text-inherit hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
          ripple={false}
          onClick={handleOpenClose}
        >
          <Bars3Icon className="w-6 h-6" />
        </IconButton>
      </div>

    </div>
  );
}

// ... NavList and MobileNav components (see below)

export default NavbarComponent;