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

  // Update useEffect to process plans from the context
  useEffect(() => {
    if (isFetchingPlans) {
      return; // Wait for the plans to be fetched
    }

    if (plans && plans.length > 0) {
      const processedPlans = plans.map((item) => {
        const plan = item?.workoutPlanDB;

        const progress = plan?.progress;
        const status =
          progress === 100 ? "completed" : progress > 0 ? "active" : "inactive";
        return {
          ...plan,
          status,
          progress,
          id: item.id,
          planName: item.planName,
        };
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
  }, [plans, isFetchingPlans]);

  const deletePlan = async (planId, planName) => {
    console.log("planName", planName);
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
