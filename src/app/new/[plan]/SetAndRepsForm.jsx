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

// Helper function to calculate the next day/week
const calculateNextDay = (currentWeekNumber, currentDayValue, dayData, totalWeeks, weekStructure) => {
  // ... (keep existing helper function)
  const totalDays = dayData.length;
  let nextWeekNumber = currentWeekNumber;
  let nextDayValue = currentDayValue;
  const currentDayIndex = dayData.findIndex(d => d.value === currentDayValue);

  if (currentDayIndex < totalDays - 1) {
    // Advance to next day in the same week
    nextDayValue = dayData[currentDayIndex + 1].value;
  } else if (currentWeekNumber < totalWeeks) {
    // Advance to the first day of the next week
    nextWeekNumber = currentWeekNumber + 1;
    nextDayValue = dayData[0].value;
  } else {
    // Last day of the last week - plan complete
    return null;
  }

  const nextWeekObj = weekStructure.find(w => w.week === nextWeekNumber);
  const nextDayObj = dayData.find(d => d.value === nextDayValue);

  if (!nextWeekObj || !nextDayObj) {
      console.error("Error calculating next step: Could not find next week or day object.", { nextWeekNumber, nextDayValue, nextWeekObj, nextDayObj });
      return 'error'; // Indicate an error occurred
  }

  return {
    nextWeekNumber,
    nextDayValue,
    nextWeekName: nextWeekObj.weekName,
    nextDayName: nextDayObj.label
  };
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
  // *** REMOVED ***: skippedDaysKey is no longer used

  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

  // Initialize sets data from local storage or create new
  const getInitialSets = () => {
    const storageKey = `workout-${selectedDay}-${exerciseId}`;
    if (typeof window !== 'undefined') {
      try {
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
           const parsedData = JSON.parse(savedData);
           // Ensure new flags exist with defaults if loading old data
           return parsedData.map((set, index) => ({
             ...set,
             isActive: set.isActive === undefined ? (index === 0 && !set.isCompleted && !set.skipped) : set.isActive, // Don't make active if skipped
             isEditing: set.isEditing || false,
             isDurationRunning: set.isDurationRunning || false,
             isRestRunning: set.isRestRunning || false,
             date: set.date || new Date().toISOString().split('T')[0],
             exerciseId: exerciseId, // Ensure exerciseId is present
             skipped: set.skipped || false, // Add default if missing
             skippedDates: set.skippedDates || [] // Add default if missing
           }));
        }
      } catch (error) {
        console.error("Error parsing saved workout data:", error);
      }
    }
    // Default creation if no saved data or error
    return Array(parseInt(initialSets) || 1).fill().map((_, index) => ({
      id: index + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
      isCompleted: false, isActive: index === 0, isEditing: false, // Initially active only if it's the first set
      isDurationRunning: false,
      isRestRunning: false,
      date: new Date().toISOString().split('T')[0],
      exerciseId: exerciseId, // Add exerciseId here too
      skipped: false, // Initialize skipped flag
      skippedDates: [] // Initialize skipped dates array
    }));
  };

  const [sets, setSets] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null); // 'workout', 'rest', or null
  const [seconds, setSeconds] = useState(0);
  const [isAllSetsCompleted, setIsAllSetsCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);
  const activeSetRef = useRef(null); // Holds the ID of the set whose timer (workout or rest) is active
  const waitingForRestCompletion = useRef(false);
  const initialLoadComplete = useRef(false);

  // Reset auto-navigation tracking when the exercise itself changes
  useEffect(() => {
      setHasAutoNavigated(false);
      initialLoadComplete.current = false; // Reset load flag on exercise change
  }, [exerciseId, selectedDay]); // Also reset if day changes


  // Load data on mount & Restore Timer State
  useEffect(() => {
    const initialData = getInitialSets();
    setSets(initialData);

    // --- Timer Restore Logic ---
    if (!initialLoadComplete.current && initialData.length > 0) {
        let restored = false;
        for (const set of initialData) {
            if (set.isDurationRunning && !set.skipped) { // Don't restore timer if skipped
                // ... (rest of timer restore logic remains the same)
                const elapsedSeconds = parseTimeToSeconds(set.duration);
                
                activeSetRef.current = set.id;
                setActiveTimer('workout');
                setSeconds(elapsedSeconds);
                waitingForRestCompletion.current = false;
                restored = true;
                break;
            }
        }
        if (!restored) {
            for (const set of initialData) {
                if (set.isRestRunning && !set.skipped) { // Don't restore timer if skipped
                    // ... (rest of timer restore logic remains the same)
                     const elapsedSeconds = parseTimeToSeconds(set.rest);
                     
                     activeSetRef.current = set.id; // Rest timer is associated with the set *just completed*
                     setActiveTimer('rest');
                     setSeconds(elapsedSeconds);
                     waitingForRestCompletion.current = true; // Set rest waiting flag
                     restored = true;
                     break;
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
      initialData.every(set => set.isCompleted || set.skipped); // Consider skipped as 'done' for day completion? Adjust if needed.
    setIsAllSetsCompleted(allInitiallyCompleted);

  }, [selectedDay, exerciseId, initialSets]); // Rerun if these core identifiers change


  useEffect(() => {
    // Only save if initial load is done and sets array is not empty AND not currently skipping
    // (Skipping handles its own save)
    if (initialLoadComplete.current && sets.length > 0) {
        // Avoid saving during the skip process itself, handleSkipDay does its own save.
        // Check if any set is marked as skipped to infer if we are in a 'skipped' state UI-wise
        const isSkippedState = sets.some(s => s.skipped);
        if (!isSkippedState || (isSkippedState && activeTimer === null)) { // Allow saving if skipped but timer isn't running (e.g. after load)
            localStorage.setItem(`workout-${selectedDay}-${exerciseId}`, JSON.stringify(sets));
        }
        checkAllSetsCompleted();
    }
  }, [sets, selectedDay, exerciseId]); // Dependency: sets state


  // Check if all sets are completed OR skipped
  const checkAllSetsCompleted = () => {
    // A day is considered "done" if every set is either completed OR marked as skipped
    const allDone = Array.isArray(sets) && sets.length > 0 &&
      sets.every(set => set.isCompleted || set.skipped) &&
      !waitingForRestCompletion.current &&
      activeTimer !== 'rest';
    setIsAllSetsCompleted(prev => prev !== allDone ? allDone : prev);
    return allDone;
  };


  // Auto-navigation effect
  useEffect(() => {
    // Condition: All sets done (completed or skipped), not last exercise, not resting, not navigated, no timer
    if (isAllSetsCompleted && !isLastExercise && !waitingForRestCompletion.current && !hasAutoNavigated && activeTimer === null) {
      const isAnySkipped = sets.some(s => s.skipped);
      // Don't auto-navigate if the state was reached by skipping (user explicitly clicked skip)
      if (!isAnySkipped) {
          const moveToNextTimeout = setTimeout(() => {
            if (isAllSetsCompleted && !isLastExercise && !waitingForRestCompletion.current && !hasAutoNavigated && activeTimer === null && !sets.some(s => s.skipped)) {
              
              setHasAutoNavigated(true);
              goNext();
            }
          }, 750);
          return () => clearTimeout(moveToNextTimeout);
      }
    }
  }, [isAllSetsCompleted, isLastExercise, waitingForRestCompletion.current, hasAutoNavigated, activeTimer, goNext, exerciseIndex, sets]); // Add sets dependency


  // Timer logic (Interval)
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => setSeconds(prev => prev + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);


  // Update set duration/rest time string based on 'seconds' state
  useEffect(() => {
    if (!activeTimer || activeSetRef.current === null) return;

    setSets(prevSets => {
      const activeSetIndex = prevSets.findIndex(set => set.id === activeSetRef.current);
      if (activeSetIndex === -1 || prevSets[activeSetIndex].skipped) return prevSets; // Don't update timer display for skipped sets

      // ... (rest of timer update logic remains the same)
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
        const newRest = `${minutes}:${secs}`;
        if (currentSet.rest !== newRest || !currentSet.isRestRunning) {
          updatedSets[activeSetIndex] = { ...currentSet, rest: newRest, isRestRunning: true, isDurationRunning: false };
          needsUpdate = true;
        }
      }
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

    // *** Add check: Don't start if skipped ***
    if (currentSet.skipped) {
        toast.error("This day/exercise was skipped.");
        return;
    }

    // Allow start only if: (Active or Editing) AND (Not Completed or Editing) AND (No timer running) AND Not Skipped
    if ((currentSet.isActive || currentSet.isEditing) &&
        (!currentSet.isCompleted || currentSet.isEditing) &&
         activeTimer === null && !currentSet.isDurationRunning)
    {
        // ... (rest of startWorkout logic remains the same)
        console.log(`Starting workout for set ${setId}. Resetting duration.`);
        const updatedSets = sets.map((s, index) => ({
            ...s,
            isDurationRunning: index === setIndex,
            isRestRunning: false,
            duration: index === setIndex ? "00:00:00" : s.duration,
            isActive: index === setIndex,
        }));
        setSets(updatedSets);
        setActiveTimer('workout');
        setSeconds(0);
        activeSetRef.current = setId;
        waitingForRestCompletion.current = false;

    } else if (activeTimer !== null) {
        toast.error("Another timer is already running.");
    }
  };

  const completeSet = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    // *** Add check: Don't complete if skipped ***
    if (currentSet.skipped) {
        toast.error("Cannot complete a set for a skipped day/exercise.");
        return;
    }

    // Allow completion if: (Editing OR (Active & Workout Timer for this set)) AND Not Skipped
    if ( currentSet.isEditing || (currentSet.isActive && activeTimer === 'workout' && activeSetRef.current === setId) ) {
      if (!currentSet.weight || !currentSet.reps) {
        toast.error("Please enter weight and reps.");
        return;
      }

      // ... (rest of completeSet logic remains the same)
      console.log(`Completing set ${setId}. Starting rest timer.`);
      const updatedSets = sets.map((s, index) => {
          if (index === setIndex) {
              return {
                  ...s,
                  isCompleted: true,
                  isEditing: false,
                  isActive: false,
                  isDurationRunning: false,
                  isRestRunning: true, // Mark for rest conceptually
              };
          }
          const shouldDeactivate = index > setIndex && !s.isCompleted && !s.skipped; // Don't deactivate skipped sets
          return {
              ...s,
              isDurationRunning: false,
              isRestRunning: false,
              isActive: s.isActive && index !== setIndex && !shouldDeactivate,
              isEditing: s.isEditing && index !== setIndex
            };
      });

      setSets(updatedSets);
      activeSetRef.current = setId;
      setActiveTimer('rest');
      setSeconds(0);
      waitingForRestCompletion.current = true;

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

    const lastCompletedSetIndex = sets.findIndex(set => set.id === activeSetRef.current);
    if (lastCompletedSetIndex === -1) return;

     // *** Add check: Don't activate next if it's skipped ***
    console.log(`Stopping rest timer associated with set ${activeSetRef.current}. Activating next set if available and not skipped.`);

    const updatedSets = sets.map((set, index) => {
        let isActive = false;
        // Activate the next set if it exists, isn't completed, AND isn't skipped
        if (lastCompletedSetIndex < sets.length - 1 &&
            index === lastCompletedSetIndex + 1 &&
            !sets[index].isCompleted &&
            !sets[index].skipped) // Check skipped flag
        {
            isActive = true;
            console.log(`Activating set ${sets[index].id}`);
        }
        const isRestRunning = (index === lastCompletedSetIndex) ? false : set.isRestRunning;

        return { ...set, isActive, isRestRunning };
    });

    setSets(updatedSets);
    setActiveTimer(null);
    setSeconds(0);
    waitingForRestCompletion.current = false;
    activeSetRef.current = null;
    checkAllSetsCompleted();
  };

  const handleWorkoutCompletion = () => {
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot finish day while a timer is active or resting.");
      return;
    }

    // Check if all sets are completed OR skipped
    const allSetsDone = sets.every(set => set.isCompleted || set.skipped);
    if (!allSetsDone) {
       toast("You have skipped this exercise");
       goNext();
       return;
    }

    // *** Logic remains the same using calculateNextDay ***
    try {
      const totalWeeks = parseInt(noOfweeks);
      let currentWeekNumber = selectedWeek.week;
      let currentDayValue = selectededDay;
      const nextStep = calculateNextDay(currentWeekNumber, currentDayValue, dayData, totalWeeks, weekStructure);

      if (nextStep === 'error') {
          toast.error("Error calculating next workout step.");
          return;
      }

      if (nextStep === null) { // Plan complete
        toast.success("Workout Plan Completed!");
        localStorage.removeItem(workoutProgressKey);
        localStorage.removeItem(selectedDayKey);
        localStorage.removeItem(selectedWeekKey);
        router.push("/new");
        return;
      }

      // Plan continues, update progress
      const { nextWeekNumber, nextDayValue, nextWeekName, nextDayName } = nextStep;
      const newProgress = { currentWeek: nextWeekNumber, currentDay: nextDayValue, weekName: nextWeekName, dayName: nextDayName };
      localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
      localStorage.setItem(selectedWeekKey, nextWeekName);
      localStorage.setItem(selectedDayKey, nextDayValue.toString());

      // Differentiate message slightly if skipped vs completed
       const wasSkipped = sets.some(s => s.skipped);
       toast.success(wasSkipped ? "Day Skipped! Progress saved." : "Day Complete! Progress saved.");
      setTimeout(() => router.push("/new"), 100);

    } catch (error) {
      console.error("Error in workout completion/skip advancement:", error);
      toast.error("An error occurred while advancing the workout");
    }
  };


  // *** MODIFIED ***: Handler for skipping the day
  const handleSkipExercise = () => {
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot skip day while a timer is active or resting.");
      return;
    }
    if (!confirm("Are you sure you want to skip this exercise? This action cannot be undone.")) {
        return;
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        const storageKey = `workout-${selectedDay}-${exerciseId}`;

        // 1. Read current data or use state as fallback
        let currentSetsData = [];
        try {
            const savedData = localStorage.getItem(storageKey);
            if (savedData) {
                currentSetsData = JSON.parse(savedData);
                if (!Array.isArray(currentSetsData)) currentSetsData = sets; // Fallback to state if parse fails
            } else {
                currentSetsData = sets; // Use state if nothing in storage yet
            }
        } catch (e) {
            console.error("Error reading workout data before skipping:", e);
            currentSetsData = sets; // Fallback to state on error
        }

         // Ensure we have some data to work with
         if (!Array.isArray(currentSetsData) || currentSetsData.length === 0) {
            // If truly empty, create default sets marked as skipped
             currentSetsData = Array(parseInt(initialSets) || 1).fill().map((_, index) => ({
                id: index + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
                isCompleted: false, isActive: false, isEditing: false,
                isDurationRunning: false, isRestRunning: false,
                date: today, // Use today's date
                exerciseId: exerciseId,
                skipped: true, // Mark as skipped
                skippedDates: [today] // Add today to skipped dates
             }));
             console.log("No existing data found, creating default skipped sets.");
         } else {
            // 2. Modify existing sets
            currentSetsData = currentSetsData.map(set => {
                const updatedSkippedDates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : [];
                if (!updatedSkippedDates.includes(today)) { // Avoid adding duplicate dates for the same skip action
                    updatedSkippedDates.push(today);
                }
                return {
                    ...set,
                    isCompleted: false, // Ensure not marked as completed if skipped
                    isActive: false,    // Ensure not active
                    isEditing: false,   // Ensure not editing
                    isDurationRunning: false, // Stop timers
                    isRestRunning: false,
                    weight: set.weight || "", // Keep existing data or empty string
                    reps: set.reps || "",
                    duration: set.duration || "00:00:00",
                    rest: set.rest || "00:00",
                    skipped: true, // Mark as skipped
                    skippedDates: updatedSkippedDates // Update dates array
                };
            });
         }


        // 3. Save modified data back to localStorage
        localStorage.setItem(storageKey, JSON.stringify(currentSetsData));
        console.log("Marked exercise as skipped for today:", storageKey);

        // Update state visually to reflect skipped status immediately
        setSets(currentSetsData);
        setActiveTimer(null); // Ensure timers are off
        setSeconds(0);
        waitingForRestCompletion.current = false;
        activeSetRef.current = null;
        setIsAllSetsCompleted(true); // Mark as 'done' for advancement logic

        // 4. Advance to the next day (using the completion logic which now handles skip)
        handleWorkoutCompletion(); // Call the completion handler which advances the day

    } catch (error) {
        console.error("Error skipping day:", error);
        toast.error("An error occurred while skipping the day.");
    }
  };


  const editSet = (setId) => {
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];

    // *** Add check: Don't edit if skipped ***
    if (currentSet.skipped) {
        toast.error("Cannot edit a set for a skipped day/exercise.");
        return;
    }

    // Allow editing only completed sets, when NO timer is running, AND not skipped
    if (currentSet.isCompleted && activeTimer === null) {
         console.log(`Editing set ${setId}. Resetting state for this set only.`);
         const updatedSets = sets.map((set, index) => {
            let updatedSet = { ...set }; // Start with the current set state

            // Always stop any running timers display flags when editing starts
            updatedSet = { ...updatedSet, isDurationRunning: false, isRestRunning: false };

            if (index === setIndex) {
                 // Reset the edited set: make it active, editable, not completed
                 updatedSet = { ...updatedSet, isEditing: true, isActive: true, isCompleted: false };
            } else {
                 // For all *other* sets (before or after):
                 // Ensure they are not active and not in editing mode.
                 // DO NOT reset their 'isCompleted' status here.
                 // DO NOT reset duration/rest here either.
                 updatedSet = { ...updatedSet, isActive: false, isEditing: false };
            }
            return updatedSet;
         });

         setActiveTimer(null);
         setSeconds(0);
         activeSetRef.current = null;
         waitingForRestCompletion.current = false;
         // It's no longer all completed because the edited set isn't
         setIsAllSetsCompleted(false);
         setSets(updatedSets);

    } else if (activeTimer !== null) {
        toast.error("Finish or skip the current timer before editing.");
    } else if (!currentSet.isCompleted) {
        // This case shouldn't happen if the edit button is only shown for completed sets,
        // but good to have a silent fail or info toast.
        // toast.info("Set is not completed, cannot edit in this way.");
    } else if (currentSet.skipped) {
         toast.error("Cannot edit a skipped set."); // Redundant check, but safe
    }
  };

  const deleteSet = (setId) => {
    if (sets.length <= 1) {
      toast.error("Cannot delete the only set.");
      return;
    }

     // Prevent deletion if *any* timer is running
     if (activeTimer !== null) {
         toast.error("Cannot delete set while a timer is active.");
         return;
     }

     // *** Add check: Don't delete if day was skipped ***
     const setToDelete = sets.find(s => s.id === setId);
     if (setToDelete?.skipped) {
         toast.error("Cannot delete sets from a skipped day/exercise.");
         return;
     }

    // ... (rest of deleteSet logic remains the same)
    const deletingSetIndex = sets.findIndex(s => s.id === setId);
    const updatedSets = sets.filter(set => set.id !== setId);
    let madeActive = false;

    const reindexedSets = updatedSets.map((set, index) => {
       const newSet = { ...set, id: index + 1, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false };
        // Try to activate next non-completed, non-skipped set
        if (!madeActive && !set.isCompleted && !set.skipped && index >= deletingSetIndex) {
             newSet.isActive = true;
             madeActive = true;
             console.log(`Set ${newSet.id} made active after deletion.`);
        } else if (!madeActive && index < deletingSetIndex) {
             if (set.isActive && !set.isCompleted && !set.skipped) {
                 newSet.isActive = true;
                 madeActive = true;
             }
        }
        return newSet;
    });

     if (!madeActive && reindexedSets.length > 0) {
        const firstIncompleteIndex = reindexedSets.findIndex(set => !set.isCompleted && !set.skipped);
        if (firstIncompleteIndex !== -1) {
            reindexedSets[firstIncompleteIndex].isActive = true;
            console.log(`Set ${reindexedSets[firstIncompleteIndex].id} made active after deletion (first incomplete/unskipped).`);
        }
     }

    setSets(reindexedSets);

  };

  const addSet = () => {
     if (activeTimer !== null) {
        toast.error("Cannot add set while timer is active.");
        return;
    }

     // *** Add check: Don't add if day was skipped ***
      if (sets.some(s => s.skipped)) {
          toast.error("Cannot add sets to a skipped day/exercise.");
          return;
      }

    // ... (rest of addSet logic remains the same)
    const newSetId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) + 1 : 1;
    const allPreviousDone = sets.every(set => set.isCompleted || set.skipped); // Should not be skipped here due to check above
    const makeActive = sets.length === 0 || allPreviousDone;

    const newSet = {
      id: newSetId,
      weight: "", reps: "", duration: "00:00:00", rest: "00:00",
      isCompleted: false, isActive: makeActive, isEditing: false,
      isDurationRunning: false, isRestRunning: false,
      date: new Date().toISOString().split('T')[0],
      exerciseId: exerciseId,
      skipped: false, // Initialize skipped flag
      skippedDates: [] // Initialize skipped dates array
    };

    const updatedSets = sets.map(set => ({ ...set, isActive: makeActive ? false : set.isActive }));
    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false);
    console.log(`Added set ${newSetId}. Active: ${makeActive}`);
  };

  const handleInputChange = (setId, field, value) => {
    setSets(prevSets =>
        prevSets.map(set => {
            // *** Add check: Don't allow input if skipped ***
            if (set.id === setId && set.skipped) {
                return set; // No changes allowed
            }

            // Allow input only if: (active or editing) AND NOT resting globally AND NOT skipped
            if (set.id === setId && (set.isActive || set.isEditing) && activeTimer !== 'rest') {
                // ... (validation logic remains the same)
                 if ((field === 'weight' || field === 'reps') && value && !/^\d*\.?\d*$/.test(value)) {
                    toast.error("Please enter only numbers for weight and reps.");
                    return set;
                 }
                return { ...set, [field]: value };
            }
            return set;
        })
    );
  };

  const getExerciseHistory = () => {
    // History function remains the same - it filters by isCompleted,
    // so skipped days/sets will naturally be excluded from this view.
    const history = [];
    // ... (rest of getExerciseHistory logic is unchanged)
    if (typeof window !== 'undefined') {
      try {
        const keys = Object.keys(localStorage);
        const pattern = `workout-\\d+-${exerciseId}`;
        const regex = new RegExp(`^${pattern}$`);

        for (const key of keys) {
             if (regex.test(key)) {
                 const currentKey = `workout-${selectedDay}-${exerciseId}`;
                 if (key === currentKey) continue;

                 try {
                     const data = JSON.parse(localStorage.getItem(key));
                     if (Array.isArray(data) && data.length > 0) {
                         // Filter for sets that are COMPLETED (not skipped)
                         const validSets = data.filter(item =>
                            item &&
                            typeof item.id !== 'undefined' &&
                            typeof item.weight !== 'undefined' && item.weight !== '' &&
                            typeof item.reps !== 'undefined' && item.reps !== '' &&
                            item.isCompleted && // Check the completed flag
                            !item.skipped // Explicitly exclude skipped sets from history
                         );
                         if (validSets.length > 0 && validSets[0]?.date) {
                             const dayMatch = key.match(/workout-(\d+)-/);
                             const dayNum = dayMatch ? dayMatch[1] : '?';
                             history.push({ date: validSets[0].date, day: `Day ${dayNum}`, sets: validSets });
                         }
                     }
                 } catch (e) { console.error("Error parsing history item:", key, e); }
             }
        }
      } catch (error) { console.error("Error accessing localStorage:", error); }
    }
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };


  const handleGoNext = () => {
    // Check needs to consider skipped state correctly
    if (checkAllSetsCompleted() && activeTimer === null) {
       // Don't auto-navigate here, goNext is for explicit exercise navigation
       goNext();
    } else if (activeTimer !== null) {
       toast.error("Complete or skip the current timer first.");
    }
     else {
      toast.error("Please complete all sets first."); // Message might need refinement if skip is considered completion
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };


  // --- RENDER ---
  return (
    <>
      {/* Header and Action Buttons */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold capitalize">{exerciseName}</h2>
          <p className="text-sm text-gray-500">Track your progress</p>
        </div>
        <div className="flex items-center gap-2">
        
            { !isAllSetsCompleted && activeTimer === null && !sets.some(s => s.skipped) && // Also hide if already skipped
                <RegularButton
                    title="Skip Exercise"
                    className="min-w-[120px] font-semibold text-white bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 disabled:cursor-not-allowed"
                    onClick={handleSkipExercise}
                    disabled={activeTimer !== null}
                    aria-disabled={activeTimer !== null}
                />
            }
            <RegularButton
                title= {showHistory ? "Hide History" : "Show History"}
                className="min-w-[120px] font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
                onClick={toggleHistory}
                // Keep disabled if timer running, history toggle might be okay though? Let's disable for consistency.
                disabled={activeTimer !== null}
                aria-disabled={activeTimer !== null}
            />
            { !sets.some(s => s.skipped) &&
        <div className="flex justify-center">
           <RegularButton title="+ Add Set" className="px-4 py-1.5 text-sm min-w-[120px]" onClick={addSet} disabled={activeTimer !== null} />
        </div>
      }
        </div>
      </div>

      {/* History Section */}
      {showHistory && (
         // ... (History section unchanged)
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
        {/* ... (thead unchanged) ... */}
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
             const isSkipped = set.skipped; // Check if the set/day was skipped
             const isThisSetDurationRunning = !isSkipped && activeTimer === 'workout' && activeSetRef.current === set.id;
             const isThisSetRestRunning = !isSkipped && activeTimer === 'rest' && activeSetRef.current === set.id;
             const isAnyRestRunning = activeTimer === 'rest';
             const isCompleted = set.isCompleted && !set.isEditing;
             const isEditable = !isSkipped && isCompleted && activeTimer === null; // Can't edit skipped or if timer running
             const isActiveNormal = !isSkipped && set.isActive && !isCompleted && !set.isEditing && !isThisSetDurationRunning;
             const isLocked = !isSkipped && !set.isActive && !isCompleted && !set.isEditing;
             const isEditing = !isSkipped && set.isEditing;

             // Input disabled if: skipped OR locked OR completed (not editing) OR resting globally (unless editing)
             const isInputDisabled = isSkipped || isLocked ||
                                    (isCompleted && !isEditing) ||
                                    (isAnyRestRunning && !isEditing);

             return (
                // Add styling for skipped rows
                <tr key={set.id} className={`${isSkipped ? "opacity-40 bg-gray-100 italic" : (isLocked || (isAnyRestRunning && !isThisSetRestRunning)) ? "opacity-50 bg-gray-50" : isEditing ? "bg-yellow-50" : "bg-white"} border transition-opacity duration-200`}>
                  {/* Set ID */}
                  <td className="p-1 font-medium text-center border">{set.id}</td>

                  {/* Weight Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="decimal" step="any"
                        className={`w-full border rounded h-10 px-1 text-center ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.weight}
                        onChange={(e) => handleInputChange(set.id, "weight", e.target.value)}
                        disabled={isInputDisabled}
                        aria-label={`Weight for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isThisSetDurationRunning ? 'text-blue-600 font-medium animate-pulse' : isSkipped ? 'text-gray-900' : 'text-gray-500'}`}>
                      {isSkipped ? `Skipped` : `Dur: ${set.duration}`}
                    </span>
                  </td>

                  {/* Reps Input */}
                  <td className="p-1 border">
                    <input
                        type="number" inputMode="numeric" pattern="\d*"
                        className={`w-full border rounded h-10 px-1 text-center ${ (isInputDisabled) ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
                        placeholder="0" value={set.reps}
                        onChange={(e) => handleInputChange(set.id, "reps", e.target.value)}
                        disabled={isInputDisabled}
                        aria-label={`Reps for set ${set.id}`}
                    />
                    <span className={`block text-[10px] text-center mt-0.5 ${isThisSetRestRunning ? 'text-orange-600 font-medium animate-pulse' : isSkipped ? 'text-gray-900' : 'text-gray-500'}`}>
                         {isSkipped ? `(${set.skippedDates[set.skippedDates.length - 1]})` : `Rest: ${set.rest}`}
                    </span>
                  </td>

                  {/* Actions Cell */}
                  <td className="p-1 text-center align-middle border">
                    <div className="flex flex-wrap items-center justify-center gap-1 text-base sm:text-lg sm:gap-2">

                        {/* State 0: Skipped */}
                        {isSkipped ? (
                             <i className="text-gray-400 fas fa-ban" title={`Skipped on ${set.skippedDates.join(', ')}`}></i>
                        ) :
                        /* State 1: Workout Timer Running for THIS set */
                        isThisSetDurationRunning ? (
                            <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700" onClick={() => completeSet(set.id)} title="Complete Set"></i>
                        ) :
                        /* State 2: Any Rest Timer Running */
                        isAnyRestRunning ? (
                             isThisSetRestRunning ? <i className="text-orange-400 fas fa-hourglass-half" title="Resting"></i> : <i className="text-gray-400 opacity-50 fas fa-hourglass-half" title="Another set resting"></i>
                        ) :
                        /* State 3: Locked */
                        isLocked ? (
                            <i className="text-gray-400 fas fa-lock" title="Complete previous set"></i>
                        ) :
                        /* State 4: Interactive States (Not Skipped/Running/Resting/Locked) */
                        (<>
                            {isEditing && (
                                <>
                                    <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700" onClick={() => startWorkout(set.id)} title="Restart Workout Timer"></i>
                                    <i className="text-green-500 cursor-pointer fas fa-check hover:text-green-700" onClick={() => completeSet(set.id)} title="Save & Complete (Skip Timer)"></i>
                                </>
                            )}
                            {isActiveNormal && (
                                <i className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700" onClick={() => startWorkout(set.id)} title="Start Workout Timer"></i>
                            )}
                            {isEditable && (
                                <i className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700" onClick={() => editSet(set.id)} title="Edit Set"></i>
                            )}
                            {(isEditing || isActiveNormal || isEditable) && (
                                <i
                                    className={`cursor-pointer fas fa-trash-alt ${sets.length <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700'}`}
                                    onClick={() => { if (sets.length > 1 && activeTimer === null && !isSkipped) deleteSet(set.id); else if (activeTimer !== null) toast.error("Cannot delete while timer is active."); else if (isSkipped) toast.error("Cannot delete skipped set."); }}
                                    title={sets.length <= 1 ? "Cannot delete last set" : activeTimer !== null ? "Cannot delete while timer active" : isSkipped ? "Cannot delete skipped set" : "Delete Set"}
                                ></i>
                            )}
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
       {/* Only show Add Set if not skipped */}
      


      {/* Rest Timer Button */}
      {activeTimer === 'rest' && (
        <RegularButton title={`Resting... (${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}) - Tap to Skip`} className="w-full mt-4 font-medium text-white bg-orange-500 hover:bg-orange-600" onClick={stopRestTimer} />
      )}

       {/* Day Action Buttons Wrapper - Finish Day Button */}
       <div className="mt-4 space-y-2">
            {/* Show Finish button if last exercise, all sets done (completed OR skipped), and no active timer */}
            {isLastExercise && isAllSetsCompleted && activeTimer === null && (
                <RegularButton title="Finish Day's Workout" className="w-full font-semibold text-white bg-green-600 hover:bg-green-700" onClick={handleWorkoutCompletion} />
            )}
       </div>


      {/* Navigation Arrows */}
      <div className="flex items-center justify-between mt-6">
        <button onClick={goPrev} className="p-3 text-xl text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed" aria-label="Previous Exercise" disabled={exerciseIndex === 0 || activeTimer !== null} > <i className="fas fa-arrow-left"></i> </button>
        <span className="text-sm text-gray-500"> Exercise {exerciseIndex + 1} of {necessaryData?.exercises?.length || 0} </span>
        {/* Disable Next button if last exercise OR not all sets done OR timer running */}
        <button onClick={handleGoNext} className={`p-3 text-xl rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed ${isLastExercise ? 'invisible' : 'text-gray-700 bg-gray-200'}`} aria-label="Next Exercise" disabled={isLastExercise || !isAllSetsCompleted || activeTimer !== null} title={!isAllSetsCompleted ? "Complete all sets to advance" : activeTimer !== null ? "Timer active" : isLastExercise ? "" : "Next Exercise"} > <i className="fas fa-arrow-right"></i> </button>
      </div>
    </>
  );
};

export default SetAndRepsForm;