"use client";
import { AppleCardsCarouselDemo } from "@/components/Card/AppleCardsCarouselDemo";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { Dummydata } from "@/utils";
import React from "react";



const Instructors = () => {
  

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden bg-tprimary">
        <div className="top-0 p-3 text-white bg-tprimary sticky-top z-1">
          <p className="text-4xl"> Learn, Grow, Succeed</p>
          <p className="text-4xl"> with Top <i>Coaches</i></p>
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          <AppleCardsCarouselDemo title="Meet Our New Coaches" data={Dummydata}/>
        </div>
      </div>
    </SecureComponent>
  );
};

export default Instructors;
