"use client";
import React, { useState, useEffect, useRef } from "react";
import _ from "lodash";
import OffCanvasComp from "@/components/OffCanvas/OffCanvasComp";
import ExerciseDeatil from "./ExerciseDeatil";
import { useRouter } from "next/navigation";
import { handleDate } from "@/utils";

const TabButton = ({ active, onClick, children, disabled }) => (
  <button
    className={`px-4 py-2 mx-1 rounded-t-lg ${
      active
        ? "bg-black text-white border-b-2 border-red-500"
        : disabled
        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
        : "bg-gray-100 hover:bg-gray-200"
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
  const [restTimes, setRestTimes] = useState({});
  const [remainingTime, setRemainingTime] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(null);
  const [setWarnings, setSetWarnings] = useState({});

  const handleOpenClose = () => setShow(!show);
  const selectedPlanName = decodeURIComponent(params?.plan);

  const checkSetWarnings = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const exercise = workoutData?.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    const configuredSets = exercise?.weeklySetConfig?.find(i => i?.isConfigured)?.sets || 0;
    const currentSets = exerciseDetails[key]?.length || 0;

    if (currentSets < configuredSets) {
      const updatedWarnings = { ...setWarnings };
      updatedWarnings[key] = `This exercise is configured for ${configuredSets} sets, but currently has ${currentSets} sets.`;
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
            const configuredSets = exercise?.weeklySetConfig?.find(i => i?.isConfigured)?.sets || 0;
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
  }, [params?.plan, selectedPlanName, isDayCompleted]);
  useEffect(() => {
    if (workoutData) {
      workoutData.workoutPlan[selectedWeek][selectedDay].exercises.forEach((exercise, exerciseIndex) => {
        addExerciseDetails(selectedWeek, selectedDay, exerciseIndex, true);
      });
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
      const allSetsCompleted = exerciseSets.every(set => set.isCompleted);
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
    console.log("trigger")
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

  const addExerciseDetails = (weekIndex, dayIndex, exerciseIndex, autoAdd = false) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;

    if (!updatedExerciseDetails[key]) {
      updatedExerciseDetails[key] = [];
    }

    const exercise = workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    const configuredSets = exercise?.weeklySetConfig?.find(i => i?.isConfigured)?.sets || 0;

    if (autoAdd) {
      // Only add sets up to the configured amount during auto-add
      const setsToAdd = configuredSets - updatedExerciseDetails[key].length;
      for (let i = 0; i < setsToAdd; i++) {
        updatedExerciseDetails[key].push({
          weight: "",
          reps: "",
          isCompleted: false,
        });
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
      setWarningMessage("Please complete the previous exercise before updating this one.");
      return;
    }

    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    updatedExerciseDetails[key][detailIndex][field] = value;
    setExerciseDetails(updatedExerciseDetails);
    setWarningMessage("");
  };


  const removeExerciseDetail = (weekIndex, dayIndex, exerciseIndex, detailIndex) => {
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
      workoutData.workoutPlan[selectedWeek][selectedDay].exercises.forEach((_, exerciseIndex) => {
        checkSetWarnings(selectedWeek, selectedDay, exerciseIndex);
      });
    }
  }, [exerciseDetails, selectedWeek, selectedDay]);

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
      const currentDate = new Date();
      const updatedHistory = { ...workoutData.exerciseHistory };
      if (!updatedHistory[key]) {
        updatedHistory[key] = [];
      }

      updatedHistory[key][detailIndex] = {
        weight: details[detailIndex].weight,
        reps: details[detailIndex].reps,
        restTime: null,
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

      const updatedWorkoutData = {
        ...workoutData,
        exerciseHistory: updatedHistory,
      };
      localStorage.setItem(
        `workoutPlan_${workoutData.name}`,
        JSON.stringify(updatedWorkoutData)
      );
      setWorkoutData(updatedWorkoutData);

      const updatedExerciseDetails = { ...exerciseDetails };
      updatedExerciseDetails[key][detailIndex].isCompleted = true;
      setExerciseDetails(updatedExerciseDetails);
      setWarningMessage("");

      startTimer(weekIndex, dayIndex, exerciseIndex, detailIndex);
    } else {
      setWarningMessage(
        "Please fill in all required fields before saving the set."
      );
    }
  };
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
    localStorage.removeItem(
      `lastPosition_${selectedPlanName}`
    )
    localStorage.removeItem(`restTime_${selectedPlanName}`)
    router.push("/createPlanPage")
  }
  console.log("lockPreviousTabs", lockPreviousTabs);
  if (!workoutData) return <div>Loading...</div>;

  return (
    <div className="container p-4 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">{workoutData.name}</h1>

      {warningMessage && (
        <div className="relative px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
          {warningMessage}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <button
          onClick={toggleLockPreviousTabs}
          className={`px-4 py-2 rounded whitespace-nowrap  ${
            lockPreviousTabs
              ? "bg-red-500 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {lockPreviousTabs ? "Unlock Previous Tabs" : "Lock Previous Tabs"}
        </button>
        <span className="text-lg font-semibold">
          Current Progress: Week {currentWeek + 1}, Day {currentDay + 1}
        </span>
        <span className="text-base text-gray-600">
          Daily Volume:{" "}
          {formatVolume(calculateDailyTotal(selectedWeek, selectedDay))}
        </span>
      </div>

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

      <div className="space-y-4">
      {workoutData.workoutPlan[selectedWeek][selectedDay].exercises.map(
          (exercise, exerciseIndex) => {
            const isEnabled = isExerciseEnabled(selectedWeek, selectedDay, exerciseIndex);
            const key = `${selectedWeek}-${selectedDay}-${exerciseIndex}`;
            const warning = setWarnings[key];
            return (
              <div
                key={exerciseIndex}
                className={`p-4 mb-3 bg-white border rounded-lg shadow-sm ${
                  !isEnabled ? "opacity-50" : ""
                }`}
              >
              {warning && (
                  
                    <div className="text-sm text-amber-600">{warning}</div>
                  
                )}
                <div className="flex items-center gap-4">
                  <img
                    src={exercise.gifUrl}
                    alt={exercise.name}
                    className="object-cover w-16 h-16 rounded cursor-pointer"
                    onClick={() => {
                      setSelectedExercise(exercise);
                      handleOpenClose();
                    }}
                  />
                  <div className="flex-1">
                    <h3
                      className="text-lg font-semibold cursor-pointer"
                      onClick={() => {
                        setSelectedExercise(exercise);
                        handleOpenClose();
                      }}
                    >
                      {_.upperFirst(exercise.name)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Target: {exercise.target} ({" "}
                      {exercise?.weeklySetConfig?.find((i) => i?.isConfigured)
                        .sets}{" "}
                      sets )
                    </p>
                    <p className="text-sm font-medium text-gray-700">
                      Total Volume:{" "}
                      {formatVolume(
                        calculateExerciseTotal(
                          selectedWeek,
                          selectedDay,
                          exerciseIndex
                        ),
                        exercise.equipment
                      )}
                      {exercise.equipment === "body weight" &&
                        ` (based on ${USER_WEIGHT_KG}kg body weight)`}
                    </p>
                  </div>

                  <button
                    onClick={() =>
                      addExerciseDetails(
                        selectedWeek,
                        selectedDay,
                        exerciseIndex
                      )
                    }
                    className={`px-4 py-2 text-white bg-black rounded hover:bg-blue-600 ${
                      !isEnabled ? "cursor-not-allowed opacity-50" : ""
                    }`}
                    disabled={!isEnabled}
                  >
                    Add Set
                  </button>
                </div>

                {exerciseDetails[
                  `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                ]?.map((detail, detailIndex) => {
                  const isSetEnabled = isEnabled && isSetEnabledFunc(
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
                    <div
                      key={detailIndex}
                      className="flex items-center gap-2 mt-2"
                    >
                      {exercise.equipment !== "body weight" &&
                        exercise.equipment !== "band" && (
                          <input
                            type="number"
                            placeholder="Weight"
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
                            className={`w-24 p-2 border rounded ${
                              !detail.isCompleted && !detail.weight
                                ? "border-red-300"
                                : ""
                            } ${
                              !isSetEnabled
                                ? "bg-gray-100 cursor-not-allowed"
                                : ""
                            }`}
                            disabled={detail.isCompleted || !isSetEnabled}
                          />
                        )}
                      <input
                        type="number"
                        placeholder="Reps"
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
                        className={`w-24 p-2 border rounded ${
                          !detail.isCompleted && !detail.reps
                            ? "border-red-300"
                            : ""
                        } ${
                          !isSetEnabled ? "bg-gray-100 cursor-not-allowed" : ""
                        }`}
                        disabled={detail.isCompleted || !isSetEnabled}
                      />
                      {detail.isCompleted && (
                        <span className="ml-2 text-sm text-gray-600">
                          Volume:{" "}
                          {formatVolume(setVolume, exercise.equipment)}
                        </span>
                      )}
                      <i className="text-red-500 fa-solid fa-play" name="start"/><span >1 min 30 sec</span><i className="fa-solid fa-stop" name="stop"/>
                      {!detail.isCompleted ? (
                        <button
                          id="save-button"
                          onClick={() =>
                            saveExerciseSet(
                              selectedWeek,
                              selectedDay,
                              exerciseIndex,
                              detailIndex
                            )
                          }
                          className={`p-2 rounded-full ${
                            isSetEnabled
                              ? "text-green-500 hover:bg-green-600 hover:text-white"
                              : "text-gray-400 cursor-not-allowed"
                          }`}
                          title="Save Set"
                          disabled={!isSetEnabled}
                        >
                          ✓
                        </button>
                      ) : (
                        <button
                          id="edit-button"
                          onClick={() =>
                            editExerciseSet(
                              selectedWeek,
                              selectedDay,
                              exerciseIndex,
                              detailIndex
                            )
                          }
                          className="p-2 text-blue-500 rounded-full hover:bg-blue-600 hover:text-white"
                          title="Edit Set"
                        >
                          ✎
                        </button>
                      )}

                      <button
                        id="remove-button"
                        onClick={() =>
                          removeExerciseDetail(
                            selectedWeek,
                            selectedDay,
                            exerciseIndex,
                            detailIndex
                          )
                        }
                        className="p-2 text-red-500 rounded-full hover:bg-red-600 hover:text-white"
                        title="Remove Set"
                        // disabled={!isSetEnabled}
                      >
                        ×
                      </button>

                      {detail?.isCompleted && (
                        <div className="ml-2">
                          {workoutData.exerciseHistory[
                            `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                          ][detailIndex]?.restTime && (
                            <span className="text-sm text-gray-600">
                              Rest:{" "}
                              {formatTime(
                                workoutData.exerciseHistory[
                                  `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                                ][detailIndex].restTime
                              )}
                            </span>
                          )}
                        </div>
                      )}
                      {detail?.isCompleted && (
                        <div className="ml-2">
                          <span className="text-sm text-green-800">
                            Performed on: ({handleDate(workoutData?.exerciseHistory[
                                `${selectedWeek}-${selectedDay}-${exerciseIndex}`
                              ]?.[detailIndex]?.date?.fullDate)})
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {selectedWeek > 0 &&
                  getPreviousRecord(selectedWeek, selectedDay, exerciseIndex) && (
                    <div className="mt-2 text-sm text-gray-600">
                      Previous:{" "}
                      {getPreviousRecord(
                        selectedWeek,
                        selectedDay,
                        exerciseIndex
                      ).map((set, index) => (
                        <span key={index}>
                          {set.weight && `${set.weight} lbs x `}
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
                    <div className="flex items-center gap-4 mt-4">
                      <span className="text-xl font-bold">
                        Rest Time: {formatTime(elapsedTime)}
                      </span>
                      <button
                        onClick={stopTimer}
                        className="px-4 py-2 text-white bg-red-500 rounded hover:bg-red-600"
                      >
                        Stop Timer
                      </button>
                    </div>
                  )}
              </div>
            );
          }
        )}
      </div>

      {/* Next Day/Week Button */}
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
        <ExerciseDeatil handleClose={handleOpenClose} data={selectedExercise} />
      </OffCanvasComp>
    </div>
  );
};

export default PlanDetail;
