"use client";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import WorkoutForm from "@/components/WorkoutForm";
import React, { useContext, useEffect, useState } from "react";


const AICoach = () => {
    const [workoutPlan, setWorkoutPlan] = useState(null);

    const handlePlanGenerated = (plan) => {
      setWorkoutPlan(plan);
    };
  

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0 p-3 text-white bg-tprimary sticky-top"><h1 className="mb-6 text-3xl font-bold">AI Workout Plan Generator</h1></div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
        <WorkoutForm onPlanGenerated={handlePlanGenerated} />

      
        </div>
      </div>
    </SecureComponent>
  );
};

export default AICoach;
