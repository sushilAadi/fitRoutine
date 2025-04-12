// app/new/[plan]/SetAndRepsForm.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import RegularButton from "@/components/Button/RegularButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculateNextDay, getAllLocalStorageData, mergeWorkoutData, parseTimeToSeconds } from "@/utils";
import ConfirmationToast from "@/components/Toast/ConfirmationToast";

import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import PreviousHistory from "./PreviousHistory";
import { calculateDetailedWorkoutProgress } from "@/utils/progress";
import ProgressRealTime from "./ProgressRealTime";
import { handleStatus } from "@/service/workoutService";
// Removed unused import: import { is } from "date-fns/locale";

const SetAndRepsForm = ({
  sets: initialSets,
  selectedDay, // Numeric day number for *this* exercise
  exerciseId,
  exerciseName,
  goPrev,
  goNext,
  necessaryData, // Object containing context
  exerciseIndex,
  isLastExercise,
}) => {
  const router = useRouter();

  const {
    selectedPlanId,
    userId,
    selectedWeek,
    setSelectedDay,
    setSelectedWeek,
    dayData = [],
    weekStructure = [],
    totalWeeksCount = 0,
    allWeeksData = [],
    currentWeekIndex,
    firebaseStoredData,
    transFormedData,
    updateProgressStats,
    progressStats
  } = necessaryData || {};

  const workoutProgressKey = `workout-progress-${selectedPlanId}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId}`;
  const selectedDayKey = `selectedDayNumber_${selectedPlanId}`;
  const slideIndexKeyBase = `slideIndex-${selectedPlanId || "default"}`;
  const storageKey = `workout-${currentWeekIndex}-${selectedDay}-${exerciseId}-${selectedPlanId}`;

  const [sets, setSets] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isAllSetsCompleted, setIsAllSetsCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);
  const activeSetRef = useRef(null);
  const waitingForRestCompletion = useRef(false);
  const initialLoadComplete = useRef(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);
  // const [progressStats, setProgressStats] = useState(null);

  // --- Helper functions for Finish Day (remain the same) ---
 
  function removeLocalStorageDataByPlanId() {
    if (!selectedPlanId) return;
    for (let i = localStorage.length - 1; i >= 0; i--) {
      let key = localStorage.key(i);
      if (key && key.endsWith(selectedPlanId)) {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.error(`Error removing item ${key}:`, e);
        }
      }
    }

  }
  async function storeInDatabase() {
    const allDataToSave = getAllLocalStorageData(selectedPlanId);
    if (!userId || !selectedPlanId || Object.keys(allDataToSave).length === 0) {
      console.warn("No user/plan ID or no data in localStorage to save to DB.");
      return;
    }
    const userProgressRef = doc(db, "userWorkoutProgress", userId);
    const firestorePayload = { [selectedPlanId]: allDataToSave };
    try {
      await setDoc(userProgressRef, firestorePayload, { merge: true });

    } catch (error) {
      console.error("Error saving data to Firestore:", error);
      toast.error("Error saving workout progress.");
    }
  }

  // --- Calculate and update progress stats ---
  // const updateProgressStats = () => {
  //   if (!transFormedData) return;
    
  //   // Get all current localStorage data to include the latest changes
  //   const currentLocalData = getAllLocalStorageData(selectedPlanId);
    
  //   // Merge with Firebase data, prioritizing local changes
  //   const mergedData = { ...firebaseStoredData, ...currentLocalData };
    
  //   // Calculate progress using the existing function
  //   const progress = calculateDetailedWorkoutProgress(transFormedData, mergedData);
    
  //   setProgressStats(progress);
  // };

  // --- Effects ---

  useEffect(() => {
    setHasAutoNavigated(false);
    initialLoadComplete.current = false;
  }, [exerciseId, selectedDay, currentWeekIndex]);

  // *** MODIFIED: Load sets data prioritizing Firebase prop, then localStorage, then defaults ***
  useEffect(() => {
    const getInitialSets = () => {
      let initialData = null;
      let source = "default";

      if (firebaseStoredData && firebaseStoredData[storageKey]) {
        try {
          const dataFromFirebase = firebaseStoredData[storageKey];
          if (Array.isArray(dataFromFirebase)) {
            initialData = dataFromFirebase;
            source = "firebase";
          } else {
            console.warn(`Data for ${storageKey} in Firebase was not an array, ignoring.`);
          }
        } catch (error) {
          console.error(`Error processing Firebase data for ${storageKey}:`, error);
        }
      }

      if (initialData === null && typeof window !== "undefined") {
        try {
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData)) {
              initialData = parsedData;
              source = "localStorage";
            } else {
              localStorage.removeItem(storageKey);
            }
          }
        } catch (error) {
          console.error(`Error parsing localStorage data for ${storageKey}:`, error);
          localStorage.removeItem(storageKey);
        }
      }

      if (initialData === null) {
        initialData = Array(parseInt(initialSets) || 1)
          .fill()
          .map((_, index) => ({
            id: index + 1,
            weight: "",
            reps: "",
            duration: "00:00:00",
            rest: "00:00",
            isCompleted: false,
            isActive: index === 0, // Only first default set is active
            isEditing: false,
            isDurationRunning: false,
            isRestRunning: false,
            date: new Date().toISOString().split("T")[0],
            exerciseId: exerciseId,
            skipped: false,
            skippedDates: [],
            isDeleted: false, // Add default isDeleted flag
          }));
        source = "default";
      }

      // --- Common processing for data from any source ---
      let firstActiveSetFound = false;
      const processedData = initialData.map((set, index) => {
        const isSetCompleted = set.isCompleted || false;
        const isSetSkipped = set.skipped || false;
        const isSetDeleted = set.isDeleted || false; // Ensure isDeleted exists
        let isActive = false;

        // Make the first non-completed, non-skipped, non-deleted set active
        if (!isSetCompleted && !isSetSkipped && !isSetDeleted && !firstActiveSetFound) {
          isActive = true;
          firstActiveSetFound = true;
        }

        return {
          ...set,
          weight: set.weight ?? "",
          reps: set.reps ?? "",
          duration: set.duration ?? "00:00:00",
          rest: set.rest ?? "00:00",
          isCompleted: isSetCompleted,
          isActive: isActive, // Use calculated isActive state
          isEditing: set.isEditing || false,
          isDurationRunning: set.isDurationRunning || false,
          isRestRunning: set.isRestRunning || false,
          date: set.date || new Date().toISOString().split("T")[0],
          exerciseId: set.exerciseId || exerciseId,
          skipped: isSetSkipped,
          skippedDates: set.skippedDates || [],
          isDeleted: isSetDeleted, // Ensure flag is present
        };
      });

       // If after processing, no set is active (e.g., all loaded sets were completed/skipped/deleted)
      if (!firstActiveSetFound && processedData.length > 0 && source !== 'default') {
         const allDoneOrSkippedOrDeleted = processedData.every(s => s.isCompleted || s.skipped || s.isDeleted);
         // If not all done/skipped/deleted, maybe activate the first *available* one?
         // Let's reconsider if we need to auto-activate here. Maybe better not to.
         if (!allDoneOrSkippedOrDeleted) {
             // Find first non-completed, non-skipped, non-deleted and make it active
             const firstAvailableIndex = processedData.findIndex(s => !s.isCompleted && !s.skipped && !s.isDeleted);
             if (firstAvailableIndex !== -1) {
                 processedData[firstAvailableIndex].isActive = true;
                 firstActiveSetFound = true; // Mark that we found one
             }
         }
      } else if (!firstActiveSetFound && processedData.length > 0 && source === 'default') {
          // Ensure default sets always have an active one if available
          const firstAvailableIndex = processedData.findIndex(s => !s.isCompleted && !s.skipped && !s.isDeleted);
            if (firstAvailableIndex !== -1) {
                processedData[firstAvailableIndex].isActive = true;
            }
      }


      return processedData;
    };

    // --- Initialize and Restore Timer ---
    const initialData = getInitialSets();
    setSets(initialData);

    if (!initialLoadComplete.current && initialData.length > 0) {
      let restored = false;
      for (const set of initialData) {
        if (set.isDurationRunning && !set.skipped && !set.isDeleted) { // Check isDeleted
          setActiveTimer("workout");
          setSeconds(parseTimeToSeconds(set.duration));
          activeSetRef.current = set.id;
          waitingForRestCompletion.current = false;
          restored = true;
          break;
        }
      }
      if (!restored) {
        for (const set of initialData) {
          if (set.isRestRunning && !set.skipped && !set.isDeleted) { // Check isDeleted
            setActiveTimer("rest");
            setSeconds(parseTimeToSeconds(set.rest));
            activeSetRef.current = set.id;
            waitingForRestCompletion.current = true;
            restored = true;
            break;
          }
        }
      }
      if (!restored) {
        setActiveTimer(null);
        setSeconds(0);
        activeSetRef.current = null;
        waitingForRestCompletion.current = false;
      }
      initialLoadComplete.current = true;
    } else if (!initialLoadComplete.current) {
        initialLoadComplete.current = true;
    }

    // Check initial completion status after setting data
     const allInitiallyDone = Array.isArray(initialData) && initialData.length > 0 &&
       initialData.every(set => set.isCompleted || set.skipped || set.isDeleted); // Include isDeleted
    setIsAllSetsCompleted(allInitiallyDone);
    updateProgressStats();

  }, [
    selectedDay,
    exerciseId,
    initialSets,
    storageKey,
    currentWeekIndex,
    firebaseStoredData,
    transFormedData,
  ]);

  // Save sets data to LOCAL STORAGE
  useEffect(() => {
    if (initialLoadComplete.current && sets.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(sets));
      checkAllSetsCompleted();
      updateProgressStats();
    }
  }, [sets, storageKey]);

  // *** MODIFIED: Check completion state function ***
  const checkAllSetsCompleted = () => {
    const allDone =
      Array.isArray(sets) &&
      sets.length > 0 &&
      // A set is considered "done" if completed, skipped, OR deleted
      sets.every((set) => set.isCompleted || set.skipped || set.isDeleted) &&
      !waitingForRestCompletion.current &&
      activeTimer !== "rest";
    setIsAllSetsCompleted((prev) => (prev !== allDone ? allDone : prev));
    return allDone;
  };


  // Auto-navigation effect (no change needed, relies on isAllSetsCompleted)
  useEffect(() => {
    if (
      isAllSetsCompleted &&
      !isLastExercise &&
      !waitingForRestCompletion.current &&
      !hasAutoNavigated &&
      activeTimer === null
    ) {
      const isAnySkipped = sets.some((s) => s.skipped && !s.isDeleted); // Only consider non-deleted skipped sets for this check maybe? Or keep as is? Let's keep as is for now.
      if (!isAnySkipped) {
        const moveToNextTimeout = setTimeout(() => {
          if (
            isAllSetsCompleted &&
            !isLastExercise &&
            !waitingForRestCompletion.current &&
            !hasAutoNavigated &&
            activeTimer === null &&
            !sets.some((s) => s.skipped && !s.isDeleted) // Check again
          ) {
            setHasAutoNavigated(true);
            goNext();
          }
        }, 750);
        return () => clearTimeout(moveToNextTimeout);
      }
    }
  }, [
    isAllSetsCompleted,
    isLastExercise,
    waitingForRestCompletion.current, // Note: useRef values don't trigger effects, but logic inside uses the current value
    hasAutoNavigated,
    activeTimer,
    goNext,
    sets,
  ]);


  // Timer interval logic (no change)
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(
        () => setSeconds((prev) => prev + 1),
        1000
      );
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  // Update set duration/rest string based on 'seconds' (no change needed, checks activeSetRef)
   useEffect(() => {
    if (!activeTimer || activeSetRef.current === null) return;
    setSets((prevSets) => {
        // Find the set, ensuring it's not deleted
        const activeSetIndex = prevSets.findIndex(
            (set) => set.id === activeSetRef.current && !set.isDeleted
        );
        // If set not found, or it's skipped/deleted, stop timer and clear state
        if (activeSetIndex === -1 || prevSets[activeSetIndex].skipped || prevSets[activeSetIndex].isDeleted) {
            if (prevSets[activeSetIndex]?.skipped || prevSets[activeSetIndex]?.isDeleted) {
                setActiveTimer(null);
                setSeconds(0);
                waitingForRestCompletion.current = false;
                activeSetRef.current = null;
                // Optionally, reset the running flags on the specific set if needed
                 return prevSets.map((s, idx) => idx === activeSetIndex ? { ...s, isDurationRunning: false, isRestRunning: false } : s);
            }
            return prevSets; // Set not found, return previous state
        }

        // Format time
        const hours = Math.floor(seconds / 3600).toString().padStart(2, "0");
        const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, "0");
        const secs = (seconds % 60).toString().padStart(2, "0");

        let needsUpdate = false;
        let updatedSets = [...prevSets];
        const currentSet = updatedSets[activeSetIndex];

        if (activeTimer === "workout") {
            const newDuration = `${hours}:${minutes}:${secs}`;
            if (currentSet.duration !== newDuration || !currentSet.isDurationRunning) {
                updatedSets[activeSetIndex] = {
                    ...currentSet,
                    duration: newDuration,
                    isDurationRunning: true,
                    isRestRunning: false,
                };
                needsUpdate = true;
            }
        } else if (activeTimer === "rest") {
            const newRest = `${minutes}:${secs}`;
            if (currentSet.rest !== newRest || !currentSet.isRestRunning) {
                updatedSets[activeSetIndex] = {
                    ...currentSet,
                    rest: newRest,
                    isRestRunning: true,
                    isDurationRunning: false,
                };
                needsUpdate = true;
            }
        }

        return needsUpdate ? updatedSets : prevSets;
    });
}, [seconds, activeTimer]);


  // =========================================
  // == HANDLER FUNCTIONS ==
  // =========================================

  const startWorkout = (setId) => {
    const setIndex = sets.findIndex((set) => set.id === setId && !set.isDeleted); // Check isDeleted
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];
    if (currentSet.skipped) {
      toast.error("Cannot start timer for a skipped set.");
      return;
    }
    if (activeTimer !== null) {
      toast.error("Another timer is already running.");
      return;
    }
    if ((currentSet.isActive || currentSet.isEditing) && !currentSet.isCompleted) {
      const updatedSets = sets.map((s, index) => ({
        ...s,
        // Only update the target set if it's not deleted
        isDurationRunning: index === setIndex && !s.isDeleted,
        isRestRunning: false,
        duration: index === setIndex && !s.isDeleted ? "00:00:00" : s.duration,
        isActive: index === setIndex && !s.isDeleted, // Ensure only the non-deleted target set is active
        isEditing: false, // Stop editing when starting timer
      }));
      setSets(updatedSets);
      setActiveTimer("workout");
      setSeconds(0);
      activeSetRef.current = setId;
      waitingForRestCompletion.current = false;
    } else {
      console.warn("Condition not met to start workout", { currentSet, activeTimer });
    }
  };

  const completeSet = (setId) => {
    const setIndex = sets.findIndex((set) => set.id === setId && !set.isDeleted); // Check isDeleted
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];
    if (currentSet.skipped) {
      toast.error("Cannot complete a skipped set.");
      return;
    }
    // Allow completing even if weight/reps are empty when editing/re-completing? Let's keep validation
    if (!currentSet.weight || !currentSet.reps) {
        toast.error("Please enter weight and reps.");
        return;
    }

    if (currentSet.isEditing || (currentSet.isActive && activeTimer === "workout" && activeSetRef.current === setId)) {
      setActiveTimer("rest");
      setSeconds(0);
      waitingForRestCompletion.current = true;
      activeSetRef.current = setId; // Rest timer belongs to the set just completed

      const updatedSets = sets.map((s, index) =>
        index === setIndex && !s.isDeleted // Ensure it's the correct, non-deleted set
          ? {
              ...s,
              isCompleted: true,
              isEditing: false,
              isActive: false,
              isDurationRunning: false,
              isRestRunning: true, // Start rest timer flag
            }
          : { // Reset flags for others
              ...s,
              isDurationRunning: false,
              isRestRunning: false,
              isActive: false,
              isEditing: false,
            }
      );
      setSets(updatedSets);
      updateProgressStats()
      // Don't activate next set yet, wait for rest timer to finish/be skipped
    } else if (activeTimer === "rest") {
        toast.error("Cannot complete set while resting.");
    } else if (activeTimer === "workout" && activeSetRef.current !== setId) {
        toast.error("Workout timer running for another set.");
    } else if (!currentSet.isActive && !currentSet.isEditing) {
        toast.error("Set is not active or being edited.");
    }
  };

  const stopRestTimer = () => {
    if (activeTimer !== "rest" || activeSetRef.current === null) return;
    const lastCompletedSetId = activeSetRef.current;
    const lastCompletedSetIndex = sets.findIndex((set) => set.id === lastCompletedSetId); // No need to check isDeleted here, it wouldn't be resting if deleted

    if (lastCompletedSetIndex === -1) return;


    let nextActiveIndex = -1;
    // Find the *first* set that is NOT completed, NOT skipped, and NOT deleted
    for (let i = 0; i < sets.length; i++) {
        if (!sets[i].isCompleted && !sets[i].skipped && !sets[i].isDeleted) {
            nextActiveIndex = i;
            break;
        }
    }

    const updatedSets = sets.map((set, index) => ({
      ...set,
      isActive: index === nextActiveIndex, // Activate the next available set
      isRestRunning: false, // Stop rest timer flag for all
    }));

    setSets(updatedSets);
    setActiveTimer(null);
    setSeconds(0);
    waitingForRestCompletion.current = false;
    activeSetRef.current = null;
     // checkAllSetsCompleted(); // Let useEffect handle this
  };

  const handleFinishDay = async () => {
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot finish day while a timer is active or resting.");
      return;
    }
    // Check if all VISIBLE sets are done/skipped
    const allCurrentExerciseSetsDone = sets.filter(s => !s.isDeleted) // Only consider non-deleted sets
                                           .every(set => set.isCompleted || set.skipped);

    if (!allCurrentExerciseSetsDone) {
      console.warn("Finish Day clicked, but not all *visible* sets are marked completed/skipped for this exercise.");
      toast.error("Please ensure all sets for this exercise are completed or skipped.");
      return;
    }

    try {
        const currentWeekIdx = selectedWeek?.week;
        const currentDayNum = selectedDay;
        if (typeof currentWeekIdx !== 'number' || typeof currentDayNum !== 'number') {
            console.error("Missing current week/day context.", { currentWeekIdx, currentDayNum });
            toast.error("Could not determine current position.");
            return;
        }

        const nextStep = calculateNextDay(
            currentWeekIdx,
            currentDayNum,
            allWeeksData,
            totalWeeksCount
        );

        if (nextStep === "error") {
            toast.error("Error calculating next workout step.");
            return;
        }

        const currentDaySlideKey = `${slideIndexKeyBase}-W${currentWeekIdx}-D${currentDayNum}`;
        localStorage.removeItem(currentDaySlideKey); // Remove slide index for the completed day

        if (nextStep === null) { // Plan finished
            toast.success("Workout Plan Completed!", { duration: 4000 });
            await storeInDatabase(); // Save the final state
            removeLocalStorageDataByPlanId(); // Clean up local storage for this plan
            // Also remove progress keys
            localStorage.removeItem(workoutProgressKey);
            localStorage.removeItem(selectedWeekKey);
            localStorage.removeItem(selectedDayKey);
            router.push("/new"); // Redirect
            return;
        }

        // Plan continues
        const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } = nextStep;
        const newProgress = {
            currentWeekIndex: nextWeekIndex,
            currentDayNumber: nextDayNumber,
            weekName: nextWeekName,
            dayName: nextDayName,
        };

        // Save next step pointers to LS (they'll be read next time or saved to DB now)
        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        localStorage.setItem(selectedWeekKey, nextWeekIndex.toString());
        localStorage.setItem(selectedDayKey, nextDayNumber.toString());

        // Save current state (including next step pointers) to DB
        await storeInDatabase();

        // Clear LS *after* successful DB save (removes individual exercise keys etc)
        removeLocalStorageDataByPlanId();

        toast.success(`Day Complete! Progress saved.`, { duration: 3000 });
        router.push("/new"); // Redirect

    } catch (error) {
        console.error("Error in handleFinishDay:", error);
        toast.error("An error occurred while finishing the workout day.");
    }
};


  const handleSkipExercise = () => {
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot skip exercise while a timer is active or resting.");
      return;
    }
    // Check if any non-deleted set is already skipped
    const isAnySetSkipped = sets.some((s) => s.skipped && !s.isDeleted);
    if (isAnySetSkipped) {
      toast.error("This exercise has already been skipped.");
      return;
    }
    toast(
      (t) => (
        <ConfirmationToast
          t={t}
          message="Skip this entire exercise?"
          onConfirm={() => proceedWithSkipExercise()}
        />
      ),
      { duration: Infinity, position: "top-center" }
    );
  };

  const proceedWithSkipExercise = () => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const updatedSets = sets.map((set) => {
            // Only modify sets that are not already deleted
            if (set.isDeleted) return set;

            const dates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : [];
            if (!dates.includes(today)) dates.push(today);

            return {
                ...set,
                isCompleted: false, // Ensure not completed
                isActive: false,
                isEditing: false,
                isDurationRunning: false,
                isRestRunning: false,
                weight: set.weight || "",
                reps: set.reps || "",
                duration: set.duration || "00:00:00",
                rest: set.rest || "00:00",
                skipped: true, // Mark as skipped
                skippedDates: dates,
            };
        });

        // Save skipped state to LS immediately
        localStorage.setItem(storageKey, JSON.stringify(updatedSets));

        setSets(updatedSets);
        setActiveTimer(null); // Ensure timer is stopped
        setSeconds(0);
        waitingForRestCompletion.current = false;
        activeSetRef.current = null;
        setIsAllSetsCompleted(true); // Skipping marks all (visible) sets as "done"

        updateProgressStats()
        toast.success("Exercise Skipped.");

        // Auto-navigate if not last exercise
        if (!isLastExercise) {
            goNext();
        } else {
            // If it's the last exercise, skipping it should finish the day
             handleFinishDay(); // Call finish day handler
        }
    } catch (error) {
        console.error("Error skipping exercise:", error);
        toast.error("An error occurred while skipping the exercise.");
    }
};


  const editSet = (setId) => {
    const setIndex = sets.findIndex((set) => set.id === setId && !set.isDeleted); // Check isDeleted
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];
    if (currentSet.skipped) {
      toast.error("Cannot edit a skipped set.");
      return;
    }
    if (activeTimer !== null) {
      toast.error("Finish or skip the current timer before editing.");
      return;
    }

    // Allow editing only if the set is completed (and not deleted/skipped)
    if (currentSet.isCompleted) {
      const updatedSets = sets.map((set, index) => ({
        ...set,
        // If this is the set to edit (and not deleted)
        isEditing: index === setIndex && !set.isDeleted,
        isActive: index === setIndex && !set.isDeleted, // Make it active again
        isCompleted: index === setIndex && !set.isDeleted ? false : set.isCompleted, // Un-complete it
        // Reset timer flags for safety, although activeTimer check should prevent issues
        isDurationRunning: false,
        isRestRunning: false,
        // Ensure other sets are not active/editing
        ...(index !== setIndex && { isActive: false, isEditing: false }),
      }));
      setSets(updatedSets);
      // Reset global timer state
      setActiveTimer(null);
      setSeconds(0);
      activeSetRef.current = null; // Clear active set reference
      waitingForRestCompletion.current = false;
      setIsAllSetsCompleted(false); // Since we un-completed a set
      updateProgressStats()
    } else {
        // Maybe allow editing an active/non-completed set too?
        // Currently, only completed sets can be edited. If needed, adjust this logic.
         toast.info("Set must be completed to edit."); // Or remove this restriction
    }
  };

  // *** MODIFIED: deleteSet function ***
  const deleteSet = (setId) => {
    // Check if timer active
    if (activeTimer !== null) {
        toast.error("Cannot delete set while a timer is active.");
        return;
    }

    const setIndexToDelete = sets.findIndex((s) => s.id === setId);
    if (setIndexToDelete === -1) return; // Set not found

    const setToDelete = sets[setIndexToDelete];

    // Check if already deleted or part of skipped exercise
    if (setToDelete.isDeleted) {
        toast.error("Set already deleted.");
        return;
    }
     if (setToDelete.skipped) {
        // Although we generally hide the delete button for skipped, double check
        toast.error("Cannot delete sets from a skipped exercise.");
        return;
    }


    // Check if it's the last *visible* set
    const visibleSetsCount = sets.filter(s => !s.isDeleted).length;
    if (visibleSetsCount <= 1) {
         toast.error("Cannot delete the last visible set.");
         return;
    }

    let nextActiveSetFound = false;

    const updatedSets = sets.map((set, index) => {
        if (index === setIndexToDelete) {
            // Mark as deleted and reset state flags
            return {
                ...set,
                isDeleted: true,
                isActive: false,
                isEditing: false,
                isDurationRunning: false,
                isRestRunning: false,
                // Keep weight/reps/etc for potential future undelete or history
            };
        }
        // For other sets, just ensure isActive/isEditing is false for now
        // We will find the correct next active set below
        return {
             ...set,
             isActive: false,
             isEditing: false,
        };
    });

    // Find the first available (non-deleted, non-completed, non-skipped) set to make active
     for (let i = 0; i < updatedSets.length; i++) {
         if (!updatedSets[i].isDeleted && !updatedSets[i].isCompleted && !updatedSets[i].skipped) {
             updatedSets[i].isActive = true;
             nextActiveSetFound = true;
             break; // Found the first available one
         }
     }


    setSets(updatedSets);
    // checkAllSetsCompleted(); // Let useEffect handle this based on `sets` change
    toast.success("Set marked for deletion.");
    updateProgressStats()

    // Ensure timer state is definitely cleared if the deleted set was somehow involved
    if (activeSetRef.current === setId) {
        setActiveTimer(null);
        setSeconds(0);
        activeSetRef.current = null;
        waitingForRestCompletion.current = false;
    }
  };


  const addSet = () => {
    if (activeTimer !== null) {
      toast.error("Cannot add set while timer is active.");
      return;
    }
    // Check if exercise is skipped (based on non-deleted sets)
    if (sets.some((s) => s.skipped && !s.isDeleted)) {
      toast.error("Cannot add sets to a skipped exercise.");
      return;
    }

    // Find the highest existing ID (including deleted ones) to ensure uniqueness
    const newSetId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) + 1 : 1;

    // Determine if the new set should be active:
    // It should be active if all *visible* existing sets are completed or skipped.
    const allVisibleSetsDone = sets
                                .filter(s => !s.isDeleted) // Only consider visible sets
                                .every(set => set.isCompleted || set.skipped);
    const makeActive = sets.filter(s => !s.isDeleted).length === 0 || allVisibleSetsDone;

    const newSet = {
      id: newSetId,
      weight: "",
      reps: "",
      duration: "00:00:00",
      rest: "00:00",
      isCompleted: false,
      isActive: makeActive, // Set isActive based on calculation
      isEditing: false,
      isDurationRunning: false,
      isRestRunning: false,
      date: new Date().toISOString().split("T")[0],
      exerciseId: exerciseId,
      skipped: false,
      skippedDates: [],
      isDeleted: false, // New sets are not deleted
      isNewSet: true, // Keep this flag if useful elsewhere
    };

    // Deactivate other sets only if the new one is being made active
    const updatedSets = sets.map((set) => ({
        ...set,
        isActive: makeActive ? false : set.isActive, // Deactivate others if new one is active
    }));

    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false); // Adding a set makes it incomplete
    updateProgressStats()
  };

  const handleInputChange = (setId, field, value) => {
    setSets((prevSets) =>
      prevSets.map((set) => {
        if (set.id === setId) {
          // Cannot edit deleted or skipped sets through input
          if (set.isDeleted || set.skipped) return set;

          // Can edit if it's the active set OR being explicitly edited,
          // AND it's not currently in the rest phase (unless editing)
          if ((set.isActive || set.isEditing) && !(activeTimer === "rest" && !set.isEditing)) {
             // Input validation for weight/reps
            if ((field === "weight" || field === "reps") && value && !/^\d*\.?\d*$/.test(value)) {
              toast.error("Please enter only numbers.");
              return set; // Return original set on validation failure
            }
            return { ...set, [field]: value };
          }
        }
        return set; // Return unchanged set if conditions not met
      })
    );
  };

  const handleGoNext = () => {
     // Use the check function which now includes isDeleted check
    if (checkAllSetsCompleted() && activeTimer === null) {
      goNext();
    } else if (activeTimer !== null) {
      toast.error("Complete or stop the current timer first.");
    } else {
      toast.error("Please complete all sets for this exercise first.");
    }
  };

  const toggleHistory = () => setShowHistory(!showHistory);

  // --- RENDER ---
  const isAnySetSkipped = sets.some((s) => s.skipped && !s.isDeleted); // Check non-deleted skipped sets
  const visibleSets = sets.filter(set => !set.isDeleted); // Filter for rendering

 


  return (
    <>
      {/* Header and Action Buttons */}
      
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-lg font-semibold capitalize">{exerciseName}</h3>
          <p className="text-xs text-gray-500">
            Track your sets, reps, and weight
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isAnySetSkipped && activeTimer === null && (
            <RegularButton
              Icon={<i className="mr-1 text-xs fas fa-forward"></i>}
              title="Skip Exercise"
              className="px-2 py-1 text-xs text-white bg-yellow-600 min-w-[100px] hover:bg-yellow-700 disabled:bg-yellow-300"
              onClick={handleSkipExercise}
              disabled={activeTimer !== null}
            />
          )}
          <RegularButton
            Icon={<i className="mr-1 text-xs fas fa-history"></i>}
            title={showHistory ? "Hide History" : "Show History"}
            className="px-2 py-1 text-xs min-w-[100px]"
            onClick={toggleHistory}
            disabled={activeTimer !== null}
            aria-disabled={activeTimer !== null}
          />
          {!isAnySetSkipped && (
            <RegularButton
              Icon={<i className="mr-1 text-xs fas fa-plus"></i>}
              title="+ Add Set"
              className="px-2 py-1 text-xs min-w-[90px]"
              onClick={addSet}
              disabled={activeTimer !== null || isAnySetSkipped} // Also disable if exercise skipped
              aria-disabled={activeTimer !== null || isAnySetSkipped}
            />
          )}
        </div>
      </div>
      {/* History Section */}
      {showHistory && (
        <PreviousHistory exerciseId={exerciseId} firebaseStoredData={firebaseStoredData}/>
      )}
      {/* Sets Table */}
      <table className="w-full mb-4 border-collapse table-fixed">
        <thead>
          <tr className="bg-gray-100">
            <th className="w-10 p-1 text-xs font-semibold text-center text-gray-600 border md:w-12">
              Set
            </th>
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">
              Weight (kg)
            </th>
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">
              Reps
            </th>
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {/* *** MODIFIED: Filter out deleted sets before mapping *** */}
          {visibleSets.map((set, displayIndex) => { // Use filtered array and get displayIndex
            // isDeleted check is no longer needed inside the loop as we filtered above
            const isSkipped = set.skipped;
            const isThisSetDurationRunning =
              !isSkipped &&
              activeTimer === "workout" &&
              activeSetRef.current === set.id;
            const isThisSetRestRunning =
              !isSkipped &&
              activeTimer === "rest" &&
              activeSetRef.current === set.id;
            const isAnyRestRunning = activeTimer === "rest";
            const isCompletedNotEditing =
              !isSkipped && set.isCompleted && !set.isEditing;
             // Can edit completed sets if no timer is running
            const isEditable =
               !isSkipped && isCompletedNotEditing && activeTimer === null;
            const isActiveOrEditing =
              !isSkipped && (set.isActive || set.isEditing) && !set.isCompleted;
            // Locked if not active, not completed, not editing, and no rest timer running globally
            const isLocked =
              !isSkipped &&
              !set.isActive &&
              !set.isCompleted &&
              !set.isEditing &&
              !isAnyRestRunning;
             // Input disabled if skipped, locked, completed+notEditing, or any rest timer running (unless explicitly editing)
            const isInputDisabled =
              isSkipped ||
              isLocked ||
              isCompletedNotEditing ||
              (isAnyRestRunning && !set.isEditing); // Allow input if editing during rest

             // Determine row class based on state
            const rowClass = isSkipped
              ? "opacity-40 bg-gray-100 italic" // Skipped style
              : isLocked
              ? "opacity-60 bg-gray-50" // Locked style
              : isAnyRestRunning && !isThisSetRestRunning && !set.isEditing // Dim if another set is resting (and this one isn't being edited)
              ? "opacity-70 bg-gray-50"
              : set.isEditing
              ? "bg-yellow-50" // Editing style
              : "bg-white"; // Default style

            return (
              // Use the stable `set.id` as the key
              <tr
                key={set.id}
                className={`${rowClass} border transition-opacity duration-200 text-sm`}
              >
                 {/* Use displayIndex + 1 for the visual set number */}
                <td className="p-1 font-medium text-center border">{displayIndex + 1}</td>
                <td className="p-1 border">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    className={`w-full border rounded h-9 px-1 text-center text-sm ${
                      isInputDisabled
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                    }`}
                    placeholder="0"
                    value={set.weight}
                    onChange={(e) =>
                      handleInputChange(set.id, "weight", e.target.value)
                    }
                    disabled={isInputDisabled}
                    aria-label={`Weight for set ${displayIndex + 1}`}
                  />
                  <span
                    className={`block text-[10px] text-center mt-0.5 ${
                      isThisSetDurationRunning
                        ? "text-blue-600 font-medium animate-pulse"
                        : isSkipped
                        ? "text-gray-900" // Keep skipped text normal color
                        : "text-gray-500"
                    }`}
                  >
                    {isSkipped ? `Skipped` : `Dur: ${set.duration}`}
                  </span>
                </td>
                <td className="p-1 border">
                  <input
                    type="number"
                    inputMode="numeric"
                    pattern="\d*"
                    className={`w-full border rounded h-9 px-1 text-center text-sm ${
                      isInputDisabled
                        ? "bg-gray-100 cursor-not-allowed"
                        : "bg-white"
                    }`}
                    placeholder="0"
                    value={set.reps}
                    onChange={(e) =>
                      handleInputChange(set.id, "reps", e.target.value)
                    }
                    disabled={isInputDisabled}
                    aria-label={`Reps for set ${displayIndex + 1}`}
                  />
                  <span
                    className={`block text-[10px] text-center mt-0.5 ${
                      isThisSetRestRunning
                        ? "text-orange-600 font-medium animate-pulse"
                        : isSkipped
                        ? "text-gray-900" // Keep skipped text normal color
                        : "text-gray-500"
                    }`}
                  >
                    {isSkipped
                      // Show last skipped date if available
                      ? `(${set.skippedDates?.[set.skippedDates.length - 1] || 'Skipped'})`
                      : `Rest: ${set.rest}`}
                  </span>
                </td>
                <td className="p-1 text-center align-middle border">
                  <div className="flex flex-wrap items-center justify-center gap-1 text-base md:gap-2">
                    {/* Actions based on set state */}
                    {isSkipped ? (
                       // Show ban icon for skipped sets
                      <i
                        className="text-gray-400 fas fa-ban"
                        title={`Skipped on ${set.skippedDates?.join(", ") || ''}`}
                      ></i>
                    ) : isThisSetDurationRunning ? (
                       // Show check mark to complete running workout timer
                      <i
                        className="text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                        onClick={() => completeSet(set.id)}
                        title="Complete Set"
                      ></i>
                    ) : isAnyRestRunning ? (
                      // Show hourglass if resting
                      isThisSetRestRunning ? (
                         // Pulsing hourglass for the set currently resting
                        <i
                          className="text-orange-400 fas fa-hourglass-half animate-pulse"
                          title="Resting"
                        ></i>
                      ) : (
                         // Dimmed hourglass if another set is resting
                        <i
                          className="text-gray-400 opacity-50 fas fa-hourglass-half"
                          title="Another set resting"
                        ></i>
                      )
                    ) : isLocked ? (
                       // Show lock icon if previous set needs completion
                      <i
                        className="text-gray-400 fas fa-lock"
                        title="Complete previous set"
                      ></i>
                    ) : (
                       // Actions for non-running, non-locked states
                      <>
                        {set.isEditing && (
                           // Actions when editing a set
                          <>
                            {/* Restart timer */}
                            <i
                              className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                              onClick={() => startWorkout(set.id)}
                              title="Restart Workout Timer"
                            ></i>
                             {/* Save & Complete (Skip Timer) */}
                            <i
                              className="mx-3 text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                              onClick={() => completeSet(set.id)}
                              title="Save & Complete (Skip Timer)"
                            ></i>
                          </>
                        )}
                         {/* Show Play button only if Active, not Editing, and not Completed */}
                        {set.isActive && !set.isEditing && !set.isCompleted && (
                          <i
                            className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                            onClick={() => startWorkout(set.id)}
                            title="Start Workout Timer"
                          ></i>
                        )}
                        {/* Show Edit button only if Completed, not Editing, no timer running */}
                        {isEditable && (
                          <i
                            className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700"
                            onClick={() => editSet(set.id)}
                            title="Edit Set"
                          ></i>
                        )}
                        {/* *** MODIFIED: Delete Button Logic *** */}
                        {/* Show Delete button if:
                            - Set is Editing OR (Active and not Editing) OR Editable (Completed+NoTimer)
                            - AND Set is NOT Completed (allow deleting active/editing sets)
                            - AND Set is NOT Skipped
                            - AND Global Timer is null */}
                        {(set.isEditing || (set.isActive && !set.isEditing) || isEditable) &&
                         !set.isCompleted && // Can delete active/editing/editable sets BEFORE completion
                         !isSkipped &&
                         activeTimer === null && (
                            <i
                                className={`cursor-pointer fas fa-trash-alt ${
                                // Disable if it's the last VISIBLE set
                                visibleSets.length <= 1
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-red-500 hover:text-red-700"
                                }`}
                                onClick={() => {
                                // Re-check conditions just before calling deleteSet
                                if (visibleSets.length > 1 && activeTimer === null && !isSkipped) {
                                    deleteSet(set.id); // Call the updated soft delete function
                                } else if (visibleSets.length <= 1) {
                                    toast.error("Cannot delete the last visible set.");
                                }
                                // activeTimer check is redundant due to outer condition, but safe
                                // isSkipped check is redundant due to outer condition, but safe
                                }}
                                title={
                                visibleSets.length <= 1
                                    ? "Cannot delete last visible set"
                                    : "Delete Set" // Simplified title as other conditions are implicitly met
                                }
                            ></i>
                        )}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {/* Rest Timer Button */}
      {activeTimer === "rest" && (
        <RegularButton
          title={`Resting... (${Math.floor(seconds / 60)
            .toString()
            .padStart(2, "0")}:${(seconds % 60)
            .toString()
            .padStart(2, "0")}) - Tap to Skip Rest`}
          className="w-full mt-4 font-medium text-white bg-orange-500 hover:bg-orange-600"
          onClick={stopRestTimer}
        />
      )}
      {/* Finish Day Button */}
      <div className="mt-4">
        {isLastExercise && isAllSetsCompleted && activeTimer === null && (
          <RegularButton
            title="Finish Day's Workout"
            className="w-full font-semibold text-white bg-green-600 hover:bg-green-700"
            onClick={()=>{handleFinishDay();handleStatus(selectedPlanId,progressStats)}}
          />
        )}
      </div>
      {/* Navigation Arrows */}
      <div className="flex items-center justify-between my-6">
        <button
          onClick={goPrev}
          className="flex items-center justify-center p-2 text-lg text-gray-700 bg-gray-200 rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed aspect-square w-9 h-9"
          aria-label="Previous Exercise"
          disabled={exerciseIndex === 0 || activeTimer !== null}
          title={
            exerciseIndex === 0
              ? ""
              : activeTimer !== null
              ? "Timer active"
              : "Previous Exercise"
          }
        >
          <i className="fas fa-arrow-left"></i>
        </button>

        {!isLastExercise && (
          <button
            onClick={handleGoNext}
            className={`p-2 text-lg rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed aspect-square flex items-center justify-center w-9 h-9 ${
               "text-gray-700 bg-gray-200" // Keep visible even if disabled
            }`}
            aria-label="Next Exercise"
            // Disable if last exercise, or not all sets completed, or timer active
            disabled={ isLastExercise || !isAllSetsCompleted || activeTimer !== null }
            title={
              !isAllSetsCompleted
                ? "Complete all sets to advance"
                : activeTimer !== null
                ? "Timer active"
                : isLastExercise // Should be disabled if last, so no title needed
                ? ""
                : "Next Exercise"
            }
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        )}
         {/* Placeholder for alignment when it's the last exercise */}
        {isLastExercise && <div className="w-9 h-9"></div>}
      </div>
      
    </>
  );
};

export default SetAndRepsForm;