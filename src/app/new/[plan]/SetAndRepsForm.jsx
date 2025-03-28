"use client";

import React, { useState, useEffect, useRef } from "react";
import RegularButton from "@/components/Button/RegularButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Helper function to parse time string (HH:MM:SS or MM:SS) to seconds
const parseTimeToSeconds = (timeString = "00:00:00") => {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) { // HH:MM:SS
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  } else if (parts.length === 2) { // MM:SS
    return (parts[0] * 60) + parts[1];
  }
  return 0; // Default case or invalid format
};


const SetAndRepsForm = ({
  sets: initialSets,
  selectedDay,
  exerciseId,
  exerciseName,
  goPrev,
  goNext,
  necessaryData,
  exerciseIndex,
  isLastExercise,
}) => {
  const router = useRouter();

  const {day, dayName, weekName, selectedPlanId, userId, selectededDay, setSelectedWeek, selectedWeek, setSelectededDay, noOfweeks,dayData,weekStructure} = necessaryData || {};

  const workoutProgressKey = `workout-progress-${selectedPlanId}`;
  const selectedDayKey = `selectedDay_${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeek_${selectedPlanId || 'default'}`;

  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  // Initialize sets data from local storage or create new
  const getInitialSets = () => {
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(`workout-${selectedDay}-${exerciseId}`);
        if (savedData) {
           const parsedData = JSON.parse(savedData);
           // Ensure new flags exist with defaults if loading old data
           return parsedData.map((set, index) => ({
             ...set,
             isActive: set.isActive === undefined ? (index === 0 && !set.isCompleted) : set.isActive, // Default isActive logic if missing
             isEditing: set.isEditing || false,
             isDurationRunning: set.isDurationRunning || false,
             isRestRunning: set.isRestRunning || false,
             date: set.date || new Date().toISOString().split('T')[0], // Add date if missing
           }));
        }
      } catch (error) {
        console.error("Error parsing saved workout data:", error);
      }
    }
    // Default creation if no saved data or error
    return Array(parseInt(initialSets) || 1).fill().map((_, index) => ({
      id: index + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
      isCompleted: false, isActive: index === 0, isEditing: false,
      isDurationRunning: false, // Add new flag
      isRestRunning: false,     // Add new flag
      date: new Date().toISOString().split('T')[0],
    }));
  };

  const [sets, setSets] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null); // 'workout', 'rest', or null
  const [seconds, setSeconds] = useState(0);
  const [isAllSetsCompleted, setIsAllSetsCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);
  const activeSetRef = useRef(null); // Holds the ID of the set whose timer (workout or rest) is active
  const waitingForRestCompletion = useRef(false); // Still useful for UI logic related to rest state
  const initialLoadComplete = useRef(false); // Prevent restore logic from running multiple times

  // Reset auto-navigation tracking when the exercise itself changes
  useEffect(() => {
      setHasAutoNavigated(false);
      initialLoadComplete.current = false; // Reset load flag on exercise change
  }, [exerciseId]);


  // Load data on mount & Restore Timer State
  useEffect(() => {
    const initialData = getInitialSets();
    setSets(initialData);

    // --- Timer Restore Logic ---
    if (!initialLoadComplete.current && initialData.length > 0) {
        let restored = false;
        // Check for running duration timer first
        for (const set of initialData) {
            if (set.isDurationRunning) {
                const elapsedSeconds = parseTimeToSeconds(set.duration);
                console.log(`Restoring Duration Timer for Set ${set.id} at ${elapsedSeconds}s`);
                activeSetRef.current = set.id;
                setActiveTimer('workout');
                setSeconds(elapsedSeconds);
                waitingForRestCompletion.current = false;
                restored = true;
                break; // Only one timer can be active
            }
        }
        // If no duration timer, check for running rest timer
        if (!restored) {
            for (const set of initialData) {
                if (set.isRestRunning) {
                    const elapsedSeconds = parseTimeToSeconds(set.rest);
                    console.log(`Restoring Rest Timer for Set ${set.id} at ${elapsedSeconds}s`);
                    activeSetRef.current = set.id; // Rest timer is associated with the set *just completed*
                    setActiveTimer('rest');
                    setSeconds(elapsedSeconds);
                    waitingForRestCompletion.current = true; // Set rest waiting flag
                    restored = true;
                    break; // Only one timer can be active
                }
            }
        }

        // If no timer was restored, ensure clean state
        if (!restored) {
             setActiveTimer(null);
             setSeconds(0);
             activeSetRef.current = null;
             waitingForRestCompletion.current = false;
        }

        initialLoadComplete.current = true; // Mark initial load and restore as complete
    }
    // --- End Timer Restore Logic ---


    const allInitiallyCompleted = Array.isArray(initialData) && initialData.length > 0 &&
      initialData.every(set => set.isCompleted);
    setIsAllSetsCompleted(allInitiallyCompleted);

  }, [selectedDay, exerciseId, initialSets]); // Rerun if these core identifiers change


  // Save data to localStorage & check completion
  useEffect(() => {
    // Only save if initial load is done and sets array is not empty
    if (initialLoadComplete.current && sets.length > 0) {
        // Debounce or throttle might be good here for performance if updates are very frequent
        localStorage.setItem(`workout-${selectedDay}-${exerciseId}`, JSON.stringify(sets));
        checkAllSetsCompleted();
    }
  }, [sets, selectedDay, exerciseId]); // Dependency: sets state


  // Check if all sets are completed
  const checkAllSetsCompleted = () => {
    const allCompleted = Array.isArray(sets) && sets.length > 0 &&
      sets.every(set => set.isCompleted) &&
      !waitingForRestCompletion.current && // Should not be considered complete if waiting for rest
      activeTimer !== 'rest'; // Or if a rest timer is actively running (even if skipped)
    setIsAllSetsCompleted(prev => prev !== allCompleted ? allCompleted : prev);
    return allCompleted;
  };


  // Auto-navigation effect
  useEffect(() => {
    // Condition: All sets marked completed, not the last exercise, not currently resting, not already navigated
    if (isAllSetsCompleted && !isLastExercise && !waitingForRestCompletion.current && !hasAutoNavigated && activeTimer === null) {
      const moveToNextTimeout = setTimeout(() => {
        // Re-check conditions just before navigating (state might change)
        if (isAllSetsCompleted && !isLastExercise && !waitingForRestCompletion.current && !hasAutoNavigated && activeTimer === null) {
          console.log("Auto-navigating to next exercise");
          setHasAutoNavigated(true);
          goNext();
        }
      }, 750);
      // Cleanup timeout if conditions change before firing
      return () => clearTimeout(moveToNextTimeout);
    }
  }, [isAllSetsCompleted, isLastExercise, waitingForRestCompletion.current, hasAutoNavigated, activeTimer, goNext, exerciseIndex]);


  // Timer logic (Interval)
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current); // Cleanup interval on unmount or when activeTimer changes
  }, [activeTimer]);


  // Update set duration/rest time string based on 'seconds' state
  useEffect(() => {
    // No timer running or no active set referenced? Do nothing.
    if (!activeTimer || activeSetRef.current === null) return;

    setSets(prevSets => {
      // Find the index of the set this timer belongs to
      const activeSetIndex = prevSets.findIndex(set => set.id === activeSetRef.current);
      if (activeSetIndex === -1) return prevSets; // Should not happen normally

      // Calculate formatted time string
      const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');

      let needsUpdate = false;
      let updatedSets = [...prevSets]; // Create a shallow copy for modification
      const currentSet = updatedSets[activeSetIndex]; // Get the specific set object

      // Update the correct field based on the timer type
      if (activeTimer === 'workout') {
        const newDuration = `${hours}:${minutes}:${secs}`;
        if (currentSet.duration !== newDuration || !currentSet.isDurationRunning) { // Update if time changed OR flag needs setting
          // Create a *new* object for the changed set (immutability)
          updatedSets[activeSetIndex] = { ...currentSet, duration: newDuration, isDurationRunning: true, isRestRunning: false };
          needsUpdate = true;
        }
      } else if (activeTimer === 'rest') {
        const newRest = `${minutes}:${secs}`;
        if (currentSet.rest !== newRest || !currentSet.isRestRunning) { // Update if time changed OR flag needs setting
           // Rest running flag is associated with the completed set
          updatedSets[activeSetIndex] = { ...currentSet, rest: newRest, isRestRunning: true, isDurationRunning: false };
          needsUpdate = true;
        }
      }

      // Return the updated array *only* if a change was made
      return needsUpdate ? updatedSets : prevSets;
    });
  }, [seconds, activeTimer]); // Dependencies: the timer value and type


  // =========================================
  // == HANDLER FUNCTION DEFINITIONS (START) ==
  // =========================================

  const startWorkout = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    // Allow start only if: (Active or Editing) AND (Not Completed or Editing) AND (No timer is currently running globally)
    if ((currentSet.isActive || currentSet.isEditing) &&
        (!currentSet.isCompleted || currentSet.isEditing) &&
         activeTimer === null) // Check if *any* timer is already running
    {
        // Clear any lingering rest/duration flags from other sets (safety)
        const updatedSets = sets.map((s, index) => ({
            ...s,
            isDurationRunning: index === setIndex, // True only for the starting set
            isRestRunning: false,                 // False for all sets
            duration: index === setIndex && (currentSet.isEditing || currentSet.duration === "00:00:00") ? "00:00:00" : s.duration, // Reset duration visually if editing or was 0
            isActive: index === setIndex, // Ensure only this one is active
        }));

        setSets(updatedSets); // Update state triggering save and UI update

        // Now start the timer state
        setActiveTimer('workout');
        setSeconds(0); // Start from 0 when manually starting
        activeSetRef.current = setId;
        waitingForRestCompletion.current = false; // Ensure not waiting for rest

    } else if (activeTimer !== null) {
        toast.error("Another timer is already running.");
    }
  };

  const completeSet = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    // Allow completion if: (Active or Editing) AND (Workout timer is running for this set OR it's being edited)
    if ((currentSet.isActive || currentSet.isEditing) && ( (activeTimer === 'workout' && activeSetRef.current === setId) || currentSet.isEditing) ) {
      if (!currentSet.weight || !currentSet.reps) {
        toast.error("Please enter weight and reps.");
        return;
      }

      // Prepare updated sets array
      const updatedSets = sets.map((s, index) => {
          if (index === setIndex) {
              // Mark completed, stop duration timer flag, start rest timer flag
              return {
                  ...s,
                  isCompleted: true,
                  isEditing: false,
                  isActive: false,
                  isDurationRunning: false, // Stop duration timer
                  isRestRunning: true,      // Start rest timer conceptually (timer itself starts below)
                  // Keep the final duration calculated by the timer useEffect
              };
          }
          // Ensure other sets have flags cleared if somehow set
          return { ...s, isDurationRunning: false, isRestRunning: false };
      });

      setSets(updatedSets); // Update state first

      // Then start the actual rest timer
      activeSetRef.current = setId; // Rest timer references the set just completed
      setActiveTimer('rest');
      setSeconds(0); // Start rest timer from 0
      waitingForRestCompletion.current = true; // Set the waiting flag

    } else if (activeTimer === 'rest') {
        toast.error("Cannot complete set while resting.");
    } else if (activeTimer === 'workout' && activeSetRef.current !== setId) {
        // This case should ideally not happen with proper UI disabling
        toast.error("Workout timer running for another set.");
    }
  };

  const stopRestTimer = () => {
    if (activeTimer !== 'rest' || activeSetRef.current === null) return; // Only stop if rest timer is active

    const lastCompletedSetIndex = sets.findIndex(set => set.id === activeSetRef.current);
    if (lastCompletedSetIndex === -1) return; // Should not happen

    // Prepare updates: clear rest flag, activate next set if exists
    const updatedSets = sets.map((set, index) => {
        let isActive = false;
        // Activate the next set if it exists and isn't completed
        if (lastCompletedSetIndex < sets.length - 1 && index === lastCompletedSetIndex + 1 && !sets[index].isCompleted) {
            isActive = true;
        }
        // Clear rest running flag for the set that was resting
        const isRestRunning = (index === lastCompletedSetIndex) ? false : set.isRestRunning;

        return { ...set, isActive, isRestRunning };
    });

    // Update state first
    setSets(updatedSets);

    // Then clear timer state variables
    setActiveTimer(null);
    setSeconds(0);
    waitingForRestCompletion.current = false;
    activeSetRef.current = null; // Clear the reference

    // Re-check completion state after stopping rest (especially for the last set)
    checkAllSetsCompleted();
  };

  const handleWorkoutCompletion = () => {
    // Prevent completion if any timer is running
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot finish day while a timer is active.");
      return;
    }

    // Ensure all sets are genuinely marked as completed in the state
    const allSetsMarkedCompleted = sets.every(set => set.isCompleted);
    if (!allSetsMarkedCompleted) {
       toast.error("Please ensure all sets are marked as completed.");
       return; // Don't proceed if state doesn't reflect completion
    }


    try {
      const totalWeeks = parseInt(noOfweeks);
      const totalDays = dayData.length;
      let currentWeekNumber = selectedWeek.week;
      let currentDayValue = selectededDay;
      let nextWeekNumber = currentWeekNumber;
      let nextDayValue = currentDayValue;
      const currentDayIndex = dayData.findIndex(d => d.value === currentDayValue);

      if (currentDayIndex < totalDays - 1) {
        nextDayValue = dayData[currentDayIndex + 1].value;
      } else if (currentWeekNumber < totalWeeks) {
        nextWeekNumber = currentWeekNumber + 1;
        nextDayValue = dayData[0].value;
      } else {
        toast.success("Workout Plan Completed!");
        localStorage.removeItem(workoutProgressKey);
        localStorage.removeItem(selectedDayKey);
        localStorage.removeItem(selectedWeekKey);
        // Consider clearing individual exercise data too
        // This requires iterating through keys, potentially complex/risky
        router.push("/new");
        return;
      }

      const nextWeekObj = weekStructure.find(w => w.week === nextWeekNumber);
      const nextDayObj = dayData.find(d => d.value === nextDayValue);

      if (!nextWeekObj || !nextDayObj) {
          console.error("Could not find next week or day object:", {nextWeekNumber, nextDayValue, nextWeekObj, nextDayObj});
          toast.error("Error calculating next workout step.");
          return;
      }

      const newProgress = { currentWeek: nextWeekNumber, currentDay: nextDayValue, weekName: nextWeekObj.weekName, dayName: nextDayObj.label };
      localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
      localStorage.setItem(selectedWeekKey, nextWeekObj.weekName);
      localStorage.setItem(selectedDayKey, nextDayValue.toString());

      toast.success("Day Complete! Progress saved.");
      setTimeout(() => router.push("/new"), 100); // Navigate after state updates likely processed

    } catch (error) {
      console.error("Error in workout completion:", error);
      toast.error("An error occurred while completing the workout");
    }
  };

  const editSet = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;

    // Allow editing only completed sets and when NO timer is running
    if (sets[setIndex].isCompleted && activeTimer === null) {
      const updatedSets = sets.map((set, index) => {
        // Reset flags for all sets during edit preparation
        let updatedSet = { ...set, isDurationRunning: false, isRestRunning: false };

        if (index === setIndex) {
          // Mark target set for editing, make active, un-complete
          updatedSet = { ...updatedSet, isEditing: true, isActive: true, isCompleted: false };
        } else if (index > setIndex) {
          // Deactivate and reset subsequent sets
          updatedSet = { ...updatedSet, isCompleted: false, isActive: false, isEditing: false, duration: "00:00:00", rest: "00:00" };
        } else {
            // Deactivate sets before the edited one as well
             updatedSet = { ...updatedSet, isActive: false, isEditing: false };
        }
        return updatedSet;
      });

      // Reset global timer state variables
      setActiveTimer(null);
      setSeconds(0);
      activeSetRef.current = null;
      waitingForRestCompletion.current = false;
      setIsAllSetsCompleted(false); // Not all completed anymore

      setSets(updatedSets);

    } else if (activeTimer !== null) {
        toast.error("Finish or skip the current timer before editing.");
    } else if (!sets[setIndex].isCompleted) {
        // Allow editing active/non-completed sets? Usually not needed.
        // toast.info("Set is already active/not completed.");
    }
  };

  const deleteSet = (setId) => {
    if (sets.length <= 1) {
      toast.error("Cannot delete the only set.");
      return;
    }

    const isTimerRunningForThisSet = activeSetRef.current === setId && activeTimer !== null;

    // Stop timer if it was running for the deleted set
     if (isTimerRunningForThisSet) {
        setActiveTimer(null);
        setSeconds(0);
        activeSetRef.current = null;
        waitingForRestCompletion.current = false;
     }

    const updatedSets = sets.filter(set => set.id !== setId);
    let activeSetFound = false;

    // Re-index and ensure correct active state and clean flags
    const reindexedSets = updatedSets.map((set, index) => {
       // Reset flags during reindex, clear timer flags
       const newSet = { ...set, id: index + 1, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false };
        // First non-completed set becomes active IF no timer was restored/running for another set
        if (!activeSetFound && !set.isCompleted && !isTimerRunningForThisSet) { // Only make active if we just stopped the timer OR no timer was running
            newSet.isActive = true;
            activeSetFound = true;
        }
        return newSet;
    });

    // Edge case: If deleting caused the need to activate the first set (if it's not completed)
     if (!activeSetFound && reindexedSets.length > 0 && !isTimerRunningForThisSet) {
        const firstIncompleteIndex = reindexedSets.findIndex(set => !set.isCompleted);
        if (firstIncompleteIndex !== -1) {
            reindexedSets[firstIncompleteIndex].isActive = true;
        } else if(reindexedSets.length > 0) { // If all remaining are complete, maybe activate first? Or handle as completed? Let's default to not activating.
           // Decide desired behavior: maybe activate first even if complete? Or rely on completion check?
           // For now, only activate if incomplete exists.
        }
     }

    setSets(reindexedSets);
    // Completion check will run via useEffect
  };

  const addSet = () => {
     // Prevent adding a set if a timer is running
    if (activeTimer !== null) {
        toast.error("Cannot add set while timer is active.");
        return;
    }

    const newSetId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) + 1 : 1;
    const allPreviousCompleted = sets.every(set => set.isCompleted);
    // Only make active if all previous are completed AND we are not in a rest state
    const makeActive = sets.length === 0 || (allPreviousCompleted && !waitingForRestCompletion.current);

    const newSet = {
      id: newSetId,
      weight: "", reps: "", duration: "00:00:00", rest: "00:00",
      isCompleted: false, isActive: makeActive, isEditing: false,
      isDurationRunning: false, isRestRunning: false, // Initialize flags
      date: new Date().toISOString().split('T')[0],
    };

    // Deactivate other sets if the new one is made active
    const updatedSets = sets.map(set => ({ ...set, isActive: makeActive ? false : set.isActive }));
    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false); // Adding a set means not all are completed
  };

  const handleInputChange = (setId, field, value) => {
    setSets(prevSets =>
        prevSets.map(set => {
            // Allow input only if the set is active or editing AND no timer is running for *another* set
            if (set.id === setId && (set.isActive || set.isEditing) && (activeTimer === null || activeSetRef.current === setId)) {
                return { ...set, [field]: value };
            }
            return set;
        })
    );
  };

  const getExerciseHistory = () => {
    // (Keep existing history logic - it's independent of timers)
    const history = [];
    if (typeof window !== 'undefined') {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          // Ensure key is not null and follows the expected pattern
          if (key && key.startsWith(`workout-${selectedDay}-`) && key.endsWith(`-${exerciseId}`)) {
            // Check if the key matches the exact format `workout-${day}-${exerciseId}`
             const parts = key.split('-');
             // Example key: "workout-1-101" -> parts = ["workout", "1", "101"]
             // We need to ensure the middle part is *exactly* the selectedDay and the last is exerciseId
             if (parts.length === 3 && parts[1] === String(selectedDay) && parts[2] === String(exerciseId)) {
                 // Skip the currently active key to avoid showing today's partial data as history
                 if (key === `workout-${selectedDay}-${exerciseId}`) continue;

                 try {
                     const data = JSON.parse(localStorage.getItem(key));
                     // Check if data is an array and has at least one valid entry with a date
                     if (Array.isArray(data) && data.length > 0 && data[0]?.date) {
                         // Filter for sets that are reasonably complete (have id, weight, reps)
                         const validSets = data.filter(item => item && typeof item.id !== 'undefined' && typeof item.weight !== 'undefined' && typeof item.reps !== 'undefined' && item.isCompleted); // Only show completed sets from history
                         if (validSets.length > 0) {
                             // Extract date from the first valid set
                             history.push({ date: validSets[0].date, day: `Day ${parts[1]}`, sets: validSets });
                         }
                     }
                 } catch (e) { console.error("Error parsing history item:", key, e); }
             }
          }
        }
      } catch (error) { console.error("Error accessing localStorage:", error); }
    }
    // Sort by date descending
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };


  const handleGoNext = () => {
    // Re-check completion status and ensure no timer is running
    if (checkAllSetsCompleted() && activeTimer === null) {
      goNext();
    } else if (activeTimer !== null) {
       toast.error("Complete or skip the current timer first.");
    }
     else {
      toast.error("Please complete all sets first.");
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };


  return (
    <>
      {/* Header and History Toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold capitalize">{exerciseName}</h2>
          <p className="text-sm text-gray-500">Track your progress</p>
        </div>
        <button onClick={toggleHistory} className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50" >
          {showHistory ? "Hide History" : "Show History"}
        </button>
      </div>

      {/* History Section */}
      {showHistory && (
         <div className="mb-4 overflow-y-auto border rounded bg-gray-50 max-h-48">
          <h3 className="p-2 text-base font-semibold bg-gray-100 border-b sticky-top">Previous Records</h3>
          <div className="p-2 text-sm">
            {(() => {
                const history = getExerciseHistory();
                return history.length > 0 ? (
                history.map((record, index) => (
                    <div key={`${record.date}-${index}-${record.day}`} className="py-1.5 border-b last:border-b-0">
                    <div className="font-medium">{record.date} ({record.day})</div>
                    <div className="pl-2 text-xs text-gray-700">
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
            <th className="w-12 p-1 text-sm font-semibold text-center text-gray-600 border">Set</th>
            <th className="w-1/3 p-1 text-sm font-semibold text-center text-gray-600 border">Weight (kg)</th>
            <th className="w-1/3 p-1 text-sm font-semibold text-center text-gray-600 border">Reps</th>
            <th className="w-auto p-1 text-sm font-semibold text-center text-gray-600 border">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => {
             // --- Determine State Variables ---
             const isThisSetDurationRunning = activeTimer === 'workout' && activeSetRef.current === set.id;
             const isAnyRestRunning = activeTimer === 'rest';
             const isCompleted = set.isCompleted && !set.isEditing;
             // Can edit only if completed AND no timer running globally
             const isEditable = set.isCompleted && !set.isEditing && activeTimer === null;
             // Active but not editing, not completed
             const isActiveNormal = set.isActive && !set.isCompleted && !set.isEditing;
             // Waiting for previous sets, not active/completed/editing
             const isLocked = !set.isActive && !set.isCompleted && !set.isEditing;
             const isEditing = set.isEditing; // Alias for clarity

             // Input disabled if: locked OR completed (not editing) OR timer running for another set OR resting globally
             const isInputDisabled = isLocked ||
                                     (isCompleted && !isEditing) ||
                                     (activeTimer !== null && activeSetRef.current !== set.id) ||
                                     isAnyRestRunning;


             return (
                <tr key={set.id} className={`${(isLocked || isAnyRestRunning) && !isThisSetDurationRunning ? "opacity-50 bg-gray-50" : "bg-white"} border`}>
                  {/* Set ID */}
                  <td className="p-1 font-medium text-center border">{set.id}</td>

                  {/* Weight Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="decimal"
                        className={`w-full border rounded h-10 px-1 text-center ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.weight}
                        onChange={(e) => handleInputChange(set.id, "weight", e.target.value)}
                        disabled={isInputDisabled}
                        aria-label={`Weight for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isThisSetDurationRunning ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>Dur: {set.duration}</span>
                  </td>

                  {/* Reps Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="numeric"
                        className={`w-full border rounded h-10 px-1 text-center ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.reps}
                        onChange={(e) => handleInputChange(set.id, "reps", e.target.value)}
                        disabled={isInputDisabled}
                        aria-label={`Reps for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isAnyRestRunning && activeSetRef.current === set.id ? 'text-orange-600 font-medium' : 'text-gray-500'}`}>Rest: {set.rest}</span>
                  </td>

                  {/* Actions Cell - REVISED LOGIC */}
                  <td className="p-1 text-center align-middle border">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-base sm:text-lg sm:gap-2">

                        {/* --- Primary State: Timer Running for THIS set --- */}
                        {isThisSetDurationRunning ? (
                            <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                               onClick={() => completeSet(set.id)}
                               title={isEditing ? "Save & Complete" : "Complete Set"}>
                            </i>
                        ) : /* --- Secondary State: Resting Globally --- */
                          isAnyRestRunning ? (
                            <i className="text-orange-400 fas fa-hourglass-half" title="Resting"></i>
                        ) : /* --- Tertiary State: Locked --- */
                          isLocked ? (
                            <i className="text-gray-400 fas fa-lock" title="Complete previous set"></i>
                        ) : /* --- Otherwise: Show appropriate actions based on Editing/Active/Completed --- */
                          (<>
                              
                              {isEditing && (
                                  <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                                     onClick={() => startWorkout(set.id)}
                                     title="Restart Timer">
                                  </i>
                                  /* Removed the unconditional checkmark when editing */
                              )}

                              {/* Active Normal State Actions (Timer NOT running) */}
                              {isActiveNormal && (
                                  <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                                     onClick={() => startWorkout(set.id)}
                                     title="Start Timer">
                                  </i>
                              )}

                              {/* Completed State Actions (Timer NOT running -> checked by isEditable) */}
                              {isEditable && (
                                  <i className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700"
                                     onClick={() => editSet(set.id)}
                                     title="Edit Set">
                                  </i>
                              )}

                              <i
                                  className={`cursor-pointer fas fa-trash-alt ${sets.length <= 1 ? 'text-gray-300 cursor-not-allowed' : activeTimer !== null ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                  onClick={() => sets.length > 1 && activeTimer === null && deleteSet(set.id)}
                                  title={sets.length <= 1 ? "Cannot delete" : activeTimer !== null ? "Cannot delete while timer active" : "Delete Set"}
                              ></i>
                          </>)
                        }
                    </div>
                  </td>
                  

                </tr>
             );
            })}
        </tbody>
      </table>

      {/* Add Set Button */}
      <div className="flex justify-center mb-4">
         <RegularButton title="+ Add Set" className="px-4 py-1.5 text-sm" onClick={addSet} disabled={activeTimer !== null} />
      </div>

      {/* Rest Timer Button */}
      {activeTimer === 'rest' && (
        <RegularButton title={`Resting... (${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}) - Tap to Skip`} className="w-full mt-4 font-medium text-white bg-orange-500 hover:bg-orange-600" onClick={stopRestTimer} />
      )}

      {/* Workout Completion Button */}
      {isLastExercise && isAllSetsCompleted && activeTimer === null && ( // Ensure timer is null
        <div className="mt-4"> <RegularButton title="Finish Day's Workout" className="w-full font-semibold text-white bg-green-600 hover:bg-green-700" onClick={handleWorkoutCompletion} /> </div>
      )}

      {/* Navigation Arrows */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={goPrev} className="p-3 text-xl text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50" aria-label="Previous Exercise" disabled={exerciseIndex === 0 || activeTimer !== null} > <i className="fas fa-arrow-left"></i> </button> {/* Disable if timer running */}
        <span className="text-sm text-gray-500"> Exercise {exerciseIndex + 1} of {necessaryData?.exercises?.length || 0} </span>
        <button onClick={handleGoNext} className={`p-3 text-xl rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${isLastExercise ? 'invisible' : 'text-gray-700 bg-gray-200'}`} aria-label="Next Exercise" disabled={!isAllSetsCompleted || isLastExercise || activeTimer !== null} title={!isAllSetsCompleted ? "Complete all sets to advance" : activeTimer !== null ? "Timer active" : "Next Exercise"} > <i className="fas fa-arrow-right"></i> </button> {/* Disable if timer running */}
      </div>
    </>
  );
};

export default SetAndRepsForm;