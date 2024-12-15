"use client";
import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import OffCanvasComp from "@/components/OffCanvas/OffCanvasComp";
import ExerciseDeatil from "./ExerciseDeatil";
import { useRouter } from "next/navigation";
import { calculateProgress, handleDate } from "@/utils";
import Image from "next/image";

const TabButton = ({ active, onClick, children, disabled }) => (
  <button
    className={` mx-1 ${
      active
        ? " text-white border-b-2 border-red-500"
        : disabled
        ? " text-gray-500 cursor-not-allowed"
        : " "
    }`}
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const PlanDetail = ({ params }) => {
  const USER_WEIGHT_KG = 60;

  const router = useRouter();
  const initializedRef = useRef(false);
  const [workoutData, setWorkoutData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [show, setShow] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [lockPreviousTabs, setLockPreviousTabs] = useState(true);
  const [restTime, setRestTime] = useState(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeExerciseSet, setActiveExerciseSet] = useState(null);
  const [setWarnings, setSetWarnings] = useState({});
  const [setTimers, setSetTimers] = useState({});
  const timerIntervals = useRef({});
  const [toggleCheck, setToggleCheck] = useState(false);
  const [EditToggle, setEditToggle] = useState(true);
  const [editValue, setEditValue] = useState("");

  const handleOpenClose = () => setShow(!show);
  const selectedPlanName = decodeURIComponent(params?.plan);

  const checkSetWarnings = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const exercise = workoutData?.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    const configuredSets = exercise?.weeklySetConfig?.find((i) => i?.isConfigured)?.sets || 0;
    const currentSets = exerciseDetails[key]?.length || 0;
    
    console.log(`Exercise ${key}: Configured sets: ${configuredSets}, Current sets: ${currentSets}`); // Add this for debugging
  
    if (currentSets === 0 && configuredSets > 0) {
      const updatedWarnings = { ...setWarnings };
      updatedWarnings[key] = `This exercise is configured for ${configuredSets} sets.`;
      setSetWarnings(updatedWarnings);
    } else {
      const updatedWarnings = { ...setWarnings };
      delete updatedWarnings[key];
      setSetWarnings(updatedWarnings);
    }
  };

  const calculateSetVolume = (weight, reps, equipment) => {
    if (!weight || !reps) return 0;

    // Convert weight to kg if needed (assuming input is in kg)
    const weightInKg = Number(weight);
    const numberOfReps = Number(reps);

    if (equipment === "body weight") {
      return USER_WEIGHT_KG * numberOfReps;
    } else if (equipment === "band") {
      // For band exercises, we'll just track reps
      return numberOfReps;
    } else {
      return weightInKg * numberOfReps;
    }
  };

  const calculateExerciseTotal = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const sets = workoutData?.exerciseHistory[key] || [];
    const exercise =
      workoutData?.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];

    let total = 0;
    sets.forEach((set) => {
      if (exercise.equipment === "body weight") {
        total += calculateSetVolume(
          USER_WEIGHT_KG,
          set.reps,
          exercise.equipment
        );
      } else {
        total += calculateSetVolume(set.weight, set.reps, exercise.equipment);
      }
    });
    return total;
  };
  const calculateDailyTotal = (weekIndex, dayIndex) => {
    const exercises =
      workoutData?.workoutPlan[weekIndex][dayIndex].exercises || [];
    let dailyTotal = 0;

    exercises.forEach((exercise, index) => {
      dailyTotal += calculateExerciseTotal(weekIndex, dayIndex, index);
    });
    return dailyTotal;
  };

  const formatVolume = (volume, equipment) => {
    if (equipment === "band") {
      return `${volume} reps`;
    } else {
      return `${volume.toLocaleString()} kg`;
    }
  };

  const isDayCompleted = (weekIndex, dayIndex, data = workoutData) => {
    if (!data) return false;
    const exercises = data?.workoutPlan[weekIndex][dayIndex].exercises || [];
    return exercises.every((_, index) => {
      const key = `${weekIndex}-${dayIndex}-${index}`;
      return data?.exerciseHistory[key] && data.exerciseHistory[key].length > 0;
    });
  };

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const plans = Object.keys(localStorage)
      .filter((key) => key.startsWith("workoutPlan_"))
      .map((key) => JSON.parse(localStorage.getItem(key)));

    const findPlan = plans?.find((i) => i?.name === selectedPlanName);

    if (findPlan) {
      const progress = calculateProgress(findPlan);
      findPlan.progress = progress;
      setWorkoutData(findPlan);
      const initialExerciseDetails = {};
      Object.entries(findPlan.exerciseHistory).forEach(([key, sets]) => {
        initialExerciseDetails[key] = sets.map((set) => ({
          ...set,
          isCompleted: true,
          restTime: set.restTime || null,
        }));
      });

      findPlan.workoutPlan.forEach((week, weekIndex) => {
        week.forEach((day, dayIndex) => {
          day.exercises.forEach((exercise, exerciseIndex) => {
            const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
            const configuredSets =
              exercise?.weeklySetConfig?.find((i) => i?.isConfigured)?.sets ||
              0;
            const existingSets = initialExerciseDetails[key]?.length || 0;
            const setsToAdd = Math.max(configuredSets - existingSets, 0);

            if (!initialExerciseDetails[key]) {
              initialExerciseDetails[key] = [];
            }

            for (let i = 0; i < setsToAdd; i++) {
              initialExerciseDetails[key].push({
                weight: "",
                reps: "",
                isCompleted: false,
              });
            }
          });
        });
      });

      setExerciseDetails(initialExerciseDetails);

      const lastPosition = localStorage.getItem(
        `lastPosition_${selectedPlanName}`
      );
      if (lastPosition) {
        const { week, day } = JSON.parse(lastPosition);
        setSelectedWeek(week);
        setSelectedDay(day);
        setCurrentWeek(week);
        setCurrentDay(day);
      } else {
        let foundPosition = false;
        for (let w = 0; w < findPlan.weeks; w++) {
          for (let d = 0; d < findPlan.daysPerWeek; d++) {
            if (!isDayCompleted(w, d, findPlan)) {
              setSelectedWeek(w);
              setSelectedDay(d);
              setCurrentWeek(w);
              setCurrentDay(d);
              foundPosition = true;
              break;
            }
          }
          if (foundPosition) break;
        }
      }
      if (progress !== 100) {
        if (!localStorage.getItem(`restTime_${selectedPlanName}`)) {
          const userRestTime = prompt(
            "Do you want to set a rest time for each set? If yes, enter the time in seconds:"
          );
          if (userRestTime && !isNaN(userRestTime)) {
            setRestTime(parseInt(userRestTime));
            localStorage.setItem(`restTime_${selectedPlanName}`, userRestTime);
          }
        } else {
          setRestTime(
            parseInt(localStorage.getItem(`restTime_${selectedPlanName}`))
          );
        }
      }
    }
  }, [params?.plan, selectedPlanName, isDayCompleted]);
  console.log("workoutData", workoutData);
  useEffect(() => {
    if (workoutData) {
      workoutData.workoutPlan[selectedWeek][selectedDay].exercises.forEach(
        (exercise, exerciseIndex) => {
          addExerciseDetails(selectedWeek, selectedDay, exerciseIndex, true);
        }
      );
    }
  }, [selectedWeek, selectedDay, workoutData]);

  useEffect(() => {
    if (workoutData) {
      localStorage.setItem(
        `lastPosition_${selectedPlanName}`,
        JSON.stringify({
          week: currentWeek,
          day: currentDay,
        })
      );
    }
  }, [currentWeek, currentDay, params?.plan, workoutData]);

  useEffect(() => {
    let timer;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isTimerRunning]);

  const startTimer = (weekIndex, dayIndex, exerciseIndex, setIndex) => {
    setElapsedTime(0);
    setIsTimerRunning(true);
    setActiveExerciseSet({
      week: weekIndex,
      day: dayIndex,
      exercise: exerciseIndex,
      set: setIndex,
    });
  };

  const stopTimer = () => {
    if (!isTimerRunning || !activeExerciseSet) return;

    const { week, day, exercise, set } = activeExerciseSet;
    const key = `${week}-${day}-${exercise}`;

    // Update the rest time in workoutData
    const updatedWorkoutData = { ...workoutData };
    if (!updatedWorkoutData.exerciseHistory[key][set].restTime) {
      updatedWorkoutData.exerciseHistory[key][set] = {
        ...updatedWorkoutData.exerciseHistory[key][set],
        restTime: elapsedTime,
      };

      // Update localStorage
      localStorage.setItem(
        `workoutPlan_${workoutData.name}`,
        JSON.stringify(updatedWorkoutData)
      );
      setWorkoutData(updatedWorkoutData);

      // Update exercise details
      const updatedExerciseDetails = { ...exerciseDetails };
      updatedExerciseDetails[key][set].restTime = elapsedTime;
      setExerciseDetails(updatedExerciseDetails);
    }

    // Reset timer state
    setIsTimerRunning(false);
    setElapsedTime(0);
    setActiveExerciseSet(null);
    setWarningMessage("");
    setEditToggle(true)
  };

  const playTimerEndSound = () => {
    const audio = new Audio("/path-to-your-sound-file.mp3"); // Replace with your sound file
    audio.play();
  };

  const areAllSetsValid = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const sets = exerciseDetails[key];

    if (!sets || sets.length === 0) return true;

    return sets.every((set) => {
      if (set.isCompleted) return true;

      const exercise =
        workoutData?.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
      const isBodyWeightOrBand =
        exercise?.equipment === "body weight" || exercise?.equipment === "band";

      if (isBodyWeightOrBand) {
        return set.reps && set.reps.trim() !== "";
      }

      return (
        set.weight &&
        set.weight.trim() !== "" &&
        set.reps &&
        set.reps.trim() !== ""
      );
    });
  };

  const isExerciseCompleted = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    return (
      workoutData?.exerciseHistory[key] &&
      workoutData.exerciseHistory[key].length > 0
    );
  };

  const isExerciseEnabled = (weekIndex, dayIndex, exerciseIndex) => {
    if (exerciseIndex === 0) return true;
    for (let i = 0; i < exerciseIndex; i++) {
      const key = `${weekIndex}-${dayIndex}-${i}`;
      const exerciseSets = exerciseDetails[key];
      if (!exerciseSets || exerciseSets.length === 0) return false;
      const allSetsCompleted = exerciseSets.every((set) => set.isCompleted);
      if (!allSetsCompleted) return false;
    }
    return true;
  };

  // const isDayCompleted = (weekIndex, dayIndex, data = workoutData) => {
  //   if (!data) return false;
  //   const exercises = data?.workoutPlan[weekIndex][dayIndex].exercises || [];
  //   return exercises.every((_, index) => {
  //     const key = `${weekIndex}-${dayIndex}-${index}`;
  //     return data?.exerciseHistory[key] && data.exerciseHistory[key].length > 0;
  //   });
  // };

  const isWeekCompleted = (weekIndex) => {
    return Array.from({ length: workoutData?.daysPerWeek || 0 }).every(
      (_, dayIndex) => isDayCompleted(weekIndex, dayIndex)
    );
  };

  const isDayAccessible = (weekIndex, dayIndex) => {
    if (lockPreviousTabs) {
      return weekIndex === currentWeek && dayIndex <= currentDay;
    }
    if (weekIndex === 0 && dayIndex === 0) return true;
    if (dayIndex === 0) return isWeekCompleted(weekIndex - 1);
    return isDayCompleted(weekIndex, dayIndex - 1);
  };

  const isWeekAccessible = (weekIndex) => {
    if (lockPreviousTabs) {
      return weekIndex === currentWeek;
    }
    if (weekIndex === 0) return true;
    return isWeekCompleted(weekIndex - 1);
  };

  const moveToNextDay = () => {
    const currentDayExercises =
      workoutData.workoutPlan[currentWeek][currentDay].exercises;
    const hasInvalidSets = currentDayExercises.some(
      (_, index) => !areAllSetsValid(currentWeek, currentDay, index)
    );

    if (hasInvalidSets) {
      setWarningMessage(
        "Please complete or remove all empty sets before proceeding."
      );
      return;
    }

    setWarningMessage("");
    let nextWeek = currentWeek;
    let nextDay = currentDay;

    if (currentDay < workoutData.daysPerWeek - 1) {
      nextDay = currentDay + 1;
    } else if (currentWeek < workoutData.weeks - 1) {
      nextWeek = currentWeek + 1;
      nextDay = 0;
    }

    while (isDayCompleted(nextWeek, nextDay)) {
      if (nextDay < workoutData.daysPerWeek - 1) {
        nextDay++;
      } else if (nextWeek < workoutData.weeks - 1) {
        nextWeek++;
        nextDay = 0;
      } else {
        break;
      }
    }

    setCurrentWeek(nextWeek);
    setCurrentDay(nextDay);
    setSelectedWeek(nextWeek);
    setSelectedDay(nextDay);

    localStorage.setItem(
      `lastPosition_${selectedPlanName}`,
      JSON.stringify({
        week: nextWeek,
        day: nextDay,
      })
    );
  };

  const addExerciseDetails = (
    weekIndex,
    dayIndex,
    exerciseIndex,
    autoAdd = false
  ) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;

    if (!updatedExerciseDetails[key]) {
      updatedExerciseDetails[key] = [];
    }

    const exercise =
      workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    const configuredSets =
      exercise?.weeklySetConfig?.find((i) => i?.isConfigured)?.sets || 0;

    if (autoAdd) {
      // Only add sets up to the configured amount during auto-add
      const setsToAdd = configuredSets - updatedExerciseDetails[key].length;
      if(!workoutData?.setUpdate){
        for (let i = 0; i < setsToAdd; i++) {
          updatedExerciseDetails[key].push({
            weight: "",
            reps: "",
            isCompleted: false,
          });
        }
      }
      
    } else {
      // Allow manual addition of sets beyond configured amount
      updatedExerciseDetails[key].push({
        weight: "",
        reps: "",
        isCompleted: false,
      });
    }

    setExerciseDetails(updatedExerciseDetails);
    setWarningMessage("");
    checkSetWarnings(weekIndex, dayIndex, exerciseIndex);
  };
  const isSetEnabledFunc = (weekIndex, dayIndex, exerciseIndex, setIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const sets = exerciseDetails[key];

    // First set is always enabled
    if (setIndex === 0) return true;

    // Check if previous set exists and is completed
    const previousSet = sets[setIndex - 1];
    if (!previousSet?.isCompleted) return false;

    // If there's an active timer for the previous set, disable current set
    if (
      isTimerRunning &&
      activeExerciseSet?.week === weekIndex &&
      activeExerciseSet?.day === dayIndex &&
      activeExerciseSet?.exercise === exerciseIndex &&
      activeExerciseSet?.set === setIndex - 1
    ) {
      return false;
    }

    // Check if previous set has completed its rest time
    const previousSetHistory =
      workoutData?.exerciseHistory[key]?.[setIndex - 1];
    return previousSetHistory?.restTime !== null;
  };

  const updateExerciseDetail = (
    weekIndex,
    dayIndex,
    exerciseIndex,
    detailIndex,
    field,
    value
  ) => {
    if (!isExerciseEnabled(weekIndex, dayIndex, exerciseIndex)) {
      setWarningMessage(
        "Please complete the previous exercise before updating this one."
      );
      return;
    }

    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    updatedExerciseDetails[key][detailIndex][field] = value;
    setExerciseDetails(updatedExerciseDetails);
    setWarningMessage("");
  };

  const removeExerciseDetail = (
    weekIndex,
    dayIndex,
    exerciseIndex,
    detailIndex
  ) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const updatedExerciseDetails = { ...exerciseDetails };
    updatedExerciseDetails[key].splice(detailIndex, 1);
    setExerciseDetails(updatedExerciseDetails);

    const updatedWorkoutData = { ...workoutData };
    if (updatedWorkoutData.exerciseHistory[key]) {
      updatedWorkoutData.exerciseHistory[key].splice(detailIndex, 1);
      setWorkoutData(updatedWorkoutData);
      localStorage.setItem(
        `workoutPlan_${workoutData.name}`,
        JSON.stringify(updatedWorkoutData)
      );
    }

    setWarningMessage("");
    checkSetWarnings(weekIndex, dayIndex, exerciseIndex);
  };
  useEffect(() => {
    if (workoutData && selectedWeek !== null && selectedDay !== null) {
      workoutData.workoutPlan[selectedWeek][selectedDay].exercises.forEach(
        (_, exerciseIndex) => {
          checkSetWarnings(selectedWeek, selectedDay, exerciseIndex);
        }
      );
    }
  }, [exerciseDetails, selectedWeek, selectedDay, workoutData]);

  const saveExerciseSet = (weekIndex, dayIndex, exerciseIndex, detailIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const details = exerciseDetails[key];
    const exercise =
      workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
  
    const isBodyWeightOrBand =
      exercise.equipment === "body weight" || exercise.equipment === "band";
    const isValidSet =
      details?.[detailIndex]?.reps &&
      (isBodyWeightOrBand || details?.[detailIndex]?.weight);
  
    if (isValidSet) {
      // Check if we're in edit mode
      if (editValue === "edit") {
        // Don't restart the stopwatch, just update the data
        setWorkoutData((prevWorkoutData) => {
          const updatedWorkoutData = { ...prevWorkoutData };
          const updatedHistory = { ...updatedWorkoutData.exerciseHistory };
  
          if (!updatedHistory[key]) {
            updatedHistory[key] = [];
          }
  
          // Preserve the existing duration and other data
          const existingSet = updatedHistory[key][detailIndex] || {};
  
          updatedHistory[key][detailIndex] = {
            ...existingSet,
            weight: details[detailIndex].weight,
            reps: details[detailIndex].reps,
          };
  
          const newWorkoutData = {
            ...updatedWorkoutData,
            exerciseHistory: updatedHistory,
          };
  
          localStorage.setItem(
            `workoutPlan_${workoutData.name}`,
            JSON.stringify(newWorkoutData)
          );
  
          return newWorkoutData;
        });
      } else {
        // This is a new set, so we stop the timer and start a new one
        stopSetTimer(weekIndex, dayIndex, exerciseIndex, detailIndex);
  
        const currentDate = new Date();
        setWorkoutData((prevWorkoutData) => {
          const updatedWorkoutData = { ...prevWorkoutData };
          const updatedHistory = { ...updatedWorkoutData.exerciseHistory };
  
          if (!updatedHistory[key]) {
            updatedHistory[key] = [];
          }
  
          // Preserve the duration from the existing history if it exists
          const existingDuration =
            updatedHistory[key][detailIndex]?.duration || 0;
  
          updatedHistory[key][detailIndex] = {
            weight: details[detailIndex].weight,
            reps: details[detailIndex].reps,
            restTime: null,
            duration: existingDuration, // Preserve the duration
            date: {
              fullDate: currentDate.toISOString(),
              dayOfWeek: currentDate.toLocaleDateString("en-US", {
                weekday: "long",
              }),
              dayOfMonth: currentDate.getDate(),
              month: currentDate.toLocaleDateString("en-US", { month: "long" }),
              year: currentDate.getFullYear(),
              timestamp: currentDate.getTime(),
            },
          };
  
          const newWorkoutData = {
            ...updatedWorkoutData,
            exerciseHistory: updatedHistory,
          };
  
          localStorage.setItem(
            `workoutPlan_${workoutData.name}`,
            JSON.stringify(newWorkoutData)
          );
  
          return newWorkoutData;
        });
  
        startTimer(weekIndex, dayIndex, exerciseIndex, detailIndex);
      }
  
      const updatedExerciseDetails = { ...exerciseDetails };
      updatedExerciseDetails[key][detailIndex].isCompleted = true;
      setExerciseDetails(updatedExerciseDetails);
  
      setWarningMessage("");
    } else {
      setWarningMessage(
        "Please fill in all required fields before saving the set."
      );
    }
  
    // Reset editValue at the end
    setEditValue("");
  };
  
  

  useEffect(() => {
    return () => {
      Object.values(timerIntervals.current).forEach(clearInterval);
    };
  }, []);
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const editExerciseSet = (weekIndex, dayIndex, exerciseIndex, detailIndex) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    updatedExerciseDetails[key][detailIndex].isCompleted = false;
    setExerciseDetails(updatedExerciseDetails);
  };

  const getPreviousRecord = (weekIndex, dayIndex, exerciseIndex) => {
    if (!workoutData || weekIndex === 0) return null;

    const currentExercise =
      workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];

    for (let i = weekIndex - 1; i >= 0; i--) {
      if (
        workoutData.workoutPlan[i]?.[dayIndex]?.exercises[exerciseIndex]
          ?.name === currentExercise.name
      ) {
        const key = `${i}-${dayIndex}-${exerciseIndex}`;
        const records = workoutData?.exerciseHistory[key];
        if (records?.length > 0) return records;
      }
    }
    return null;
  };
  const isEntirePlanCompleted = () => {
    if (!workoutData) return false;

    for (let week = 0; week < workoutData.weeks; week++) {
      for (let day = 0; day < workoutData.daysPerWeek; day++) {
        if (!isDayCompleted(week, day)) {
          return false;
        }
      }
    }
    return true;
  };

  const toggleLockPreviousTabs = () => {
    setLockPreviousTabs((prev) => !prev);
    if (!lockPreviousTabs) {
      setSelectedWeek(currentWeek);
      setSelectedDay(currentDay);
    } else {
      let foundPosition = false;
      for (let w = 0; w < workoutData.weeks; w++) {
        for (let d = 0; d < workoutData.daysPerWeek; d++) {
          if (!isDayCompleted(w, d)) {
            setSelectedWeek(w);
            setSelectedDay(d);
            foundPosition = true;
            break;
          }
        }
        if (foundPosition) break;
      }
    }
  };

  const finishPlan = () => {
    localStorage.removeItem(`lastPosition_${selectedPlanName}`);
    localStorage.removeItem(`restTime_${selectedPlanName}`);
    router.push("/createPlanPage");
  };
  const startSetTimer = (weekIndex, dayIndex, exerciseIndex, setIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}-${setIndex}`;

    // Initialize timer for this specific set if not exists
    setSetTimers((prev) => ({
      ...prev,
      [key]: prev[key] || 0,
    }));

    // Start interval for this specific set
    timerIntervals.current[key] = setInterval(() => {
      setSetTimers((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));
    }, 1000);
  };
  

  const stopSetTimer = (weekIndex, dayIndex, exerciseIndex, setIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}-${setIndex}`;
    const historyKey = `${weekIndex}-${dayIndex}-${exerciseIndex}`;

    // Clear the interval
    if (timerIntervals.current[key]) {
      clearInterval(timerIntervals.current[key]);
      delete timerIntervals.current[key];
    }

    // Get the current timer duration from state
    setSetTimers((prev) => {
      const setTimerDuration = prev[key] || 0;

      // Update workout data with the current duration
      setWorkoutData((prevWorkoutData) => {
        const updatedWorkoutData = JSON.parse(JSON.stringify(prevWorkoutData));

        // Initialize the history array if it doesn't exist
        if (!updatedWorkoutData.exerciseHistory[historyKey]) {
          updatedWorkoutData.exerciseHistory[historyKey] = [];
        }

        // Update the specific set's duration
        if (!updatedWorkoutData.exerciseHistory[historyKey][setIndex]) {
          updatedWorkoutData.exerciseHistory[historyKey][setIndex] = {};
        }

        updatedWorkoutData.exerciseHistory[historyKey][setIndex] = {
          ...updatedWorkoutData.exerciseHistory[historyKey][setIndex],
          duration: setTimerDuration,
        };

        // Save to localStorage
        localStorage.setItem(
          `workoutPlan_${updatedWorkoutData.name}`,
          JSON.stringify(updatedWorkoutData)
        );

        return updatedWorkoutData;
      });

      // Return updated setTimers state
      return prev;
    });
  };

  useEffect(() => {
    if (isEntirePlanCompleted()) {
      setLockPreviousTabs(false);
    }
  }, [isEntirePlanCompleted()]);

  const formatSetTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };
  if (!workoutData) return <div>Loading...</div>;

  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-tprimary">

        <div className="top-0 p-3 pb-1 bg-black sticky-top">
        <div className="flex items-center justify-between my-2">
          <h1 className="mb-6 text-2xl font-bold text-white">
            {workoutData.name}
          </h1>
          <button
            onClick={toggleLockPreviousTabs}
            className={` whitespace-nowrap  ${
              lockPreviousTabs ? "text-red-500 " : "text-gray-200 "
            }`}
          >
            {lockPreviousTabs ? "Unlock  Tabs" : "Lock  Tabs"}
          </button>
        </div>

        

        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="text-sm font-semibold text-white">
            Current Progress: Week {currentWeek + 1}, Day {currentDay + 1}
          </span>
          <span className="text-base text-gray-400">
            Daily Volume:{" "}
            {formatVolume(calculateDailyTotal(selectedWeek, selectedDay))}
          </span>
        </div>
        {!lockPreviousTabs && 
<>
        <div className="mb-4">
          <div className="flex">
            {workoutData.weekNames.map((weekName, index) => (
              <TabButton
                key={index}
                active={selectedWeek === index}
                onClick={() => {
                  setSelectedWeek(index);
                  setSelectedDay(
                    lockPreviousTabs && index === currentWeek ? currentDay : 0
                  );
                }}
                disabled={!isWeekAccessible(index)}
              >
                {weekName}
              </TabButton>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <div className="flex">
            {workoutData.dayNames.map((dayName, index) => (
              <TabButton
                key={index}
                active={selectedDay === index}
                onClick={() => setSelectedDay(index)}
                disabled={!isDayAccessible(selectedWeek, index)}
              >
                {dayName}
              </TabButton>
            ))}
          </div>
        </div>
        </>}
        </div>


        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
        {warningMessage && (
          <div className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
            {warningMessage}
          </div>
        )}
        <div className="space-y-4">
          {workoutData.workoutPlan[selectedWeek][selectedDay].exercises.map(
            (exercise, exerciseIndex) => {
              const isEnabled = isExerciseEnabled(
                selectedWeek,
                selectedDay,
                exerciseIndex
              );
              const key = `${selectedWeek}-${selectedDay}-${exerciseIndex}`;
              const warning = setWarnings[key];
              return (
                <div key={exerciseIndex}>
                  <div className={`p-3 my-3 bg-gray-800 rounded-xl`}>
                    <div className={`flex p-2 "bg-gray-900 gap-x-4 rounded-xl`}>
                      <div className="min-w-[50px] min-h-[50px] max-h-[50px] max-w-[50px] overflow-hidden">
                        <Image
                          src={exercise.gifUrl}
                          alt={exercise.name}
                          width={50}
                          height={50}
                          className="object-cover rounded-full max-w-[50px] max-h-50px]"
                          onClick={() => {
                            setSelectedExercise(exercise);
                            handleOpenClose();
                          }}
                        />
                      </div>
                      <div className="text-conatiner w-100">
                        <p
                          className={`text-gray-400`}
                          onClick={() => {
                            setSelectedExercise(exercise);
                            handleOpenClose();
                          }}
                        >
                          {_.upperFirst(exercise.name)}
                        </p>
                        <div className="flex items-center justify-between ">
                          <div
                            className={`flex items-center gap-x-4 text-white`}
                          >
                            <p className="text-sm font-semibold ">
                              Target: {_.upperFirst(exercise.target)}
                            </p>
                            <p className="text-sm font-semibold">
                              {" "}
                              Sets :{" "}
                              {
                                exercise?.weeklySetConfig?.find(
                                  (i) => i?.isConfigured
                                )?.sets
                              }
                            </p>
                            {/* <p className="text-sm font-semibold text-white">
                            {" "}
                            TV : {formatVolume(
                          calculateExerciseTotal(
                            selectedWeek,
                            selectedDay,
                            exerciseIndex
                          ),
                          exercise.equipment
                        )}
                        {exercise.equipment === "body weight" &&
                          ` (based on ${USER_WEIGHT_KG}kg body weight)`}
                          </p> */}
                          </div>
                          {!isEntirePlanCompleted() && (
                            <i
                              className="text-xl text-white cursor-pointer fa-solid fa-circle-plus"
                              onClick={() =>
                                {addExerciseDetails(
                                  selectedWeek,
                                  selectedDay,
                                  exerciseIndex
                                );
                                }
                              }
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    {warning && (
                      <div className="text-sm text-amber-600">{warning}</div>
                    )}
                    {exerciseDetails[
                      `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                    ]?.map((detail, detailIndex) => {
                      const timerKey = `${selectedWeek}-${selectedDay}-${exerciseIndex}-${detailIndex}`;

                      const isSetEnabled =
                        isEnabled &&
                        isSetEnabledFunc(
                          selectedWeek,
                          selectedDay,
                          exerciseIndex,
                          detailIndex
                        );
                      const setVolume = detail.isCompleted
                        ? calculateSetVolume(
                            exercise.equipment === "body weight"
                              ? USER_WEIGHT_KG
                              : detail.weight,
                            detail.reps,
                            exercise.equipment
                          )
                        : 0;

                      return (
                        <div key={detailIndex}>
                          <div className="flex items-center justify-between mt-3 mb-1 overflow-hidden gap-x-3">
                            <div className="flex gap-x-1 w-100">
                              {exercise.equipment !== "body weight" &&
                                exercise.equipment !== "band" && (
                                  <input
                                    type="number"
                                    placeholder="weight"
                                    className="px-3 py-2 text-white bg-gray-700 outline-none rounded-xl w-100"
                                    disabled={
                                      detail.isCompleted || !isSetEnabled
                                    }
                                    value={detail.weight}
                                    onChange={(e) =>
                                      updateExerciseDetail(
                                        selectedWeek,
                                        selectedDay,
                                        exerciseIndex,
                                        detailIndex,
                                        "weight",
                                        e.target.value
                                      )
                                    }
                                    min={1}
                                  />
                                )}
                              <input
                                type="number"
                                placeholder="reps"
                                className="px-3 py-2 text-white bg-gray-700 outline-none rounded-xl w-100"
                                value={detail.reps}
                                onChange={(e) =>
                                  updateExerciseDetail(
                                    selectedWeek,
                                    selectedDay,
                                    exerciseIndex,
                                    detailIndex,
                                    "reps",
                                    e.target.value
                                  )
                                }
                                disabled={detail.isCompleted || !isSetEnabled}
                                min={1}
                              />
                            </div>
                            {
                            <div className="flex items-center gap-x-3">
                              {!detail?.isCompleted && detail.reps && (
                                <>
                                  {timerIntervals.current[timerKey] ===
                                    undefined && (
                                      <>
                                      {EditToggle &&
                                    <i
                                      className="text-red-500 cursor-pointer fa-solid fa-play"
                                      disabled={!isSetEnabled}
                                      onClick={() =>
                                        {startSetTimer(
                                          selectedWeek,
                                          selectedDay,
                                          exerciseIndex,
                                          detailIndex
                                        );setToggleCheck(true)}
                                      }
                                    />}
                                    </>
                                  )}
                                </>
                              )}
                              {!detail.isCompleted ? (
                                <>
                                {isSetEnabled && toggleCheck && <i
                                  className={`text-white cursor-pointer fa-solid fa-check`}
                                  onClick={() => {
                                    saveExerciseSet(
                                      selectedWeek,
                                      selectedDay,
                                      exerciseIndex,
                                      detailIndex
                                    );
                                    setToggleCheck(false);
                                    setEditToggle(true)
                                  }}
                                  disabled={!isSetEnabled}
                                />}
                                
                                </>
                              ) : (
                                <button
                                  className={`text-white cursor-pointer`}
                                  onClick={() =>
                                    {editExerciseSet(
                                      selectedWeek,
                                      selectedDay,
                                      exerciseIndex,
                                      detailIndex
                                    );
                                    setToggleCheck(true);
                                    setEditToggle(false)
                                    setEditValue("edit")
                                    }
                                    
                                  }
                                >
                                  ✎
                                </button>
                              )}
                              {workoutData?.setUpdate && 
                              <>
                              {!detail?.isCompleted && editValue !== "edit" && <i
                                className="text-red-500 cursor-pointer fa-solid fa-circle-xmark"
                                onClick={() =>
                                  {removeExerciseDetail(
                                    selectedWeek,
                                    selectedDay,
                                    exerciseIndex,
                                    detailIndex
                                  );stopSetTimer(selectedWeek,
                                    selectedDay,
                                    exerciseIndex,
                                    detailIndex);setSetTimers({})
                                    setToggleCheck(false)}
                                }
                              />}
                              </>}
                              
                            </div>
                            }
                          </div>
                          <div
                            className={`flex items-center pb-2 text-white cursor-pointer`}
                          >
                            {setTimers[timerKey] !== undefined &&
                              !detail.isCompleted && (
                                <>
                                  <p>
                                    <i className="mr-2 font-semibold fa-duotone fa-solid fa-timer "></i>
                                  </p>
                                  <p className="pr-3 text-xs whitespace-nowrap">
                                    {formatSetTimer(setTimers[timerKey])} sec
                                  </p>
                                </>
                              )}
                            {detail.isCompleted && (
                              <>
                                <p>
                                  <i className="mr-2 font-semibold text-white fa-duotone fa-solid fa-timer "></i>
                                </p>
                                <p className="pr-3 text-xs text-gray-300 whitespace-nowrap">
                                  {formatSetTimer(
                                    workoutData?.exerciseHistory[
                                      `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                                    ]?.[detailIndex]?.duration
                                  )}{" "}
                                  Sec
                                </p>
                              </>
                            )}
                            {detail?.isCompleted && (
                              <>
                                {workoutData?.exerciseHistory[
                                  `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                                ][detailIndex]?.restTime && (
                                  <>
                                    {" "}
                                    <p>
                                      <i className="pr-2 font-semibold text-white fa-solid fa-person-seat"></i>
                                    </p>
                                    <p className="pr-3 text-xs text-gray-300 whitespace-nowrap">
                                      {formatTime(
                                        workoutData.exerciseHistory[
                                          `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                                        ][detailIndex].restTime
                                      )}{" "}
                                      sec
                                    </p>
                                  </>
                                )}
                              </>
                            )}

                            {detail.isCompleted && (
                              <>
                                <p>
                                  <i class="fa-duotone fa-solid fa-weight-hanging  font-semibold text-white whitespace-nowrap pr-2"></i>
                                </p>
                                <p className="text-xs text-gray-300 whitespace-nowrap">
                                  {formatVolume(setVolume, exercise.equipment)}
                                </p>
                              </>
                            )}
                            {/* {detail?.isCompleted && (
                          <div className="ml-2">
                            <span className="text-sm text-green-800">
                              Performed on: (
                              {handleDate(
                                workoutData?.exerciseHistory[
                                  `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                                ]?.[detailIndex]?.date?.fullDate
                              )}
                              )
                            </span>
                          </div>
                        )} */}
                          </div>
                        </div>
                      );
                    })}
                    {selectedWeek > 0 &&
                      getPreviousRecord(
                        selectedWeek,
                        selectedDay,
                        exerciseIndex
                      ) && (
                        <div className="mt-2 text-sm text-gray-300">
                          Previous:{" "}
                          {getPreviousRecord(
                            selectedWeek,
                            selectedDay,
                            exerciseIndex
                          ).map((set, index) => (
                            <span key={index}>
                              {set.weight && `${set.weight} kg x `}
                              {set.reps} reps
                              {index <
                              getPreviousRecord(
                                selectedWeek,
                                selectedDay,
                                exerciseIndex
                              ).length -
                                1
                                ? ", "
                                : ""}
                            </span>
                          ))}
                        </div>
                      )}

                    {isTimerRunning &&
                      activeExerciseSet?.exercise === exerciseIndex && (
                        <div className="flex items-center justify-center gap-x-4">
                          <button
                            onClick={stopTimer}
                            className="px-3 py-2 mt-3 text-sm font-semibold text-white bg-red-500 rounded-full"
                            disabled={!EditToggle}
                          >
                            <i className="mr-3 fa-solid fa-circle-stop"></i>Stop
                            &nbsp;({formatTime(elapsedTime)})
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              );
            }
          )}
        </div>

        {/* Next Day/Week Button */}
        {!isEntirePlanCompleted() && (
          <>
            {isDayCompleted(selectedWeek, selectedDay) &&
              (selectedDay < workoutData.daysPerWeek - 1 ||
                selectedWeek < workoutData.weeks - 1) && (
                <button
                  onClick={() => {
                    lockPreviousTabs && moveToNextDay();

                    router.push("/SavedPlan");
                  }}
                  className="float-right px-6 py-2 mt-4 mb-2 text-white bg-black rounded-lg"
                >
                  {/* {selectedDay < workoutData.daysPerWeek - 1
              ? `Next Day (${workoutData.dayNames[selectedDay + 1]})`
              : `Next Week (${workoutData.weekNames[selectedWeek + 1]}, ${
                  workoutData.dayNames[0]
                })`} */}
                  Complete Workout
                </button>
              )}
          </>
        )}

        {isEntirePlanCompleted() && (
          <button
            onClick={() => finishPlan()}
            className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
          >
            Finish Plan
          </button>
        )}

        <OffCanvasComp
          placement="end"
          name="savePlan"
          showProps={show}
          handleClose={handleOpenClose}
          customStyle="pl-4 py-4"
        >
          <ExerciseDeatil
            handleClose={handleOpenClose}
            data={selectedExercise}
          />
        </OffCanvasComp>
        </div>
      </div>
      
    </>
  );
};

export default PlanDetail;
