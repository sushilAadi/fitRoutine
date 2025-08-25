"use client";

import React, { useState, useEffect, useContext, useRef } from "react";
import { Switch } from "@material-tailwind/react";

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
import WorkoutDayAccordion from "./WorkoutDayAccordian";
import toast from "react-hot-toast";
import { useUser } from '@clerk/clerk-react';
import { addDoc, collection, doc, setDoc } from 'firebase/firestore';
import { db } from "@/firebase/firebaseConfig";

// Draft loader hook
const useDraftLoader = ({
  setPlanName,
  setWeeks,
  setDaysPerWeek,
  setWorkoutPlan,
  setExerciseHistory,
  setWeekNames,
  setDayNames,
  setIsChecked,
  setIsDraft,
  setIsEditingExistingPlan,
  setIsEditingDraft,
  setCurrentDraftId,
  setToggleForm
}) => {
  useEffect(() => {
    const editingDraft = sessionStorage.getItem('editingDraft');
    
    if (editingDraft) {
      try {
        const draft = JSON.parse(editingDraft);
        
        setPlanName(draft.name);
        setWeeks(draft.weeks);
        setDaysPerWeek(draft.daysPerWeek);
        setWorkoutPlan(draft.workoutPlan);
        setExerciseHistory(draft.exerciseHistory || {});
        setWeekNames(draft.weekNames || []);
        setDayNames(draft.dayNames || []);
        setIsChecked(draft.setUpdate);
        setIsDraft(true);
        setIsEditingExistingPlan(false); // Allow adding exercises for drafts
        setIsEditingDraft(true); // Mark as editing draft
        setCurrentDraftId(draft.id); // Store draft ID
        setToggleForm(false);
        
        sessionStorage.removeItem('editingDraft');
        
      } catch (error) {
        console.error('Error loading draft:', error);
        sessionStorage.removeItem('editingDraft');
      }
    }
  }, []);
};

