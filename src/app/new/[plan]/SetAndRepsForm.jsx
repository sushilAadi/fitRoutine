// app/new/[plan]/SetAndRepsForm.jsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import RegularButton from "@/components/Button/RegularButton";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { calculateNextDay, parseTimeToSeconds } from "@/utils";
import ConfirmationToast from "@/components/Toast/ConfirmationToast";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import PreviousHistory from "./PreviousHistory";

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

  // Destructure necessary data, including firebaseStoredData
  const {
    selectedPlanId,
    userId,
    selectedWeek, // current week object
    setSelectedDay,
    setSelectedWeek,
    dayData = [],
    weekStructure = [],
    totalWeeksCount = 0,
    allWeeksData = [],
    currentWeekIndex,
    // *** GET FIREBASE DATA FROM PROPS ***
    firebaseStoredData,
  } = necessaryData || {};

  // Keys for storage (remain the same)
  const workoutProgressKey = `workout-progress-${selectedPlanId}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId}`;
  const selectedDayKey = `selectedDayNumber_${selectedPlanId}`;
  const slideIndexKeyBase = `slideIndex-${selectedPlanId || "default"}`;
  const storageKey = `workout-${currentWeekIndex}-${selectedDay}-${exerciseId}-${selectedPlanId}`; // Key for this specific exercise's sets on this day

  // --- State Variables (remain the same) ---
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

  // --- Helper functions for Finish Day (remain the same) ---
  function getAllLocalStorageData() {
    let data = {};
    for (let i = 0; i < localStorage.length; i++) {
      let key = localStorage.key(i);
      if (key && key.endsWith(selectedPlanId)) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
          data[key] = localStorage.getItem(key);
        }
      }
    }
    return data;
  }
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
    console.log(`Cleared localStorage for plan ${selectedPlanId}`);
  }
  async function storeInDatabase() {
    const allDataToSave = getAllLocalStorageData();
    if (!userId || !selectedPlanId || Object.keys(allDataToSave).length === 0) {
      console.warn("No user/plan ID or no data in localStorage to save to DB.");
      return; // Don't proceed if nothing to save
    }
    const userProgressRef = doc(db, "userWorkoutProgress", userId);
    const firestorePayload = { [selectedPlanId]: allDataToSave };
    try {
      await setDoc(userProgressRef, firestorePayload, { merge: true });
      console.log(
        "Successfully saved data to Firestore for plan:",
        selectedPlanId
      );
    } catch (error) {
      console.error("Error saving data to Firestore:", error);
      toast.error("Error saving workout progress.");
      // Optionally re-throw or handle the error more gracefully
    }
  }

  // --- Effects ---

  useEffect(() => {
    setHasAutoNavigated(false);
    initialLoadComplete.current = false;
  }, [exerciseId, selectedDay, currentWeekIndex]);

  // *** MODIFIED: Load sets data prioritizing Firebase prop, then localStorage, then defaults ***
  useEffect(() => {
    const getInitialSets = () => {
      let initialData = null;
      let source = "default"; // Track where the data came from

      // 1. Check Firebase Data first (passed via props)
      if (firebaseStoredData && firebaseStoredData[storageKey]) {
        try {
          const dataFromFirebase = firebaseStoredData[storageKey];
          // Basic validation: Check if it's an array (or potentially adapt if structure differs)
          if (Array.isArray(dataFromFirebase)) {
            initialData = dataFromFirebase;
            source = "firebase";
            console.log(
              `Initializing sets for ${exerciseId} from Firebase data.`
            );
          } else {
            console.warn(
              `Data for ${storageKey} in Firebase was not an array, ignoring.`
            );
          }
        } catch (error) {
          console.error(
            `Error processing Firebase data for ${storageKey}:`,
            error
          );
        }
      }

      // 2. If not found in Firebase, check Local Storage (for active session state)
      if (initialData === null && typeof window !== "undefined") {
        try {
          const savedData = localStorage.getItem(storageKey);
          if (savedData) {
            const parsedData = JSON.parse(savedData);
            if (Array.isArray(parsedData)) {
              initialData = parsedData;
              source = "localStorage";
              console.log(
                `Initializing sets for ${exerciseId} from localStorage data.`
              );
            } else {
              console.warn(
                `Data for ${storageKey} in localStorage was not an array, ignoring.`
              );
              localStorage.removeItem(storageKey); // Clean up invalid data
            }
          }
        } catch (error) {
          console.error(
            `Error parsing localStorage data for ${storageKey}:`,
            error
          );
          localStorage.removeItem(storageKey); // Clean up corrupted data
        }
      }

      // 3. If still no data, create Defaults
      if (initialData === null) {
        console.log(`Initializing sets for ${exerciseId} with defaults.`);
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
          }));
        source = "default";
      }

      // --- Common processing for data from any source ---
      // Ensure all necessary flags exist with defaults, especially isActive for the first non-completed/non-skipped set
      let firstActiveSet = false;
      const processedData = initialData.map((set, index) => {
        const isSetCompleted = set.isCompleted || false;
        const isSetSkipped = set.skipped || false;
        let isActive = false;
        // Make the first non-completed, non-skipped set active
        if (!isSetCompleted && !isSetSkipped && !firstActiveSet) {
          isActive = true;
          firstActiveSet = true;
        }

        return {
          ...set, // Spread existing data
          // Ensure defaults for potentially missing fields
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
          exerciseId: set.exerciseId || exerciseId, // Ensure exerciseId is set
          skipped: isSetSkipped,
          skippedDates: set.skippedDates || [],
        };
      });

      // If after processing, no set is active (e.g., all loaded sets were completed/skipped), make the first one active IF it exists
      if (!firstActiveSet && processedData.length > 0 && source !== "default") {
        // This scenario is less likely if loading completed state, but handle defensively
        // We generally don't want to auto-activate a completed/skipped set.
        // Let's check if *all* are done/skipped
        const allDoneOrSkipped = processedData.every(
          (s) => s.isCompleted || s.skipped
        );
        if (!allDoneOrSkipped && processedData[0]) {
          // If not all are done, but none were activated (edge case), activate the first one.
          // console.warn(`No initial active set found for ${exerciseId}, activating the first one.`);
          // processedData[0].isActive = true; // Reconsider if this is desired behavior
        } else {
          // console.log(`All sets for ${exerciseId} loaded as completed/skipped. No set activated initially.`);
        }
      } else if (
        !firstActiveSet &&
        processedData.length > 0 &&
        source === "default"
      ) {
        // Default sets should always have the first one active if length > 0
        processedData[0].isActive = true;
      }

      return processedData; // Return the final processed array
    };

    // --- Initialize and Restore Timer ---
    const initialData = getInitialSets();
    setSets(initialData); // Set the state

    // Timer Restore Logic (run only once after initial load/data source is determined)
    if (!initialLoadComplete.current && initialData.length > 0) {
      let restored = false;
      // Prioritize restoring duration timer
      for (const set of initialData) {
        if (set.isDurationRunning && !set.skipped) {
          setActiveTimer("workout");
          setSeconds(parseTimeToSeconds(set.duration));
          activeSetRef.current = set.id;
          waitingForRestCompletion.current = false;
          restored = true;
          break;
        }
      }
      // If no duration timer, check for rest timer
      if (!restored) {
        for (const set of initialData) {
          if (set.isRestRunning && !set.skipped) {
            setActiveTimer("rest");
            setSeconds(parseTimeToSeconds(set.rest));
            activeSetRef.current = set.id;
            waitingForRestCompletion.current = true;
            restored = true;
            break;
          }
        }
      }
      // If no timer was running, ensure state is clean
      if (!restored) {
        setActiveTimer(null);
        setSeconds(0);
        activeSetRef.current = null;
        waitingForRestCompletion.current = false;
      }

      initialLoadComplete.current = true; // Mark initial load and timer restore as complete
      console.log(
        `Timer restore check complete for ${exerciseId}. Timer state: ${
          activeTimer || "none"
        }`
      );
    } else if (!initialLoadComplete.current) {
      initialLoadComplete.current = true; // Mark as complete even if no data/timer
      console.log(
        `Initial load complete for ${exerciseId}, no timer to restore.`
      );
    }

    // Check initial completion status after setting data
    const allInitiallyDone =
      Array.isArray(initialData) &&
      initialData.length > 0 &&
      initialData.every((set) => set.isCompleted || set.skipped);
    setIsAllSetsCompleted(allInitiallyDone);
    console.log(
      `Initial 'all sets completed' status for ${exerciseId}: ${allInitiallyDone}`
    );
  }, [
    selectedDay,
    exerciseId,
    initialSets,
    storageKey,
    currentWeekIndex,
    firebaseStoredData,
  ]); // Add firebaseStoredData dependency

  // Save sets data to LOCAL STORAGE whenever it changes (for active session state)
  useEffect(() => {
    // Only save after the initial load is complete to avoid overwriting immediately
    if (initialLoadComplete.current && sets.length > 0) {
      // Add a small delay or check if data actually changed if performance becomes an issue
      console.log(`Saving sets state to localStorage for ${storageKey}`);
      localStorage.setItem(storageKey, JSON.stringify(sets));
      checkAllSetsCompleted(); // Update completion status after state changes
    }
  }, [sets, storageKey]); // Removed initialLoadComplete dependency here, rely on it being true

  // Check completion state function (no change)
  const checkAllSetsCompleted = () => {
    const allDone =
      Array.isArray(sets) &&
      sets.length > 0 &&
      sets.every((set) => set.isCompleted || set.skipped) &&
      !waitingForRestCompletion.current &&
      activeTimer !== "rest";
    setIsAllSetsCompleted((prev) => (prev !== allDone ? allDone : prev));
    return allDone;
  };

  // Auto-navigation effect (no change)
  useEffect(() => {
    if (
      isAllSetsCompleted &&
      !isLastExercise &&
      !waitingForRestCompletion.current &&
      !hasAutoNavigated &&
      activeTimer === null
    ) {
      const isAnySkipped = sets.some((s) => s.skipped);
      if (!isAnySkipped) {
        const moveToNextTimeout = setTimeout(() => {
          if (
            isAllSetsCompleted &&
            !isLastExercise &&
            !waitingForRestCompletion.current &&
            !hasAutoNavigated &&
            activeTimer === null &&
            !sets.some((s) => s.skipped)
          ) {
            console.log("Auto-navigating to next exercise...");
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

  // Update set duration/rest string based on 'seconds' (no change)
  useEffect(() => {
    if (!activeTimer || activeSetRef.current === null) return;
    setSets((prevSets) => {
      const activeSetIndex = prevSets.findIndex(
        (set) => set.id === activeSetRef.current
      );
      if (activeSetIndex === -1 || prevSets[activeSetIndex].skipped) {
        if (prevSets[activeSetIndex]?.skipped) {
          setActiveTimer(null);
          setSeconds(0);
          waitingForRestCompletion.current = false;
          activeSetRef.current = null;
        }
        return prevSets;
      }
      const hours = Math.floor(seconds / 3600)
        .toString()
        .padStart(2, "0");
      const minutes = Math.floor((seconds % 3600) / 60)
        .toString()
        .padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      let needsUpdate = false;
      let updatedSets = [...prevSets];
      const currentSet = updatedSets[activeSetIndex];
      if (activeTimer === "workout") {
        const newDuration = `${hours}:${minutes}:${secs}`;
        if (
          currentSet.duration !== newDuration ||
          !currentSet.isDurationRunning
        ) {
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
  // == HANDLER FUNCTIONS (No changes needed) ==
  // =========================================
  const startWorkout = (setId) => {
    /* ... unchanged ... */
    const setIndex = sets.findIndex((set) => set.id === setId);
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
    if (
      (currentSet.isActive || currentSet.isEditing) &&
      !currentSet.isCompleted
    ) {
      console.log(`Starting workout for set ${setId}.`);
      const updatedSets = sets.map((s, index) => ({
        ...s,
        isDurationRunning: index === setIndex,
        isRestRunning: false,
        duration: index === setIndex ? "00:00:00" : s.duration,
        isActive: index === setIndex,
        isEditing: false,
      }));
      setSets(updatedSets);
      setActiveTimer("workout");
      setSeconds(0);
      activeSetRef.current = setId;
      waitingForRestCompletion.current = false;
    } else {
      console.warn("Condition not met to start workout", {
        currentSet,
        activeTimer,
      });
    }
  };
  const completeSet = (setId) => {
    /* ... unchanged ... */
    const setIndex = sets.findIndex((set) => set.id === setId);
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
    if (
      currentSet.isEditing ||
      (currentSet.isActive &&
        activeTimer === "workout" &&
        activeSetRef.current === setId)
    ) {
      console.log(`Completing set ${setId}. Starting rest timer.`);
      setActiveTimer("rest");
      setSeconds(0);
      waitingForRestCompletion.current = true;
      activeSetRef.current = setId;
      const updatedSets = sets.map((s, index) =>
        index === setIndex
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
    } else if (activeTimer === "rest") {
      toast.error("Cannot complete set while resting.");
    } else if (activeTimer === "workout" && activeSetRef.current !== setId) {
      toast.error("Workout timer running for another set.");
    } else if (!currentSet.isActive && !currentSet.isEditing) {
      toast.error("Set is not active or being edited.");
    }
  };
  const stopRestTimer = () => {
    /* ... unchanged ... */
    if (activeTimer !== "rest" || activeSetRef.current === null) return;
    const lastCompletedSetId = activeSetRef.current;
    const lastCompletedSetIndex = sets.findIndex(
      (set) => set.id === lastCompletedSetId
    );
    if (lastCompletedSetIndex === -1) return;
    console.log(
      `Stopping rest timer for set ${lastCompletedSetId}. Activating next available set.`
    );
    let nextActiveIndex = -1;
    for (let i = lastCompletedSetIndex + 1; i < sets.length; i++) {
      if (!sets[i].isCompleted && !sets[i].skipped) {
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
  const handleFinishDay = async () => {
    /* ... unchanged ... */
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot finish day while a timer is active or resting.");
      return;
    }
    const allCurrentExerciseSetsDone = sets.every(
      (set) => set.isCompleted || set.skipped
    );
    if (!allCurrentExerciseSetsDone) {
      console.warn(
        "Finish Day clicked, but not all sets are marked completed/skipped for this exercise."
      );
      toast.error(
        "Please ensure all sets for this exercise are completed or skipped."
      );
      return;
    }
    console.log("Finishing Day's Workout...");
    try {
      const currentWeekIdx = selectedWeek?.week;
      const currentDayNum = selectedDay;
      if (
        typeof currentWeekIdx !== "number" ||
        typeof currentDayNum !== "number"
      ) {
        console.error("Missing current week/day context.", {
          currentWeekIdx,
          currentDayNum,
        });
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
        router.push("/new");
        return;
      }
      const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } =
        nextStep;
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
      // Clear LS *after* successful DB save
      removeLocalStorageDataByPlanId();
      toast.success(`Day Complete! Progress saved.`, { duration: 3000 });
      router.push("/new");
    } catch (error) {
      console.error("Error in handleFinishDay:", error);
      toast.error("An error occurred while finishing the workout day.");
    }
  };
  const handleSkipExercise = () => {
    /* ... unchanged ... */
    if (activeTimer !== null || waitingForRestCompletion.current) {
      toast.error("Cannot skip exercise while a timer is active or resting.");
      return;
    }
    const isAnySetSkipped = sets.some((s) => s.skipped);
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
    /* ... unchanged ... */
    try {
      const today = new Date().toISOString().split("T")[0];
      console.log(`Skipping exercise ${exerciseId} on day ${selectedDay}.`);
      const updatedSets = sets.map((set) => {
        const dates = Array.isArray(set.skippedDates)
          ? [...set.skippedDates]
          : [];
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
      localStorage.setItem(storageKey, JSON.stringify(updatedSets)); // Save skipped state to LS
      setSets(updatedSets);
      setActiveTimer(null);
      setSeconds(0);
      waitingForRestCompletion.current = false;
      activeSetRef.current = null;
      setIsAllSetsCompleted(true);
      toast.success("Exercise Skipped.");
      if (!isLastExercise) {
        goNext();
      } else {
        console.log("Last exercise skipped, finishing day...");
        handleFinishDay();
      } // Finish day if last exercise
    } catch (error) {
      console.error("Error skipping exercise:", error);
      toast.error("An error occurred while skipping the exercise.");
    }
  };
  const editSet = (setId) => {
    /* ... unchanged ... */
    const setIndex = sets.findIndex((set) => set.id === setId);
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
      console.log(`Editing set ${setId}.`);
      const updatedSets = sets.map((set, index) => ({
        ...set,
        isEditing: index === setIndex,
        isActive: index === setIndex,
        isCompleted: index === setIndex ? false : set.isCompleted,
        isDurationRunning: false,
        isRestRunning: false,
      }));
      setSets(updatedSets);
      setActiveTimer(null);
      setSeconds(0);
      activeSetRef.current = null;
      waitingForRestCompletion.current = false;
      setIsAllSetsCompleted(false);
    }
  };
  const deleteSet = (setId) => {
    /* ... unchanged ... */
    if (sets.length <= 1) {
      toast.error("Cannot delete the only set.");
      return;
    }
    if (activeTimer !== null) {
      toast.error("Cannot delete set while a timer is active.");
      return;
    }
    const setToDelete = sets.find((s) => s.id === setId);
    if (setToDelete?.skipped) {
      toast.error("Cannot delete sets from a skipped exercise.");
      return;
    }
    const updatedSets = sets.filter((set) => set.id !== setId);
    let madeActive = false;
    const reindexedSets = updatedSets.map((set, index) => {
      const newSet = {
        ...set,
        id: index + 1,
        isActive: false,
        isEditing: false,
        isDurationRunning: false,
        isRestRunning: false,
      };
      if (!madeActive && !set.isCompleted && !set.skipped) {
        newSet.isActive = true;
        madeActive = true;
      }
      return newSet;
    });
    setSets(reindexedSets);
  };
  const addSet = () => {
    /* ... unchanged ... */
    if (activeTimer !== null) {
      toast.error("Cannot add set while timer is active.");
      return;
    }
    if (sets.some((s) => s.skipped)) {
      toast.error("Cannot add sets to a skipped exercise.");
      return;
    }
    const newSetId =
      sets.length > 0 ? Math.max(...sets.map((s) => s.id)) + 1 : 1;
    const allPreviousDone = sets.every((set) => set.isCompleted || set.skipped);
    const makeActive = sets.length === 0 || allPreviousDone;
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
    };
    const updatedSets = sets.map((set) => ({
      ...set,
      isActive: makeActive ? false : set.isActive,
    }));
    setSets([...updatedSets, newSet]);
    setIsAllSetsCompleted(false);
    console.log(`Added set ${newSetId}. Active: ${makeActive}`);
  };
  const handleInputChange = (setId, field, value) => {
    /* ... unchanged ... */
    setSets((prevSets) =>
      prevSets.map((set) => {
        if (set.id === setId) {
          if (set.skipped) return set;
          if (
            (set.isActive || set.isEditing) &&
            !(activeTimer === "rest" && !set.isEditing)
          ) {
            if (
              (field === "weight" || field === "reps") &&
              value &&
              !/^\d*\.?\d*$/.test(value)
            ) {
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
    /* ... unchanged ... */
    if (checkAllSetsCompleted() && activeTimer === null) {
      goNext();
    } else if (activeTimer !== null) {
      toast.error("Complete or skip the current timer first.");
    } else {
      toast.error("Please complete all sets for this exercise first.");
    }
  };
  const toggleHistory = () =>
    setShowHistory(!showHistory); /* ... unchanged ... */

  // --- RENDER (No changes needed) ---
  const isAnySetSkipped = sets.some((s) => s.skipped);

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
              disabled={activeTimer !== null}
              aria-disabled={activeTimer !== null}
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
          {" "}
          <tr className="bg-gray-100">
            {" "}
            <th className="w-10 p-1 text-xs font-semibold text-center text-gray-600 border md:w-12">
              Set
            </th>{" "}
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">
              Weight (kg)
            </th>{" "}
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">
              Reps
            </th>{" "}
            <th className="p-1 text-xs font-semibold text-center text-gray-600 border">
              Actions
            </th>{" "}
          </tr>{" "}
        </thead>
        <tbody>
          {sets.map((set) => {
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
              : isAnyRestRunning && !isThisSetRestRunning
              ? "opacity-70 bg-gray-50"
              : set.isEditing
              ? "bg-yellow-50"
              : "bg-white";
            return (
              <tr
                key={set.id}
                className={`${rowClass} border transition-opacity duration-200 text-sm`}
              >
                <td className="p-1 font-medium text-center border">{set.id}</td>
                <td className="p-1 border">
                  {" "}
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
                    aria-label={`Weight for set ${set.id}`}
                  />{" "}
                  <span
                    className={`block text-[10px] text-center mt-0.5 ${
                      isThisSetDurationRunning
                        ? "text-blue-600 font-medium animate-pulse"
                        : isSkipped
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {" "}
                    {isSkipped ? `Skipped` : `Dur: ${set.duration}`}{" "}
                  </span>{" "}
                </td>
                <td className="p-1 border">
                  {" "}
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
                    aria-label={`Reps for set ${set.id}`}
                  />{" "}
                  <span
                    className={`block text-[10px] text-center mt-0.5 ${
                      isThisSetRestRunning
                        ? "text-orange-600 font-medium animate-pulse"
                        : isSkipped
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {" "}
                    {isSkipped
                      ? `(${set.skippedDates[set.skippedDates.length - 1]})`
                      : `Rest: ${set.rest}`}{" "}
                  </span>{" "}
                </td>
                <td className="p-1 text-center align-middle border">
                  <div className="flex flex-wrap items-center justify-center gap-1 text-base md:gap-2">
                    {isSkipped ? (
                      <i
                        className="text-gray-400 fas fa-ban"
                        title={`Skipped on ${set.skippedDates.join(", ")}`}
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
                        {" "}
                        {set.isEditing && (
                          <>
                            {" "}
                            <i
                              className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                              onClick={() => startWorkout(set.id)}
                              title="Restart Workout Timer"
                            ></i>{" "}
                            <i
                              className="mx-3 text-green-500 cursor-pointer fas fa-check hover:text-green-700"
                              onClick={() => completeSet(set.id)}
                              title="Save & Complete (Skip Timer)"
                            ></i>{" "}
                          </>
                        )}{" "}
                        {set.isActive && !set.isEditing && !set.isCompleted && (
                          <i
                            className="text-blue-500 cursor-pointer fas fa-play hover:text-blue-700"
                            onClick={() => startWorkout(set.id)}
                            title="Start Workout Timer"
                          ></i>
                        )}{" "}
                        {isEditable && (
                          <i
                            className="text-orange-500 cursor-pointer fas fa-pencil-alt hover:text-orange-700"
                            onClick={() => editSet(set.id)}
                            title="Edit Set"
                          ></i>
                        )}{" "}
                        {(set.isEditing ||
                          (set.isActive &&
                            !set.isEditing
                            ) ||
                          isEditable) && !set.isCompleted && (
                          <i
                            className={`cursor-pointer fas fa-trash-alt ${
                              sets.length <= 1
                                ? "text-gray-300 cursor-not-allowed"
                                : "text-red-500 hover:text-red-700"
                            }`}
                            onClick={() => {
                              if (
                                sets.length > 1 &&
                                activeTimer === null &&
                                !isSkipped
                              )
                                deleteSet(set.id);
                              else if (sets.length <= 1)
                                toast.error("Cannot delete last set.");
                              else if (activeTimer !== null)
                                toast.error(
                                  "Cannot delete while timer active."
                                );
                              else if (isSkipped)
                                toast.error("Cannot delete skipped set.");
                            }}
                            title={
                              sets.length <= 1
                                ? "Cannot delete last set"
                                : activeTimer !== null
                                ? "Timer active"
                                : isSkipped
                                ? "Cannot delete skipped set"
                                : "Delete Set"
                            }
                          ></i>
                        )}{" "}
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
        {" "}
        {isLastExercise && isAllSetsCompleted && activeTimer === null && (
          <RegularButton
            title="Finish Day's Workout"
            className="w-full font-semibold text-white bg-green-600 hover:bg-green-700"
            onClick={handleFinishDay}
          />
        )}{" "}
      </div>
      {/* Navigation Arrows */}
      <div className="flex items-center justify-between mt-6">
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
          {" "}
          <i className="fas fa-arrow-left"></i>{" "}
        </button>
        {/* <span className="text-xs text-gray-500">
          {" "}
          Exercise {exerciseIndex + 1} of {filteredExercises.length || 0}{" "}
        </span> */}
        {!isLastExercise && (
          <button
            onClick={handleGoNext}
            className={`p-2 text-lg rounded-full hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed aspect-square flex items-center justify-center w-9 h-9 ${
              isLastExercise ? "invisible" : "text-gray-700 bg-gray-200"
            }`}
            aria-label="Next Exercise"
            disabled={
              isLastExercise || !isAllSetsCompleted || activeTimer !== null
            }
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
            {" "}
            <i className="fas fa-arrow-right"></i>{" "}
          </button>
        )}
        {isLastExercise && <div className="w-9 h-9"></div>}
      </div>
    </>
  );
};

export default SetAndRepsForm;
