"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SavedCard from "@/components/Card/SavedCard";

const CustomPlanPage = () => {
  const router = useRouter();
  const [savedPlans, setSavedPlans] = useState([]);

  const isCompleted = (plan) => {
    let totalExercises = 0;
    let completedExercises = 0;

    plan?.workoutPlan.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        day.exercises.forEach((_, exerciseIndex) => {
          totalExercises++;
          if (plan.exerciseHistory[`${weekIndex}-${dayIndex}-${exerciseIndex}`]?.length > 0) {
            completedExercises++;
          }
        });
      });
    });

    return totalExercises > 0 && completedExercises === totalExercises;
  };

  useEffect(() => {
    const plans = Object.keys(localStorage)
      .filter((key) => key.startsWith("workoutPlan_"))
      .map((key) => {
        const plan = JSON.parse(localStorage.getItem(key));
        return { ...plan, status: plan.status || "inactive" };
      });
    
    // Sort plans: active first, then completed, then inactive
    plans.sort((a, b) => {
      const order = { active: 0, completed: 1, inactive: 2 };
      return order[a.status] - order[b.status];
    });
    
    setSavedPlans(plans);
  }, []);

  const deletePlan = (planName) => {
    if (window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
      localStorage.removeItem(`workoutPlan_${planName}`);
      setSavedPlans((prevPlans) =>
        prevPlans.filter((plan) => plan.name !== planName)
      );
    }
  };

  const startPlan = (planName) => {
    const updatedPlans = savedPlans.map(plan => {
      if (plan.name === planName && !isCompleted(plan)) {
        plan.status = "active";
      } else if (plan.status === "active" && !isCompleted(plan)) {
        plan.status = "inactive";
      }
      localStorage.setItem(`workoutPlan_${plan.name}`, JSON.stringify(plan));
      return plan;
    });
    setSavedPlans(updatedPlans);
    router.push(`/SavedPlan/${planName}`);
  };

  const hasActivePlan = savedPlans.some(plan => plan.status === "active" && !isCompleted(plan));
  const hasCompletedPlan = savedPlans.some(plan => isCompleted(plan));

  return (
    <div className="container h-screen px-4 py-2 mx-auto overflow-y-auto">
      <h1 className="mb-4 text-2xl font-bold">Saved Plans</h1>
      {savedPlans.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedPlans.map((plan, index) => (
            <div key={index} className="flex flex-col">
              <SavedCard
                plan={plan}
                onClick={() => {
                  if (isCompleted(plan) || plan.status === "active") {
                    router.push(`/SavedPlan/${plan.name}`);
                  } else {
                    startPlan(plan.name);
                  }
                }}
                onClickSecondary={() => deletePlan(plan.name)}
                isDisabled={hasActivePlan && plan.status === "inactive" && !isCompleted(plan)}
                isCompleted={isCompleted(plan)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p>No saved plans found.</p>
      )}
    </div>
  );
};

export default CustomPlanPage;