const createPlanPage = () => {
  const { user } = useUser();
  const { id } = user || {}
  const { handleOpenClose: menuOpenClose, plansRefetch } = useContext(GlobalContext);

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
  const [isDraft, setIsDraft] = useState(false); // New state to track if current plan is a draft
  const [isEditingDraft, setIsEditingDraft] = useState(false); // New state to differentiate between editing completed plan vs draft
  const [currentDraftId, setCurrentDraftId] = useState(null); // Store draft ID for updates
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
  const [isChecked, setIsChecked] = useState(true);

  const [openAccordion, setOpenAccordion] = useState({
    weekIndex: null,
    dayIndex: null,
  });

  // Load draft data if coming from draft plans page
  useDraftLoader({
    setPlanName,
    setWeeks,
    setDaysPerWeek,
    setWorkoutPlan,
    setExerciseHistory,
    setWeekNames,
    setDayNames,
    setIsChecked,
    setIsDraft,
    setIsEditingExistingPlan,
    setIsEditingDraft,
    setCurrentDraftId,
    setToggleForm
  });

  const toggleAccordion = (weekIndex, dayIndex) => {
    if (
      openAccordion.weekIndex === weekIndex &&
      openAccordion.dayIndex === dayIndex
    ) {
      setOpenAccordion({ weekIndex: null, dayIndex: null });
    } else {
      setOpenAccordion({ weekIndex, dayIndex });
    }
  };

  const openAccordionWithoutClosing = (weekIndex, dayIndex) => {
    if (
      openAccordion.weekIndex !== weekIndex ||
      openAccordion.dayIndex !== dayIndex
    ) {
      setOpenAccordion({ weekIndex, dayIndex });
    }
  };

  const handleOpenClose = () => setShowExe(!showExe);

  const formData = {
    planName,
    weeks,
    daysPerWeek,
    workoutPlan,
  };

  const generateWorkoutPlan = (e) => {
    e.preventDefault();
    if (!planName) {
      setNameError("Please enter a plan name");
      return;
    }

    const existingPlan = savedPlans.find(plan => plan.planName === `workoutPlan_${planName}`);
    if (existingPlan && !isEditingExistingPlan) {
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
      for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
        updatedWorkoutPlan[i][dayIndex].exercises = updatedWorkoutPlan[i][
          dayIndex
        ].exercises.filter((e) => e.id !== exerciseToRemove.id);
      }
    } else if (exercise) {
      for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
        const newExercise = {
          ...exercise,
          weeklySetConfig: workoutPlan.map((_, index) => ({
            sets: index < weekIndex ? 0 : 0,
            isConfigured: false,
          })),
        };
        updatedWorkoutPlan[i][dayIndex].exercises.push(newExercise);
      }
    }

    setWorkoutPlan(updatedWorkoutPlan);

    setErrors((prevErrors) => {
      const newErrors = { ...prevErrors };
      delete newErrors[`day${dayIndex}`];
      return newErrors;
    });
  };

  const removeExercise = (weekIndex, dayIndex, exerciseIndex) => {
    const updatedWorkoutPlan = [...workoutPlan];
    for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
      updatedWorkoutPlan[i][dayIndex].exercises.splice(exerciseIndex, 1);
    }
    setWorkoutPlan(updatedWorkoutPlan);
  };

  const validatePlan = (isDraftSave = false) => {
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

    // Only validate exercises if it's not a draft save
    if (!isDraftSave) {
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save as draft function
  const saveDraftPlan = async (planName, plan) => {
    try {
      if (!planName || !plan || !id) {
        throw new Error('Missing required data');
      }

      const planToSave = {
        name: planName,
        weeks: JSON.stringify(weeks),
        daysPerWeek: JSON.stringify(daysPerWeek),
        workoutPlan: JSON.stringify(plan),
        exerciseHistory: JSON.stringify(exerciseHistory),
        weekNames: JSON.stringify(weekNames),
        dayNames: JSON.stringify(dayNames),
        date: new Date().toISOString(),
        setUpdate: isChecked,
        isDraft: true, // Mark as draft
      };

      const planDocRef = await addDoc(collection(db, 'workoutDrafts'), {
        userIdCl: id,
        planName: `draftPlan_${planName}`,
        workoutPlanDB: planToSave,
      });

      toast.success('Draft Saved Successfully');
      
    } catch (e) {
      toast.error(`Error saving Draft: ${e.message}`);
    }
  };

  // Update existing draft
  const updateDraftPlan = async (planName, plan) => {
    const planToSave = {
      name: planName,
      weeks: JSON.stringify(weeks),
      daysPerWeek: JSON.stringify(daysPerWeek),
      workoutPlan: JSON.stringify(plan),
      exerciseHistory: JSON.stringify(exerciseHistory),
      weekNames: JSON.stringify(weekNames),
      dayNames: JSON.stringify(dayNames),
      date: new Date().toISOString(),
      setUpdate: isChecked,
      isDraft: true,
    };

    try {
      // Update the specific draft document using the stored draft ID
      const planDocRef = doc(db, 'workoutDrafts', currentDraftId);
      await setDoc(planDocRef, {
        userIdCl: id,
        planName: `draftPlan_${planName}`,
        workoutPlanDB: planToSave,
      }, { merge: true });

      toast.success('Draft updated Successfully');
    } catch (error) {
      console.error('Error updating draft: ', error);
      toast.error('Error updating Draft');
    }
  };

  const exercisePlanDetail = async (planName, plan) => {
    try {
      if (!planName || !plan || !id) {
        throw new Error('Missing required data');
      }

      const planToSave = {
        name: planName,
        weeks: JSON.stringify(weeks),
        daysPerWeek: JSON.stringify(daysPerWeek),
        workoutPlan: JSON.stringify(plan),
        exerciseHistory: JSON.stringify(exerciseHistory),
        weekNames: JSON.stringify(weekNames),
        dayNames: JSON.stringify(dayNames),
        date: new Date().toISOString(),
        setUpdate: isChecked,
        isDraft: false, // Mark as completed plan
      };

      const planDocRef = await addDoc(collection(db, 'workoutPlans'), {
        userIdCl: id,
        planName: `workoutPlan_${planName}`,
        workoutPlanDB: planToSave,
      });

      toast.success('Plan Saved Successfully');
      
    } catch (e) {
      toast.error(`Error saving Plan: ${e.message}`);
    }
  };

  const updatePlanDetail = async (planName, plan) => {
    const planToSave = {
      name: planName,
      weeks: JSON.stringify(weeks),
      daysPerWeek: JSON.stringify(daysPerWeek),
      workoutPlan: JSON.stringify(plan),
      exerciseHistory: JSON.stringify(exerciseHistory),
      weekNames: JSON.stringify(weekNames),
      dayNames: JSON.stringify(dayNames),
      date: new Date().toISOString(),
      setUpdate: isChecked,
      isDraft: false,
    };

    try {
      const planDocRef = doc(db, 'workoutPlans', id);
      await setDoc(planDocRef, {
        workoutPlanDB: planToSave,
      }, { merge: true });

      toast.success('Plan updated Successfully');
      plansRefetch();
    } catch (error) {
      console.error('Error updating document: ', error);
      toast.error('Error updating Plan');
    }
  };

  const savePlan = (isDraftSave = false) => {
    if (!validatePlan(isDraftSave)) {
      return;
    }

    if (!planName) {
      setErrors((prev) => ({ ...prev, planName: "Please enter a plan name" }));
      return;
    }
    
    const planToSave = workoutPlan;
    const storageKey = planName;

    if (isDraftSave) {
      // Save as draft
      if (isEditingDraft && currentDraftId) {
        updateDraftPlan(storageKey, planToSave);
      } else {
        saveDraftPlan(storageKey, planToSave);
      }
    } else {
      // Save as completed plan
      if (isEditingExistingPlan && !isDraft) {
        updatePlanDetail(storageKey, planToSave);
        setSavedPlans((prevPlans) =>
          prevPlans.map((plan) => (plan.planName === `workoutPlan_${storageKey}` ? {...plan, workoutPlanDB: planToSave} : plan))
        );
      } else {
        const existingPlan = savedPlans.find(plan => plan.planName === `workoutPlan_${planName}`);

        if (existingPlan && !isEditingExistingPlan) {
          setErrors((prev) => ({
            ...prev,
            planName: "A plan with this name already exists",
          }));
          return;
        }

        exercisePlanDetail(storageKey, planToSave);
      }
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

    if (weekIndex === 0 && dayIndex === 0 && exerciseIndex === 0) return true;

    if (exerciseIndex > 0) {
      return isExerciseCompleted(weekIndex, dayIndex, exerciseIndex - 1);
    }

    if (dayIndex > 0) {
      const previousDay = workoutPlan[weekIndex][dayIndex - 1];
      return isExerciseCompleted(
        weekIndex,
        dayIndex - 1,
        previousDay.exercises.length - 1
      );
    }

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
            name: `${weekNames[weekIndex]} - ${dayNames[dayIndex]}`,
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
      savePlan(false); // Save as completed plan

      // Reset the component state after successful save
      setToggleForm(true);
      setPlanName("");
      setWeeks(3);
      setDaysPerWeek(3);
      setWorkoutPlan([]);
      setExerciseDetails({});
      setExerciseHistory({});
      setWeekNames([]);
      setDayNames([]);
      setErrors({});
      setShowWarning(false);
      setSaveAttempted(false);
      setIsDraft(false);
      setIsEditingDraft(false);
      setCurrentDraftId(null);
      plansRefetch();
    }
  };

  const handleSaveDraft = () => {
    savePlan(true); // Save as draft
    
    // Reset the component state after successful draft save
    setToggleForm(true);
    setPlanName("");
    setWeeks(3);
    setDaysPerWeek(3);
    setWorkoutPlan([]);
    setExerciseDetails({});
    setExerciseHistory({});
    setWeekNames([]);
    setDayNames([]);
    setErrors({});
    setShowWarning(false);
    setSaveAttempted(false);
    setIsDraft(false);
    setIsEditingDraft(false);
    setCurrentDraftId(null);
    plansRefetch();
  };

  const scrollToWeek = (weekIndex) => {
    if (weekRefs.current[weekIndex] && scrollContainerRef.current) {
      const containerTop = scrollContainerRef.current.offsetTop;
      const weekTop = weekRefs.current[weekIndex].offsetTop;
      scrollContainerRef.current.scrollTo({
        top: weekTop - containerTop,
        behavior: "smooth",
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

  const updateExerciseSets = (weekIndex, dayIndex, exerciseIndex, newSets) => {
    const updatedWorkoutPlan = [...workoutPlan];
    const exercise =
      updatedWorkoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];

    for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
      const weekExercise =
        updatedWorkoutPlan[i][dayIndex].exercises[exerciseIndex];

      weekExercise.weeklySetConfig[i].sets = newSets;
      weekExercise.weeklySetConfig[i].isConfigured = true;
    }

    setWorkoutPlan(updatedWorkoutPlan);
    updateLocalStorage(updatedWorkoutPlan);
  };

  const updateLocalStorage = (updatedWorkoutPlan) => {
    const planToSave = {
      name: planName,
      weeks: weeks,
      daysPerWeek: daysPerWeek,
      workoutPlan: updatedWorkoutPlan,
      exerciseHistory: exerciseHistory,
      weekNames: weekNames,
      dayNames: dayNames,
      date: new Date(),
      setUpdate: isChecked,
    };
  };

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

                      const existingPlan = savedPlans.find(plan => plan.planName === `workoutPlan_${newName}`);
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
          <div className="flex flex-col h-screen overflow-hidden ">
            <div className="top-0 p-3 bg-black sticky-top">
              <div className="flex items-center cursor-pointer">
                <i
                  className="mr-2 text-white fa-duotone fa-solid fa-bars text-[20px]"
                  onClick={menuOpenClose}
                ></i>
                <h1 className="text-white">{planName} {isDraft && "(Draft)"}</h1>
              </div>

              <p className="my-2 text-gray-400">
                {weeks} weeks | {daysPerWeek} days per week
              </p>

              {showWarning && saveAttempted && (
                <div className="mt-4 text-red-700 rounded">
                  <p>Warning: The following days are missing exercises:</p>
                  <ul>
                    {getMissingExerciseDays().map(
                      ({ week, day, name }, index) => (
                        <li
                          key={index}
                          className="cursor-pointer hover:underline"
                          onClick={() => scrollToWeek(week)}
                        >
                          {name}
                        </li>
                      )
                    )}
                  </ul>
                  <p>
                    You can save this as a draft and complete it later, or add exercises to save as a complete plan.
                  </p>
                </div>
              )}
            </div>
            <div
              ref={scrollContainerRef}
              className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar "
            >
              <div className="mb-2">
                <Switch
                  ripple={false}
                  checked={isChecked}
                  onChange={() => setIsChecked((prev) => !prev)}
                  label={
                    <p className="text-black ">Include set as a must-do.</p>
                  }
                />
              </div>

              {workoutPlan?.map((week, weekIndex) => (
                <div
                  key={weekIndex}
                  className="mb-8"
                  ref={(el) => (weekRefs.current[weekIndex] = el)} 
                >
                  <div className="flex items-center gap-2 mb-4">
                    <h2 className="mr-2 text-xl font-semibold">
                      {weekNames[weekIndex]}{" "}
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
                      <WorkoutDayAccordion
                        key={dayIndex}
                        day={day}
                        dayIndex={dayIndex}
                        weekIndex={weekIndex}
                        dayName={dayNames[dayIndex]}
                        isEditingExistingPlan={isEditingExistingPlan}
                        isEditingDraft={isEditingDraft} // Pass the draft editing state
                        updateDayName={updateDayName}
                        handleOpenClose={handleOpenClose}
                        setSelectedWeekIndex={setSelectedWeekIndex}
                        setSelectedDayIndex={setSelectedDayIndex}
                        removeExercise={removeExercise}
                        isOpen={
                          openAccordion.weekIndex === weekIndex &&
                          openAccordion.dayIndex === dayIndex
                        }
                        toggleAccordion={toggleAccordion}
                        openAccordionWithoutClosing={
                          openAccordionWithoutClosing
                        }
                        updateExerciseSets={updateExerciseSets}
                      />
                  ))}
                </div>
              ))}
            </div>
            <div className="p-3">
              {workoutPlan.length > 0 && (
                <div className="flex gap-3">
                  <ButtonCs
                    onClick={handleSave}
                    title="Save Plan"
                    type="submit"
                    className="mt-[36px] btnStyle flex-1"
                  />
                  <ButtonCs
                    onClick={handleSaveDraft}
                    title="Save Draft"
                    type="button"
                    className="mt-[36px] bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex-1"
                  />
                </div>
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