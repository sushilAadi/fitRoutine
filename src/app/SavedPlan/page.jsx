"use client";

import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import SavedCard from "@/components/Card/SavedCard";
import { IconButton } from "@material-tailwind/react";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { GlobalContext } from "@/context/GloablContext";
import { calculateProgress } from "@/utils";
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import toast from "react-hot-toast";

const CustomPlanPage = () => {
  const {
    handleOpenClose,
    userId,
    fetchPlans,
    setLastPosition,
    plans,
    isFetchingPlans,
  } = useContext(GlobalContext);

  const router = useRouter();
  const [savedPlans, setSavedPlans] = useState([]);

  const fetchCaloriesBurnt = async (planId) => {
    const db = getFirestore();
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const docRef = doc(db, "caloriesBurnt", `${userId}_${planId}_${currentDate}`);

    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data().totalCalories; // Return the total calories burnt
      } else {
        return 0; // Return 0 if no data exists
      }
    } catch (error) {
      console.error("Error fetching calories burnt: ", error);
      return 0;
    }
  };


  useEffect(() => {
    if (isFetchingPlans) {
      return; // Wait for the plans to be fetched
    }

    if (plans && plans.length > 0) {
      const processPlans = async () => {
        const processedPlans = await Promise.all(
          plans.map(async (item) => {
            const plan = item?.workoutPlanDB;
            const progress = plan?.progress;
            const status =
              progress === 100 ? "completed" : progress > 0 ? "active" : "inactive";

            // Fetch calories burnt for this plan
            const caloriesBurnt = await fetchCaloriesBurnt(item.id);

            return {
              ...plan,
              status,
              progress,
              id: item.id,
              planName: item.planName,
              caloriesBurnt, // Add calories burnt to the plan object
            };
          })
        );

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
      };

      processPlans();
    }
  }, [plans, isFetchingPlans]);

  const deletePlan = async (planId, planName) => {
    
    const modifiedLastPositionKey = planName.replace(
      "workoutPlan_",
      "lastPosition_"
    );
    const modifiedRestTimeKey = planName.replace("workoutPlan_", "restTime_");

    if (
      typeof window !== "undefined" &&
      window.confirm(`Are you sure you want to delete the plan "${planName}"?`)
    ) {
      try {
        const db = getFirestore();
        const planRef = doc(db, "workoutPlans", planId);
        const planDoc = await getDoc(planRef);

        if (!planDoc.exists()) {
          throw new Error("Plan not found");
        }

        const planData = planDoc.data();

        if (planData.userIdCl !== userId) {
          throw new Error("You can only delete your own plans.");
        }

        await deleteDoc(planRef);

        setSavedPlans((prevPlans) =>
          prevPlans.filter((plan) => plan.id !== planId)
        );
        localStorage.removeItem(modifiedLastPositionKey);
        localStorage.removeItem(modifiedRestTimeKey);

        toast.success("Plan deleted successfully!");
      } catch (error) {
        console.error("Error deleting plan:", error);
        toast.error(`Failed to delete plan: ${error.message}`);
      }
    }
  };

  const startPlan = (planId, planName) => {
    const updatedPlans = savedPlans.map((plan) => {
      if (plan.id === planId && plan.progress !== 100) {
        plan.status = "active";
      } else if (plan.status === "active" && plan.progress === 100) {
        plan.status = "completed";
      } else if (plan.status === "inactive" && plan.progress === 0) {
        plan.status = "inactive";
      }
      // plan.progress = calculateProgress(plan);

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
      typeof window !== "undefined" &&
      window.confirm(
        "Are you sure you want to delete all workout plans? This action cannot be undone."
      )
    ) {
      try {
        const db = getFirestore();
        const plansRef = collection(db, "workoutPlans");
        const q = query(plansRef, where("userIdCl", "==", userId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          toast.info("No plans found for the user.");
          return;
        }

        const deletePromises = querySnapshot.docs.map((docSnap) =>
          deleteDoc(doc(db, "workoutPlans", docSnap.id))
        );

        await Promise.all(deletePromises);
        toast.success("All plans deleted successfully!");
        setSavedPlans([]);
      } catch (error) {
        toast.error(`Error deleting all plans: ${error.message}`);
        console.error("Error deleting all plans:", error);
      }
    }
  };

  return (
    <>
      <SecureComponent>
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

              {/* <IconButton
                variant="text"
                className="w-6 h-6 ml-auto text-white hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
                ripple={false}
                onClick={handleOpenClose}
              >
                <Bars3Icon className="w-6 h-6" />
              </IconButton> */}
            </div>
          </div>
          {/* {savedPlans?.length > 0 && (
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
          )} */}

          <div className="flex flex-wrap justify-center p-2 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar h-100 md:justify-between">
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
                          startPlan(plan.id, plan.planName);
                        }
                      }}
                      onClickSecondary={() =>
                        deletePlan(plan.id, plan.planName)
                      }
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
      </SecureComponent>
    </>
  );
};

export default CustomPlanPage;
