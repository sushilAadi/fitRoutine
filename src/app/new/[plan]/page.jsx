"use client";
import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { GlobalContext } from "@/context/GloablContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import TabMT from "@/components/Tabs/TabMT"; // Adjust path if needed
import { transformData } from "@/utils"; // Adjust path if needed
import _ from "lodash"; // Make sure lodash is installed
import Progress from "./Progress";

const PlanDetail = ({ params }) => {
  const { userId } = useContext(GlobalContext);
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState(null);
  const [transFormedData, setTransformedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [firebaseStoredData, setFirebaseStoredData] = useState(undefined); // Use undefined initially to distinguish from null (no data found)

  const selectedPlanId = decodeURIComponent(params?.plan);

  const workoutProgressKey = `workout-progress-${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId || 'default'}`;
  const selectedDayKey = `selectedDayNumber_${selectedPlanId || 'default'}`;

  // Function to retrieve progress from Firestore
  async function retrieveWorkoutProgress() {
    // No setLoading here, let the calling effect handle it
    if (!userId || !selectedPlanId) {
      console.warn("User ID or Selected Plan ID missing for progress retrieval.");
      return null; // Explicitly return null if prerequisite missing
    }
    try {
      const userProgressRef = doc(db, "userWorkoutProgress", userId);
      const docSnap = await getDoc(userProgressRef);

      if (docSnap.exists()) {
        const allUserData = docSnap.data();
        const specificPlanData = allUserData[selectedPlanId];
        // Check if data exists and is not empty
        if (specificPlanData && Object.keys(specificPlanData).length > 0) {
          
          return specificPlanData; // Return the data
        } else {
          
          return null; // Return null if no data for this plan
        }
      } else {
        
        return null; // Return null if document doesn't exist
      }
    } catch (error) {
      console.error("Error retrieving workout progress from Firestore:", error);
      // Don't set error state here, let the caller handle it based on context
      // Rethrow or return a specific error indicator if needed downstream
      throw error; // Rethrow to be caught by the caller
    }
  }

  // --- REMOVED storeWorkoutDataToLocalStorage function ---

  // --- Fetch Plan Structure AND Saved Progress ---
  useEffect(() => {
    const initializePlan = async () => {
      setLoading(true); // Start loading indicator
      setError(null);
      setWorkoutData(null);
      setTransformedData(null);
      setSelectedWeek(null);
      setSelectedDay(null);
      setFirebaseStoredData(undefined); // Reset to initial state

      if (!selectedPlanId) {
        setError("Plan ID is missing.");
        setLoading(false);
        return;
      }
      if (!userId) {
        console.warn("User ID not available yet, waiting...");
        // Keep loading until userId is available or timeout
        return;
      }

      try {
        const planRef = doc(db, "workoutPlans", selectedPlanId);
        // Fetch concurrently
        const [planDoc, savedProgress] = await Promise.all([
           getDoc(planRef),
           retrieveWorkoutProgress().catch(err => {
               // Handle potential error from retrieveWorkoutProgress specifically
               console.error("Caught error during progress retrieval:", err);
               setError("Failed to retrieve saved progress.");
               return null; // Treat as no saved progress found on error
           })
        ]);

        // Set the fetched progress data (will be null if not found or error)
        setFirebaseStoredData(savedProgress);

        // Process Plan Structure (only if planDoc exists)
        if (!planDoc.exists()) {
          setError("Workout plan structure not found.");
          setLoading(false); // Stop loading if core plan is missing
          return;
        }
        const data = planDoc.data();
        if (!data || !data.workoutPlanDB) {
          setError("Workout plan structure is invalid.");
          setLoading(false);
          return;
        }

        // Parse plan structure (same as before)
        let parsedWorkoutPlan, parsedExerciseHistory, dayNames, weekNames;
        try {
             parsedWorkoutPlan = typeof data.workoutPlanDB.workoutPlan === "string" ? JSON.parse(data.workoutPlanDB.workoutPlan) : data.workoutPlanDB.workoutPlan;
             parsedExerciseHistory = typeof data.workoutPlanDB.exerciseHistory === "string" ? JSON.parse(data.workoutPlanDB.exerciseHistory) : data.workoutPlanDB.exerciseHistory;
             dayNames = typeof data.workoutPlanDB.dayNames === "string" ? JSON.parse(data.workoutPlanDB.dayNames) : data.workoutPlanDB.dayNames;
             weekNames = typeof data.workoutPlanDB.weekNames === "string" ? JSON.parse(data.workoutPlanDB.weekNames) : data.workoutPlanDB.weekNames;
             if (!Array.isArray(parsedWorkoutPlan)) throw new Error("Parsed workoutPlan is not an array.");
        } catch (parseError) {
             console.error("Error parsing plan structure from Firestore:", parseError);
             setError("Failed to parse workout plan data structure.");
             setLoading(false); // Stop on parsing error
             return;
        }

        // Set raw plan data (same as before)
        setWorkoutData({
          id: planDoc.id, name: data.workoutPlanDB.name || "Unnamed Plan", progress: data.workoutPlanDB.progress || 0,
          workoutPlan: parsedWorkoutPlan, exerciseHistory: parsedExerciseHistory, dayNames: dayNames,
          daysPerWeek: data.workoutPlanDB.daysPerWeek, weeks: data.workoutPlanDB.weeks, weekNames: weekNames,
          setUpdate: data.workoutPlanDB.setUpdate, date: data.workoutPlanDB.date,
        });

        // Loading state will be turned off in the next effect after processing

      } catch (fetchError) {
         // Catch errors not handled by specific catches above
         console.error("Error during plan initialization:", fetchError);
         if (!error) { // Avoid overwriting more specific errors
              setError("Failed to load workout plan details.");
         }
         toast.error(error || "Failed to load workout plan details.");
         setFirebaseStoredData(null); // Ensure it's null on general error
         setLoading(false); // Stop loading on error
      }
    };

    if (userId) { // Only run initialization if userId is available
        initializePlan();
    } else {
        setLoading(true); // Ensure loading stays true while waiting for userId
    }
  }, [selectedPlanId, userId]); // Re-run if planId or userId changes

  // --- Transform Data, Determine Initial State from Firebase (if available) ---
  useEffect(() => {
    // Wait until workoutData is loaded AND firebaseStoredData fetch attempt is complete (it's not undefined)
    if (!workoutData || firebaseStoredData === undefined) {
      // Still loading structure or waiting for Firebase progress check results
      // Loading state is managed by the previous effect or initial state
       if (!error && !loading) setLoading(true); // Ensure loading is true if we are waiting
      return;
    }
    // If there was an error during initialization, stop processing
    if (error) {
        setLoading(false);
        return;
    }

    setLoading(true); // Indicate processing starts

    try {
      const transformed = transformData(workoutData);
      if (!transformed || !transformed.weeksExercise || transformed.weeksExercise.length === 0) {
        setError("Workout data is empty or invalid after transformation.");
        setTransformedData(null); setSelectedWeek(null); setSelectedDay(null); setLoading(false);
        return;
      }
      setTransformedData(transformed);

      const weekData = transformed.weeksExercise;
      let initialWeekIndex = 0;
      let initialDayNumber = 1; // Default

      // --- Determine starting point ---
      if (firebaseStoredData && Object.keys(firebaseStoredData).length > 0) {
        // Use Firebase data to find the starting point
        const progressData = firebaseStoredData[workoutProgressKey];
        if (progressData && typeof progressData.currentWeekIndex === 'number' && typeof progressData.currentDayNumber === 'number') {
          initialWeekIndex = progressData.currentWeekIndex;
          initialDayNumber = progressData.currentDayNumber;
          console.log(`Using progress from Firebase '${workoutProgressKey}': WeekIndex=${initialWeekIndex}, DayNumber=${initialDayNumber}`);
        } else {
          const fbWeekIndex = firebaseStoredData[selectedWeekKey];
          const fbDayNumber = firebaseStoredData[selectedDayKey];
          if (typeof fbWeekIndex === 'number' && typeof fbDayNumber === 'number') {
            initialWeekIndex = fbWeekIndex;
            initialDayNumber = fbDayNumber;
            console.log(`Using progress from Firebase individual keys: WeekIndex=${initialWeekIndex}, DayNumber=${initialDayNumber}`);
          } else {
            console.warn("No valid progress keys found in Firebase data. Defaulting to start.");
            // Keep defaults: week 0, day 1 (or first available)
          }
        }
      } else {
        console.log("No Firebase progress data found or data is empty. Starting from the beginning.");
        // Use defaults: week 0, day 1 (or first available)
      }

      // --- Find the corresponding Week Object and Day Number ---
      let initialWeek = weekData.find(w => w.week === initialWeekIndex);
      let initialDay = null;

      if (initialWeek) {
          // Try to find the exact day number
          const dayExists = initialWeek.days.some(d => d.day === initialDayNumber);
          if (dayExists) {
              initialDay = initialDayNumber;
          } else if (initialWeek.days.length > 0) {
              // If specific day not found (e.g., plan structure changed?), default to first day of target week
              console.warn(`Day number ${initialDayNumber} not found in week index ${initialWeekIndex}. Defaulting to first day (${initialWeek.days[0].day}) of that week.`);
              initialDay = initialWeek.days[0].day;
          } else {
              // Target week has no days, fall back to overall default
               console.warn(`Target week index ${initialWeekIndex} has no days. Resetting to plan default.`);
               initialWeek = null; // Force reset below
          }
      }

      // Fallback to overall default if target week wasn't found or had no days
       if (!initialWeek) {
           console.warn(`Week index ${initialWeekIndex} not found or invalid. Resetting to plan default.`);
           initialWeek = weekData.length > 0 ? weekData[0] : null;
           initialDay = initialWeek && initialWeek.days.length > 0 ? initialWeek.days[0].day : null;
       }

       // Final check for valid state
       if (!initialWeek || initialDay === null) {
            setError("Could not determine a valid starting week/day for the plan.");
            setTransformedData(null); setSelectedWeek(null); setSelectedDay(null); setLoading(false);
            return;
       }

      // --- Set the initial state ---
      console.log(`Setting initial state: Week ${initialWeek.week}, Day ${initialDay}`);
      setSelectedWeek(initialWeek);
      setSelectedDay(initialDay);

      // --- DO NOT POPULATE LOCALSTORAGE HERE ---

    } catch (processError) {
      console.error("Error during data transformation or initial state setting:", processError);
      setError("Failed to process workout data.");
      setTransformedData(null); setSelectedWeek(null); setSelectedDay(null);
    } finally {
      setLoading(false); // Processing complete
    }

  }, [workoutData, firebaseStoredData]); // Re-run when structure or FB data is ready

  // --- Event Handlers (No changes needed) ---
   const handleWeekSelect = (weekObject) => {
      if (weekObject && weekObject.days && weekObject.days.length > 0) {
          console.log("Manual week selection:", weekObject.weekName);
          setSelectedWeek(weekObject);
          setSelectedDay(weekObject.days[0].day);
      } else {
          console.warn("Selected week has no days, cannot switch.", weekObject);
      }
   };
   const handleDaySelect = (dayNumber) => {
        console.log("Manual day selection:", dayNumber);
        setSelectedDay(dayNumber);
   };

  // --- Derived Data for Rendering (No changes needed) ---
  const weekTabsData = transFormedData?.weeksExercise || [];
  const dayTabsData = selectedWeek?.days?.map(day => ({
    label: day.dayName, value: day.day, day: day.day, exercises: day.exercises,
  })) || [];
  const exercisesBasedOnDayObj = dayTabsData.find(d => d.value === selectedDay);
  const weekStructureForPassing = weekTabsData.map(w => ({ week: w.week, weekName: w.weekName })) || [];
  const structuredExercisesBasedOnDay = exercisesBasedOnDayObj ? {
    dayName: exercisesBasedOnDayObj.label, day: exercisesBasedOnDayObj.value, exercises: exercisesBasedOnDayObj.exercises,
    weekName: selectedWeek?.weekName, week: selectedWeek?.week,
  } : {};



  // --- Render Logic (No changes needed, added firebaseStoredData prop pass) ---
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="p-4 text-center">Loading workout plan...</div></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-screen"><div className="p-4 text-red-500">Error: {error}</div></div>;
  if (!transFormedData || !selectedWeek || selectedDay === null) return <div className="flex flex-col items-center justify-center h-screen"><div className="p-4 text-center text-gray-500">Workout data not available or incomplete.</div></div>;

  return (
    <div className="flex flex-col bg-gray-50">
      {/* Header */}
      
      <div className="p-3 pb-1 bg-white border-b sticky-top">
        <h2 className="text-lg font-semibold capitalize">{_.capitalize(transFormedData?.name)}</h2>
         <p className="text-xs text-gray-500">
            {selectedWeek?.weekName || `Week ${selectedWeek?.week !== undefined ? selectedWeek.week + 1 : '?'}`}
            {' / '}
            {dayTabsData.find(d => d.value === selectedDay)?.label || `Day ${selectedDay || '?'}`}
        </p>
      </div>

      {/* Week Tabs */}
      <div className="flex gap-2 p-2 overflow-x-auto bg-white border-b no-scrollbar shrink-0">
        {weekTabsData.map((weekItem) => (
          <button
            className={`px-3 py-1.5 text-sm font-medium rounded-md border whitespace-nowrap ${
              selectedWeek?.week === weekItem.week
                ? "bg-black text-white border-black"
                : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
            }`}
            onClick={() => handleWeekSelect(weekItem)}
            key={weekItem.weekName}
            // disabled={selectedWeek?.week !== weekItem.week}
          >
            {weekItem.weekName}
          </button>
        ))}
      </div>
     
      {/* Day Tabs and Exercise Content */}
      <div className="flex-1 mb-2 overflow-y-auto exerciseCard no-scrollbar">
       {dayTabsData.length > 0 ? (
         <TabMT
            tab={dayTabsData}
            selectedDay={selectedDay}
            setSelectedDay={handleDaySelect}
            exercisesBasedOnDay={structuredExercisesBasedOnDay}
            selectedPlanId={selectedPlanId}
            transFormedData={transFormedData}
            selectedWeek={selectedWeek}
            setSelectedWeek={handleWeekSelect}
            weekStructure={weekStructureForPassing}
            setSelectedDayDirectly={setSelectedDay}
            setSelectedWeekDirectly={setSelectedWeek}
            // *** PASS FIREBASE DATA DOWN ***
            firebaseStoredData={firebaseStoredData}
          />
        ) : (
          <div className="p-4 text-center text-gray-500">No days found for this week.</div>
        )}
        <Progress transFormedData={transFormedData} firebaseStoredData={firebaseStoredData}/>
      </div>
      
    </div>
  );
};

export default PlanDetail;