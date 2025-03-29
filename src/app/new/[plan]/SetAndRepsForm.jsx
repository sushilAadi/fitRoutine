"use client";

import React, { useState, useEffect, useRef } from "react";
import RegularButton from "@/components/Button/RegularButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Helper function to parse time string (HH:MM:SS or MM:SS) to seconds
const parseTimeToSeconds = (timeString = "00:00:00") => {
  // ... (keep existing helper function)
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
             date: set.date || new Date().toISOString().split('T')[0],
             exerciseId:exerciseId // Add date if missing
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
    } else if (!initialLoadComplete.current) {
        initialLoadComplete.current = true; // Mark as complete even if no data
    }
    // --- End Timer Restore Logic ---


    const allInitiallyCompleted = Array.isArray(initialData) && initialData.length > 0 &&
      initialData.every(set => set.isCompleted);
    setIsAllSetsCompleted(allInitiallyCompleted);

  }, [selectedDay, exerciseId, initialSets]); // Rerun if these core identifiers change


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
    // Added check for !isThisSetDurationRunning locally just in case, although activeTimer check should cover it.
    if ((currentSet.isActive || currentSet.isEditing) &&
        (!currentSet.isCompleted || currentSet.isEditing) &&
         activeTimer === null && !currentSet.isDurationRunning)
    {
        console.log(`Starting workout for set ${setId}. Resetting duration.`);
        // Clear any lingering rest/duration flags from other sets (safety)
        const updatedSets = sets.map((s, index) => ({
            ...s,
            isDurationRunning: index === setIndex, // True only for the starting set
            isRestRunning: false,                 // False for all sets
            // Reset duration visually ONLY when starting workout (not resuming)
            duration: index === setIndex ? "00:00:00" : s.duration,
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

    // Allow completion if:
    // 1. Editing this set (regardless of timer state - handles immediate complete after edit)
    // 2. Workout timer is running for this set (normal completion flow)
    if ( currentSet.isEditing || (currentSet.isActive && activeTimer === 'workout' && activeSetRef.current === setId) ) {
      if (!currentSet.weight || !currentSet.reps) {
        toast.error("Please enter weight and reps.");
        return;
      }

      console.log(`Completing set ${setId}. Starting rest timer.`);
      // Prepare updated sets array
      const updatedSets = sets.map((s, index) => {
          if (index === setIndex) {
              // Mark completed, stop duration timer flag, start rest timer flag
              return {
                  ...s,
                  isCompleted: true,
                  isEditing: false, // Ensure editing is turned off on completion
                  isActive: false,
                  isDurationRunning: false, // Stop duration timer
                  isRestRunning: true,      // Start rest timer conceptually (timer itself starts below)
                  // Keep the final duration calculated by the timer useEffect if timer was running, otherwise it stays as it was (e.g., 00:00:00 if skipped)
              };
          }
          // Ensure other sets have flags cleared if somehow set
          // Keep completed status of previous sets
          return { ...s, isDurationRunning: false, isRestRunning: false, isActive: s.isActive && index !== setIndex, isEditing: s.isEditing && index !== setIndex };
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
    } else if (!currentSet.isActive && !currentSet.isEditing){
        toast.error("Set is not active or being edited."); // Added for clarity
    }
  };

  const stopRestTimer = () => {
    if (activeTimer !== 'rest' || activeSetRef.current === null) return; // Only stop if rest timer is active

    const lastCompletedSetIndex = sets.findIndex(set => set.id === activeSetRef.current);
    if (lastCompletedSetIndex === -1) return; // Should not happen

    console.log(`Stopping rest timer associated with set ${activeSetRef.current}. Activating next set if available.`);

    // Prepare updates: clear rest flag, activate next set if exists
    const updatedSets = sets.map((set, index) => {
        let isActive = false;
        // Activate the next set if it exists and isn't completed
        if (lastCompletedSetIndex < sets.length - 1 && index === lastCompletedSetIndex + 1 && !sets[index].isCompleted) {
            isActive = true;
            console.log(`Activating set ${sets[index].id}`);
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
      console.log(`Editing set ${setId}. Resetting state.`);
      const updatedSets = sets.map((set, index) => {
        // Reset flags for all sets during edit preparation
        let updatedSet = { ...set, isDurationRunning: false, isRestRunning: false };

        if (index === setIndex) {
          // Mark target set for editing, make active, un-complete
          updatedSet = { ...updatedSet, isEditing: true, isActive: true, isCompleted: false };
        } else if (index > setIndex) {
          // Deactivate and reset subsequent completed sets (allow user to redo from edit point)
          if(updatedSet.isCompleted){
              updatedSet = { ...updatedSet, isCompleted: false, isActive: false, isEditing: false, duration: "00:00:00", rest: "00:00" };
          } else {
             updatedSet = { ...updatedSet, isActive: false, isEditing: false }; // Keep non-completed subsequent sets as they are, just deactivate
          }
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
        // You could potentially allow editing active/non-completed sets here if needed
        // For now, we only allow editing *completed* sets.
        // toast.info("Set is already active/not completed.");
    }
  };

  const deleteSet = (setId) => {
    if (sets.length <= 1) {
      toast.error("Cannot delete the only set.");
      return;
    }

    // Check if timer running FOR THIS SET specifically
    const isTimerRunningForThisSet = activeSetRef.current === setId && activeTimer !== null;
    const deletingSetIndex = sets.findIndex(s => s.id === setId);

     // Prevent deletion if *any* timer is running (safer approach)
     if (activeTimer !== null) {
         toast.error("Cannot delete set while a timer is active.");
         return;
     }

    // // Stop timer if it was running for the deleted set - No longer needed with the check above
    //  if (isTimerRunningForThisSet) {
    //     setActiveTimer(null);
    //     setSeconds(0);
    //     activeSetRef.current = null;
    //     waitingForRestCompletion.current = false;
    //     console.log(`Stopped timer because set ${setId} was deleted.`);
    //  }

    const updatedSets = sets.filter(set => set.id !== setId);
    let activeSetFound = false;
    let madeActive = false; // Track if we actively set a new active set

    // Re-index and ensure correct active state and clean flags
    const reindexedSets = updatedSets.map((set, index) => {
       // Reset flags during reindex, clear timer flags (should be null anyway due to check above)
       const newSet = { ...set, id: index + 1, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false };

        // Try to find the first non-completed set AFTER the deleted position to make active
        if (!madeActive && !set.isCompleted && index >= deletingSetIndex) {
            newSet.isActive = true;
            madeActive = true;
            console.log(`Set ${newSet.id} made active after deletion.`);
        }
        return newSet;
    });

    // If no subsequent set was made active, try activating the first incomplete overall
     if (!madeActive && reindexedSets.length > 0) {
        const firstIncompleteIndex = reindexedSets.findIndex(set => !set.isCompleted);
        if (firstIncompleteIndex !== -1) {
            reindexedSets[firstIncompleteIndex].isActive = true;
            console.log(`Set ${reindexedSets[firstIncompleteIndex].id} made active after deletion (first incomplete).`);
        }
        // If all remaining are complete, checkAllSetsCompleted will handle the state.
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
    // Only make active if all previous are completed OR if it's the very first set.
    const makeActive = sets.length === 0 || allPreviousCompleted;

    const newSet = {
      id: newSetId,
      weight: "", reps: "", duration: "00:00:00", rest: "00:00",
      isCompleted: false, isActive: makeActive, isEditing: false,
      isDurationRunning: false, isRestRunning: false, // Initialize flags
      date: new Date().toISOString().split('T')[0],
      exerciseId:exerciseId
    };

    // Deactivate other sets if the new one is made active
    const updatedSets = sets.map(set => ({ ...set, isActive: makeActive ? false : set.isActive }));

    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false); // Adding a set means not all are completed
    console.log(`Added set ${newSetId}. Active: ${makeActive}`);
  };

  const handleInputChange = (setId, field, value) => {
    setSets(prevSets =>
        prevSets.map(set => {
            // Allow input only if the set is active or editing AND no global rest timer is running
            // Input during workout timer is usually okay (for weight/reps)
            if (set.id === setId && (set.isActive || set.isEditing) && activeTimer !== 'rest') {
                // Basic validation for number fields
                 if ((field === 'weight' || field === 'reps') && value && !/^\d*\.?\d*$/.test(value)) {
                    return set; // Prevent invalid characters
                 }
                return { ...set, [field]: value };
            }
            return set;
        })
    );
  };

  const getExerciseHistory = () => {
    // (Keep existing history logic - it's independent of timers)
    // ... (function remains the same) ...
    const history = [];
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        const pattern = `workout-\\d+-${exerciseId}`; // Match workout-<any digits>-exerciseId
        const regex = new RegExp(`^${pattern}$`);

        for (const key of keys) {
            // Check if key matches the pattern `workout-{digits}-{exerciseId}`
             if (regex.test(key)) {
                 // Skip the currently active key to avoid showing today's partial data as history
                 const currentKey = `workout-${selectedDay}-${exerciseId}`;
                 if (key === currentKey) continue;

                 try {
                     const data = JSON.parse(localStorage.getItem(key));
                     // Check if data is an array and has at least one valid entry with a date
                     if (Array.isArray(data) && data.length > 0 && data[0]?.date) {
                         // Filter for sets that are completed (have id, weight, reps)
                         const validSets = data.filter(item => item && typeof item.id !== 'undefined' && typeof item.weight !== 'undefined' && typeof item.reps !== 'undefined' && item.isCompleted); // Only show completed sets from history
                         if (validSets.length > 0) {
                             // Extract date from the first valid set
                             const dayMatch = key.match(/workout-(\d+)-/);
                             const dayNum = dayMatch ? dayMatch[1] : '?'; // Extract day number from key
                             history.push({ date: validSets[0].date, day: `Day ${dayNum}`, sets: validSets });
                         }
                     }
                 } catch (e) { console.error("Error parsing history item:", key, e); }
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
             // Active but not editing, not completed, timer not running for it
             const isActiveNormal = set.isActive && !set.isCompleted && !set.isEditing && !isThisSetDurationRunning;
             // Waiting for previous sets, not active/completed/editing
             const isLocked = !set.isActive && !set.isCompleted && !set.isEditing;
             const isEditing = set.isEditing; // Alias for clarity

             // Input disabled if: locked OR completed (not editing) OR resting globally
             const isInputDisabled = isLocked ||
                                     (isCompleted && !isEditing) ||
                                     isAnyRestRunning;

             // Actions Cell Disable condition (for delete mostly)
             const isActionDisabled = activeTimer !== null;


             return (
                <tr key={set.id} className={`${(isLocked || isAnyRestRunning) && !isThisSetDurationRunning ? "opacity-50 bg-gray-50" : isEditing ? "bg-yellow-50" : "bg-white"} border`}>
                  {/* Set ID */}
                  <td className="p-1 font-medium text-center border">{set.id}</td>

                  {/* Weight Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="decimal" step="any" // Allow decimals
                        className={`w-full border rounded h-10 px-1 text-center ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.weight}
                        onChange={(e) => handleInputChange(set.id, "weight", e.target.value)}
                        disabled={isInputDisabled}
                        aria-label={`Weight for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isThisSetDurationRunning ? 'text-blue-600 font-medium animate-pulse' : 'text-gray-500'}`}>Dur: {set.duration}</span>
                  </td>

                  {/* Reps Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="numeric" pattern="\d*" // Only allow whole numbers
                        className={`w-full border rounded h-10 px-1 text-center ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.reps}
                        onChange={(e) => handleInputChange(set.id, "reps", e.target.value)}
                        disabled={isInputDisabled}
                        aria-label={`Reps for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isAnyRestRunning && activeSetRef.current === set.id ? 'text-orange-600 font-medium animate-pulse' : 'text-gray-500'}`}>Rest: {set.rest}</span>
                  </td>

                  {/* ======================= */}
                  {/* == ACTIONS CELL V3 == */}
                  {/* ======================= */}
                  <td className="p-1 text-center align-middle border">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-base sm:text-lg sm:gap-2">

                        {/* --- State 1: Workout Timer Running for THIS set --- */}
                        {isThisSetDurationRunning ? (
                            // Show ONLY Check when workout timer is running (covers normal flow AND edit->play)
                            <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                               onClick={() => completeSet(set.id)}
                               title="Complete Set">
                            </i>
                        ) : /* --- State 2: Resting Globally --- */
                        isAnyRestRunning ? (
                            <i className="text-orange-400 fas fa-hourglass-half" title="Resting"></i>
                        ) : /* --- State 3: Locked --- */
                        isLocked ? (
                            <i className="text-gray-400 fas fa-lock" title="Complete previous set"></i>
                        ) : /* --- State 4: Interactive States (Not Running/Resting/Locked) --- */
                        (<>
                            {/* --- Sub-state: Editing --- */}
                            {isEditing && (
                                <>
                                    {/* Play Button (Restart Timer) - Shown only when editing */}
                                    <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                                       onClick={() => startWorkout(set.id)}
                                       title="Restart Workout Timer">
                                    </i>
                                    {/* Check Button (Save & Complete) - Shown only when editing */}
                                    <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                                       onClick={() => completeSet(set.id)}
                                       title="Save & Complete (Skip Timer)">
                                    </i>
                                </>
                            )}

                            {/* --- Sub-state: Active Normal (Not Editing) --- */}
                            {isActiveNormal && (
                                // Show ONLY Play when active normally and timer not running
                                <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                                   onClick={() => startWorkout(set.id)}
                                   title="Start Workout Timer">
                                </i>
                            )}

                            {/* --- Sub-state: Completed & Editable (Not Editing) --- */}
                            {isEditable && (
                                // Show ONLY Edit Pencil when completed and editable
                                <i className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700"
                                   onClick={() => editSet(set.id)}
                                   title="Edit Set">
                                </i>
                            )}

                            {/* --- Delete Button (Common when interactive) --- */}
                            {/* Show delete if not locked, not completed (or editable), and timer not running */}
                            {(isEditing || isActiveNormal || isEditable) && (
                                <i
                                    className={`cursor-pointer fas fa-trash-alt ${sets.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                    // The parent conditions (!isThisSetDurationRunning && !isAnyRestRunning) ensure timer is not running globally
                                    onClick={() => { if (sets.length > 1) deleteSet(set.id); }}
                                    title={sets.length <= 1 ? "Cannot delete last set" : "Delete Set"}
                                ></i>
                            )}
                        </>)
                        }
                    </div>
                 </td>
                  {/* ======================= */}
                  {/* == END ACTIONS CELL == */}
                  {/* ======================= */}

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