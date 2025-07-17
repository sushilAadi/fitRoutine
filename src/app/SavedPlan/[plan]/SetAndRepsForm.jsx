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
  // Add active timer storage key
  const activeTimerKey = `activeTimer-${selectedPlanId}-${currentWeekIndex}-${selectedDay}`;

  const [sets, setSets] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isAllSetsCompleted, setIsAllSetsCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  // *** NEW STATE: Track completion status for entire day ***
  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [incompleteExercises, setIncompleteExercises] = useState([]);
  
  const timerRef = useRef(null);
  const activeSetRef = useRef(null);
  const waitingForRestCompletion = useRef(false);
  const initialLoadComplete = useRef(false);
  const [hasAutoNavigated, setHasAutoNavigated] = useState(false);

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

  // *** NEW FUNCTION: Check if entire day is completed ***
  const checkDayCompletion = () => {
    if (!transFormedData?.weeksExercise || !selectedWeek) return false;

    const currentWeekData = transFormedData.weeksExercise.find(w => w.week === selectedWeek.week);
    if (!currentWeekData) return false;

    const currentDayData = currentWeekData.days.find(d => d.day === selectedDay);
    if (!currentDayData || !currentDayData.exercises) return false;

    const allExercisesForDay = currentDayData.exercises.filter(
      (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
    );

    const incomplete = [];
    let allDayExercisesComplete = true;

    // Check each exercise's completion status
    for (const exercise of allExercisesForDay) {
      const exerciseId = exercise.id || `${selectedDay}-${allExercisesForDay.indexOf(exercise)}`;
      const storageKey = `workout-${currentWeekIndex}-${selectedDay}-${exerciseId}-${selectedPlanId}`;
      
      let exerciseComplete = false;
      
      // Check Firebase data first, then localStorage
      let exerciseData = null;
      if (firebaseStoredData && firebaseStoredData[storageKey]) {
        exerciseData = firebaseStoredData[storageKey];
      } else if (typeof window !== "undefined") {
        try {
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            exerciseData = JSON.parse(savedData);
          }
        } catch (error) {
          console.error(`Error parsing data for ${storageKey}:`, error);
        }
      }

      if (exerciseData && Array.isArray(exerciseData) && exerciseData.length > 0) {
        // Check if all visible sets are completed or skipped
        const visibleSets = exerciseData.filter(set => !set.isDeleted);
        exerciseComplete = visibleSets.length > 0 && visibleSets.every(set => set.isCompleted || set.skipped);
      }

      if (!exerciseComplete) {
        incomplete.push({
          name: exercise.name,
          exerciseId: exerciseId,
          index: allExercisesForDay.indexOf(exercise)
        });
        allDayExercisesComplete = false;
      }
    }

    setIsDayCompleted(allDayExercisesComplete);
    setIncompleteExercises(incomplete);
    
    return allDayExercisesComplete;
  };

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
            isActive: index === 0,
            isEditing: false,
            isDurationRunning: false,
            isRestRunning: false,
            date: new Date().toISOString().split("T")[0],
            exerciseId: exerciseId,
            skipped: false,
            skippedDates: [],
            isDeleted: false,
          }));
        source = "default";
      }

      // --- Common processing for data from any source ---
      let firstActiveSetFound = false;
      const processedData = initialData.map((set, index) => {
        const isSetCompleted = set.isCompleted || false;
        const isSetSkipped = set.skipped || false;
        const isSetDeleted = set.isDeleted || false;
        let isActive = false;

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
          isActive: isActive,
          isEditing: set.isEditing || false,
          isDurationRunning: set.isDurationRunning || false,
          isRestRunning: set.isRestRunning || false,
          date: set.date || new Date().toISOString().split("T")[0],
          exerciseId: set.exerciseId || exerciseId,
          skipped: isSetSkipped,
          skippedDates: set.skippedDates || [],
          isDeleted: isSetDeleted,
        };
      });

      if (!firstActiveSetFound && processedData.length > 0 && source !== 'default') {
         const allDoneOrSkippedOrDeleted = processedData.every(s => s.isCompleted || s.skipped || s.isDeleted);
         if (!allDoneOrSkippedOrDeleted) {
             const firstAvailableIndex = processedData.findIndex(s => !s.isCompleted && !s.skipped && !s.isDeleted);
             if (firstAvailableIndex !== -1) {
                 processedData[firstAvailableIndex].isActive = true;
                 firstActiveSetFound = true;
             }
         }
      } else if (!firstActiveSetFound && processedData.length > 0 && source === 'default') {
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

    // ADDED: Check for active timer info in localStorage
    const savedTimerInfo = localStorage.getItem(activeTimerKey);
    if (savedTimerInfo) {
      try {
        const timerInfo = JSON.parse(savedTimerInfo);
        if (timerInfo.exerciseId === exerciseId) {
          // This is the correct exercise, restore timer
          if (!initialLoadComplete.current && initialData.length > 0) {
            let restored = false;
            for (const set of initialData) {
              if (set.isDurationRunning && !set.skipped && !set.isDeleted) {
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
                if (set.isRestRunning && !set.skipped && !set.isDeleted) {
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
              localStorage.removeItem(activeTimerKey);
            }
            initialLoadComplete.current = true;
          } else if (!initialLoadComplete.current) {
            initialLoadComplete.current = true;
          }
        } else {
          // Different exercise, clear timer info
          localStorage.removeItem(activeTimerKey);
          setActiveTimer(null);
          setSeconds(0);
          activeSetRef.current = null;
          waitingForRestCompletion.current = false;
          initialLoadComplete.current = true;
        }
      } catch (error) {
        console.error("Error restoring timer info:", error);
        localStorage.removeItem(activeTimerKey);
        initialLoadComplete.current = true;
      }
    } else {
      // No saved timer info, proceed with normal initialization
      if (!initialLoadComplete.current && initialData.length > 0) {
        let restored = false;
        for (const set of initialData) {
          if (set.isDurationRunning && !set.skipped && !set.isDeleted) {
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
            if (set.isRestRunning && !set.skipped && !set.isDeleted) {
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
    }

    const allInitiallyDone = Array.isArray(initialData) && initialData.length > 0 &&
       initialData.every(set => set.isCompleted || set.skipped || set.isDeleted);
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
    activeTimerKey,
  ]);

  // Save timer state when it changes
  useEffect(() => {
    if (activeTimer && activeSetRef.current !== null) {
      const timerInfo = {
        exerciseId: exerciseId,
        timerType: activeTimer,
        setId: activeSetRef.current,
        timestamp: Date.now()
      };
      localStorage.setItem(activeTimerKey, JSON.stringify(timerInfo));
    } else {
      localStorage.removeItem(activeTimerKey);
    }
  }, [activeTimer, exerciseId, activeTimerKey]);

  // Save sets data to LOCAL STORAGE and check day completion
  useEffect(() => {
    if (initialLoadComplete.current && sets.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(sets));
      checkAllSetsCompleted();
      updateProgressStats();
      // *** CHECK DAY COMPLETION WHENEVER SETS CHANGE ***
      checkDayCompletion();
    }
  }, [sets, storageKey]);

  // *** FIXED: Enhanced effect for checking day completion ***
  useEffect(() => {
    // Check day completion immediately when component mounts or key data changes
    const checkCompletion = () => {
      checkDayCompletion();
    };
    
    checkCompletion();
    
    // Also check when localStorage changes (for cross-tab updates)
    const handleStorageChange = (e) => {
      if (e.key && e.key.includes(selectedPlanId)) {
        checkCompletion();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Check completion after a small delay to ensure all data is loaded
    const timeoutId = setTimeout(checkCompletion, 100);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearTimeout(timeoutId);
    };
  }, [
    firebaseStoredData, 
    selectedDay, 
    selectedWeek, 
    currentWeekIndex, 
    transFormedData,
    exerciseId, // Add exerciseId to dependencies
    isLastExercise // Add isLastExercise to dependencies
  ]);

  // *** NEW: Add focus event listener to recheck when tab/window regains focus ***
  useEffect(() => {
    const handleFocus = () => {
      if (isLastExercise) {
        checkDayCompletion();
      }
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [isLastExercise]);

  // *** MODIFIED: Check completion state function ***
  const checkAllSetsCompleted = () => {
    const allDone =
      Array.isArray(sets) &&
      sets.length > 0 &&
      sets.every((set) => set.isCompleted || set.skipped || set.isDeleted) &&
      !waitingForRestCompletion.current &&
      activeTimer !== "rest";
    setIsAllSetsCompleted((prev) => (prev !== allDone ? allDone : prev));
    return allDone;
  };

  // FIXED: Auto-navigation effect - prevent navigation when timer is active
  useEffect(() => {
    if (
      isAllSetsCompleted &&
      !isLastExercise &&
      !waitingForRestCompletion.current &&
      !hasAutoNavigated &&
      activeTimer === null && // Ensure no timer is active
      initialLoadComplete.current // Ensure initial load is complete
    ) {
      const isAnySkipped = sets.some((s) => s.skipped && !s.isDeleted);
      if (!isAnySkipped) {
        const moveToNextTimeout = setTimeout(() => {
          if (
            isAllSetsCompleted &&
            !isLastExercise &&
            !waitingForRestCompletion.current &&
            !hasAutoNavigated &&
            activeTimer === null &&
            !sets.some((s) => s.skipped && !s.isDeleted)
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
    waitingForRestCompletion.current,
    hasAutoNavigated,
    activeTimer,
    goNext,
    sets,
    initialLoadComplete.current,
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
        const activeSetIndex = prevSets.findIndex(
            (set) => set.id === activeSetRef.current && !set.isDeleted
        );
        if (activeSetIndex === -1 || prevSets[activeSetIndex].skipped || prevSets[activeSetIndex].isDeleted) {
            if (prevSets[activeSetIndex]?.skipped || prevSets[activeSetIndex]?.isDeleted) {
                setActiveTimer(null);
                setSeconds(0);
                waitingForRestCompletion.current = false;
                activeSetRef.current = null;
                 return prevSets.map((s, idx) => idx === activeSetIndex ? { ...s, isDurationRunning: false, isRestRunning: false } : s);
            }
            return prevSets;
        }

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
    const setIndex = sets.findIndex((set) => set.id === setId && !set.isDeleted);
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
        isDurationRunning: index === setIndex && !s.isDeleted,
        isRestRunning: false,
        duration: index === setIndex && !s.isDeleted ? "00:00:00" : s.duration,
        isActive: index === setIndex && !s.isDeleted,
        isEditing: false,
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

  // *** FIXED: completeSet with storage event dispatch ***
  const completeSet = (setId) => {
    const setIndex = sets.findIndex((set) => set.id === setId && !set.isDeleted);
    if (setIndex === -1) return;
    const currentSet = sets[setIndex];
    if (currentSet.skipped) {
      toast.error("Cannot complete a skipped set.");
      return;
    }
    if (!currentSet.weight || !currentSet.reps) {
        toast.error("Please enter weight and reps.");
        return;
    }

    if (currentSet.isEditing || (currentSet.isActive && activeTimer === "workout" && activeSetRef.current === setId)) {
      setActiveTimer("rest");
      setSeconds(0);
      waitingForRestCompletion.current = true;
      activeSetRef.current = setId;

      const updatedSets = sets.map((s, index) =>
        index === setIndex && !s.isDeleted
          ? {
              ...s,
              isCompleted: true,
              isEditing: false,
              isActive: false,
              isDurationRunning: false,
              isRestRunning: true,
            }
          : {
              ...s,
              isDurationRunning: false,
              isRestRunning: false,
              isActive: false,
              isEditing: false,
            }
      );
      setSets(updatedSets);
      updateProgressStats();
      
      // Dispatch storage event to notify other components
      window.dispatchEvent(new StorageEvent('storage', {
        key: storageKey,
        newValue: JSON.stringify(updatedSets),
        url: window.location.href
      }));
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
    const lastCompletedSetIndex = sets.findIndex((set) => set.id === lastCompletedSetId);

    if (lastCompletedSetIndex === -1) return;

    let nextActiveIndex = -1;
    for (let i = 0; i < sets.length; i++) {
        if (!sets[i].isCompleted && !sets[i].skipped && !sets[i].isDeleted) {
            nextActiveIndex = i;
            break;
        }
    }

    const updatedSets = sets.map((set, index) => ({
      ...set,
      isActive: index === nextActiveIndex,
      isRestRunning: false,
    }));

    setSets(updatedSets);
    setActiveTimer(null);
    setSeconds(0);
    waitingForRestCompletion.current = false;
    activeSetRef.current = null;
  };

  // *** MODIFIED: handleFinishDay with better validation ***
  const handleFinishDay = async () => {
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot finish day while a timer is active or resting.");
      return;
    }

    // *** ENHANCED VALIDATION: Check if entire day is completed ***
    const dayComplete = checkDayCompletion();
    
    if (!dayComplete) {
      // Show specific incomplete exercises
      const incompleteList = incompleteExercises.map(ex => ex.name).join(", ");
      toast.error(`Cannot finish day. Incomplete exercises: ${incompleteList}`, {
        duration: 5000,
      });
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
        localStorage.removeItem(currentDaySlideKey);

        if (nextStep === null) {
            toast.success("Workout Plan Completed!", { duration: 4000 });
            await storeInDatabase();
            removeLocalStorageDataByPlanId();
            localStorage.removeItem(workoutProgressKey);
            localStorage.removeItem(selectedWeekKey);
            localStorage.removeItem(selectedDayKey);
            router.push("/SavedPlan");
            return;
        }

        const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } = nextStep;
        const newProgress = {
            currentWeekIndex: nextWeekIndex,
            currentDayNumber: nextDayNumber,
            weekName: nextWeekName,
            dayName: nextDayName,
        };

        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        localStorage.setItem(selectedWeekKey, nextWeekIndex.toString());
        localStorage.setItem(selectedDayKey, nextDayNumber.toString());

        await storeInDatabase();
        removeLocalStorageDataByPlanId();

        toast.success(`Day Complete! Progress saved.`, { duration: 3000 });
        router.push("/SavedPlan");

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

  // *** FIXED: proceedWithSkipExercise with immediate updates ***
  const proceedWithSkipExercise = () => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const updatedSets = sets.map((set) => {
            if (set.isDeleted) return set;

            const dates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : [];
            if (!dates.includes(today)) dates.push(today);

            return {
                ...set,
                isCompleted: false,
                isActive: false,
                isEditing: false,
                isDurationRunning: false,
                isRestRunning: false,
                weight: set.weight || "",
                reps: set.reps || "",
                duration: set.duration || "00:00:00",
                rest: set.rest || "00:00",
                skipped: true,
                skippedDates: dates,
            };
        });

        localStorage.setItem(storageKey, JSON.stringify(updatedSets));

        setSets(updatedSets);
        setActiveTimer(null);
        setSeconds(0);
        waitingForRestCompletion.current = false;
        activeSetRef.current = null;
        setIsAllSetsCompleted(true);

        updateProgressStats();
        
        // Force immediate day completion check
        checkDayCompletion();
        
        // Also trigger a storage event to update other components
        window.dispatchEvent(new StorageEvent('storage', {
          key: storageKey,
          newValue: JSON.stringify(updatedSets),
          url: window.location.href
        }));
        
        toast.success("Exercise Skipped.");

        if (!isLastExercise) {
            goNext();
        }
    } catch (error) {
        console.error("Error skipping exercise:", error);
        toast.error("An error occurred while skipping the exercise.");
    }
  };

  const editSet = (setId) => {
    const setIndex = sets.findIndex((set) => set.id === setId && !set.isDeleted);
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

    if (currentSet.isCompleted) {
      const updatedSets = sets.map((set, index) => ({
        ...set,
        isEditing: index === setIndex && !set.isDeleted,
        isActive: index === setIndex && !set.isDeleted,
        isCompleted: index === setIndex && !set.isDeleted ? false : set.isCompleted,
        isDurationRunning: false,
        isRestRunning: false,
        ...(index !== setIndex && { isActive: false, isEditing: false }),
      }));
      setSets(updatedSets);
      setActiveTimer(null);
      setSeconds(0);
      activeSetRef.current = null;
      waitingForRestCompletion.current = false;
      setIsAllSetsCompleted(false);
      updateProgressStats()
    } else {
         toast.info("Set must be completed to edit.");
    }
  };

  const deleteSet = (setId) => {
    if (activeTimer !== null) {
        toast.error("Cannot delete set while a timer is active.");
        return;
    }

    const setIndexToDelete = sets.findIndex((s) => s.id === setId);
    if (setIndexToDelete === -1) return;

    const setToDelete = sets[setIndexToDelete];

    if (setToDelete.isDeleted) {
        toast.error("Set already deleted.");
        return;
    }
     if (setToDelete.skipped) {
        toast.error("Cannot delete sets from a skipped exercise.");
        return;
    }

    const visibleSetsCount = sets.filter(s => !s.isDeleted).length;
    if (visibleSetsCount <= 1) {
         toast.error("Cannot delete the last visible set.");
         return;
    }

    let nextActiveSetFound = false;

    const updatedSets = sets.map((set, index) => {
        if (index === setIndexToDelete) {
            return {
                ...set,
                isDeleted: true,
                isActive: false,
                isEditing: false,
                isDurationRunning: false,
                isRestRunning: false,
            };
        }
        return {
             ...set,
             isActive: false,
             isEditing: false,
        };
    });

     for (let i = 0; i < updatedSets.length; i++) {
         if (!updatedSets[i].isDeleted && !updatedSets[i].isCompleted && !updatedSets[i].skipped) {
             updatedSets[i].isActive = true;
             nextActiveSetFound = true;
             break;
         }
     }

    setSets(updatedSets);
    toast.success("Set marked for deletion.");
    updateProgressStats()

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
    if (sets.some((s) => s.skipped && !s.isDeleted)) {
      toast.error("Cannot add sets to a skipped exercise.");
      return;
    }

    const newSetId = sets.length > 0 ? Math.max(...sets.map(s => s.id)) + 1 : 1;

    const allVisibleSetsDone = sets
                                .filter(s => !s.isDeleted)
                                .every(set => set.isCompleted || set.skipped);
    const makeActive = sets.filter(s => !s.isDeleted).length === 0 || allVisibleSetsDone;

    const newSet = {
      id: newSetId,
      weight: "",
      reps: "",
      duration: "00:00:00",
      rest: "00:00",
      isCompleted: false,
      isActive: makeActive,
      isEditing: false,
      isDurationRunning: false,
      isRestRunning: false,
      date: new Date().toISOString().split("T")[0],
      exerciseId: exerciseId,
      skipped: false,
      skippedDates: [],
      isDeleted: false,
      isNewSet: true,
    };

    const updatedSets = sets.map((set) => ({
        ...set,
        isActive: makeActive ? false : set.isActive,
    }));

    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false);
    updateProgressStats()
  };

  const handleInputChange = (setId, field, value) => {
    setSets((prevSets) =>
      prevSets.map((set) => {
        if (set.id === setId) {
          if (set.isDeleted || set.skipped) return set;

          if ((set.isActive || set.isEditing) && !(activeTimer === "rest" && !set.isEditing)) {
            if ((field === "weight" || field === "reps") && value && !/^\d*\.?\d*$/.test(value)) {
              toast.error("Please enter only numbers.");
              return set;
            }
            return { ...set, [field]: value };
          }
        }
        return set;
      })
    );
  };

  const handleGoNext = () => {
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
  const isAnySetSkipped = sets.some((s) => s.skipped && !s.isDeleted);
  const visibleSets = sets.filter(set => !set.isDeleted);

  // FIXED: Better logic for showing warnings
  const shouldShowIncompleteWarning = () => {
    if (!isLastExercise) return false;
    
    // Check if all visible sets for current exercise are done
    const currentExerciseComplete = visibleSets.every(set => set.isCompleted || set.skipped);
    
    // Only show warning if current exercise is complete and no timers are running
    return currentExerciseComplete && activeTimer === null && !isDayCompleted && incompleteExercises.length > 0;
  };

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
              disabled={activeTimer !== null || isAnySetSkipped}
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
          {visibleSets.map((set, displayIndex) => {
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
            const isEditable =
               !isSkipped && isCompletedNotEditing && activeTimer === null;
            const isActiveOrEditing =
              !isSkipped && (set.isActive || set.isEditing) && !set.isCompleted;
            const isLocked =
              !isSkipped &&
              !set.isActive &&
              !set.isCompleted &&
              !set.isEditing &&
              !isAnyRestRunning;
            const isInputDisabled =
              isSkipped ||
              isLocked ||
              isCompletedNotEditing ||
              (isAnyRestRunning && !set.isEditing);

            const rowClass = isSkipped
              ? "opacity-40 bg-gray-100 italic"
              : isLocked
              ? "opacity-60 bg-gray-50"
              : isAnyRestRunning && !isThisSetRestRunning && !set.isEditing
              ? "opacity-70 bg-gray-50"
              : set.isEditing
              ? "bg-yellow-50"
              : "bg-white";

            return (
              <tr
                key={set.id}
                className={`${rowClass} border transition-opacity duration-200 text-sm`}
              >
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
                        ? "text-gray-900"
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
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {isSkipped
                      ? `(${set.skippedDates?.[set.skippedDates.length - 1] || 'Skipped'})`
                      : `Rest: ${set.rest}`}
                  </span>
                </td>
                <td className="p-1 text-center align-middle border">
                  <div className="flex flex-wrap items-center gap-1 text-base justify-evenly md:gap-2">
                    {isSkipped ? (
                      <i
                        className="text-gray-400 fas fa-ban"
                        title={`Skipped on ${set.skippedDates?.join(", ") || ''}`}
                      ></i>
                    ) : isThisSetDurationRunning ? (
                      <i
                        className="text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                        onClick={() => completeSet(set.id)}
                        title="Complete Set"
                      ></i>
                    ) : isAnyRestRunning ? (
                      isThisSetRestRunning ? (
                        <i
                          className="text-orange-400 fas fa-hourglass-half animate-pulse"
                          title="Resting"
                        ></i>
                      ) : (
                        <i
                          className="text-gray-400 opacity-50 fas fa-hourglass-half"
                          title="Another set resting"
                        ></i>
                      )
                    ) : isLocked ? (
                      <i
                        className="text-gray-400 fas fa-lock"
                        title="Complete previous set"
                      ></i>
                    ) : (
                      <>
                        {set.isEditing && (
                          <div className="flex justify-evenly">
                            <i
                              className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                              onClick={() => startWorkout(set.id)}
                              title="Restart Workout Timer"
                            ></i>
                            <i
                              className="mx-3 text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                              onClick={() => completeSet(set.id)}
                              title="Save & Complete (Skip Timer)"
                            ></i>
                          </div>
                        )}
                        {set.isActive && !set.isEditing && !set.isCompleted && (
                          <i
                            className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                            onClick={() => startWorkout(set.id)}
                            title="Start Workout Timer"
                          ></i>
                        )}
                        {isEditable && (
                          <i
                            className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700"
                            onClick={() => editSet(set.id)}
                            title="Edit Set"
                          ></i>
                        )}
                        {(set.isEditing || (set.isActive && !set.isEditing) || isEditable) &&
                         !set.isCompleted &&
                         !isSkipped &&
                         activeTimer === null && (
                            <i
                                className={`cursor-pointer fas fa-trash-alt ${
                                visibleSets.length <= 1
                                    ? "text-gray-300 cursor-not-allowed"
                                    : "text-red-500 hover:text-red-700"
                                }`}
                                onClick={() => {
                                if (visibleSets.length > 1 && activeTimer === null && !isSkipped) {
                                    deleteSet(set.id);
                                } else if (visibleSets.length <= 1) {
                                    toast.error("Cannot delete the last visible set.");
                                }
                                }}
                                title={
                                visibleSets.length <= 1
                                    ? "Cannot delete last visible set"
                                    : "Delete Set"
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

      {/* *** FIXED: Enhanced Finish Day Section *** */}
      <div className="mt-4">
        {isLastExercise && (
          <>
            {/* Only show warning when appropriate */}
            {shouldShowIncompleteWarning() && (
              <div className="p-3 mb-3 border border-yellow-200 rounded-lg bg-yellow-50">
                {/* <h4 className="mb-2 text-sm font-semibold text-yellow-800">
                  <i className="mr-2 fas fa-exclamation-triangle"></i>
                  Day Not Complete
                </h4> */}
                <p className="mb-2 text-xs text-yellow-700">
                <i className="mr-2 fas fa-exclamation-triangle"></i> You still have incomplete exercises:
                </p>
                <ul className="text-xs text-yellow-700 list-disc list-inside">
                  {incompleteExercises.map((exercise, index) => (
                    <li key={index}>{exercise.name}</li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-yellow-600">
                  Complete or skip these exercises to finish the day.
                </p>
              </div>
            )}

            {/* Finish Day Button - only show when day is complete */}
            {isDayCompleted && isAllSetsCompleted && activeTimer === null ? (
              <RegularButton
                title="Finish Day's Workout"
                className="w-full font-semibold text-white bg-green-600 hover:bg-green-700"
                onClick={() => {
                  handleFinishDay();
                  handleStatus(selectedPlanId, progressStats);
                }}
              />
            ) : (
              shouldShowIncompleteWarning() &&
              <RegularButton
                title={
                  !isDayCompleted 
                    ? "Complete All Exercises First" 
                    : !isAllSetsCompleted 
                    ? "Complete This Exercise First"
                    : activeTimer !== null
                    ? "Finish Current Timer First"
                    : "Finish Day's Workout"
                }
                className="w-full font-semibold text-gray-400 bg-gray-200 cursor-not-allowed"
                disabled={true}
              />
            )}
          </>
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
            className={`p-2 text-lg rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed aspect-square flex items-center justify-center w-9 h-9 text-gray-700 bg-gray-200`}
            aria-label="Next Exercise"
            disabled={ isLastExercise || !isAllSetsCompleted || activeTimer !== null }
            title={
              !isAllSetsCompleted
                ? "Complete all sets to advance"
                : activeTimer !== null
                ? "Timer active"
                : isLastExercise
                ? ""
                : "Next Exercise"
            }
          >
            <i className="fas fa-arrow-right"></i>
          </button>
        )}
        {isLastExercise && <div className="w-9 h-9"></div>}
      </div>
      
    </>
  );
};

export default SetAndRepsForm;