"use client";
import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { GlobalContext } from "@/context/GloablContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import TabMT from "@/components/Tabs/TabMT";
import { transformData } from "@/utils";

const PlanDetail = ({ params }) => {
  const { userId, latestWeight } = useContext(GlobalContext);
  const USER_WEIGHT_KG = latestWeight?.userWeights;
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
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
      let dayNames = null;
      let weekNames = null;

      try {
        if (typeof data.workoutPlanDB.workoutPlan === "string") {
          parsedWorkoutPlan = JSON.parse(data.workoutPlanDB.workoutPlan);
        } else {
          parsedWorkoutPlan = data.workoutPlanDB.workoutPlan;
        }
        if (typeof data.workoutPlanDB.dayNames === "string") {
          dayNames = JSON.parse(data.workoutPlanDB.dayNames);
        } else {
          dayNames = data.workoutPlanDB.dayNames;
        }
        if (typeof data.workoutPlanDB.weekNames === "string") {
          weekNames = JSON.parse(data.workoutPlanDB.weekNames);
        } else {
          weekNames = data.workoutPlanDB.weekNames;
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
        dayNames: dayNames,
        daysPerWeek: data.workoutPlanDB.daysPerWeek,
        weeks: data.workoutPlanDB.weeks,
        weekNames: weekNames,
        setUpdate: data.workoutPlanDB.setUpdate,
        date: data.workoutPlanDB.date,
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

 
  
  const transFormWorkoutData =!loading && workoutData ? transformData(workoutData) : null; // Check workoutData before transforming.
  const weekData = transFormWorkoutData?.weeksExercise?.map((i) => i) || []; // Handle possible null
  
  useEffect(() => {
    if (weekData && weekData.length > 0 && !selectedWeek) {
      setSelectedWeek(weekData[0]);
    }
  }, [weekData, selectedWeek]);
  
  
  

  

  const dataDay = selectedWeek?.days?.map(i=>({
    "label": i?.dayName,
    "value": i?.day,
    "exercise": i?.exercises,
    "day":i?.day
})) || [];  // Handle possible null



const exercisesBasedOnDay = dataDay?.find(
  (i) => i?.value === selectededDay
);

console.log("weekData",weekData)
const weekStructure = weekData?.map(i=>({week:i?.week,weekName:i?.weekName})) || [];

const structuredExercisesBasedOnDay = {dayName:exercisesBasedOnDay?.label,day:exercisesBasedOnDay?.value,exercises:exercisesBasedOnDay?.exercise,weekName:selectedWeek?.weekName,week:selectedWeek?.week}||{};

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
        <h2>{_.capitalize(workoutData?.name)}</h2>
      </div>
      <div className="flex gap-2 overflow-auto">
      {weekData && weekData?.map((i) => (
          <div
            className={`border cursor-pointer ${
              selectedWeek?.weekName === i?.weekName && "bg-black text-white"
            }`}
            onClick={() => setSelectedWeek(i)}
            key={i?.weekName}
          >
            {i?.weekName}  
          </div>
        )) }
      </div>
      <div className="flex-1 mb-2 overflow-auto overflow-y-auto bg-gray-50 exerciseCard h-fit no-scrollbar">
        <TabMT
          tab={dataDay}
          selectededDay={selectededDay}
          setSelectededDay={setSelectededDay}
          exercisesBasedOnDay={structuredExercisesBasedOnDay}
          selectedWeek={selectedWeek}
          setSelectedWeek={setSelectedWeek}
          selectedPlanId={selectedPlanId}
          noOfweeks={transFormWorkoutData?.weeks}
          weekStructure={weekStructure}
        />
      </div>
    </div>
  );
};

export default PlanDetail;