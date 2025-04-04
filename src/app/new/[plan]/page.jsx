
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

const PlanDetail = ({ params }) => {
  const { userId, latestWeight } = useContext(GlobalContext);
  // const USER_WEIGHT_KG = latestWeight?.userWeights; // Keep if used elsewhere
  const router = useRouter();
  const [workoutData, setWorkoutData] = useState(null); // Raw data from Firestore
  const [transFormedData, setTransformedData] = useState(null); // Processed data
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true); // Start loading true
  const [selectedWeek, setSelectedWeek] = useState(null); // Stores the week *object*
  const [selectedDay, setSelectedDay] = useState(null);
  const [firebaseStoredData,setFirebaseStoredData] = useState(null)

  const selectedPlanId = decodeURIComponent(params?.plan);

  // Define keys consistently
  const workoutProgressKey = `workout-progress-${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId || 'default'}`; // Use index
  const selectedDayKey = `selectedDayNumber_${selectedPlanId || 'default'}`;   // Use number

  async function retrieveWorkoutProgress( ) {
    if (!userId || !selectedPlanId) {
      console.error("User ID and Selected Plan ID are required.");
      return null; // Or throw an error, depending on your error handling strategy
    }
  
    try {
      // 1. Define the Document Reference (same as when saving)
      // Points to the document holding ALL progress for this specific user.
      const userProgressRef = doc(db, "userWorkoutProgress", userId);
  
      // 2. Fetch the Document Snapshot
      console.log(`Attempting to fetch document: userWorkoutProgress/${userId}`);
      const docSnap = await getDoc(userProgressRef);
  
      // 3. Check if the Document Exists
      if (docSnap.exists()) {
        console.log(`Document found for user ${userId}.`);
        // 4. Get all data from the document
        const allUserData = docSnap.data();
  
        // 5. Access the specific plan's data using selectedPlanId as the key
        // This accesses the map field named after your plan ID.
        const specificPlanData = allUserData[selectedPlanId];
  
        if (specificPlanData) {
          console.log(`Data found for plan ${selectedPlanId}:`, specificPlanData);
          // This is the data you originally saved from getAllLocalStorageData() for this specific plan
          console.log("specificPlanData",specificPlanData)
          setFirebaseStoredData(specificPlanData)
          
        } else {
          setFirebaseStoredData(null)
          // The user document exists, but there's no data saved under this specific planId key.
          console.warn(`No data found for plan ID "${selectedPlanId}" within user ${userId}'s document.`);
          return null;
        }
      } else {
        // The document for this userId doesn't exist at all in the 'userWorkoutProgress' collection.
        console.warn(`No workout progress document found for user ID: ${userId}`);
        return null;
      }
    } catch (error) {
      console.error("Error retrieving workout progress from Firestore:", error);
      return null; // Return null or re-throw the error
    }
  }

  useEffect(()=>{
    retrieveWorkoutProgress()
  },[])
  console.log("firebaseStoredData",firebaseStoredData)


  // --- Fetch Data ---
  useEffect(() => {
    const fetchWorkoutPlan = async () => {
      setLoading(true);
      setError(null);
      setWorkoutData(null); // Reset data on new fetch
      setTransformedData(null);
      setSelectedWeek(null);
      setSelectedDay(null);

      if (!selectedPlanId) {
        setError("Plan ID is missing.");
        setLoading(false);
        return;
      }

      if (!userId) {
        // setError("User not authenticated."); // Optionally wait for userId
        // setLoading(false);
        // return;
        console.warn("User ID not available yet, waiting...");
        // No return, let useEffect re-run when userId is available
        return; // Or handle redirection if auth is strictly required before fetch
      }

      try {
        const planRef = doc(db, "workoutPlans", selectedPlanId);
        const planDoc = await getDoc(planRef);

        if (!planDoc.exists()) {
          setError("Workout plan not found.");
          setLoading(false);
          return;
        }

        const data = planDoc.data();
        // console.log("Fetched raw data:", data); // Debug raw data

        if (!data || !data.workoutPlanDB) {
          setError("Workout plan structure (workoutPlanDB) is missing.");
          setLoading(false);
          return;
        }

        // Directly use the structure, parsing if necessary (adapt based on actual storage format)
        let parsedWorkoutPlan, parsedExerciseHistory, dayNames, weekNames;

        try {
             parsedWorkoutPlan = typeof data.workoutPlanDB.workoutPlan === "string"
                ? JSON.parse(data.workoutPlanDB.workoutPlan)
                : data.workoutPlanDB.workoutPlan;

             parsedExerciseHistory = typeof data.workoutPlanDB.exerciseHistory === "string"
                ? JSON.parse(data.workoutPlanDB.exerciseHistory)
                : data.workoutPlanDB.exerciseHistory;

             dayNames = typeof data.workoutPlanDB.dayNames === "string"
                ? JSON.parse(data.workoutPlanDB.dayNames)
                : data.workoutPlanDB.dayNames;

             weekNames = typeof data.workoutPlanDB.weekNames === "string"
                ? JSON.parse(data.workoutPlanDB.weekNames)
                : data.workoutPlanDB.weekNames;

             // Basic validation of parsed data
            if (!Array.isArray(parsedWorkoutPlan)) {
                 throw new Error("Parsed workoutPlan is not an array.");
            }


        } catch (parseError) {
            console.error("Error parsing data from Firestore:", parseError);
            setError("Failed to parse workout plan data structure.");
            setLoading(false);
            return;
        }

        // Set the raw data first
        setWorkoutData({
          id: planDoc.id,
          name: data.workoutPlanDB.name || "Unnamed Plan",
          progress: data.workoutPlanDB.progress || 0, // Use saved progress if available
          workoutPlan: parsedWorkoutPlan, // This should be the array of weeks/days/exercises
          exerciseHistory: parsedExerciseHistory,
          dayNames: dayNames,
          daysPerWeek: data.workoutPlanDB.daysPerWeek,
          weeks: data.workoutPlanDB.weeks, // This should be total weeks count
          weekNames: weekNames,
          setUpdate: data.workoutPlanDB.setUpdate,
          date: data.workoutPlanDB.date,
        });

      } catch (fetchError) {
        console.error("Error fetching workout plan:", fetchError);
        setError("Failed to fetch workout plan.");
        toast.error("Failed to fetch workout plan.");
      } finally {
        // Loading will be set to false in the next effect after transformation/state setting
      }
    };

    fetchWorkoutPlan();
  }, [selectedPlanId, userId]); // Re-fetch if planId or userId changes


  // --- Transform Data and Set Initial State ---
  useEffect(() => {
    if (!workoutData) {
      // If workoutData is null (still fetching or error), don't proceed
      if (!loading && !error) setLoading(true); // Ensure loading is true if data isn't ready
      return;
    }

    setLoading(true); // Set loading true while processing

    try {
      // Transform the raw data
      const transformed = transformData(workoutData);
      // console.log("Transformed Data:", transformed); // Debug transformed data

      if (!transformed || !transformed.weeksExercise || transformed.weeksExercise.length === 0) {
        setError("Workout data is empty or invalid after transformation.");
        setTransformedData(null);
        setSelectedWeek(null);
        setSelectedDay(null);
        setLoading(false);
        return;
      }

      setTransformedData(transformed); // Store the transformed data

      const weekData = transformed.weeksExercise; // Array of week objects
      const totalWeeksCount = parseInt(transformed.weeks, 10) || weekData.length;

      // Determine initial week and day
      let initialWeek = null;
      let initialDay = null;

      // 1. Try loading from the combined progress key
      const savedProgressRaw = localStorage.getItem(workoutProgressKey);
      let savedProgress = null;
      if (savedProgressRaw) {
          try {
            savedProgress = JSON.parse(savedProgressRaw);
            // Validate saved progress structure
            if (typeof savedProgress.currentWeekIndex !== 'number' || typeof savedProgress.currentDayNumber !== 'number') {
                console.warn("Invalid structure in saved progress key, ignoring.", savedProgress);
                savedProgress = null; // Invalidate if structure is wrong
                localStorage.removeItem(workoutProgressKey); // Clean up bad data
            }
          } catch (e) {
             console.error("Error parsing saved progress key:", e);
             savedProgress = null; // Invalidate on parse error
             localStorage.removeItem(workoutProgressKey); // Clean up bad data
          }
      }

      if (savedProgress) {
        // Find the week object using the stored numeric index
        initialWeek = weekData.find(w => w.week === savedProgress.currentWeekIndex);
        if (initialWeek) {
          // Find the day object within that week using the stored numeric day number
          const dayObj = initialWeek.days.find(d => d.day === savedProgress.currentDayNumber);
          if (dayObj) {
            initialDay = dayObj.day; // Use the numeric day number
          } else {
             console.warn(`Day number ${savedProgress.currentDayNumber} not found in saved week index ${savedProgress.currentWeekIndex}. Resetting.`);
             initialWeek = null; // Reset if day not found
          }
        } else {
             console.warn(`Week index ${savedProgress.currentWeekIndex} not found in workout data. Resetting.`);
        }
      }

      // 2. If progress key didn't yield results, use defaults
      if (!initialWeek || initialDay === null) {
        if (weekData.length > 0 && weekData[0].days.length > 0) {
          initialWeek = weekData[0]; // Default to first week object
          initialDay = weekData[0].days[0].day; // Default to first day number
          console.log("Setting default initial week/day.");
        } else {
             setError("Workout has no weeks or days defined.");
             setLoading(false);
             return; // Cannot proceed
        }
      }

      // console.log("Setting initial state:", { initialWeek, initialDay }); // Debug initial state
      setSelectedWeek(initialWeek);
      setSelectedDay(initialDay);

    } catch (transformError) {
      console.error("Error during data transformation or initial state setting:", transformError);
      setError("Failed to process workout data.");
      setTransformedData(null);
      setSelectedWeek(null);
      setSelectedDay(null);
    } finally {
        setLoading(false); // Processing complete
    }

  }, [workoutData, workoutProgressKey]); // Re-run when raw data is loaded


  // --- Derived Data for Rendering (only when state is ready) ---
  const weekTabsData = transFormedData?.weeksExercise || [];

  const dayTabsData = selectedWeek?.days?.map(day => ({
    label: day.dayName,
    value: day.day, // Use numeric day number as value
    day: day.day,   // Keep numeric day number accessible
    exercises: day.exercises,
  })) || [];

  const exercisesBasedOnDayObj = dayTabsData.find(d => d.value === selectedDay);

  const weekStructureForPassing = weekTabsData.map(w => ({
      week: w.week, // numeric index
      weekName: w.weekName
  })) || [];

  // Structure data for the ExerciseCardSelected component
  const structuredExercisesBasedOnDay = exercisesBasedOnDayObj ? {
    dayName: exercisesBasedOnDayObj.label,
    day: exercisesBasedOnDayObj.value, // numeric day number
    exercises: exercisesBasedOnDayObj.exercises,
    weekName: selectedWeek?.weekName,
    week: selectedWeek?.week, // numeric week index
  } : {};


  // --- Event Handlers ---
   const handleWeekSelect = (weekObject) => {
      if (weekObject && weekObject.days && weekObject.days.length > 0) {
          setSelectedWeek(weekObject);
          // When manually changing week, default to its first day
          setSelectedDay(weekObject.days[0].day);
          // Optional: Clear progress key if manually navigating away from saved progress?
          // localStorage.removeItem(workoutProgressKey);
          // Optional: Update individual keys if needed for other logic
          // localStorage.setItem(selectedWeekKey, weekObject.week.toString());
          // localStorage.setItem(selectedDayKey, weekObject.days[0].day.toString());
      } else {
          console.warn("Selected week has no days, cannot switch.", weekObject);
      }
   };

   const handleDaySelect = (dayNumber) => {
        setSelectedDay(dayNumber); // dayNumber is the numeric day value
        // Optional: Update individual day key if needed
        // localStorage.setItem(selectedDayKey, dayNumber.toString());
   };

  // --- Render Logic ---
  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="p-4 text-center">Loading workout plan...</div></div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error: {error}</div>;
  }

  if (!transFormedData || !selectedWeek || selectedDay === null) {
    return <div className="p-4 text-center">Workout data not available or incomplete.</div>;
  }


  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* Header */}
      <div className="p-3 pb-1 bg-white border-b sticky-top">
        <h2 className="text-lg font-semibold capitalize">{_.capitalize(transFormedData?.name)}</h2>
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
            disabled={selectedWeek?.week !== weekItem.week}
          >
            {weekItem.weekName}
          </button>
        ))}
      </div>

      {/* Day Tabs and Exercise Content */}
      <div className="flex-1 mb-2 overflow-y-auto exerciseCard no-scrollbar">
       {dayTabsData.length > 0 ? (
         <TabMT
            tab={dayTabsData} // Pass day data for the *selected* week
            selectedDay={selectedDay} // Pass numeric selected day number
            setSelectedDay={handleDaySelect} // Pass handler function
            exercisesBasedOnDay={structuredExercisesBasedOnDay} // Pass data for selected day
            // Pass necessary props for navigation logic down the chain
            selectedPlanId={selectedPlanId}
            transFormedData={transFormedData} // Pass the whole transformed data
            selectedWeek={selectedWeek} // Pass selected week object
            setSelectedWeek={handleWeekSelect} // Pass handler (might need adjustment if TabMT modifies week directly)
            weekStructure={weekStructureForPassing} // Pass simplified week structure
            setSelectedDayDirectly={setSelectedDay} // Allow direct setting from deeper components if needed
            setSelectedWeekDirectly={setSelectedWeek} // Allow direct setting from deeper components if needed
          />
        ) : (
          <div className="p-4 text-center text-gray-500">No days found for this week.</div>
        )}
      </div>
    </div>
  );
};

export default PlanDetail;