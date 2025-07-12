'use client'
import React from "react";
import { IconButton } from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const FloatingNavbar = ({ title }) => {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="fixed top-4 left-4 z-50 flex items-center">
      <IconButton
        variant="filled"
        className="w-10 h-10 bg-white/90 backdrop-blur-sm shadow-lg text-gray-700 hover:bg-white"
        ripple={false}
        onClick={handleBackClick}
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </IconButton>
      
      {title && (
        <div className="ml-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg">
          <span className="font-medium text-gray-800">{title}</span>
        </div>
      )}
    </div>
  );
};

export default FloatingNavbar;