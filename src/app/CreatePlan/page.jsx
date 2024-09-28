'use client';

import React, { useState, useEffect } from 'react';
import { exercises } from '../../utils/exercise';
import InputCs from '@/components/InputCs/InputCs';
import ButtonCs from '@/components/Button/ButtonCs';
import {
  Tabs,
  TabsHeader,
  TabsBody,
  Tab,
  TabPanel,
} from "@material-tailwind/react";

const CustomPlanPage = () => {
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

  useEffect(() => {
    // Load saved plans on component mount
    const plans = Object.keys(localStorage)
      .filter(key => key.startsWith('workoutPlan_'))
      .map(key => JSON.parse(localStorage.getItem(key)));
    setSavedPlans(plans);
  }, []);

  const generateWorkoutPlan = (e) => {
    e.preventDefault();
    if (!planName) {
      setNameError('Please enter a plan name');
      return;
    }

    const existingPlan = localStorage.getItem(`workoutPlan_${planName}`);
    if (existingPlan) {
      setNameError('A plan with this name already exists');
      return;
    }

    setNameError('');
    const newWorkoutPlan = [];
    for (let week = 0; week < weeks; week++) {
      const weekPlan = [];
      for (let day = 0; day < daysPerWeek; day++) {
        weekPlan.push({
          day: day + 1,
          exercises: week === 0 ? [] : [...newWorkoutPlan[0][day].exercises]
        });
      }
      newWorkoutPlan.push(weekPlan);
    }
    setWorkoutPlan(newWorkoutPlan);
    setWeekNames(Array(weeks).fill('').map((_, i) => `Week ${i + 1}`));
    setDayNames(Array(daysPerWeek).fill('').map((_, i) => `Day ${i + 1}`));
  };

  const addExerciseToDay = (weekIndex, dayIndex, exercise) => {
    if (exercise) {
      const updatedWorkoutPlan = [...workoutPlan];
      // Add the exercise to the current week and all subsequent weeks
      for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
        updatedWorkoutPlan[i][dayIndex].exercises.push(exercise);
      }
      setWorkoutPlan(updatedWorkoutPlan);

      // Clear the error for this day across all weeks
      setErrors(prevErrors => {
        const newErrors = { ...prevErrors };
        delete newErrors[`day${dayIndex}`];
        return newErrors;
      });
    }
  };

  const removeExercise = (weekIndex, dayIndex, exerciseIndex) => {
    const updatedWorkoutPlan = [...workoutPlan];
    // Remove the exercise from the current week and all subsequent weeks
    for (let i = weekIndex; i < updatedWorkoutPlan.length; i++) {
      updatedWorkoutPlan[i][dayIndex].exercises.splice(exerciseIndex, 1);
    }
    setWorkoutPlan(updatedWorkoutPlan);
  };

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
      exerciseHistory: updatedHistory
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

  const isDayComplete = (weekIndex, dayIndex) => {
    const day = workoutPlan[weekIndex][dayIndex];
    return day.exercises.every((exercise, exerciseIndex) => {
      const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
      return exerciseHistory[key] && exerciseHistory[key].length > 0;
    });
  };

  const isCurrentDayEnabled = (weekIndex, dayIndex) => {
    return true; // Always enable all days
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

  const loadPlan = (plan) => {
    setPlanName(plan.name);
    setWeeks(plan.weeks);
    setDaysPerWeek(plan.daysPerWeek);
    setWorkoutPlan(plan.workoutPlan);
    setExerciseHistory(plan.exerciseHistory);
    setActiveTab('create');
    setIsEditingExistingPlan(true);
  };

  const startNewPlan = () => {
    setPlanName('');
    setWeeks(1);
    setDaysPerWeek(1);
    setWorkoutPlan([]);
    setExerciseDetails({});
    setExerciseHistory({});
    setIsEditingExistingPlan(false);
  };

  const deletePlan = (planName) => {
    if (window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
      localStorage.removeItem(`workoutPlan_${planName}`);
      setSavedPlans(prevPlans => prevPlans.filter(plan => plan.name !== planName));
    }
  };

  const tabs = [
    { value: 'create', label: 'Create New Plan' },
    { value: 'saved', label: 'Saved Plans' }
  ];

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
      <div className="mb-4">
        <Tabs value={activeTab}>
          <TabsHeader
            className="rounded-none border-b border-blue-gray-50 bg-transparent p-0"
            indicatorProps={{
              className:
                "bg-transparent border-b-2 border-gray-900 shadow-none rounded-none",
            }}
          >
            {tabs.map((tab) => (
              <Tab
                key={tab.value}
                value={tab.value}
                onClick={() => {
                  setActiveTab(tab.value);
                  if (tab.value === 'create') {
                    startNewPlan();
                  }
                }}
                className={activeTab === tab.value ? "text-gray-900" : ""}
              >
                {tab.label}
              </Tab>
            ))}
          </TabsHeader>
          <TabsBody>
            {/* Add TabPanel content here if needed */}
          </TabsBody>
        </Tabs>
      </div>

      {activeTab === 'create' ? (
        <>
          {isEditingExistingPlan && <h1 className="text-2xl font-bold mb-4">
            {isEditingExistingPlan ? `${planName}` : 'Create Custom Plan'}
          </h1>}
          
          {!isEditingExistingPlan && (
            <>
              <form className="mb-6 " onSubmit={generateWorkoutPlan}>
                <div className="mb-4 gap-3 flex flex-wrap">
                  <div className='inputBox'>
                    <label htmlFor="planName" className="block mb-2">Plan Name:</label>
                    <InputCs
                      type="text"
                      id="planName"
                      value={planName}
                      placeholder="Enter Plan Name"
                      onChange={(e) => {
                        setPlanName(e.target.value);
                        setErrors({...errors, planName: ''});
                      }}
                      className={` p-2 border rounded inputStyle ${errors.planName ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.planName && <p className="text-red-500 text-sm mt-1">{errors.planName}</p>}
                  </div>
                  
                </div>
                <div className="mb-4 flex gap-3 flex-wrap">
                <div className='inputBox'>
                    <label htmlFor="weeks" className="block mb-2">Number of Weeks:</label>
                    <InputCs
                      type="number"
                      id="weeks"
                      value={weeks}
                      onChange={(e) => {
                        setWeeks(parseInt(e.target.value));
                        setErrors({...errors, weeks: ''});
                      }}
                      min="1"
                      placeholder="Enter no of weeks"
                      className={`w-full p-2 border rounded ${errors.weeks ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.weeks && <p className="text-red-500 text-sm mt-1">{errors.weeks}</p>}
                  </div>
                  <div className='inputBox'>
                  <label htmlFor="daysPerWeek" className="block mb-2">Days per Week:</label>
                  <InputCs
                    type="number"
                    id="daysPerWeek"
                    value={daysPerWeek}
                    onChange={(e) => {
                      setDaysPerWeek(parseInt(e.target.value));
                      setErrors({...errors, daysPerWeek: ''});
                    }}
                    min="1"
                    max="7"
                    placeholder="Enter no of Days"
                    className={`w-full p-2 border rounded min-w-[184px] ${errors.daysPerWeek ? 'border-red-500' : ''}`}
                    required
                  />
                  {errors.daysPerWeek && <p className="text-red-500 text-sm mt-1">{errors.daysPerWeek}</p>}
                  </div>
                </div>
                <ButtonCs title="Generate Plan" type="submit" className="mt-[36px] btnStyle min-w-[184px]" />
              </form>
              
            </>
          )}

          {workoutPlan.map((week, weekIndex) => (
            <div key={weekIndex} className="mb-8">
              <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold mr-2">
                  {weekNames[weekIndex]}
                </h2>
                {!isEditingExistingPlan && (
                  <i
                    className="fa-regular fa-pen-to-square text-gray-500 cursor-pointer"
                    onClick={() => {
                      const newName = prompt('Enter new week name:', weekNames[weekIndex]);
                      if (newName) updateWeekName(weekIndex, newName);
                    }}
                  />
                )}
              </div>
              {week.map((day, dayIndex) => (
                <div key={dayIndex} className="mb-4">
                  <div className="flex items-center mb-2">
                    <h3 className="text-lg font-medium mr-2">
                      {dayNames[dayIndex]}
                    </h3>
                    {!isEditingExistingPlan && (
                      <i
                        className="fa-regular fa-pen-to-square text-gray-500 cursor-pointer"
                        onClick={() => {
                          const newName = prompt('Enter new day name:', dayNames[dayIndex]);
                          if (newName) updateDayName(dayIndex, newName);
                        }}
                      />
                    )}
                  </div>
                  {!isEditingExistingPlan && <div className="flex items-center mb-2">
                    <InputCs
                      type="text"
                      list="exerciseOptions"
                      onChange={(e) => {
                        const selectedExercise = exercises.find(ex => ex.name === e.target.value);
                        if (selectedExercise && !day.exercises.includes(selectedExercise.name)) {
                          addExerciseToDay(weekIndex, dayIndex, selectedExercise.name);
                          e.target.value = '';
                        } else if (selectedExercise) {
                          alert("This exercise is already added to this day.");
                          e.target.value = '';
                        }
                      }}
                      className=" p-2 border rounded mr-2 max-w-[386px] w-full mb-4"
                      placeholder="Search and select an exercise"
                    />
                    <datalist id="exerciseOptions">
                      {exercises.map((ex) => (
                        <option 
                          key={ex.id} 
                          value={ex.name}
                          disabled={day.exercises.includes(ex.name)}
                        />
                      ))}
                    </datalist>
                  </div>}
                  
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
                          {!isEditingExistingPlan && 
                            <i class="ml-2 fa-regular fa-trash-can text-red-500 cursor-pointer" onClick={() => removeExercise(weekIndex, dayIndex, exerciseIndex)}/>
                          }
                          
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

          {workoutPlan.length > 0 && (
            <ButtonCs onClick={savePlan} title={isEditingExistingPlan ? 'Update Plan' : 'Save Plan'} type="submit" className="mt-[36px] btnStyle min-w-[184px] mb-5" />
           
          )}
        </>
      ) : (
        <div>
          {savedPlans.length > 0 ? (
            <div>
              {savedPlans.map((plan, index) => (
                <li key={index} className="mb-2 flex items-center">
                  <ButtonCs title={`${plan.name} (${plan.weeks} weeks, ${plan.daysPerWeek} days/week)`} className="mb-2 mr-2 !text-sm" onClick={() => loadPlan(plan)}/>
                  {/* <button
                    onClick={() => loadPlan(plan)}
                    className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                  >
                    {plan.name} ({plan.weeks} weeks, {plan.daysPerWeek} days/week)
                  </button> */}
                  <i class="fa-regular fa-trash-can text-red-500 cursor-pointer" onClick={() => deletePlan(plan.name)}/>
                    
                  
                </li>
              ))}
            </div>
          ) : (
            <p>No saved plans found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomPlanPage;
