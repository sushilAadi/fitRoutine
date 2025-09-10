"use client";
import React, { useState, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import { GlobalContext } from "@/context/GloablContext";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import TabMT from "@/components/Tabs/TabMT"; // Adjust path if needed
import { calculateNextDay, getAllLocalStorageData, transformData } from "@/utils"; // Adjust path if needed
import _ from "lodash"; // Make sure lodash is installed
import Progress from "./Progress";
import ConfirmationToast from "@/components/Toast/ConfirmationToast";
import { calculateDetailedWorkoutProgress } from "@/utils/progress";
import { ProgressBar } from "react-bootstrap";
import FloatingNavbar from "@/components/Navbar/FloatingNavbar";
import { calculateTodayCalories, saveCaloriesToFirestore } from "@/utils/caloriesCalculation";

const PlanDetail = ({ params }) => {
  const resolvedParams = React.use(params);
  const { userId, latestWeight } = useContext(GlobalContext);
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState(null);
  const [transFormedData, setTransformedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [firebaseStoredData, setFirebaseStoredData] = useState(undefined); // Use undefined initially to distinguish from null (no data found)
  const [progressStats, setProgressStats] = useState(null);

  const selectedPlanId = decodeURIComponent(resolvedParams?.plan);

  const workoutProgressKey = `workout-progress-${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId || 'default'}`;
  const selectedDayKey = `selectedDayNumber_${selectedPlanId || 'default'}`;
  const slideIndexKeyBase = `slideIndex-${selectedPlanId || 'default'}`;

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
          console.log("Retrieved Firebase progress data:", specificPlanData);
          return specificPlanData; // Return the data
        } else {
          console.log("No specific plan data found in Firebase");
          return null; // Return null if no data for this plan
        }
      } else {
        console.log("No user progress document exists in Firebase");
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

      // --- IMPROVED: Determine starting point with more robust priority ---
      
      // FIRST: Check Firebase data for the workoutProgressKey (most accurate source)
      if (firebaseStoredData && Object.keys(firebaseStoredData).length > 0) {
        // Check for the comprehensive progress object first (highest priority)
        if (firebaseStoredData[workoutProgressKey] && 
            typeof firebaseStoredData[workoutProgressKey].currentWeekIndex === 'number' && 
            typeof firebaseStoredData[workoutProgressKey].currentDayNumber === 'number') {
            
            initialWeekIndex = firebaseStoredData[workoutProgressKey].currentWeekIndex;
            initialDayNumber = firebaseStoredData[workoutProgressKey].currentDayNumber;
            console.log(`Using comprehensive progress from Firebase: Week=${initialWeekIndex}, Day=${initialDayNumber}`);
        } 
        // Then check for individual keys (second priority)
        else if (firebaseStoredData[selectedWeekKey] !== undefined && 
                 firebaseStoredData[selectedDayKey] !== undefined) {
            
            // Ensure we have numeric values
            const fbWeekIndex = parseInt(firebaseStoredData[selectedWeekKey], 10);
            const fbDayNumber = parseInt(firebaseStoredData[selectedDayKey], 10);
            
            if (!isNaN(fbWeekIndex) && !isNaN(fbDayNumber)) {
                initialWeekIndex = fbWeekIndex;
                initialDayNumber = fbDayNumber;
                console.log(`Using separate key progress from Firebase: Week=${initialWeekIndex}, Day=${initialDayNumber}`);
            } else {
                console.warn("Firebase progress keys exist but contain invalid numeric values.");
            }
        }
        // Last case: check if there's any exercise data that indicates progress
        else {
            console.log("No direct progress indicators in Firebase, proceeding with defaults.");
        }
      } else {
        console.log("No Firebase progress data found. Using defaults: Week 0, Day 1");
      }

      // --- IMPROVED: Validate the week/day exists in the plan structure ---
      let initialWeek = weekData.find(w => w.week === initialWeekIndex);
      let initialDay = null;

      // If week exists, try to find the day
      if (initialWeek) {
          const dayExists = initialWeek.days.some(d => d.day === initialDayNumber);
          if (dayExists) {
              initialDay = initialDayNumber;
              console.log(`Found valid target: Week ${initialWeekIndex}, Day ${initialDayNumber}`);
          } else if (initialWeek.days.length > 0) {
              // Day not found - default to first day of target week
              initialDay = initialWeek.days[0].day;
              console.warn(`Day ${initialDayNumber} not found in Week ${initialWeekIndex}. Using first day (${initialDay}).`);
          } else {
              // Week has no days!
              console.warn(`Week ${initialWeekIndex} has no days. Need to find alternative.`);
              initialWeek = null; // Force reset below
          }
      } else {
          console.warn(`Week ${initialWeekIndex} not found in plan structure. Using default.`);
      }

      // Fallback if either week wasn't found or had no days
      if (!initialWeek) {
          // Find the first valid week with days
          for (const weekObj of weekData) {
              if (weekObj.days && weekObj.days.length > 0) {
                  initialWeek = weekObj;
                  initialDay = weekObj.days[0].day;
                  console.log(`Fallback to first valid week: Week ${initialWeek.week}, Day ${initialDay}`);
                  break;
              }
          }
      }

      // Final safety check
      if (!initialWeek || initialDay === null) {
          setError("Could not determine a valid starting position in the workout plan.");
          setLoading(false);
          return;
      }

      // --- Set the initial state ---
      console.log(`Setting initial state: Week ${initialWeek.week}, Day ${initialDay}`);
      setSelectedWeek(initialWeek);
      setSelectedDay(initialDay);

      // --- IMPORTANT: Store the validated state to localStorage ---
      // This ensures synchronization between Firebase and localStorage
      // This step is critical to fix the refresh issue with Skip Day
      const validatedProgress = { 
          currentWeekIndex: initialWeek.week,
          currentDayNumber: initialDay,
          weekName: initialWeek.weekName,
          dayName: initialWeek.days.find(d => d.day === initialDay)?.dayName || `Day ${initialDay}`
      };
      
      // Synchronize localStorage with our validated state
      localStorage.setItem(workoutProgressKey, JSON.stringify(validatedProgress));
      localStorage.setItem(selectedWeekKey, initialWeek.week.toString());
      localStorage.setItem(selectedDayKey, initialDay.toString());

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

   function getAllLocalStorageDataForFinish() {
    let data = {};
    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key && key.endsWith(selectedPlanId)) {
            try { data[key] = JSON.parse(localStorage.getItem(key)); } catch { data[key] = localStorage.getItem(key); }
        }
    } return data;
  }

  // IMPROVED: Store progress to Firebase after skipping
  async function storeFinalStateToDatabase(allDataToSave) {
    if (!userId || !selectedPlanId || Object.keys(allDataToSave).length === 0) {
      console.warn("Missing userId, selectedPlanId, or data when trying to save to Firebase");
      return false;
    }
    
    const userProgressRef = doc(db, "userWorkoutProgress", userId);
    const firestorePayload = { [selectedPlanId]: allDataToSave };
    
    try {
        // Save workout progress
        await setDoc(userProgressRef, firestorePayload, { merge: true });
        console.log("Successfully saved state to Firestore for plan:", selectedPlanId);
        
        // Calculate and save calories burnt
        const userWeight = latestWeight?.weight || 70; // Default to 70kg if no weight found
        if (userWeight && allDataToSave) {
          const todayCalories = calculateTodayCalories(allDataToSave, userWeight, selectedPlanId);
          if (todayCalories > 0) {
            await saveCaloriesToFirestore(userId, selectedPlanId, todayCalories);
            console.log(`Calories saved: ${todayCalories} kcal`);
          }
        }
        
        return true;
    } catch (error) {
        console.error("Error saving state to Firestore:", error);
        toast.error("Error saving workout state to cloud.");
        return false;
    }
  }
  
  function removeLocalStorageDataByPlanIdForFinish() {
    if (!selectedPlanId) return;
    for (let i = localStorage.length - 1; i >= 0; i--) {
        let key = localStorage.key(i);
        if (key && key.endsWith(selectedPlanId)) {
            try { localStorage.removeItem(key); } catch (e) { console.error(`Error removing item ${key}:`, e); }
        }
    }
    console.log(`Cleared localStorage for plan ${selectedPlanId} after skip/finish.`);
  }

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

  const { exercises, day: currentDayNumber, week: currentWeekIndex } = structuredExercisesBasedOnDay || {};

  const dayData = dayTabsData?.map(i => ({
    label: i.label, value: i.value, day: i.day
  })) || [];

  const totalWeeksCount = parseInt(transFormedData?.weeks || '0', 10)

  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  ) || [];
  const allWeeksData = transFormedData?.weeksExercise || [];

  // IMPROVED: handleSkipDay function to properly persist the skipped state
  const handleSkipDay = async () => {
    if (!allWeeksData || !dayData || totalWeeksCount <= 0 || typeof currentWeekIndex !== 'number' || typeof currentDayNumber !== 'number') {
        console.error("Cannot skip day: Plan structure data missing or invalid.");
        toast.error("Cannot skip day: Plan data missing.");
        return;
    }

    const proceedWithSkip = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Update localStorage for each exercise on the skipped day
        // IMPORTANT: Skipping STILL modifies localStorage because that's where the *active* session state is temporarily held.
        // When "Finish Day" happens (implicitly by skipping the last exercise or explicitly later), this localStorage state gets saved.
        if (filteredExercises && filteredExercises.length > 0) {
          
          filteredExercises.forEach((exercise, index) => {
            const exerciseId = exercise.id || `${currentDayNumber}-${index}`;
            const storageKey = `workout-${currentWeekIndex}-${currentDayNumber}-${exerciseId}-${selectedPlanId}`;
            const numberOfSets = exercise?.weeklySetConfig?.sets || 1;
            try {
                let exerciseData = [];
                const savedData = localStorage.getItem(storageKey);
                if (savedData) try { exerciseData = JSON.parse(savedData); if (!Array.isArray(exerciseData)) exerciseData = []; } catch { exerciseData = []; }

                let updatedExerciseData = exerciseData.length === 0
                    ? Array(numberOfSets).fill().map((_, setIndex) => ({ id: setIndex + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00", isCompleted: false, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false, date: today, exerciseId: exerciseId, skipped: true, skippedDates: [today] }))
                    : exerciseData.map(set => { const dates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : []; if (!dates.includes(today)) dates.push(today); return { ...set, isCompleted: false, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false, skipped: true, skippedDates: dates }; });
                localStorage.setItem(storageKey, JSON.stringify(updatedExerciseData));
            } catch (error) { console.error(`Error updating localStorage for exercise ${exerciseId} on skipped day ${currentDayNumber}:`, error); }
          });
        } else { console.warn(`No exercises found for Day ${currentDayNumber} (Week ${currentWeekIndex}) to mark as skipped.`); }

        // 2. Calculate the next day
        const nextStep = calculateNextDay(currentWeekIndex, currentDayNumber, allWeeksData, totalWeeksCount);
        if (nextStep === 'error') { toast.error("Error calculating the next day, but current day marked as skipped."); return; }

        // Clear slide index for the day being skipped
        const skippedDaySlideKey = `${slideIndexKeyBase}-W${currentWeekIndex}-D${currentDayNumber}`;
        localStorage.removeItem(skippedDaySlideKey);

        // --- Handle Plan Completion or Continuation (Saves progress to localStorage for next load/finish) ---
        if (nextStep === null) {
          toast.success("Workout Plan Completed! Finishing up...");
          // !! IMPORTANT: Simulate "Finish Day" to save the skipped state to Firebase !!
          // Get all current LS data (which now includes the skipped day's flags)
          const finalLocalStorageData = getAllLocalStorageDataForFinish(); // Need a helper to get all relevant LS keys
          // Store this final state to DB
          await storeFinalStateToDatabase(finalLocalStorageData); // Need helper
          // Clear LS for this plan
          removeLocalStorageDataByPlanIdForFinish(); // Need helper
          // Clear progress markers
          localStorage.removeItem(workoutProgressKey);
          localStorage.removeItem(selectedWeekKey);
          localStorage.removeItem(selectedDayKey);
          router.push("/SavedPlan");
          return;
        }

        // 3. Plan continues: Get details for the *next* step
        const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } = nextStep;

        // PERSIST Global Progress (to the *next* day/week) using numeric identifiers
        // Create comprehensive progress object
        const newProgress = { 
          currentWeekIndex: nextWeekIndex, 
          currentDayNumber: nextDayNumber, 
          weekName: nextWeekName, 
          dayName: nextDayName
        };
        
        // Update localStorage first
        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        localStorage.setItem(selectedWeekKey, nextWeekIndex.toString());
        localStorage.setItem(selectedDayKey, nextDayNumber.toString());

        // CRITICAL FIX: Save current state (including all progress keys) to Firebase IMMEDIATELY
        // This ensures that when user refreshes, the data is already in Firebase
        const allLocalData = getAllLocalStorageDataForFinish();
        
        // Add the latest progress keys to ensure they're saved to Firebase
        // This is critical - we need to make sure the progress objects are in Firebase
        allLocalData[workoutProgressKey] = newProgress;
        allLocalData[selectedWeekKey] = nextWeekIndex;
        allLocalData[selectedDayKey] = nextDayNumber;
        
        // Save to Firebase
        const savedToFirebase = await storeFinalStateToDatabase(allLocalData);
        if (!savedToFirebase) {
          console.warn("Failed to save progress to Firebase after skipping day.");
          // Continue anyway since localStorage is updated
        }

        // UPDATE React state in PlanDetail (to the *next* day/week)
        const nextWeekObject = allWeeksData.find(w => w.week === nextWeekIndex);
        if(nextWeekObject) {
            setSelectedWeek(nextWeekObject); // Update PlanDetail's week state
            setSelectedDay(nextDayNumber);   // Update PlanDetail's day state
            toast.success(`Skipped to ${nextDayName || `Day ${nextDayNumber}`}, ${nextWeekName || `Week ${nextWeekIndex + 1}`}`);
        } else {
            console.error("Could not find next week object after skip calculation.", { nextWeekIndex });
            toast.error("Skipped day, but failed to load next week's data.");
        }
      } catch (error) {
        console.error("Error encountered in proceedWithSkip:", error);
        toast.error("An unexpected error occurred while skipping the day.");
      }
    };

    // Show confirmation toast
    toast((t) => ( <ConfirmationToast t={t} message="Skip this entire day's workout?" onConfirm={proceedWithSkip} /> ), { duration: Infinity, position: "top-center" });
  };

  const updateProgressStats = () => {
    if (!transFormedData) return;
    
    // Get all current localStorage data to include the latest changes
    const currentLocalData = getAllLocalStorageData(selectedPlanId);
    
    // Merge with Firebase data, prioritizing local changes
    const mergedData = { ...firebaseStoredData, ...currentLocalData };
    
    // Calculate progress using the existing function
    const progress = calculateDetailedWorkoutProgress(transFormedData, mergedData);
    
    setProgressStats(progress);
  };



  // --- Render Logic (No changes needed, added firebaseStoredData prop pass) ---
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="p-4 text-center">Loading workout plan...</div></div>;
  if (error) return <div className="flex flex-col items-center justify-center h-screen"><div className="p-4 text-red-500">Error: {error}</div></div>;
  if (!transFormedData || !selectedWeek || selectedDay === null) return <div className="flex flex-col items-center justify-center h-screen"><div className="p-4 text-center text-gray-500">Workout data not available or incomplete.</div></div>;

  return (
    <>
      <FloatingNavbar title={workoutData?.planName || "Workout Plan"} />
      <div className="flex flex-col pt-16 bg-gray-50 hide-scrollbar">
      {/* Header */}
      
      <div className="p-3 pb-1 bg-white border-b sticky-top">
        <h2 className="text-lg font-semibold capitalize">{_.capitalize(transFormedData?.name)}</h2>
        <div className="flex justify-between">
        <p className="text-xs text-gray-500">
            {selectedWeek?.weekName || `Week ${selectedWeek?.week !== undefined ? selectedWeek.week + 1 : '?'}`}
            {' / '}
            {dayTabsData.find(d => d.value === selectedDay)?.label || `Day ${selectedDay || '?'}`}
        </p>
         <button className="text-sm text-red-600" onClick={handleSkipDay}>Skip Day</button> 
        </div>
         
      </div>
      {/* {progressStats && (
      <ProgressBar animated
              percentage={progressStats?.progressPlannedOnlyPercent} 
              label={`Planned Sets Completed ${progressStats?.progressPlannedOnlyPercent}%`} 
              className="rounded-0"
              variant="warning"
              min={0}
              max={100}
            />)}
      {progressStats && (
      <ProgressBar animated
              percentage={progressStats.progressIncludingExtraPercent} 
              label={`Overall Progress (incl. Extra Sets) ${progressStats.progressIncludingExtraPercent}%`} 
              className="mt-1 rounded-0"
              variant="success"
              min={0}
              max={100}
            />)} */}
      {/* {progressStats && (
        <ProgressRealTime progressStats={progressStats} />
      )} */}

      {/* Week Tabs never remove below code */}
      {workoutData?.progress === 100 && (
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
      )}
     
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
            updateProgressStats={updateProgressStats}
            progressStats={progressStats}
            progress={workoutData?.progress}
          />
        ) : (
          <div className="p-4 text-center text-gray-500">No days found for this week.</div>
        )}
      </div>
        {/* <Progress transFormedData={transFormedData} firebaseStoredData={firebaseStoredData}/> */}
      
      </div>
    </>
  );
};

export default PlanDetail;