"use client";
import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { GlobalContext } from "@/context/GloablContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import TabMT from "@/components/Tabs/TabMT";


const PlanDetail = ({ params }) => {
  const { userId, latestWeight } = useContext(GlobalContext);
  const USER_WEIGHT_KG = latestWeight?.userWeights;
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectededDay, setSelectededDay] = useState(null);
  const selectedPlanId = decodeURIComponent(params?.plan);

  const fetchWorkoutPlan = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!userId) {
        setError("User not authenticated.");
        return;
      }

      const planRef = doc(db, "workoutPlans", selectedPlanId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        setError("Workout plan not found.");
        return;
      }

      const data = planDoc.data();

      if (!data || !data.workoutPlanDB) {
        setError("Workout plan data is missing.");
        return;
      }

      let parsedWorkoutPlan = null;
      let parsedExerciseHistory = null;

      try {
        if (typeof data.workoutPlanDB.workoutPlan === "string") {
          parsedWorkoutPlan = JSON.parse(data.workoutPlanDB.workoutPlan);
        } else {
          parsedWorkoutPlan = data.workoutPlanDB.workoutPlan;
        }

        if (typeof data.workoutPlanDB.exerciseHistory === "string") {
          parsedExerciseHistory = JSON.parse(
            data.workoutPlanDB.exerciseHistory
          );
        } else {
          parsedExerciseHistory = data.workoutPlanDB.exerciseHistory;
        }
      } catch (parseError) {
        console.error("Error parsing data:", parseError);
        setError("Failed to parse workout plan data.");
        return;
      }

      setWorkoutData({
        id: planDoc.id,
        name: data.workoutPlanDB.name,
        progress: 0, // Initial progress
        workoutPlan: parsedWorkoutPlan,
        exerciseHistory: parsedExerciseHistory,
      });
    } catch (fetchError) {
      console.error("Error fetching workout plan:", fetchError);
      setError("Failed to fetch workout plan.");
      toast.error("Failed to fetch workout plan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedPlanId) {
      fetchWorkoutPlan();
    }
  }, [selectedPlanId, userId]); // Add userId as dependency

  const { workoutPlan, exerciseHistory } = workoutData || {};

  const dayTab = workoutPlan?.[0]?.map((i) => i?.day);

  const exercisesBasedOnDay = workoutPlan?.[0]?.find(i=>i?.day === selectededDay)
 console.log("workoutPlan",exercisesBasedOnDay)

  const dataDay = dayTab?.map((day, index) => ({
    label: `Day ${day}`,
    value: day,
    desc: `Description for Day ${day}. Customize this as needed.`,
  }));


  if (loading) {
    return <div className="p-4">Loading workout plan...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!workoutData) {
    return <div className="p-4">No workout data available.</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="top-0 p-3 pb-1 sticky-top">
        <h2>{workoutData?.name}</h2>
      </div>

      <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
        <TabMT
          tab={dataDay}
          selectededDay={selectededDay}
          setSelectededDay={setSelectededDay}
          exercisesBasedOnDay={exercisesBasedOnDay}
        />
      </div>
    </div>
  );
};

export default PlanDetail;
