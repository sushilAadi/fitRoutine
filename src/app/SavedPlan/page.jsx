"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import SavedCard from "@/components/Card/SavedCard";
import { IconButton } from "@material-tailwind/react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { GlobalContext } from "@/context/GloablContext";
import { calculateProgress } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { toast } from 'react-hot-toast';
import { supabase } from '@/createClient';

const CustomPlanPage = () => {
  const { handleOpenClose, userId, fetchPlans, setLastPosition } =
    useContext(GlobalContext);
  const router = useRouter();
  const [savedPlans, setSavedPlans] = useState([]);

  const {
    data: userPlanData,
    error: userPlanError,
    refetch: userPlanRefetch,
    isLoading: userPlanisLoading,
  } = useQuery({
    queryKey: ["userPlanData", userId],
    queryFn: fetchPlans,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (userPlanError) {
      toast.error(`Error fetching plans: ${userPlanError.message}`, {
        position: toast.POSITION.TOP_CENTER,
      });
      return;
    }
    if (userPlanisLoading) {
      return; // Do not process if still loading
    }
    if (userPlanData) {
    const processedPlans = userPlanData.map((item) => {
      const plan = item?.workoutPlanDB;
      const progress = calculateProgress(plan);
      const status =
        progress === 100 ? "completed" : progress > 0 ? "active" : "inactive";
      return { ...plan, status, progress, id: item.id, planName: item.planName };
    });


    // Custom sorting logic based on the conditions
    processedPlans.sort((a, b) => {
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
    
      setSavedPlans(processedPlans);
    }
  }, [userPlanData, userPlanError, userPlanisLoading]);

  const deletePlan = async (planId, planName) => {
    console.log("planId",planId)
    if (window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
      try {
        // Delete from Supabase using the plan's id
        const { error } = await supabase
          .from("workoutPlan")
          .delete()
          .eq("id", planId);
  
        if (error) {
          console.error("Error deleting plan from Supabase:", error);
            toast.error(`Failed to delete plan: ${error.message}`);
            return;
        }

        // Optimistically update the UI
        setSavedPlans((prevPlans) =>
          prevPlans.filter((plan) => plan.id !== planId)
        );
            toast.success("Plan deleted successfully!");
      
      } catch (error) {
            toast.error(`Error deleting plan: ${error.message}`);
        
      }
    }
  };

 const startPlan = (planId, planName) => {
    // console.log(planId, planName);
      
       
    const updatedPlans = savedPlans.map((plan) => {
      if (plan.id === planId && plan.progress !== 100) {
          plan.status = "active";
       } else if (plan.status === "active" && plan.progress === 100) {
          plan.status = "completed";
        } else if (plan.status === "inactive" && plan.progress === 0) {
          plan.status = "inactive";
        }
         plan.progress = calculateProgress(plan);

      return plan;
    });

    setSavedPlans(updatedPlans);

     router.push(`/SavedPlan/${planId}`);
  };

  const hasActivePlan = savedPlans.some(
    (plan) => plan.status === "active" && plan.progress < 100
  );

  const hasCompletedPlan = savedPlans.some((plan) => plan.progress === 100);

    const deleteAllPlans = async () => {
      if (
          window.confirm(
              "Are you sure you want to delete all workout plans? This action cannot be undone."
          )
      ) {
          try {
              // Delete all plans from Supabase for the current user
              const { error } = await supabase
                  .from("userPlan")
                  .delete()
                  .eq("userIdCl", userId); // Use userId from context

              if (error) {
                  console.error("Error deleting all plans from Supabase:", error);
                    toast.error(`Failed to delete all plans: ${error.message}`, {
                      position: toast.POSITION.TOP_CENTER,
                    });
                return;
              }
                toast.success("All plans deleted successfully!", {
                  position: toast.POSITION.TOP_CENTER,
                });
              // Clear state
              setSavedPlans([]);
              setLastPosition({})
          } catch (error) {
            toast.error(`Error deleting all plans: ${error.message}`, {
              position: toast.POSITION.TOP_CENTER,
            });
              console.error("Error deleting all plans:", error);
          }
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
            <p className="mb-2 text-white">
              You have saved plans. If you want to delete click the delete
              button?  {" "}
              <i
                onClick={deleteAllPlans}
                className="text-white cursor-pointer fa-duotone fa-light fa-trash"
              ></i>
            </p>
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
                          router.push(`/SavedPlan/${plan.id}`);
                      } else {
                        startPlan(plan.id,plan.planName);
                        }
                    }}
                    onClickSecondary={() => deletePlan(plan.id,plan.planName)}
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