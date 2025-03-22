"use client";
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useCallback,
} from "react";
import _ from "lodash";
import OffCanvasComp from "@/components/OffCanvas/OffCanvasComp";
import ExerciseDeatil from "./ExerciseDeatil";
import { useRouter } from "next/navigation";
import { calculateProgress, handleDate } from "@/utils";
import Image from "next/image";
import { GlobalContext } from "@/context/GloablContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { getExercisesGif } from "@/service/exercise";
import toast from "react-hot-toast";
import CaloriesBurnt from "./CaloriesBurnt";

// Import Swiper React components
import { Swiper, SwiperSlide } from "swiper/react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/scrollbar";
// import required modules
import {  Pagination } from "swiper/modules";

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
  const {
    userId,
    plansRefetch,
    latestWeight,
    handleOpenClose: menuOpenClose,
  } = useContext(GlobalContext);

  const USER_WEIGHT_KG = latestWeight?.userWeights;

  const router = useRouter();
  const initializedRef = useRef(false);
  const [workoutData, setWorkoutData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentDay, setCurrentDay] = useState(0);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [selectedExercise, setSelectedExercise] = useState(null);

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const selectedPlanId = decodeURIComponent(params?.plan);

  // Store timer state in localStorage to persist across refreshes
  useEffect(() => {
    // Load timer state from localStorage on component mount
    const savedTimerState = localStorage.getItem(
      `timerState_${selectedPlanId}`
    );
    if (savedTimerState) {
      const timerState = JSON.parse(savedTimerState);
      setIsTimerRunning(timerState.isRunning);
      setElapsedTime(timerState.elapsedTime);
      setActiveExerciseSet(timerState.activeExerciseSet);
    }
  }, [selectedPlanId]);

  // Save timer state to localStorage whenever it changes
  useEffect(() => {
    if (activeExerciseSet) {
      localStorage.setItem(
        `timerState_${selectedPlanId}`,
        JSON.stringify({
          isRunning: isTimerRunning,
          elapsedTime: elapsedTime,
          activeExerciseSet: activeExerciseSet,
        })
      );
    } else if (!isTimerRunning) {
      // Clear timer state when timer is stopped
      localStorage.removeItem(`timerState_${selectedPlanId}`);
    }
  }, [isTimerRunning, elapsedTime, activeExerciseSet, selectedPlanId]);

  const fetchWorkoutPlan = async () => {
    setError(null);

    try {
      if (!userId) {
        setError("Loading...");
        return;
      }

      const planRef = doc(db, "workoutPlans", selectedPlanId);
      const planDoc = await getDoc(planRef);

      if (!planDoc.exists()) {
        setError("Workout plan not found.");
        return;
      }

      const data = planDoc.data();

      if (!data || !data.workoutPlanDB) {
        setError("Workout plan not found.");
        return;
      }

      // Create a deep copy of the data to avoid modifying the original
      const parsedData = {
        ...data.workoutPlanDB,
        id: planDoc.id,
        name: data.workoutPlanDB.name,
        progress: 0,
        workoutPlan: null,
        exerciseHistory: null,
      };

      // Parse the JSON strings if they exist
      try {
        // Check if workoutPlan is a string before parsing
        if (typeof data.workoutPlanDB.workoutPlan === "string") {
          parsedData.workoutPlan = JSON.parse(data.workoutPlanDB.workoutPlan);
        } else {
          // If it's already an object, use it as is
          parsedData.workoutPlan = data.workoutPlanDB.workoutPlan;
        }

        // Check if exerciseHistory is a string before parsing
        if (typeof data.workoutPlanDB.exerciseHistory === "string") {
          parsedData.exerciseHistory = JSON.parse(
            data.workoutPlanDB.exerciseHistory
          );
        } else {
          // If it's already an object, use it as is
          parsedData.exerciseHistory = data.workoutPlanDB.exerciseHistory;
        }
      } catch (err) {
        console.error("Error parsing workout plan:", err);
        setError("Failed to parse workout plan.");
        return;
      }

      const progress = calculateProgress(parsedData);
      parsedData.progress = progress;

      setWorkoutData(parsedData);

      // Rest of your initialization code...
      const initialExerciseDetails = {};
      if (parsedData.exerciseHistory) {
        Object.entries(parsedData?.exerciseHistory).forEach(([key, sets]) => {
          initialExerciseDetails[key] = sets?.map((set) => ({
            ...set,
            isCompleted: true,
            restTime: set?.restTime || null,
          }));
        });
      }

      // Initialize exercise details...
      parsedData.workoutPlan.forEach((week, weekIndex) => {
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

      // Handle position setting...
      const lastPosition = localStorage.getItem(
        `lastPosition_${parsedData.name}`
      );
      if (lastPosition) {
        const { week, day } = JSON.parse(lastPosition);
        setSelectedWeek(week);
        setSelectedDay(day);
        setCurrentWeek(week);
        setCurrentDay(day);
      } else {
        let foundPosition = false;
        for (let w = 0; w < parsedData.weeks; w++) {
          for (let d = 0; d < parsedData.daysPerWeek; d++) {
            if (!isDayCompleted(w, d, parsedData)) {
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

      // Handle rest time...
      if (progress !== 100) {
        if (!localStorage.getItem(`restTime_${parsedData.name}`)) {
          const userRestTime = prompt(
            "Do you want to set a rest time for each set? If yes, enter the time in seconds:"
          );
          if (userRestTime && !isNaN(userRestTime)) {
            setRestTime(parseInt(userRestTime));
            localStorage.setItem(`restTime_${parsedData.name}`, userRestTime);
          }
        } else {
          setRestTime(
            parseInt(localStorage.getItem(`restTime_${parsedData.name}`))
          );
        }
      }
    } catch (err) {
      console.error("Unexpected error during fetch:", err);
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const checkSetWarnings = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const exercise =
      workoutData?.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    const configuredSets =
      exercise?.weeklySetConfig?.find((i) => i?.isConfigured)?.sets || 0;
    const currentSets = exerciseDetails[key]?.length || 0;

    if (currentSets === 0 && configuredSets > 0) {
      const updatedWarnings = { ...setWarnings };
      updatedWarnings[
        key
      ] = `This exercise is configured for ${configuredSets} sets.`;
      setSetWarnings(updatedWarnings);
    } else {
      const updatedWarnings = { ...setWarnings };
      delete updatedWarnings[key];
      setSetWarnings(updatedWarnings);
    }
  };

  const calculateSetVolume = (weight, reps, equipment) => {
    if (!weight || !reps) return 0;

    const weightInKg = Number(weight);
    const numberOfReps = Number(reps);

    if (equipment === "body weight") {
      return USER_WEIGHT_KG * numberOfReps;
    } else if (equipment === "band") {
      return numberOfReps;
    } else {
      return weightInKg * numberOfReps;
    }
  };

  const calculateExerciseTotal = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const sets = workoutData?.exerciseHistory[key] || [];
    const exercise =
      workoutData?.workoutPlan[weekIndex][dayIndex]?.exercises[exerciseIndex];

    let total = 0;
    sets.forEach((set) => {
      if (exercise.equipment === "body weight") {
        total += calculateSetVolume(
          USER_WEIGHT_KG,
          set?.reps,
          exercise?.equipment
        );
      } else {
        total += calculateSetVolume(
          set?.weight,
          set?.reps,
          exercise?.equipment
        );
      }
    });
    return total;
  };

  const calculateDailyTotal = (weekIndex, dayIndex) => {
    const exercises =
      workoutData?.workoutPlan?.[weekIndex]?.[dayIndex]?.exercises || [];
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
    if (!initializedRef.current) {
      initializedRef.current = true;
      fetchWorkoutPlan();
    }

    return () => {
      initializedRef.current = false;
    };
  }, [params?.plan, userId]);

  useEffect(() => {
    if (workoutData) {
      workoutData?.workoutPlan?.[selectedWeek]?.[
        selectedDay
      ]?.exercises?.forEach((exercise, exerciseIndex) => {
        addExerciseDetails(selectedWeek, selectedDay, exerciseIndex, true);
      });
    }
  }, [selectedWeek, selectedDay, workoutData]);

  useEffect(() => {
    if (workoutData) {
      localStorage.setItem(
        `lastPosition_${workoutData.name}`,
        JSON.stringify({
          week: currentWeek,
          day: currentDay,
        })
      );
    }
  }, [currentWeek, currentDay, workoutData]);

  // Modified timer effect to handle page refreshes
  useEffect(() => {
    let timer;
    if (isTimerRunning) {
      timer = setInterval(() => {
        setElapsedTime((prevTime) => {
          const newTime = prevTime + 1;
          // Update localStorage with current elapsed time
          if (activeExerciseSet) {
            const timerState = JSON.parse(
              localStorage.getItem(`timerState_${selectedPlanId}`) || "{}"
            );
            localStorage.setItem(
              `timerState_${selectedPlanId}`,
              JSON.stringify({
                ...timerState,
                elapsedTime: newTime,
              })
            );
          }
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [isTimerRunning, selectedPlanId, activeExerciseSet]);

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

    const updatedWorkoutData = { ...workoutData };
    if (!updatedWorkoutData.exerciseHistory) {
      updatedWorkoutData.exerciseHistory = {};
    }
    if (!updatedWorkoutData.exerciseHistory[key]) {
      updatedWorkoutData.exerciseHistory[key] = [];
    }
    if (!updatedWorkoutData.exerciseHistory[key][set]) {
      updatedWorkoutData.exerciseHistory[key][set] = {};
    }

    if (!updatedWorkoutData.exerciseHistory[key][set]?.restTime) {
      updatedWorkoutData.exerciseHistory[key][set] = {
        ...updatedWorkoutData.exerciseHistory[key][set],
        restTime: elapsedTime,
      };
      updateWorkoutData(updatedWorkoutData);
      const updatedExerciseDetails = { ...exerciseDetails };
      if (!updatedExerciseDetails[key]) {
        updatedExerciseDetails[key] = [];
      }
      if (!updatedExerciseDetails[key][set]) {
        updatedExerciseDetails[key][set] = {};
      }
      updatedExerciseDetails[key][set].restTime = elapsedTime;
      setExerciseDetails(updatedExerciseDetails);
    }

    setIsTimerRunning(false);
    setElapsedTime(0);
    setActiveExerciseSet(null);
    setWarningMessage("");
    setEditToggle(true);

    // Clear timer state from localStorage
    localStorage.removeItem(`timerState_${selectedPlanId}`);

    // Refresh data after stopping timer
    fetchWorkoutPlan();
  };

  const areAllSetsValid = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const sets = exerciseDetails[key];

    if (!sets || sets.length === 0) return true;

    return sets.every((set) => {
      if (set.isCompleted) return true;

      const exercise =
        workoutData?.workoutPlan?.[weekIndex]?.[dayIndex]?.exercises?.[
          exerciseIndex
        ];
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

  const isAllExercisesInDayCompleted = () => {
    const exercises =
      workoutData?.workoutPlan?.[selectedWeek]?.[selectedDay]?.exercises || [];
    if (exercises?.length === 0) {
      return false;
    }

    return exercises.every((_, exerciseIndex) => {
      const key = `${selectedWeek}-${selectedDay}-${exerciseIndex}`;
      return (
        workoutData?.exerciseHistory[key] &&
        workoutData?.exerciseHistory[key].length > 0 &&
        exerciseDetails[key]?.every((set) => set.isCompleted)
      );
    });
  };

  const isExerciseCompleted = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    return (
      workoutData?.exerciseHistory[key] &&
      workoutData?.exerciseHistory[key].length > 0
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

  const moveToNextDay = (skip) => {
    const currentDayExercises =
      workoutData.workoutPlan[currentWeek][currentDay].exercises;
    if (!skip) {
      const hasInvalidSets = currentDayExercises.some(
        (_, index) => !areAllSetsValid(currentWeek, currentDay, index)
      );

      if (hasInvalidSets) {
        setWarningMessage(
          "Please complete or remove all empty sets before proceeding."
        );
        return;
      }
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
      `lastPosition_${workoutData.name}`,
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
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const updatedExerciseDetails = { ...exerciseDetails };

    if (!updatedExerciseDetails[key]) {
      updatedExerciseDetails[key] = [];
    }

    const exercise =
      workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    const configuredSets =
      exercise?.weeklySetConfig?.find((i) => i?.isConfigured)?.sets || 0;

    let setsAdded = 0; // Keep track of how many sets we are adding
    if (autoAdd) {
      const setsToAdd = configuredSets - updatedExerciseDetails[key].length;
      if (!workoutData?.setUpdate) {
        for (let i = 0; i < setsToAdd; i++) {
          updatedExerciseDetails[key].push({
            weight: "",
            reps: "",
            isCompleted: false,
          });
        }
        setsAdded = setsToAdd; // Keep track of added sets for update
      }
    } else {
      updatedExerciseDetails[key].push({
        weight: "",
        reps: "",
        isCompleted: false,
      });
      setsAdded = 1; // Keep track of added sets for update
    }

    setExerciseDetails(updatedExerciseDetails);

    // Update workoutPlan.exercises.weeklySetConfig
    const updatedWorkoutData = { ...workoutData };
    let setsChanged = false;

    if (
      updatedWorkoutData.workoutPlan &&
      updatedWorkoutData.workoutPlan[weekIndex] &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex] &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
        exerciseIndex
      ]
    ) {
      const exerciseToUpdate =
        updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
          exerciseIndex
        ];
      const weeklySetConfig = exerciseToUpdate.weeklySetConfig || [];
      const currentSets =
        weeklySetConfig.find((i) => i?.isConfigured)?.sets || 0;
      const newSetCount = updatedExerciseDetails[key].length;

      if (currentSets !== newSetCount) {
        // Update the sets value
        weeklySetConfig.forEach((config, index) => {
          config.isConfigured = index === 0; // Ensure only the first one remains configured
          if (index === 0) {
            config.sets = newSetCount; // Update the sets count
          }
        });

        setsChanged = true; // Indicate sets were changed
      }
    }

    if (setsChanged) {
      updateWorkoutData(updatedWorkoutData);
    }

    setWarningMessage("");
    checkSetWarnings(weekIndex, dayIndex, exerciseIndex);
  };

  const isSetEnabledFunc = (weekIndex, dayIndex, exerciseIndex, setIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const sets = exerciseDetails[key];

    if (setIndex === 0) return true;

    const previousSet = sets[setIndex - 1];
    if (!previousSet?.isCompleted) return false;

    if (
      isTimerRunning &&
      activeExerciseSet?.week === weekIndex &&
      activeExerciseSet?.day === dayIndex &&
      activeExerciseSet?.exercise === exerciseIndex &&
      activeExerciseSet?.set === setIndex - 1
    ) {
      return false;
    }

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
    if (!updatedExerciseDetails[key]) {
      updatedExerciseDetails[key] = [];
    }
    if (!updatedExerciseDetails[key][detailIndex]) {
      updatedExerciseDetails[key][detailIndex] = {};
    }
    updatedExerciseDetails[key][detailIndex][field] = value;
    setExerciseDetails(updatedExerciseDetails);
    setWarningMessage("");
  };

  const updateWorkoutData = async (updatedWorkoutData) => {
    // Create a deep copy to avoid modifying the original data
    const workoutDataUpdate = {
      ...updatedWorkoutData,
      workoutPlan:
        typeof updatedWorkoutData.workoutPlan === "string"
          ? updatedWorkoutData.workoutPlan
          : JSON.stringify(updatedWorkoutData.workoutPlan),
      exerciseHistory:
        typeof updatedWorkoutData.exerciseHistory === "string"
          ? updatedWorkoutData.exerciseHistory
          : JSON.stringify(updatedWorkoutData.exerciseHistory),
    };

    try {
      const workoutPlanRef = doc(db, "workoutPlans", updatedWorkoutData.id);
      await updateDoc(workoutPlanRef, {
        workoutPlanDB: workoutDataUpdate,
      });

      // Update local state with the original object (not stringified)
      setWorkoutData(updatedWorkoutData);
    } catch (err) {
      console.error("Error during update:", err);
      setError("Failed to update workout plan.");
    }
  };

  const removeExerciseDetail = async (
    weekIndex,
    dayIndex,
    exerciseIndex,
    detailIndex
  ) => {
    await new Promise((resolve) => {
      setSetTimers((prevSetTimers) => {
        const updatedTimers = { ...prevSetTimers };
        const timerKey = `${weekIndex}-${dayIndex}-${exerciseIndex}-${detailIndex}`;
        delete updatedTimers[timerKey];

        resolve(updatedTimers);
        return updatedTimers;
      });
    });

    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const updatedExerciseDetails = { ...exerciseDetails };
    if (updatedExerciseDetails[key]) {
      updatedExerciseDetails[key].splice(detailIndex, 1);
    }
    setExerciseDetails(updatedExerciseDetails);

    const updatedWorkoutData = { ...workoutData };
    if (!updatedWorkoutData.exerciseHistory) {
      updatedWorkoutData.exerciseHistory = {};
    }

    if (updatedWorkoutData.exerciseHistory[key]) {
      // Remove the entry from exerciseHistory
      const updatedHistory = [...updatedWorkoutData.exerciseHistory[key]]; // Create a copy
      updatedHistory.splice(detailIndex, 1);

      if (updatedHistory.length === 0) {
        delete updatedWorkoutData.exerciseHistory[key];
      } else {
        updatedWorkoutData.exerciseHistory[key] = updatedHistory;
      }
    }

    // Update weeklySetConfig.sets here
    if (
      updatedWorkoutData.workoutPlan &&
      updatedWorkoutData.workoutPlan[weekIndex] &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex] &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
        exerciseIndex
      ] &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
        exerciseIndex
      ].weeklySetConfig &&
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
        exerciseIndex
      ].weeklySetConfig[0]
    ) {
      const currentSets =
        updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
          exerciseIndex
        ].weeklySetConfig[0].sets;
      updatedWorkoutData.workoutPlan[weekIndex][dayIndex].exercises[
        exerciseIndex
      ].weeklySetConfig[0].sets = Math.max(0, currentSets - 1); // Ensure sets don't go below 0
    }
    updateWorkoutData(updatedWorkoutData);

    setWarningMessage("");
    checkSetWarnings(weekIndex, dayIndex, exerciseIndex);
  };

  useEffect(() => {
    if (workoutData && selectedWeek !== null && selectedDay !== null) {
      workoutData?.workoutPlan?.[selectedWeek]?.[
        selectedDay
      ]?.exercises?.forEach((_, exerciseIndex) => {
        checkSetWarnings(selectedWeek, selectedDay, exerciseIndex);
      });
    }
  }, [exerciseDetails, selectedWeek, selectedDay, workoutData]);

  const saveExerciseSet = async (
    weekIndex,
    dayIndex,
    exerciseIndex,
    detailIndex
  ) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const details = exerciseDetails[key];
    const exercise =
      workoutData?.workoutPlan?.[weekIndex]?.[dayIndex]?.exercises?.[
        exerciseIndex
      ];

    const isBodyWeightOrBand =
      exercise?.equipment === "body weight" || exercise?.equipment === "band";
    const isValidSet =
      details?.[detailIndex]?.reps &&
      (isBodyWeightOrBand || details?.[detailIndex]?.weight);

    if (isValidSet) {
      const currentDate = new Date();

      const updatedWorkoutData = { ...workoutData };
      let updatedHistory = updatedWorkoutData?.exerciseHistory || {};
      if (!updatedHistory[key]) {
        updatedHistory[key] = [];
      }
      if (!updatedHistory[key][detailIndex]) {
        updatedHistory[key][detailIndex] = {};
      }
      const existingDuration = updatedHistory[key][detailIndex]?.duration || 0;
      updatedHistory[key][detailIndex] = {
        weight: details[detailIndex].weight,
        reps: details[detailIndex].reps,
        restTime: null,
        duration: existingDuration,
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

      if (editValue === "edit") {
        await updateWorkoutData(updatedWorkoutData);
      } else {
        stopSetTimer(weekIndex, dayIndex, exerciseIndex, detailIndex);
        await updateWorkoutData(updatedWorkoutData);
        startTimer(weekIndex, dayIndex, exerciseIndex, detailIndex);
      }

      const updatedExerciseDetails = { ...exerciseDetails };
      if (!updatedExerciseDetails[key]) {
        updatedExerciseDetails[key] = [];
      }
      if (!updatedExerciseDetails[key][detailIndex]) {
        updatedExerciseDetails[key][detailIndex] = {};
      }
      updatedExerciseDetails[key][detailIndex].isCompleted = true;
      setExerciseDetails(updatedExerciseDetails);

      setWorkoutData(updatedWorkoutData);

      setWarningMessage("");
    } else {
      setWarningMessage(
        "Please fill in all required fields before saving the set."
      );
    }
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
    if (!updatedExerciseDetails[key]) {
      updatedExerciseDetails[key] = [];
    }
    if (!updatedExerciseDetails[key][detailIndex]) {
      updatedExerciseDetails[key][detailIndex] = {};
    }
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

  const finishPlan = async () => {
    try {
      const workoutDataUpdate = {
        ...workoutData,
        workoutPlan:
          typeof workoutData.workoutPlan === "string"
            ? workoutData.workoutPlan
            : JSON.stringify(workoutData.workoutPlan),
        exerciseHistory:
          typeof workoutData.exerciseHistory === "string"
            ? workoutData.exerciseHistory
            : JSON.stringify(workoutData.exerciseHistory),
      };

      const workoutPlanRef = doc(db, "workoutPlans", workoutData.id);
      await updateDoc(workoutPlanRef, {
        workoutPlanDB: workoutDataUpdate,
      });

      localStorage.removeItem(`lastPosition_${workoutData.name}`);
      localStorage.removeItem(`restTime_${workoutData.name}`);
      localStorage.removeItem(`timerState_${selectedPlanId}`);
      router.push("/createPlanPage");
    } catch (error) {
      console.error("Error finishing plan:", error);
      setError("Failed to finish workout plan.");
    }
  };

  const startSetTimer = (weekIndex, dayIndex, exerciseIndex, setIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}-${setIndex}`;

    setSetTimers((prev) => ({
      ...prev,
      [key]: prev[key] || 0,
    }));

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

    if (timerIntervals.current[key]) {
      clearInterval(timerIntervals.current[key]);
      delete timerIntervals.current[key];
    }

    setSetTimers((prev) => {
      const setTimerDuration = prev[key] || 0;

      setWorkoutData((prevWorkoutData) => {
        const updatedWorkoutData = { ...prevWorkoutData };
        if (!updatedWorkoutData.exerciseHistory) {
          updatedWorkoutData.exerciseHistory = {};
        }
        if (!updatedWorkoutData.exerciseHistory[historyKey]) {
          updatedWorkoutData.exerciseHistory[historyKey] = [];
        }
        if (!updatedWorkoutData.exerciseHistory[historyKey][setIndex]) {
          updatedWorkoutData.exerciseHistory[historyKey][setIndex] = {};
        }

        updatedWorkoutData.exerciseHistory[historyKey][setIndex] = {
          ...updatedWorkoutData.exerciseHistory[historyKey][setIndex],
          duration: setTimerDuration,
        };
        return updatedWorkoutData;
      });

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

  const [brokenImages, setBrokenImages] = useState({});


  const getImage = async (id) => {
    try {
      const response = await getExercisesGif(id);
      return response;
    } catch (error) {
      console.error(`Error fetching image for ID ${id}:`, error);
      throw error;
    }
  };

  // const fetchImages = async () => {
  //   try {
  //     const exercises =
  //       workoutData?.workoutPlan?.[selectedWeek]?.[selectedDay]?.exercises;

  //     if (!Array.isArray(exercises)) {
  //       console.error("Exercises is not a valid array:", exercises);
  //       return;
  //     }

  //     const urls = { ...imageUrls };

  //     for (const exercise of exercises) {
  //       if (
  //         exercise?.id &&
  //         !processedIds.current.has(exercise.id) &&
  //         !brokenImages[exercise.id]
  //       ) {
  //         try {
  //           const formattedId = exercise.id.toString().padStart(4, "0"); // Ensure 4-digit ID

  //           const image = await getImage(formattedId);
  //           urls[exercise.id] = image;
  //           processedIds.current.add(exercise.id); // Mark as processed
  //         } catch (error) {
  //           console.error(
  //             `Error fetching image for exercise ID ${exercise.id}:`,
  //             error
  //           );
  //         }
  //       }
  //     }

  //     setImageUrls(urls); // Batch update the state
  //   } catch (error) {
  //     console.error("Error in fetchImages function:", error);
  //   }
  // };

  // useEffect(() => {
  //   if (workoutData) {
  //     fetchImages();
  //   }
  // }, [workoutData, selectedWeek, selectedDay]);

  // Handle broken images
  const handleImageError = (exerciseId) => {
    setBrokenImages((prev) => ({ ...prev, [exerciseId]: true }));
  };

  const skipSet = () => {
    toast(
      (t) => (
        <div className="">
          Are you sure you want to skip this set for the day?
          <div className="flex justify-between mt-2">
            <button
              className="px-2 py-1 w-[50%] text-white border-none bg-red-500"
              onClick={() => {
                toast.dismiss(t.id);
                moveToNextDay(true);
              }}
            >
              Yes, Skip
            </button>
            <button
              className="px-2 py-1 w-[50%] text-white border-none bg-tprimary"
              onClick={() => {
                toast.dismiss(t.id);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      {
        duration: 999999999,
        autoClose: false,
        hideProgressBar: true,
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-white">
        Loading...
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="p-4 text-red-700 bg-red-100 border border-red-400 rounded-md">
          {error}
        </div>
      </div>
    );
  }
  if (!workoutData)
    return (
      <div className="flex items-center justify-center h-screen text-white">
        No data found
      </div>
    );
  return (
    <>
      <div className="flex flex-col h-screen overflow-hidden bg-tprimary">
        <div className="top-0 p-3 pb-1 bg-black sticky-top">
          <div className="flex items-center justify-between my-2">
            <h1
              onClick={menuOpenClose}
              className="mb-6 text-2xl font-bold text-white"
            >
              {workoutData?.name}
            </h1>
            <p
              onClick={() => skipSet()}
              className="text-red-500 cursor-pointer "
            >
              Skip Week {currentWeek + 1}, Day {currentDay + 1}
            </p>
          </div>

          <CaloriesBurnt
            exerciseDetails={exerciseDetails}
            workoutData={workoutData}
            selectedWeek={selectedWeek}
            selectedDay={selectedDay}
            userWeight={latestWeight?.userWeights}
            selectedPlanId={selectedPlanId}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <span className="text-sm font-semibold text-white">
              Current Progress: Week {currentWeek + 1}, Day {currentDay + 1}
            </span>
            <span className="text-base text-gray-400">
              Daily Volume:
              {formatVolume(calculateDailyTotal(selectedWeek, selectedDay))}
            </span>
          </div>
        </div>

        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          {warningMessage && (
            <div className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
              {warningMessage}
            </div>
          )}

          {/* Swiper Component */}
          <Swiper
            modules={[Pagination]}
            spaceBetween={10}
            slidesPerView={1}
            pagination={{
              clickable: true,
              dynamicBullets: false,
              renderBullet: (index, className) => {
                return `<span class="${className} swiper-custom-bullet"></span>`;
              },
            }}
            className="w-full"
          >
            {workoutData?.workoutPlan?.[selectedWeek]?.[
              selectedDay
            ]?.exercises?.map((exercise, exerciseIndex) => {
              const isEnabled = isExerciseEnabled(
                selectedWeek,
                selectedDay,
                exerciseIndex
              );
              const key = `${selectedWeek}-${selectedDay}-${exerciseIndex}`;
              const warning = setWarnings[key];
              {/* const imageUrl = imageUrls[exercise?.id] || ""; */}

              return (
                <SwiperSlide key={exerciseIndex}>
                  <div className={`p-3 my-3 bg-gray-800 rounded-xl`}>
                    {/* Exercise Content - Existing Code Here */}
                    <div className={`flex p-2 "bg-gray-900 gap-x-4 rounded-xl`}>
                      <div className="min-w-[50px] min-h-[50px] max-h-[50px] max-w-[50px] overflow-hidden">
                        {/* {imageUrl && (
                          <Image
                            src={imageUrl || "/placeholder.svg"}
                            alt={exercise.name}
                            width={50}
                            height={50}
                            className="object-cover rounded-full max-w-[50px] max-h-50px] cursor-pointer"
                            onError={() => handleImageError(exercise.id)}
                            onClick={() => {
                              setSelectedExercise(exercise);
                            }}
                          />
                        )} */}
                      </div>
                      <div className="text-conatiner w-100">
                        <p
                          className={`text-gray-400`}
                          onClick={() => {
                            setSelectedExercise(exercise);
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
                              {exercise?.weeklySetConfig?.find(
                                (i) => i?.isConfigured
                              )?.sets ?? 0}
                            </p>
                          </div>
                          {
                            <i
                              className="text-xl text-white cursor-pointer fa-solid fa-circle-plus"
                              onClick={() => {
                                addExerciseDetails(
                                  selectedWeek,
                                  selectedDay,
                                  exerciseIndex
                                );
                              }}
                            />
                          }
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
                                        {
                                          <i
                                            className="p-2 px-3 text-red-500   cursor-pointer fa-solid fa-play text-[20px] bg-[#61616154] rounded-lg"
                                            disabled={!isSetEnabled}
                                            onClick={() => {
                                              startSetTimer(
                                                selectedWeek,
                                                selectedDay,
                                                exerciseIndex,
                                                detailIndex
                                              );
                                              setToggleCheck(true);
                                            }}
                                          />
                                        }
                                      </>
                                    )}
                                  </>
                                )}
                                {!detail.isCompleted ? (
                                  <>
                                    {isSetEnabled && toggleCheck && (
                                      <i
                                        className={`text-white cursor-pointer  p-2 px-3 fa-solid fa-check text-[20px] bg-[#61616154] rounded-lg`}
                                        onClick={() => {
                                          saveExerciseSet(
                                            selectedWeek,
                                            selectedDay,
                                            exerciseIndex,
                                            detailIndex
                                          );
                                          setToggleCheck(false);
                                          setEditToggle(true);
                                        }}
                                        disabled={!isSetEnabled}
                                      />
                                    )}
                                  </>
                                ) : (
                                  <i
                                    className="p-2 px-3 text-white  cursor-pointer fa-solid fa-pencil text-[20px] bg-[#61616154] rounded-lg"
                                    onClick={() => {
                                      editExerciseSet(
                                        selectedWeek,
                                        selectedDay,
                                        exerciseIndex,
                                        detailIndex
                                      );

                                      setToggleCheck(true);
                                      setEditToggle(false);
                                    }}
                                  />
                                )}

                                {workoutData?.setUpdate && (
                                  <>
                                    {!detail?.isCompleted &&
                                      editValue !== "edit" && (
                                        <i
                                          className="p-2 px-3 text-red-500 cursor-pointer fa-solid fa-circle-xmark text-[20px] bg-[#61616154] rounded-lg"
                                          onClick={async () => {
                                            await removeExerciseDetail(
                                              selectedWeek,
                                              selectedDay,
                                              exerciseIndex,
                                              detailIndex
                                            );
                                            stopSetTimer(
                                              selectedWeek,
                                              selectedDay,
                                              exerciseIndex,
                                              detailIndex
                                            );
                                          }}
                                        />
                                      )}
                                  </>
                                )}
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
                                    ]?.[detailIndex]?.duration || 0
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
                                  <i className="pr-2 font-semibold text-white fa-duotone fa-solid fa-weight-hanging whitespace-nowrap"></i>
                                </p>
                                <p className="text-xs text-gray-300 whitespace-nowrap">
                                  {formatVolume(setVolume, exercise.equipment)}
                                </p>
                              </>
                            )}
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
                            className="px-3 py-2 mt-3 text-sm font-semibold text-white bg-red-500 rounded-full w-100"
                            disabled={!EditToggle}
                          >
                            <i className="mr-3 fa-solid fa-circle-stop"></i>
                            Stop ({formatTime(elapsedTime)})
                          </button>
                        </div>
                      )}
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
          {/* End Swiper Component */}

          {!isTimerRunning && (
            <>
              {!isEntirePlanCompleted() && (
                <>
                  {isAllExercisesInDayCompleted() &&
                    (selectedDay < workoutData.daysPerWeek - 1 ||
                      selectedWeek < workoutData.weeks - 1) && (
                      <button
                        onClick={() => {
                          lockPreviousTabs && moveToNextDay();

                          router.push("/SavedPlan");
                          plansRefetch();
                          fetchWorkoutPlan();
                        }}
                        className="float-right px-6 py-2 mt-4 mb-2 text-white bg-black rounded-lg"
                      >
                        Complete Workout
                      </button>
                    )}
                </>
              )}
            </>
          )}
          {!isTimerRunning && (
            <>
              {isEntirePlanCompleted() && (
                <>
                  {isAllExercisesInDayCompleted() && (
                    <button
                      onClick={() => finishPlan()}
                      className="px-6 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700"
                    >
                      Finish Plan
                    </button>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default PlanDetail;
