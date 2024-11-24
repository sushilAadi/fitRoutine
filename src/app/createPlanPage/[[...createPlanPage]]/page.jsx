"use client";

import React, { useState, useEffect, useContext, useRef } from "react";

import InputCs from "@/components/InputCs/InputCs";
import ButtonCs from "@/components/Button/ButtonCs";
import ExerciseCard from "@/components/ExerciseCard/ExerciseCard";
import { exercises } from "@/utils/exercise";
import OffCanvasComp from "@/components/OffCanvas/OffCanvasComp";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import InputCsTwo from "@/components/InputCs/InputCsTwo";
import BlurryBlob from "@/components/BlurryBlob/BlurryBlob";
import Image from "next/image";
import CCard from "@/components/CCard";
import { GlobalContext } from "@/context/GloablContext";

const createPlanPage = () => {
  const { handleOpenClose: menuOpenClose } = useContext(GlobalContext);

  const [toggleForm, setToggleForm] = useState(true);
  const [weeks, setWeeks] = useState(3);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [planName, setPlanName] = useState("Weight Gain");
  const [nameError, setNameError] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState([]);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [savedPlans, setSavedPlans] = useState([]);
  const [isEditingExistingPlan, setIsEditingExistingPlan] = useState(false);
  ``;
  const [weekNames, setWeekNames] = useState([]);
  const [dayNames, setDayNames] = useState([]);
  const [errors, setErrors] = useState({});
  const [showExe, setShowExe] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  const [showWarning, setShowWarning] = useState(false);
  const [saveAttempted, setSaveAttempted] = useState(false);
  const weekRefs = useRef([]);
  const scrollContainerRef = useRef(null);

  const handleOpenClose = () => setShowExe(!showExe);

  const formData = {
    planName,
    weeks,
    daysPerWeek,
    workoutPlan,
  };

  useEffect(() => {
    // Load saved plans on component mount
    const plans = Object.keys(localStorage)
      .filter((key) => key.startsWith("workoutPlan_"))
      .map((key) => JSON.parse(localStorage.getItem(key)));
    setSavedPlans(plans);
  }, []);

  const generateWorkoutPlan = (e) => {
    e.preventDefault();
    if (!planName) {
      setNameError("Please enter a plan name");
      return;
    }

    const existingPlan = localStorage.getItem(`workoutPlan_${planName}`);
    if (existingPlan) {
      setNameError("A plan with this name already exists");
      return;
    }
    setToggleForm(!toggleForm);

    setNameError("");
    const newWorkoutPlan = [];
    for (let week = 0; week < weeks; week++) {
      const weekPlan = [];
      for (let day = 0; day < daysPerWeek; day++) {
        weekPlan.push({
          day: day + 1,
          exercises: week === 0 ? [] : [...newWorkoutPlan[0][day].exercises],
        });
      }
      newWorkoutPlan.push(weekPlan);
    }

    setWorkoutPlan(newWorkoutPlan);
    setWeekNames(
      Array(weeks)
        .fill("")
        .map((_, i) => `Week ${i + 1}`)
    );
    setDayNames(
      Array(daysPerWeek)
        .fill("")
        .map((_, i) => `Day ${i + 1}`)
    );
  };

  const addExerciseToDay = (
    weekIndex,
    dayIndex,
    exercise,
    exerciseToRemove
  ) => {
    const updatedWorkoutPlan = [...workoutPlan];

    if (exercise === null && exerciseToRemove) {
      // Remove the exercise from current and subsequent weeks
      for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
        updatedWorkoutPlan[i][dayIndex].exercises = updatedWorkoutPlan[i][
          dayIndex
        ].exercises.filter((e) => e.id !== exerciseToRemove.id);
      }
    } else if (exercise) {
      // Add the exercise to current and subsequent weeks
      for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
        updatedWorkoutPlan[i][dayIndex].exercises.push(exercise);
      }
    }

    setWorkoutPlan(updatedWorkoutPlan);

    // Clear the error for this day across all weeks
    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`day${dayIndex}`];
      return newErrors;
    });
  };

  const removeExercise = (weekIndex, dayIndex, exerciseIndex) => {
    const updatedWorkoutPlan = [...workoutPlan];
    // Remove the exercise from the current week and all subsequent weeks
    for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
      updatedWorkoutPlan[i][dayIndex].exercises.splice(exerciseIndex, 1);
    }
    setWorkoutPlan(updatedWorkoutPlan);
  };

  const validatePlan = () => {
    const newErrors = {};

    if (!planName.trim()) {
      newErrors.planName = "Plan name cannot be empty";
    }

    if (weeks < 1) {
      newErrors.weeks = "Number of weeks must be at least 1";
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      newErrors.daysPerWeek = "Days per week must be between 1 and 7";
    }

    for (let dayIndex = 0; dayIndex < daysPerWeek; dayIndex++) {
      let hasExercises = false;
      for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
        if (workoutPlan[weekIndex][dayIndex].exercises.length > 0) {
          hasExercises = true;
          break;
        }
      }
      if (!hasExercises) {
        newErrors[`day${dayIndex}`] =
          "Each day must have at least one exercise in any week";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const savePlan = () => {
    if (!validatePlan()) {
      return;
    }

    if (!planName) {
      setErrors((prev) => ({ ...prev, planName: "Please enter a plan name" }));
      return;
    }

    const planToSave = {
      name: planName,
      weeks: weeks,
      daysPerWeek: daysPerWeek,
      workoutPlan: workoutPlan,
      exerciseHistory: exerciseHistory,
      weekNames: weekNames, // Save week names
      dayNames: dayNames, // Save day names
      date: new Date(),
    };

    const storageKey = `workoutPlan_${planName}`;

    if (isEditingExistingPlan) {
      localStorage.setItem(storageKey, JSON.stringify(planToSave));
      alert("Workout plan updated successfully!");
      setToggleForm(!toggleForm);
      setSavedPlans((prevPlans) =>
        prevPlans.map((plan) => (plan.name === planName ? planToSave : plan))
      );
    } else {
      if (localStorage.getItem(storageKey)) {
        setErrors((prev) => ({
          ...prev,
          planName: "A plan with this name already exists",
        }));
        return;
      }
      localStorage.setItem(storageKey, JSON.stringify(planToSave));
      alert("Workout plan saved successfully!");
      setToggleForm(!toggleForm);
      setSavedPlans((prevPlans) => [...prevPlans, planToSave]);
    }

    if (!isEditingExistingPlan) {
      setPlanName("");
      setWeeks(1);
      setDaysPerWeek(1);
      setWorkoutPlan([]);
      setExerciseDetails({});
      setExerciseHistory({});
      setWeekNames([]); // Reset week names
      setDayNames([]); // Reset day names
    }
  };

  const isExerciseCompleted = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    return exerciseHistory[key] && exerciseHistory[key].length > 0;
  };

  const updateWeekName = (index, newName) => {
    const updatedWeekNames = [...weekNames];
    updatedWeekNames[index] = newName;
    setWeekNames(updatedWeekNames);
  };

  const updateDayName = (index, newName) => {
    const updatedDayNames = [...dayNames];
    updatedDayNames[index] = newName;
    setDayNames(updatedDayNames);
  };

  const isExerciseEnabled = (weekIndex, dayIndex, exerciseIndex) => {
    if (!isEditingExistingPlan) return true;

    // Check if it's the first exercise of the first day
    if (weekIndex === 0 && dayIndex === 0 && exerciseIndex === 0) return true;

    // Check if the previous exercise is completed
    if (exerciseIndex > 0) {
      return isExerciseCompleted(weekIndex, dayIndex, exerciseIndex - 1);
    }

    // Check if the last exercise of the previous day is completed
    if (dayIndex > 0) {
      const previousDay = workoutPlan[weekIndex][dayIndex - 1];
      return isExerciseCompleted(
        weekIndex,
        dayIndex - 1,
        previousDay.exercises.length - 1
      );
    }

    // Check if the last exercise of the last day of the previous week is completed
    if (weekIndex > 0) {
      const previousWeek = workoutPlan[weekIndex - 1];
      const lastDay = previousWeek[previousWeek.length - 1];
      return isExerciseCompleted(
        weekIndex - 1,
        previousWeek.length - 1,
        lastDay.exercises.length - 1
      );
    }

    return false;
  };

  const getMissingExerciseDays = () => {
    const missingDays = [];
    workoutPlan.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        if (day.exercises.length === 0) {
          missingDays.push({
            week: weekIndex,
            day: dayIndex,
            name: `${weekNames[weekIndex]} - ${dayNames[dayIndex]}`
          });
        }
      });
    });
    return missingDays;
  };

  const handleSave = () => {
    setSaveAttempted(true);
    const missingDays = getMissingExerciseDays();
    if (missingDays.length > 0) {
      setShowWarning(true);
    } else {
      savePlan();
    }
  };

  const scrollToWeek = (weekIndex) => {
    if (weekRefs.current[weekIndex] && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.offsetTop;
      const weekTop = weekRefs.current[weekIndex].offsetTop;
      scrollContainerRef.current.scrollTo({
        top: weekTop - containerTop,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    weekRefs.current = weekRefs.current.slice(0, weeks);
  }, [weeks]);

  useEffect(() => {
    if (saveAttempted) {
      const missingDays = getMissingExerciseDays();
      setShowWarning(missingDays.length > 0);
    }
  }, [workoutPlan, saveAttempted]);

  return (
    <SecureComponent>
      {toggleForm && <BlurryBlob />}
      {toggleForm ? (
        <div className="flex justify-between h-screen lg:items-center flex-column ">
          <div className="flex justify-center p-4 my-3 flex-column">
            <h1 className="text-black cap-font  text-[40px]">YOUR IDEAL</h1>
            <h1 className="text-black cap-font  text-[40px]">WORKOUT PLAN,</h1>
            <h1 className="text-black cap-font  text-[40px]">
              CUSTOMIZED TO FIT
            </h1>
            <h1 className="text-black cap-font  text-[40px]"> YOU.</h1>
            <p className="text-gray-800">Get motivated and achieve more with</p>
            <p className="text-gray-800">your unique plan.</p>
          </div>
          <div className="p-4">
            <form className="" onSubmit={generateWorkoutPlan}>
              <div className="flex flex-wrap gap-3 mb-4">
                <div className="inputBox">
                  <InputCsTwo
                    label="Plan Name"
                    type="text"
                    id="planName"
                    value={planName}
                    placeholder="Enter Plan Name"
                    onChange={(e) => {
                      const newName = e.target.value;
                      setPlanName(newName);

                      // Live validation for existing plan names
                      const existingPlan = localStorage.getItem(
                        `workoutPlan_${newName}`
                      );
                      if (existingPlan) {
                        setNameError("A plan with this name already exists");
                      } else {
                        setNameError("");
                      }
                    }}
                    className={` border rounded inputStyle ${
                      nameError ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {nameError && (
                    <p className="mt-1 text-sm text-red-500">{nameError}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mb-4">
                <div className="inputBox">
                  <InputCsTwo
                    label="Number of Weeks"
                    type="number"
                    id="weeks"
                    value={weeks}
                    onChange={(e) => {
                      setWeeks(parseInt(e.target.value));
                      setErrors({ ...errors, weeks: "" });
                    }}
                    min="1"
                    placeholder="Enter no of weeks"
                    className={`w-full p-2 border rounded ${
                      errors.weeks ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.weeks && (
                    <p className="mt-1 text-sm text-red-500">{errors.weeks}</p>
                  )}
                </div>
                <div className="inputBox">
                  <InputCsTwo
                    label="Days per Week"
                    type="number"
                    id="daysPerWeek"
                    value={daysPerWeek}
                    onChange={(e) => {
                      setDaysPerWeek(parseInt(e.target.value));
                      setErrors({ ...errors, daysPerWeek: "" });
                    }}
                    min="1"
                    max="7"
                    placeholder="Enter no of Days"
                    className={`w-full p-2 border rounded min-w-[184px] ${
                      errors.daysPerWeek ? "border-red-500" : ""
                    }`}
                    required
                  />
                  {errors.daysPerWeek && (
                    <p className="mt-1 text-sm text-red-500">
                      {errors.daysPerWeek}
                    </p>
                  )}
                </div>
              </div>
              <ButtonCs
                title="Generate Plan"
                type="submit"
                className="mt-[36px] btnStyle min-w-[184px]"
              />
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col h-screen overflow-hidden">
            <div className="top-0 p-3 bg-black sticky-top">
              <div className="flex items-center cursor-pointer">
                <i
                  className="mr-2 text-white fa-duotone fa-solid fa-bars text-[20px]"
                  onClick={menuOpenClose}
                ></i>
                <h1 className="text-white">{planName}</h1>
              </div>

              <p className="my-2 text-gray-400">
                {weeks} weeks | {daysPerWeek} days per week
              </p>

              {showWarning && saveAttempted && (
          <div className="mt-4 text-red-700 rounded">
            <p>Warning: The following days are missing exercises:</p>
            <ul>
              {getMissingExerciseDays().map(({ week, day, name }, index) => (
                <li key={index} className="cursor-pointer hover:underline" onClick={() => scrollToWeek(week)}>
                  {name}
                </li>
              ))}
            </ul>
            <p>Please add exercises to these days before saving the plan.</p>
          </div>
        )}
            </div>
            <div
              ref={scrollContainerRef}
              className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar"
            >
              {workoutPlan?.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="mb-8"
                  ref={(el) => (weekRefs.current[weekIndex] = el)}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="mr-2 text-xl font-semibold">
                      {weekNames[weekIndex]}{" "}
                      {/* Display week name regardless of editing state */}
                    </h2>
                    {!isEditingExistingPlan && (
                      <i
                        className="text-gray-500 cursor-pointer fa-regular fa-pen-to-square"
                        onClick={() => {
                          const newName = prompt(
                            "Enter new week name:",
                            weekNames[weekIndex]
                          );
                          if (newName) updateWeekName(weekIndex, newName);
                        }}
                      />
                    )}
                  </div>
                  {week.map((day, dayIndex) => (
                    <div
                      key={dayIndex}
                      className={` p-2 ${
                        day.exercises?.length > 0 && " bg-white  "
                      } `}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-medium ">
                          {dayNames[dayIndex]}{" "}
                          {/* Display day name regardless of editing state */}
                        </h3>
                        {!isEditingExistingPlan && (
                          <>
                            <i
                              className="text-gray-500 cursor-pointer fa-regular fa-pen-to-square"
                              onClick={() => {
                                const newName = prompt(
                                  "Enter new day name:",
                                  dayNames[dayIndex]
                                );
                                if (newName) updateDayName(dayIndex, newName);
                              }}
                            />
                            <i
                              className="cursor-pointer fa-duotone fa-solid fa-rectangle-history-circle-plus"
                              onClick={() => {
                                handleOpenClose();
                                setSelectedWeekIndex(weekIndex);
                                setSelectedDayIndex(dayIndex);
                              }}
                            ></i>
                          </>
                        )}
                      </div>

                      <ul className="flex p-0 mb-0 overflow-y-auto">
                        {day.exercises.map((exercise, exerciseIndex) => (
                          <>
                            <li
                              key={exerciseIndex}
                              className={`relative ${
                                exerciseIndex !== 0 ? "ml-5" : ""
                              }`}
                            >
                              <CCard
                                key={exerciseIndex}
                                img={exercise.gifUrl}
                                bgColor="bg-[#DBFE02]"
                                parentStyle="w-full min-w-[180px] max-w-[180px]"
                                caption={exercise?.bodyPart}
                                title={exercise?.target}
                                name={exercise?.name}
                              />
                              {!isEditingExistingPlan && (
                                <div
                                  className="absolute w-[30px] h-[20px] rounded-l-lg bg-red-500 top-[44px] right-[0] flex justify-center items-center"
                                  onClick={() => {
                                    if (!isEditingExistingPlan) {
                                      removeExercise(
                                        weekIndex,
                                        dayIndex,
                                        exerciseIndex
                                      );
                                    }
                                  }}
                                >
                                  <i class="fa-solid fa-xmark text-white cursor-pointer" />
                                </div>
                              )}
                            </li>
                          </>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="p-3">
            {workoutPlan.length > 0 && (
          <ButtonCs
            onClick={handleSave}
            title="Save Plan"
            type="submit"
            className="mt-[36px] btnStyle"
          />
        )}
              <OffCanvasComp
                placement="end"
                name="createPlan"
                showProps={showExe}
                handleClose={handleOpenClose}
                customStyle="responsiveStyle"
              >
                <ExerciseCard
                  formData={formData}
                  handleClose={handleOpenClose}
                  currentWeekIndex={selectedWeekIndex}
                  currentDayIndex={selectedDayIndex}
                  onSelectExercise={(exercise, exerciseToRemove) => {
                    addExerciseToDay(
                      selectedWeekIndex,
                      selectedDayIndex,
                      exercise,
                      exerciseToRemove
                    );
                  }}
                />
              </OffCanvasComp>
            </div>
          </div>
        </>
      )}
    </SecureComponent>
  );
};

export default createPlanPage;
