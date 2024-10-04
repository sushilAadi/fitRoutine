'use client';

import React, { useState, useEffect } from 'react';

import InputCs from '@/components/InputCs/InputCs';
import ButtonCs from '@/components/Button/ButtonCs';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react";
import { exercises } from '@/utils/exercise';

const PlanDetail = ({params}) => {
  const [activeTab, setActiveTab] = useState('create');
  const [weeks, setWeeks] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(1);
  const [planName, setPlanName] = useState('');
  const [nameError, setNameError] = useState('');
  const [workoutPlan, setWorkoutPlan] = useState([]);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [exerciseHistory, setExerciseHistory] = useState({});
  const [savedPlans, setSavedPlans] = useState([]);
  const [isEditingExistingPlan, setIsEditingExistingPlan] = useState(false);
  const [weekNames, setWeekNames] = useState([]);
  const [dayNames, setDayNames] = useState([]);
  const [errors, setErrors] = useState({});

  
  const selectedPlan = params?.plan

  const loadPlan = (plan) => {
    setPlanName(plan.name);
    setWeeks(plan.weeks);
    setDaysPerWeek(plan.daysPerWeek);
    setWorkoutPlan(plan.workoutPlan);
    setExerciseHistory(plan.exerciseHistory);
    setWeekNames(plan.weekNames || []); // Load week names from the plan
    setDayNames(plan.dayNames || []);   // Load day names from the plan
    setActiveTab('create');
    setIsEditingExistingPlan(true);
    
  };

  useEffect(() => {
    // Load saved plans on component mount
    const plans = Object.keys(localStorage)
      .filter(key => key.startsWith('workoutPlan_'))
      .map(key => JSON.parse(localStorage.getItem(key)));
      
      const findPlan = plans?.find(i=>i?.name === selectedPlan)
      loadPlan(findPlan)
    // setSavedPlans(plans);
  }, []);




  const addExerciseDetails = (weekIndex, dayIndex, exerciseIndex) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;

    if (!updatedExerciseDetails[key]) {
      updatedExerciseDetails[key] = [];
    }

    updatedExerciseDetails[key].push({ weight: '', reps: '' });
    setExerciseDetails(updatedExerciseDetails);
  };

  const updateExerciseDetail = (weekIndex, dayIndex, exerciseIndex, detailIndex, field, value) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    updatedExerciseDetails[key][detailIndex][field] = value;
    setExerciseDetails(updatedExerciseDetails);
  };

  const isBodyWeightOrBandExercise = (exerciseName) => {
    const exercise = exercises.find(ex => ex.name === exerciseName);
    return exercise && (exercise.equipment === "body weight" || exercise.equipment === "band");
  };

  const updatePlan = (updatedHistory) => {
    const updatedPlan = {
      name: planName,
      weeks: weeks,
      daysPerWeek: daysPerWeek,
      workoutPlan: workoutPlan,
      exerciseHistory: updatedHistory,
      weekNames: weekNames, // Include week names
      dayNames: dayNames,   // Include day names
    };

    // Update localStorage
    localStorage.setItem(`workoutPlan_${planName}`, JSON.stringify(updatedPlan));

    // Update savedPlans state
    setSavedPlans(prevPlans =>
      prevPlans.map(plan => plan.name === planName ? updatedPlan : plan)
    );

    // Update exerciseHistory state
    setExerciseHistory(updatedHistory);
  };

  const submitExerciseDetails = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const details = exerciseDetails[key];
    if (details && details.length > 0) {
      const setCount = details.length;
      const confirmMessage = `You have completed ${setCount} set${setCount > 1 ? 's' : ''}. Do you want to submit?`;

      if (window.confirm(confirmMessage)) {
        const updatedHistory = { ...exerciseHistory };
        if (!updatedHistory[key]) {
          updatedHistory[key] = [];
        }
        updatedHistory[key].push(details);

        // Update the plan
        if (isEditingExistingPlan) {
          updatePlan(updatedHistory);
        } else {
          setExerciseHistory(updatedHistory);
        }

        // Clear current exercise details
        const updatedExerciseDetails = { ...exerciseDetails };
        updatedExerciseDetails[key] = [];
        setExerciseDetails(updatedExerciseDetails);
      }
    }
  };

  const getPreviousRecord = (weekIndex, dayIndex, exerciseIndex) => {
    if (weekIndex === 0) return null; // No previous record for the first week
    const currentExercise = workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];

    // Look for the same exercise in the previous week
    for (let i = weekIndex - 1; i >= 0; i--) {
      const key = `${i}-${dayIndex}-${exerciseIndex}`;
      const records = exerciseHistory[key];
      if (records && workoutPlan[i][dayIndex].exercises[exerciseIndex] === currentExercise) {
        return records[records.length - 1];
      }
    }

    return null; // No previous record found for this exercise
  };

  const removeExerciseDetail = (weekIndex, dayIndex, exerciseIndex, detailIndex) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    updatedExerciseDetails[key].splice(detailIndex, 1);
    setExerciseDetails(updatedExerciseDetails);
  };

  const isSetComplete = (detail, exercise) => {
    if (isBodyWeightOrBandExercise(exercise)) {
      return detail.reps !== '';
    }
    return detail.weight !== '' && detail.reps !== '';
  };

  const areAllSetsComplete = (weekIndex, dayIndex, exerciseIndex, exercise) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const details = exerciseDetails[key];
    return details && details.length > 0 && details.every(detail => isSetComplete(detail, exercise));
  };


  const validatePlan = () => {
    const newErrors = {};

    if (!planName.trim()) {
      newErrors.planName = 'Plan name cannot be empty';
    }

    if (weeks < 1) {
      newErrors.weeks = 'Number of weeks must be at least 1';
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      newErrors.daysPerWeek = 'Days per week must be between 1 and 7';
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
        newErrors[`day${dayIndex}`] = 'Each day must have at least one exercise in any week';
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
      setErrors(prev => ({ ...prev, planName: 'Please enter a plan name' }));
      return;
    }

    const planToSave = {
      name: planName,
      weeks: weeks,
      daysPerWeek: daysPerWeek,
      workoutPlan: workoutPlan,
      exerciseHistory: exerciseHistory
    };

    const storageKey = `workoutPlan_${planName}`;

    if (isEditingExistingPlan) {
      localStorage.setItem(storageKey, JSON.stringify(planToSave));
      alert('Workout plan updated successfully!');
      setSavedPlans(prevPlans =>
        prevPlans.map(plan => plan.name === planName ? planToSave : plan)
      );
    } else {
      if (localStorage.getItem(storageKey)) {
        setErrors(prev => ({ ...prev, planName: 'A plan with this name already exists' }));
        return;
      }
      localStorage.setItem(storageKey, JSON.stringify(planToSave));
      alert('Workout plan saved successfully!');
      setSavedPlans(prevPlans => [...prevPlans, planToSave]);
    }

    if (!isEditingExistingPlan) {
      setPlanName('');
      setWeeks(1);
      setDaysPerWeek(1);
      setWorkoutPlan([]);
      setExerciseDetails({});
      setExerciseHistory({});
    }
  };

  

 

  const deletePlan = (planName) => {
    if (window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
      localStorage.removeItem(`workoutPlan_${planName}`);
      setSavedPlans(prevPlans => prevPlans.filter(plan => plan.name !== planName));
    }
  };



  const isExerciseCompleted = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    return exerciseHistory[key] && exerciseHistory[key].length > 0;
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
      return isExerciseCompleted(weekIndex, dayIndex - 1, previousDay.exercises.length - 1);
    }

    // Check if the last exercise of the last day of the previous week is completed
    if (weekIndex > 0) {
      const previousWeek = workoutPlan[weekIndex - 1];
      const lastDay = previousWeek[previousWeek.length - 1];
      return isExerciseCompleted(weekIndex - 1, previousWeek.length - 1, lastDay.exercises.length - 1);
    }

    return false;
  };

  return (
    <div className="px-4">

      <>
        <h1 className="text-2xl font-bold mb-4">
          {planName}
        </h1>



        {workoutPlan.map((week, weekIndex) => (
          <div key={weekIndex} className="mb-8">
            <div className="flex items-center mb-4">
              <h2 className="text-xl font-semibold mr-2">
                {weekNames[weekIndex]} {/* Display week name regardless of editing state */}
              </h2>

            </div>
            {week.map((day, dayIndex) => (
              <div key={dayIndex} className="mb-4">
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-medium mr-2">
                    {dayNames[dayIndex]} {/* Display day name regardless of editing state */}
                  </h3>

                </div>


                <ul className="list-disc pl-5">
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <li key={exerciseIndex} className="mb-4">
                      <div className="flex items-center mb-2">
                        <span className={`bg-gray-600 px-2 rounded-md ${!isExerciseEnabled(weekIndex, dayIndex, exerciseIndex) ? 'opacity-50' : ''}`}>
                          {exercise}
                        </span>
                        {isEditingExistingPlan && isExerciseCompleted(weekIndex, dayIndex, exerciseIndex) && (
                          <span className="ml-2 text-green-500" title="Completed">&#10004;</span>
                        )}


                        {isEditingExistingPlan && !isExerciseCompleted(weekIndex, dayIndex, exerciseIndex) && isExerciseEnabled(weekIndex, dayIndex, exerciseIndex) && (
                          <button
                            onClick={() => addExerciseDetails(weekIndex, dayIndex, exerciseIndex)}
                            className="ml-2 bg-green-500 text-white px-2 py-1 rounded text-sm"
                          >
                            Add Set
                          </button>
                        )}
                      </div>
                      {weekIndex > 0 && (activeTab !== 'create' || isEditingExistingPlan) && (
                        <>
                          {getPreviousRecord(weekIndex, dayIndex, exerciseIndex) && (
                            <div className="text-sm text-gray-600 mb-2">
                              Previous: {getPreviousRecord(weekIndex, dayIndex, exerciseIndex).map((set, index) => (
                                <span key={index}>
                                  {set.weight && `${set.weight} lbs x `}{set.reps} reps
                                  {index < getPreviousRecord(weekIndex, dayIndex, exerciseIndex).length - 1 ? ', ' : ''}
                                </span>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {isEditingExistingPlan && !isExerciseCompleted(weekIndex, dayIndex, exerciseIndex) && isExerciseEnabled(weekIndex, dayIndex, exerciseIndex) && (
                        <>
                          {exerciseDetails[`${weekIndex}-${dayIndex}-${exerciseIndex}`]?.map((detail, detailIndex) => (
                            <div key={detailIndex} className="flex items-center mb-2">
                              {!isBodyWeightOrBandExercise(exercise) && (
                                <input
                                  type="number"
                                  placeholder="Weight"
                                  value={detail.weight}
                                  onChange={(e) => updateExerciseDetail(weekIndex, dayIndex, exerciseIndex, detailIndex, 'weight', e.target.value)}
                                  className="w-20 p-1 border rounded mr-2"
                                />
                              )}
                              <input
                                type="number"
                                placeholder="Reps"
                                value={detail.reps}
                                onChange={(e) => updateExerciseDetail(weekIndex, dayIndex, exerciseIndex, detailIndex, 'reps', e.target.value)}
                                className="w-20 p-1 border rounded mr-2"
                              />
                              <button
                                onClick={() => removeExerciseDetail(weekIndex, dayIndex, exerciseIndex, detailIndex)}
                                className="text-red-500 text-sm"
                              >
                                Remove Set
                              </button>
                            </div>
                          ))}
                          {areAllSetsComplete(weekIndex, dayIndex, exerciseIndex, exercise) && (
                            <button
                              onClick={() => submitExerciseDetails(weekIndex, dayIndex, exerciseIndex)}
                              className="bg-blue-500 text-white px-2 py-1 rounded text-sm"
                            >
                              Submit
                            </button>
                          )}
                        </>
                      )}
                      {exerciseHistory[`${weekIndex}-${dayIndex}-${exerciseIndex}`] && (
                        <div className="mt-2">
                          {/* <h4 className="text-sm font-semibold">
                              {isDayComplete(weekIndex, dayIndex) ? "Today's Completed Sets" : "Previous Workout Sets"}
                            </h4> */}
                          <div className="flex flex-row space-x-4 text-sm text-[#c5e1a5]">
                            Completed Sets: {exerciseHistory[`${weekIndex}-${dayIndex}-${exerciseIndex}`].map((record, recordIndex) => (
                              <div key={recordIndex} className="text-md ml-2">
                                {record.map((set, setIndex) => (
                                  <span key={setIndex}>
                                    {set.weight && `${set.weight} lbs x `}{set.reps} reps
                                    {setIndex < record.length - 1 && ', '}
                                  </span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
                {errors[`day${dayIndex}`] && (
                  <p className="text-red-500 text-sm mt-1">{errors[`day${dayIndex}`]}</p>
                )}
              </div>
            ))}
          </div>
        ))}

        {/* {workoutPlan.length > 0 && (
          <ButtonCs onClick={savePlan} title='Update Plan' type="submit" className="mt-[36px] btnStyle min-w-[184px] mb-5" />

        )} */}
      </>

      

    </div>
  );
};

export default PlanDetail
;