"use client";
import { AppleCardsCarouselDemo } from "@/components/Card/AppleCardsCarouselDemo";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import { Dummydata } from "@/utils";
import React, { use, useContext } from "react";



const Coaches = () => {
  const {handleOpenClose} = useContext(GlobalContext)

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden bg-tprimary">
        <div className="top-0 p-3 text-white bg-tprimary sticky-top z-1">
        <div className="flex justify-between">
          <div className="mt-[-8px]">
          <p className="text-3xl"> Choose </p>
          <p className="text-3xl">your <i>Coach</i></p>
          </div>
          <i className="cursor-pointer  text-white fa-duotone fa-solid fa-bars text-[20px]  hambergerMenu" onClick={handleOpenClose}/>
        </div>
          
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          <AppleCardsCarouselDemo title="Meet Our New Coaches" data={Dummydata}/>
        </div>
      </div>
    </SecureComponent>
  );
};

export default Coaches;
