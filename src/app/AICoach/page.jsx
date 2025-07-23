"use client";
import BlurryBlob from "@/components/BlurryBlob/BlurryBlob";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import WorkoutChat from "@/components/WorkoutChat";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext, useEffect, useState } from "react";


const AICoach = () => {
    const [workoutPlan, setWorkoutPlan] = useState(null);
    const {handleOpenClose,userDetailData} = useContext(GlobalContext)

    const handlePlanGenerated = (plan) => {
      setWorkoutPlan(plan);
    };
  

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden ">
      <BlurryBlob />
        <div className="top-0 p-3 text-tprimary sticky-top"><h1 onClick={handleOpenClose} className="mb-6 text-3xl font-bold">Neeed FIT AI</h1></div>
        <div className="flex flex-col flex-grow p-3 mb-2 overflow-x-hidden overflow-y-auto exerciseCard no-scrollbar">
        <WorkoutChat onPlanGenerated={handlePlanGenerated} />

      
        </div>
      </div>
    </SecureComponent>
  );
};

export default AICoach;
