// app/new/[plan]/SetAndRepsForm.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import RegularButton from "@/components/Button/RegularButton"; // Adjust path
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculateNextDay, parseTimeToSeconds } from "@/utils"; // Import helpers
import ConfirmationToast from "@/components/Toast/ConfirmationToast";

const SetAndRepsForm = ({
  sets: initialSets,
  selectedDay, // Numeric day number for *this* exercise
  exerciseId,
  exerciseName,
  goPrev,
  goNext,
  necessaryData, // Object containing context: { selectedPlanId, userId, selectedDay (current), selectedWeek (current), setSelectedDay, setSelectedWeek, dayData (current week), weekStructure (all weeks), totalWeeksCount, allWeeksData }
  exerciseIndex,
  isLastExercise,
}) => {
  const router = useRouter();

  // Destructure necessary data with defaults
  const {
      selectedPlanId = 'default',
      userId,
      // current state (passed down for context)
      selectedWeek,       // current week object
      // setters for PlanDetail state
      setSelectedDay,
      setSelectedWeek,
      // data for calculations/context
      dayData = [],         // day objects for *current* week
      weekStructure = [],   // week objects {week, weekName} for *all* weeks
      totalWeeksCount = 0,
      allWeeksData = [],     // full weeksExercise array
   } = necessaryData || {};

   // Keys for storage
   const workoutProgressKey = `workout-progress-${selectedPlanId}`;
   const selectedWeekKey = `selectedWeekIndex_${selectedPlanId}`;
   const selectedDayKey = `selectedDayNumber_${selectedPlanId}`;
   const slideIndexKeyBase = `slideIndex-${selectedPlanId || 'default'}`; 
   const storageKey = `workout-${selectedDay}-${exerciseId}`; // Key for this specific exercise's sets on this day

  // --- State Variables ---
  const [sets, setSets] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null); // 'workout', 'rest', or null
  const [seconds, setSeconds] = useState(0);
  const [isAllSetsCompleted, setIsAllSetsCompleted] = useState(false); // Tracks if all sets for *this exercise* are done/skipped
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);
  const activeSetRef = useRef(null); // Holds the ID of the set whose timer is active
  const waitingForRestCompletion = useRef(false);
  const initialLoadComplete = useRef(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false); // Track auto-navigation for this instance

  // --- Effects ---

  // Reset auto-navigation tracking when the exercise or day changes
  useEffect(() => {
      setHasAutoNavigated(false);
      initialLoadComplete.current = false; // Reset load flag on change
  }, [exerciseId, selectedDay]);

  // Load sets data from storage, restore timers, check completion state
  useEffect(() => {
    const getInitialSets = () => {
        if (typeof window !== 'undefined') {
          try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
               const parsedData = JSON.parse(savedData);
               if (Array.isArray(parsedData)) {
                   // Ensure new flags exist with defaults
                   return parsedData.map((set, index) => ({
                     ...set,
                     isActive: set.isActive === undefined ? (index === 0 && !set.isCompleted && !set.skipped) : set.isActive,
                     isEditing: set.isEditing || false,
                     isDurationRunning: set.isDurationRunning || false,
                     isRestRunning: set.isRestRunning || false,
                     date: set.date || new Date().toISOString().split('T')[0],
                     exerciseId: exerciseId,
                     skipped: set.skipped || false,
                     skippedDates: set.skippedDates || []
                   }));
               }
            }
          } catch (error) {
            console.error(`Error parsing saved workout data for ${storageKey}:`, error);
            localStorage.removeItem(storageKey); // Clear potentially corrupted data
          }
        }
        // Default creation if no saved data or error
        return Array(parseInt(initialSets) || 1).fill().map((_, index) => ({
          id: index + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
          isCompleted: false, isActive: index === 0, isEditing: false,
          isDurationRunning: false, isRestRunning: false,
          date: new Date().toISOString().split('T')[0],
          exerciseId: exerciseId, skipped: false, skippedDates: []
        }));
      };

    const initialData = getInitialSets();
    setSets(initialData);

    // --- Timer Restore Logic ---
    let restored = false;
    if (!initialLoadComplete.current && initialData.length > 0) {
        for (const set of initialData) {
            if (set.isDurationRunning && !set.skipped) {
                const elapsedSeconds = parseTimeToSeconds(set.duration);
                activeSetRef.current = set.id;
                setActiveTimer('workout');
                setSeconds(elapsedSeconds);
                waitingForRestCompletion.current = false;
                restored = true; break;
            }
        }
        if (!restored) {
            for (const set of initialData) {
                if (set.isRestRunning && !set.skipped) {
                     const elapsedSeconds = parseTimeToSeconds(set.rest);
                     activeSetRef.current = set.id;
                     setActiveTimer('rest');
                     setSeconds(elapsedSeconds);
                     waitingForRestCompletion.current = true;
                     restored = true; break;
                }
            }
        }
        if (!restored) {
             setActiveTimer(null); setSeconds(0); activeSetRef.current = null; waitingForRestCompletion.current = false;
        }
        initialLoadComplete.current = true;
    } else if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
    }
    // --- End Timer Restore Logic ---

    // Check initial completion status
    const allInitiallyDone = Array.isArray(initialData) && initialData.length > 0 &&
      initialData.every(set => set.isCompleted || set.skipped);
    setIsAllSetsCompleted(allInitiallyDone);

  }, [selectedDay, exerciseId, initialSets, storageKey]); // Rerun if these change


  // Save sets data to local storage whenever it changes
  useEffect(() => {
    if (initialLoadComplete.current && sets.length > 0) {
        // Avoid saving if a skip operation just happened (it saves its own state)
        // A simple check: if the component just loaded and all are skipped, don't resave immediately
        const justLoadedAndAllSkipped = initialLoadComplete.current && sets.every(s => s.skipped);
        if (!justLoadedAndAllSkipped) {
             localStorage.setItem(storageKey, JSON.stringify(sets));
        }
        checkAllSetsCompleted(); // Update completion status after state changes
    }
  }, [sets, storageKey]);


  // Check if all sets for THIS exercise are completed or skipped
  const checkAllSetsCompleted = () => {
    const allDone = Array.isArray(sets) && sets.length > 0 &&
      sets.every(set => set.isCompleted || set.skipped) &&
      !waitingForRestCompletion.current &&
      activeTimer !== 'rest'; // Ensure rest is finished too
    // Avoid unnecessary state updates if the value hasn't changed
    setIsAllSetsCompleted(prev => prev !== allDone ? allDone : prev);
    return allDone;
  };

  // Auto-navigation to next EXERCISE
  useEffect(() => {
    if (isAllSetsCompleted && !isLastExercise && !waitingForRestCompletion.current && !hasAutoNavigated && activeTimer === null) {
      const isAnySkipped = sets.some(s => s.skipped);
      // Don't auto-navigate if the state was reached because the exercise was explicitly skipped
      if (!isAnySkipped) {
          const moveToNextTimeout = setTimeout(() => {
            // Re-check conditions inside timeout in case state changed
            if (isAllSetsCompleted && !isLastExercise && !waitingForRestCompletion.current && !hasAutoNavigated && activeTimer === null && !sets.some(s => s.skipped)) {
              console.log("Auto-navigating to next exercise...");
              setHasAutoNavigated(true); // Prevent repeated navigation for this instance
              goNext(); // Call the function to slide the swiper
            }
          }, 750); // Delay before auto-navigating
          return () => clearTimeout(moveToNextTimeout);
      }
    }
  }, [isAllSetsCompleted, isLastExercise, waitingForRestCompletion.current, hasAutoNavigated, activeTimer, goNext, sets]); // Add sets dependency


  // Timer interval logic
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);


  // Update set duration/rest string based on 'seconds' state
  useEffect(() => {
    if (!activeTimer || activeSetRef.current === null) return;

    setSets(prevSets => {
      const activeSetIndex = prevSets.findIndex(set => set.id === activeSetRef.current);
      // Stop if set not found or if it's marked as skipped
      if (activeSetIndex === -1 || prevSets[activeSetIndex].skipped) {
           if (prevSets[activeSetIndex]?.skipped) { // If skipped, ensure timer stops
               setActiveTimer(null);
               setSeconds(0);
               waitingForRestCompletion.current = false;
               activeSetRef.current = null;
           }
           return prevSets;
      }

      const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');

      let needsUpdate = false;
      let updatedSets = [...prevSets];
      const currentSet = updatedSets[activeSetIndex];

      if (activeTimer === 'workout') {
        const newDuration = `${hours}:${minutes}:${secs}`;
        if (currentSet.duration !== newDuration || !currentSet.isDurationRunning) {
          updatedSets[activeSetIndex] = { ...currentSet, duration: newDuration, isDurationRunning: true, isRestRunning: false };
          needsUpdate = true;
        }
      } else if (activeTimer === 'rest') {
        const newRest = `${minutes}:${secs}`; // Rest usually MM:SS
        if (currentSet.rest !== newRest || !currentSet.isRestRunning) {
          updatedSets[activeSetIndex] = { ...currentSet, rest: newRest, isRestRunning: true, isDurationRunning: false };
          needsUpdate = true;
        }
      }
      // Only return new array if an update actually happened
      return needsUpdate ? updatedSets : prevSets;

    });
  }, [seconds, activeTimer]);


  // =========================================
  // == HANDLER FUNCTION DEFINITIONS (START) ==
  // =========================================

  const startWorkout = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    if (currentSet.skipped) { toast.error("Cannot start timer for a skipped set."); return; }
    if (activeTimer !== null) { toast.error("Another timer is already running."); return; }

    if ((currentSet.isActive || currentSet.isEditing) && !currentSet.isCompleted) {
        console.log(`Starting workout for set ${setId}.`);
        const updatedSets = sets.map((s, index) => ({
            ...s,
            isDurationRunning: index === setIndex,
            isRestRunning: false,
            duration: index === setIndex ? "00:00:00" : s.duration, // Reset duration only for the starting set
            isActive: index === setIndex, // Make only this set active
            isEditing: false // Ensure editing is off when timer starts
        }));
        setSets(updatedSets);
        setActiveTimer('workout');
        setSeconds(0);
        activeSetRef.current = setId;
        waitingForRestCompletion.current = false;
    } else {
        console.warn("Condition not met to start workout", { currentSet, activeTimer });
    }
  };

  const completeSet = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    if (currentSet.skipped) { toast.error("Cannot complete a skipped set."); return; }
    if (!currentSet.weight || !currentSet.reps) { toast.error("Please enter weight and reps."); return; }
    // Allow completion if editing OR if it's the active workout timer running
    if ( currentSet.isEditing || (currentSet.isActive && activeTimer === 'workout' && activeSetRef.current === setId) ) {
        console.log(`Completing set ${setId}. Starting rest timer.`);
        setActiveTimer('rest'); // Switch to rest timer conceptually
        setSeconds(0);          // Reset timer seconds for rest
        waitingForRestCompletion.current = true; // We are now in the rest phase
        activeSetRef.current = setId; // Rest timer is associated with the set just completed

        const updatedSets = sets.map((s, index) => {
            if (index === setIndex) {
                // Mark current set as completed, stop editing/activity/duration timer, start rest timer flag
                return {
                    ...s, isCompleted: true, isEditing: false, isActive: false,
                    isDurationRunning: false, isRestRunning: true, // Mark rest as running
                };
            }
            // Ensure other sets are not active, editing, or running timers
            return {
              ...s,
              isDurationRunning: false,
              isRestRunning: false, // Only the completed set's rest timer runs
              isActive: false,      // Deactivate others
              isEditing: false
            };
        });

        setSets(updatedSets); // Update state triggers save and completion check effects
    } else if (activeTimer === 'rest') {
        toast.error("Cannot complete set while resting.");
    } else if (activeTimer === 'workout' && activeSetRef.current !== setId) {
        toast.error("Workout timer running for another set.");
    } else if (!currentSet.isActive && !currentSet.isEditing){
        toast.error("Set is not active or being edited.");
    }
  };

  const stopRestTimer = () => {
    if (activeTimer !== 'rest' || activeSetRef.current === null) return;

    const lastCompletedSetId = activeSetRef.current;
    const lastCompletedSetIndex = sets.findIndex(set => set.id === lastCompletedSetId);
    if (lastCompletedSetIndex === -1) return;

    console.log(`Stopping rest timer for set ${lastCompletedSetId}. Activating next available set.`);

    // Find the next set that is NOT completed and NOT skipped
    let nextActiveIndex = -1;
    for (let i = lastCompletedSetIndex + 1; i < sets.length; i++) {
        if (!sets[i].isCompleted && !sets[i].skipped) {
            nextActiveIndex = i;
            break;
        }
    }

    const updatedSets = sets.map((set, index) => ({
        ...set,
        isActive: index === nextActiveIndex, // Activate the next valid set
        isRestRunning: false // Stop rest running flag for all sets
    }));

    setSets(updatedSets);
    setActiveTimer(null);
    setSeconds(0);
    waitingForRestCompletion.current = false;
    activeSetRef.current = null;
    // checkAllSetsCompleted(); // Check completion status after rest finishes
  };


  const handleFinishDay = () => {
    // Check if timer is running (same as before)
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot finish day while a timer is active or resting.");
      return;
    }

    // Check if all sets are done (same as before)
    const allCurrentExerciseSetsDone = sets.every(set => set.isCompleted || set.skipped);
    if (!allCurrentExerciseSetsDone) {
       console.warn("Finish Day clicked, but not all sets are marked completed/skipped for this exercise.");
       toast.error("Please ensure all sets for this exercise are completed or skipped.");
       return;
    }

    console.log("Finishing Day's Workout...");

    try {
      // Get current position from props/necessaryData
      const currentWeekIdx = selectedWeek?.week;
      const currentDayNum = selectedDay; // The day number being finished

       if (typeof currentWeekIdx !== 'number' || typeof currentDayNum !== 'number') {
           console.error("Missing current week/day context for finishing day.", { currentWeekIdx, currentDayNum });
           toast.error("Could not determine current position to finish the day.");
           return;
       }

      // Calculate the next step
      const nextStep = calculateNextDay(currentWeekIdx, currentDayNum, allWeeksData, totalWeeksCount);

      if (nextStep === 'error') {
          toast.error("Error calculating next workout step.");
          return;
      }

      // Clear slide index for the day being finished
      localStorage.removeItem(`${slideIndexKeyBase}-${currentDayNum}`);

      // --- Scenario 1: Plan Complete ---
      if (nextStep === null) {
        toast.success("Workout Plan Completed!", { duration: 4000 });
        // Clear progress markers
        localStorage.removeItem(workoutProgressKey);
        localStorage.removeItem(selectedWeekKey);
        localStorage.removeItem(selectedDayKey);
        // Consider clearing all slide indexes for this plan?

        // *** NAVIGATE ON COMPLETION ***
        router.push("/new");
        return; // Stop execution here
      }

      // --- Scenario 2: Plan Continues ---
      const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } = nextStep;

      // 1. PERSIST Global Progress to Local Storage (for the *next* day/week)
      const newProgress = {
            currentWeekIndex: nextWeekIndex,
            currentDayNumber: nextDayNumber,
            weekName: nextWeekName,
            dayName: nextDayName
      };
      localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
      // Also update individual keys (might be redundant but safe)
      localStorage.setItem(selectedWeekKey, nextWeekIndex.toString());
      localStorage.setItem(selectedDayKey, nextDayNumber.toString());

      toast.success(`Day Complete! Progress saved.`, { duration: 3000 });

      // *** NAVIGATE AFTER SAVING PROGRESS ***
      router.push("/new");

      // NOTE: Removed the direct calls to setSelectedWeek/setSelectedDay here.
      // The PlanDetail component will read the updated localStorage upon the user's return.

    } catch (error) {
      console.error("Error in handleFinishDay:", error);
      toast.error("An error occurred while finishing the workout day.");
    }
  };

  // Skip Exercise (marks all sets in *this* form as skipped and saves)
  const handleSkipExercise = () => {
    if (activeTimer !== null || waitingForRestCompletion.current) {
        toast.error("Cannot skip exercise while a timer is active or resting.");
        return;
    }
    if (isAnySetSkipped) {
        toast.error("This exercise has already been skipped.");
        return;
    }

    // Confirmation Toast for skipping exercise
    toast((t) => (
        <ConfirmationToast
          t={t} // Pass the toast object
          message="Are you sure you want to skip this entire exercise?"
          onConfirm={() => proceedWithSkipExercise()} // Call the actual skip logic on confirm
        />
      ), {
        duration: Infinity, // Keep toast open until confirmed/dismissed
        position: "top-center",
      });
};

  const editSet = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    if (currentSet.skipped) { toast.error("Cannot edit a skipped set."); return; }
    if (activeTimer !== null) { toast.error("Finish or skip the current timer before editing."); return; }

    if (currentSet.isCompleted) {
         console.log(`Editing set ${setId}.`);
         const updatedSets = sets.map((set, index) => ({
            ...set,
            isEditing: index === setIndex, // Enable editing only for this set
            isActive: index === setIndex,  // Make it active
            isCompleted: index === setIndex ? false : set.isCompleted, // Mark as not completed for editing
            isDurationRunning: false, // Ensure timers are off
            isRestRunning: false
         }));
         setSets(updatedSets);
         // No active timer during edit
         setActiveTimer(null); setSeconds(0); activeSetRef.current = null; waitingForRestCompletion.current = false;
         setIsAllSetsCompleted(false); // Cannot be all completed if one is being edited
    } else {
         // Maybe toast.info("Set not completed, cannot edit.") if button should be hidden anyway.
    }
  };

  const deleteSet = (setId) => {
    if (sets.length <= 1) { toast.error("Cannot delete the only set."); return; }
    if (activeTimer !== null) { toast.error("Cannot delete set while a timer is active."); return; }

    const setToDelete = sets.find(s => s.id === setId);
    if (setToDelete?.skipped) { toast.error("Cannot delete sets from a skipped exercise."); return; }

    const updatedSets = sets.filter(set => set.id !== setId);
    let madeActive = false;

    // Re-index and try to activate the next available (not completed, not skipped) set
    const reindexedSets = updatedSets.map((set, index) => {
       const newSet = { ...set, id: index + 1, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false };
       // Activate the first non-completed, non-skipped set encountered
       if (!madeActive && !set.isCompleted && !set.skipped) {
             newSet.isActive = true;
             madeActive = true;
       }
       return newSet;
    });

    // If no set was activated (e.g., all remaining are completed/skipped), ensure nothing is active.
    setSets(reindexedSets);
    // checkAllSetsCompleted(); // Recheck completion status
  };

  const addSet = () => {
     if (activeTimer !== null) { toast.error("Cannot add set while timer is active."); return; }
     if (sets.some(s => s.skipped)) { toast.error("Cannot add sets to a skipped exercise."); return; }

    const newSetId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) + 1 : 1;
    // Activate the new set only if all previous sets are completed/skipped
    const allPreviousDone = sets.every(set => set.isCompleted || set.skipped);
    const makeActive = sets.length === 0 || allPreviousDone;

    const newSet = {
      id: newSetId, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
      isCompleted: false, isActive: makeActive, isEditing: false,
      isDurationRunning: false, isRestRunning: false,
      date: new Date().toISOString().split('T')[0],
      exerciseId: exerciseId, skipped: false, skippedDates: []
    };

    // Deactivate other sets if the new one becomes active
    const updatedSets = sets.map(set => ({ ...set, isActive: makeActive ? false : set.isActive }));
    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false); // Adding a set means it's not all completed anymore
    console.log(`Added set ${newSetId}. Active: ${makeActive}`);
  };

  const handleInputChange = (setId, field, value) => {
    setSets(prevSets =>
        prevSets.map(set => {
            if (set.id === setId) {
                if (set.skipped) return set; // No changes if skipped
                // Allow input if active or editing, AND not globally resting (unless editing)
                if ((set.isActive || set.isEditing) && !(activeTimer === 'rest' && !set.isEditing)) {
                    // Basic validation for weight/reps
                    if ((field === 'weight' || field === 'reps') && value && !/^\d*\.?\d*$/.test(value)) {
                        toast.error("Please enter only numbers for weight and reps.");
                        return set;
                    }
                    return { ...set, [field]: value };
                }
            }
            return set;
        })
    );
  };

  const getExerciseHistory = () => {
    const history = [];
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        // Match keys like `workout-<dayNumber>-<exerciseId>`
        const pattern = `workout-\\d+-${exerciseId}`;
        const regex = new RegExp(`^${pattern}$`);

        for (const key of keys) {
             if (regex.test(key)) {
                 // Exclude the current day's data
                 if (key === storageKey) continue;

                 try {
                     const data = JSON.parse(localStorage.getItem(key));
                     if (Array.isArray(data) && data.length > 0) {
                         // Filter for sets that are COMPLETED and NOT SKIPPED
                         const validSets = data.filter(item =>
                            item && item.isCompleted && !item.skipped &&
                            item.weight !== '' && item.reps !== '' // Ensure data exists
                         );
                         if (validSets.length > 0 && validSets[0]?.date) {
                             // Extract day number from the key
                             const dayMatch = key.match(/workout-(\d+)-/);
                             const dayNum = dayMatch ? dayMatch[1] : '?';
                             history.push({ date: validSets[0].date, day: `Day ${dayNum}`, sets: validSets });
                         }
                     }
                 } catch (e) { console.error("Error parsing history item:", key, e); }
             }
        }
      } catch (error) { console.error("Error accessing localStorage for history:", error); }
    }
    // Sort by date descending
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };


  const handleGoNext = () => {
    // Use the check function to ensure all sets are done/skipped
    if (checkAllSetsCompleted() && activeTimer === null) {
       goNext(); // Navigate swiper
    } else if (activeTimer !== null) {
       toast.error("Complete or skip the current timer first.");
    } else {
      toast.error("Please complete all sets for this exercise first.");
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };


  // --- RENDER ---
  // Determine button states based on current status
  const isAnySetSkipped = sets.some(s => s.skipped);



// Actual logic to perform the exercise skip
const proceedWithSkipExercise = () => {
    try {
        const today = new Date().toISOString().split('T')[0];
        console.log(`Skipping exercise ${exerciseId} on day ${selectedDay}.`);

        // 1. Mark all sets for THIS exercise as skipped
        const updatedSets = sets.map(set => {
            const updatedSkippedDates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : [];
            if (!updatedSkippedDates.includes(today)) { // Avoid adding duplicate dates
                updatedSkippedDates.push(today);
            }
            return {
                ...set,
                isCompleted: false, // Ensure not marked completed
                isActive: false,
                isEditing: false,
                isDurationRunning: false, // Stop timers conceptually
                isRestRunning: false,
                weight: set.weight || "", // Keep potentially entered data
                reps: set.reps || "",
                duration: set.duration || "00:00:00",
                rest: set.rest || "00:00",
                skipped: true, // Mark as skipped
                skippedDates: updatedSkippedDates
            };
        });

        // 2. Save skipped state to localStorage for this specific exercise/day
        localStorage.setItem(storageKey, JSON.stringify(updatedSets));

        // 3. Update component state immediately
        setSets(updatedSets);
        setActiveTimer(null); // Ensure timers are visually stopped
        setSeconds(0);
        waitingForRestCompletion.current = false;
        activeSetRef.current = null;
        setIsAllSetsCompleted(true); // Mark this exercise as 'done' for navigation logic

        toast.success("Exercise Skipped.");

        // 4. Navigate: Move to next exercise or finish day
        if (!isLastExercise) {
            // If not the last exercise, slide to the next one
            goNext();
        } else {
            // If it IS the last exercise, skipping it means the day is finished
            console.log("Last exercise skipped, finishing day...");
            // Call handleFinishDay to calculate next day, save global progress, and navigate
            handleFinishDay();
        }

    } catch (error) {
        console.error("Error skipping exercise:", error);
        toast.error("An error occurred while skipping the exercise.");
    }
};

  return (
    <>
      {/* Header and Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold capitalize">{exerciseName}</h3>
          <p className="text-xs text-gray-500">Track your sets, reps, and weight</p>
        </div>
        <div className="flex items-center gap-2">
        {!isAnySetSkipped && activeTimer === null && ( // Show only if not skipped and no timer running
                       <RegularButton
                           Icon={<i className="mr-1 text-xs fas fa-forward"></i>}
                           title="Skip Exercise"
                           className="px-2 py-1 text-xs text-white bg-yellow-600 min-w-[100px] hover:bg-yellow-700 disabled:bg-yellow-300"
                           onClick={handleSkipExercise} // Use the new handler
                           disabled={activeTimer !== null} // Disable if timer active
                       />
                    )}
            {/* History Button */}
             <RegularButton
                Icon={<i className="mr-1 text-xs fas fa-history"></i>}
                title= {showHistory ? "Hide History" : "Show History"}
                className="px-2 py-1 text-xs min-w-[100px]"
                onClick={toggleHistory}
                disabled={activeTimer !== null} // Disable if timer running
                aria-disabled={activeTimer !== null}
            />
            {/* Add Set Button - Hide if skipped */}
            { !isAnySetSkipped && (
                 <RegularButton
                    Icon={<i className="mr-1 text-xs fas fa-plus"></i>}
                    title="+ Add Set"
                    className="px-2 py-1 text-xs min-w-[90px]"
                    onClick={addSet}
                    disabled={activeTimer !== null} // Disable if timer running
                    aria-disabled={activeTimer !== null}
                />
            )}
        </div>
      </div>

      {/* History Section */}
      {showHistory && (
         <div className="mb-4 overflow-y-auto border rounded bg-gray-50 max-h-48">
          <h4 className="sticky top-0 p-2 text-sm font-semibold bg-gray-100 border-b">Previous Records</h4>
          <div className="p-2 text-xs">
            {(() => {
                const history = getExerciseHistory();
                return history.length > 0 ? (
                history.map((record, index) => (
                    <div key={`${record.date}-${index}-${record.day}`} className="py-1.5 border-b last:border-b-0">
                    <div className="font-medium">{record.date} ({record.day})</div>
                    <div className="pl-2 text-[10px] text-gray-700">
                        {record.sets.map((set, i) => ( <span key={`${set.id}-${i}`} className="mr-2"> S{set.id}: {set.weight || 0}kg × {set.reps || 0}r </span> ))}
                    </div>
                    </div>
                )) ) : ( <p className="italic text-gray-500">No previous records found.</p> );
            })()}
            </div>
        </div>
      )}

      {/* Sets Table */}
      <table className="w-full mb-4 border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th className="w-10 p-1 text-xs font-semibold text-center text-gray-600 border md:w-12">Set</th>
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">Weight (kg)</th>
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">Reps</th>
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => {
             // Determine state variables for rendering clarity
             const isSkipped = set.skipped;
             const isThisSetDurationRunning = !isSkipped && activeTimer === 'workout' && activeSetRef.current === set.id;
             const isThisSetRestRunning = !isSkipped && activeTimer === 'rest' && activeSetRef.current === set.id;
             const isAnyRestRunning = activeTimer === 'rest'; // Is *any* rest timer running?
             const isCompletedNotEditing = !isSkipped && set.isCompleted && !set.isEditing;
             const isEditable = !isSkipped && isCompletedNotEditing && activeTimer === null; // Can edit completed only if no timer is active
             const isActiveOrEditing = !isSkipped && (set.isActive || set.isEditing) && !set.isCompleted; // Set is ready for input/action
             const isLocked = !isSkipped && !set.isActive && !set.isCompleted && !set.isEditing && !isAnyRestRunning; // Neither active, completed, editing, nor globally resting

             // Input disabled if: skipped, locked, completed (not editing), or resting globally (unless this set is being edited)
             const isInputDisabled = isSkipped || isLocked || isCompletedNotEditing || (isAnyRestRunning && !set.isEditing);
             // Row styling
             const rowClass = isSkipped ? "opacity-40 bg-gray-100 italic" :
                              isLocked ? "opacity-60 bg-gray-50" :
                              isAnyRestRunning && !isThisSetRestRunning ? "opacity-70 bg-gray-50" : // Dim if another set is resting
                              set.isEditing ? "bg-yellow-50" :
                              "bg-white";


             return (
                <tr key={set.id} className={`${rowClass} border transition-opacity duration-200 text-sm`}>
                  {/* Set ID */}
                  <td className="p-1 font-medium text-center border">{set.id}</td>

                  {/* Weight Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="decimal" step="any"
                        className={`w-full border rounded h-9 px-1 text-center text-sm ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.weight}
                        onChange={(e) => handleInputChange(set.id, "weight", e.target.value)}
                        disabled={isInputDisabled} aria-label={`Weight for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isThisSetDurationRunning ? 'text-blue-600 font-medium animate-pulse' : isSkipped ? 'text-gray-900' : 'text-gray-500'}`}>
                      {isSkipped ? `Skipped` : `Dur: ${set.duration}`}
                    </span>
                  </td>

                  {/* Reps Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="numeric" pattern="\d*"
                        className={`w-full border rounded h-9 px-1 text-center text-sm ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.reps}
                        onChange={(e) => handleInputChange(set.id, "reps", e.target.value)}
                        disabled={isInputDisabled} aria-label={`Reps for set ${set.id}`}
                    />
                     <span className={`block text-[10px] text-center mt-0.5 ${isThisSetRestRunning ? 'text-orange-600 font-medium animate-pulse' : isSkipped ? 'text-gray-900' : 'text-gray-500'}`}>
                         {isSkipped ? `(${set.skippedDates[set.skippedDates.length - 1]})` : `Rest: ${set.rest}`}
                    </span>
                  </td>

                  {/* Actions Cell */}
                  <td className="p-1 text-center align-middle border">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-base md:gap-2">

                        {/* State 0: Skipped */}
                        {isSkipped ? (
                             <i className="text-gray-400 fas fa-ban" title={`Skipped on ${set.skippedDates.join(', ')}`}></i>
                        ) :
                        /* State 1: Workout Timer Running for THIS set */
                        isThisSetDurationRunning ? (
                            // Only show Check button when timer is running
                            <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700" onClick={() => completeSet(set.id)} title="Complete Set"></i>
                        ) :
                        /* State 2: Any Rest Timer Running */
                        isAnyRestRunning ? (
                             // Show resting icons
                             isThisSetRestRunning ? <i className="text-orange-400 fas fa-hourglass-half animate-pulse" title="Resting"></i> : <i className="text-gray-400 opacity-50 fas fa-hourglass-half" title="Another set resting"></i>
                        ) :
                        /* State 3: Locked */
                        isLocked ? (
                            <i className="text-gray-400 fas fa-lock" title="Complete previous set"></i>
                        ) :
                        /* State 4: Interactive States (Not Skipped/Running/Resting/Locked) */
                        (<>
                            {/* Case 4a: Editing a completed set */}
                            {set.isEditing && ( // Check if specifically in editing mode
                                <>
                                    {/* Play icon to restart the timer */}
                                    <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700" onClick={() => startWorkout(set.id)} title="Restart Workout Timer"></i>
                                    {/* Check icon to save edits and complete immediately (skip timer) */}
                                    <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700" onClick={() => completeSet(set.id)} title="Save & Complete (Skip Timer)"></i>
                                </>
                            )}

                            {/* Case 4b: Active, NOT editing, NOT completed */}
                            {/* Define isActiveNormal-like condition here */}
                            {set.isActive && !set.isEditing && !set.isCompleted && (
                                // Only show the Play button to start the timer
                                <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700" onClick={() => startWorkout(set.id)} title="Start Workout Timer"></i>
                            )}

                            {/* Case 4c: Completed, NOT editing, No timer -> Editable */}
                            {isEditable && ( // isEditable already covers !isEditing and activeTimer === null
                                // Show the Edit button
                                <i className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700" onClick={() => editSet(set.id)} title="Edit Set"></i>
                            )}

                            {/* Delete Button: Show if Editing, ActiveNormal (Case 4b), or Editable */}
                            {(set.isEditing || (set.isActive && !set.isEditing && !set.isCompleted) || isEditable) && (
                                <i
                                    className={`cursor-pointer fas fa-trash-alt ${sets.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                    onClick={() => { if (sets.length > 1 && activeTimer === null && !isSkipped) deleteSet(set.id); else if (sets.length <= 1) toast.error("Cannot delete last set."); else if (activeTimer !== null) toast.error("Cannot delete while timer active."); else if (isSkipped) toast.error("Cannot delete skipped set."); }}
                                    title={sets.length <= 1 ? "Cannot delete last set" : activeTimer !== null ? "Timer active" : isSkipped ? "Cannot delete skipped set" : "Delete Set"}
                                ></i>
                            )}
                        </>)}
                    </div>
                 </td>
                </tr>
             );
            })}
        </tbody>
      </table>

      {/* Rest Timer Button */}
      {activeTimer === 'rest' && (
        <RegularButton title={`Resting... (${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}) - Tap to Skip Rest`} className="w-full mt-4 font-medium text-white bg-orange-500 hover:bg-orange-600" onClick={stopRestTimer} />
      )}

       {/* Finish Day Button */}
       <div className="mt-4">
            {isLastExercise && isAllSetsCompleted && activeTimer === null && (
                <RegularButton
                    title="Finish Day's Workout"
                    className="w-full font-semibold text-white bg-green-600 hover:bg-green-700"
                    onClick={handleFinishDay}
                />
            )}
       </div>


      {/* Navigation Arrows */}
      <div className="flex items-center justify-between mt-6">
         {/* Previous Button */}
        <button
            onClick={goPrev}
            className="flex items-center justify-center p-2 text-lg text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed aspect-square w-9 h-9"
            aria-label="Previous Exercise"
            disabled={exerciseIndex === 0 || activeTimer !== null} // Disable if first exercise or timer running
            title={exerciseIndex === 0 ? "" : activeTimer !== null ? "Timer active" : "Previous Exercise"}
        >
            <i className="fas fa-arrow-left"></i>
        </button>

        {/* Exercise Counter */}
        <span className="text-xs text-gray-500"> Exercise {exerciseIndex + 1} of {necessaryData?.allWeeksData?.[selectedWeek?.week || 0]?.days?.[selectedDay-1]?.exercises?.length || 0} </span>

        {/* Next Button */}
        {/* Hide completely if last exercise */}
        {!isLastExercise && (
             <button
                onClick={handleGoNext}
                className={`p-2 text-lg rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed aspect-square flex items-center justify-center w-9 h-9 ${isLastExercise ? 'invisible' : 'text-gray-700 bg-gray-200'}`}
                aria-label="Next Exercise"
                disabled={isLastExercise || !isAllSetsCompleted || activeTimer !== null} // Disable if last, not all sets done, or timer running
                title={!isAllSetsCompleted ? "Complete all sets to advance" : activeTimer !== null ? "Timer active" : isLastExercise ? "" : "Next Exercise"}
             >
                 <i className="fas fa-arrow-right"></i>
             </button>
        )}
         {/* Placeholder for alignment when Next button is hidden */}
         {isLastExercise && <div className="w-9 h-9"></div>}

      </div>
    </>
  );
};

export default SetAndRepsForm;