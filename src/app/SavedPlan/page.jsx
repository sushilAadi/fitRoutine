"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import SavedCard from "@/components/Card/SavedCard";
import { IconButton } from "@material-tailwind/react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { GlobalContext } from "@/context/GloablContext";

const CustomPlanPage = () => {
  const { handleOpenClose } = useContext(GlobalContext);
  const router = useRouter();
  const [savedPlans, setSavedPlans] = useState([]);

  const calculateProgress = (plan) => {
    let totalExercises = 0;
    let completedExercises = 0;

    plan?.workoutPlan.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        day.exercises.forEach((_, exerciseIndex) => {
          totalExercises++;
          if (
            plan.exerciseHistory[`${weekIndex}-${dayIndex}-${exerciseIndex}`]
              ?.length > 0
          ) {
            completedExercises++;
          }
        });
      });
    });

    const progress =
      totalExercises > 0
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0;
    return progress;
  };

  useEffect(() => {
    const plans = Object.keys(localStorage)
      .filter((key) => key.startsWith("workoutPlan_"))
      .map((key) => {
        const plan = JSON.parse(localStorage.getItem(key));
        const progress = calculateProgress(plan);
        const status =
          progress === 100 ? "completed" : progress > 0 ? "active" : "inactive";
        return { ...plan, status, progress };
      });

    // Custom sorting logic based on the conditions
    plans.sort((a, b) => {
      if (a.status === "active" && b.status !== "active") return -1; // Active plans come first
      if (a.status !== "active" && b.status === "active") return 1;

      if (a.status === "completed" && b.status !== "completed") return 1; // Completed plans come last
      if (a.status !== "completed" && b.status === "completed") return -1;

      // For plans with undefined/null status, move them to the top
      if (!a.status && b.status) return -1;
      if (a.status && !b.status) return 1;

      // Fallback to order by progress (inactive -> active -> completed)
      return b.progress - a.progress;
    });

    setSavedPlans(plans);
  }, []);

  const deletePlan = (planName) => {
    if (
      window.confirm(`Are you sure you want to delete the plan "${planName}"?`)
    ) {
      localStorage.removeItem(`workoutPlan_${planName}`);
      setSavedPlans((prevPlans) =>
        prevPlans.filter((plan) => plan.name !== planName)
      );
    }
  };

  const startPlan = (planName) => {
    const updatedPlans = savedPlans.map((plan) => {
      if (plan.name === planName && plan.progress !== 100) {
        plan.status = "active";
      } else if (plan.status === "active" && plan.progress === 100) {
        plan.status = "completed";
      } else if (plan.status === "inactive" && plan.progress === 0) {
        plan.status = "inactive";
      }

      plan.progress = calculateProgress(plan);
      localStorage.setItem(`workoutPlan_${plan.name}`, JSON.stringify(plan));
      return plan;
    });

    setSavedPlans(updatedPlans);
    router.push(`/SavedPlan/${planName}`);
  };

  const hasActivePlan = savedPlans.some(
    (plan) => plan.status === "active" && plan.progress < 100
  );
  const hasCompletedPlan = savedPlans.some((plan) => plan.progress === 100);

  const deleteAllPlans = () => {
    if (
      window.confirm(
        "Are you sure you want to delete all workout plans? This action cannot be undone."
      )
    ) {
      // Remove all workout plans
      Object.keys(localStorage)
        .filter((key) => key.startsWith("workoutPlan_"))
        .forEach((key) => localStorage.removeItem(key));
  
      // Remove related localStorage items
      Object.keys(localStorage)
        .filter((key) => key.startsWith("lastPosition_") || key.startsWith("restTime_"))
        .forEach((key) => localStorage.removeItem(key));
  
      // Clear state
      setSavedPlans([]);
    }
  };
  

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0 p-3 bg-black sticky-top">
          <div className="flex cursor-pointer">
            <div className="">
              <h3 className="font-semibold text-white text-1xl">
                Saved Workout Plans
              </h3>
              <p className="text-xs font-medium text-gray-500">
                Track your fitness journey and access all your <br /> saved
                custom workout plans. Let's crush those goals!
              </p>
            </div>
           
            <IconButton
              variant="text"
              className="w-6 h-6 ml-auto text-white hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
              ripple={false}
              onClick={handleOpenClose}
            >
              <Bars3Icon className="w-6 h-6" />
            </IconButton>
          </div>
        </div>
        {savedPlans?.length > 0 && (
  <div className="p-2 bg-red-600">
    <p className="mb-2 text-white">You have saved plans. If you want to delete click the delete button? &nbsp; <i onClick={deleteAllPlans} className="text-white cursor-pointer fa-duotone fa-light fa-trash"></i></p> 
  </div>
)}
        
        <div className="flex flex-wrap justify-between p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar h-100">
        
          {savedPlans.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedPlans.map((plan, index) => (
                <div key={index} className="flex flex-col">
                  <SavedCard
                    plan={plan}
                    onClick={() => {
                      if (plan.progress === 100 || plan.status === "active") {
                        router.push(`/SavedPlan/${plan.name}`);
                      } else {
                        startPlan(plan.name);
                      }
                    }}
                    onClickSecondary={() => deletePlan(plan.name)}
                    isDisabled={
                      hasActivePlan &&
                      plan.status === "inactive" &&
                      plan.progress !== 100
                    }
                    isCompleted={plan.progress === 100}
                  />
                </div>
              ))}
            </div>
          ) : (
            <p>No saved plans found.</p>
          )}
        </div>
      </div>
    </>
  );
};

export default CustomPlanPage;
