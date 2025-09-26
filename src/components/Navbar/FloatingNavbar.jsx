'use client'
import React from "react";
import { IconButton } from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import { useRouter } from "next/navigation";

const FloatingNavbar = ({ title,onClick }) => {
  const router = useRouter();

  const handleBackClick = () => {
    router.back();
  };

  return (
    <div className="fixed z-50 flex items-center top-4 left-4">
      <IconButton
        variant="filled"
        className="w-10 h-10 text-gray-700 shadow-lg bg-white/90 backdrop-blur-sm hover:bg-white"
        ripple={false}
        onClick={handleBackClick}
      >
        <ArrowLeftIcon className="w-5 h-5" />
      </IconButton>
      
      {title && (
        <div onClick={onClick} className="px-4 py-2 ml-3 rounded-full shadow-lg cursor-pointer bg-white/90 backdrop-blur-sm">
          <span className="font-medium text-gray-800">{title}</span>
        </div>
      )}
    </div>
  );
};

export default FloatingNavbar;