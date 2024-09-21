'use client';

import React, { useState, useEffect } from 'react';
import { exercises } from '../../utils/exercise';

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

  useEffect(() => {
    // Load saved plans on component mount
    const plans = Object.keys(localStorage)
      .filter(key => key.startsWith('workoutPlan_'))
      .map(key => JSON.parse(localStorage.getItem(key)));
    setSavedPlans(plans);
  }, []);

  const generateWorkoutPlan = () => {
    if (!planName) {
      setNameError('Please enter a plan name');
      return;
    }

    const existingPlan = localStorage.getItem(`exerciseHistory_${planName}`);
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
  };

  const addExerciseToDay = (weekIndex, dayIndex, exercise) => {
    if (exercise) {
      const updatedWorkoutPlan = [...workoutPlan];
      // Add the exercise to the same day in all weeks
      for (let i = 0; i < updatedWorkoutPlan.length; i++) {
        updatedWorkoutPlan[i][dayIndex].exercises.push(exercise);
      }
      setWorkoutPlan(updatedWorkoutPlan);
    }
  };

  const removeExercise = (weekIndex, dayIndex, exerciseIndex) => {
    const updatedWorkoutPlan = [...workoutPlan];
    // Remove the exercise from the same day in all weeks
    for (let i = 0; i < updatedWorkoutPlan.length; i++) {
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

  const submitExerciseDetails = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const details = exerciseDetails[key];
    if (details && details.length > 0) {
      const updatedHistory = { ...exerciseHistory };
      if (!updatedHistory[key]) {
        updatedHistory[key] = [];
      }
      updatedHistory[key].push(details);
      setExerciseHistory(updatedHistory);
      
      // Save to localStorage with plan name
      localStorage.setItem(`exerciseHistory_${planName}`, JSON.stringify(updatedHistory));

      // Clear current exercise details
      const updatedExerciseDetails = { ...exerciseDetails };
      updatedExerciseDetails[key] = [];
      setExerciseDetails(updatedExerciseDetails);
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

  const savePlan = () => {
    if (!planName) {
      setNameError('Please enter a plan name');
      return;
    }

    const planToSave = {
      name: planName,
      weeks: weeks,
      daysPerWeek: daysPerWeek,
      workoutPlan: workoutPlan,
      exerciseHistory: exerciseHistory
    };

    localStorage.setItem(`workoutPlan_${planName}`, JSON.stringify(planToSave));
    alert('Workout plan saved successfully!');

    // Clear form and generated plan
    setPlanName('');
    setWeeks(1);
    setDaysPerWeek(1);
    setWorkoutPlan([]);
    setExerciseDetails({});
    setExerciseHistory({});

    // Refresh saved plans list
    setSavedPlans([...savedPlans, planToSave]);
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

  const tabs = [
    { value: 'create', label: 'Create New Plan' },
    { value: 'saved', label: 'Saved Plans' }
  ];

  const isExerciseCompleted = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    return exerciseHistory[key] && exerciseHistory[key].length > 0;
  };

  return (
    <div className="container p-6 mt-8">
      <div className="mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              if (tab.value === 'create') {
                startNewPlan();
              }
            }}
            className={`mr-2 px-4 py-2 rounded ${
              activeTab === tab.value && (tab.value !== 'create' || !isEditingExistingPlan)
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-black'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'create' ? (
        <>
          <h1 className="text-2xl font-bold mb-4">
            {isEditingExistingPlan ? `${planName}` : 'Create Custom Plan'}
          </h1>
          
          {!isEditingExistingPlan && (
            <>
              <form className="mb-6 flex gap-4">
                <div className="mb-4">
                  <label htmlFor="planName" className="block mb-2">Plan Name:</label>
                  <input
                    type="text"
                    id="planName"
                    value={planName}
                    onChange={(e) => {
                      setPlanName(e.target.value);
                      setNameError('');
                    }}
                    className="w-full p-2 border rounded"
                  />
                  {nameError && <p className="text-red-500 text-sm mt-1">{nameError}</p>}
                </div>
                <div className="mb-4">
                  <label htmlFor="weeks" className="block mb-2">Number of Weeks:</label>
                  <input
                    type="number"
                    id="weeks"
                    value={weeks}
                    onChange={(e) => setWeeks(parseInt(e.target.value))}
                    min="1"
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="daysPerWeek" className="block mb-2">Days per Week:</label>
                  <input
                    type="number"
                    id="daysPerWeek"
                    value={daysPerWeek}
                    onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
                    min="1"
                    max="7"
                    className="w-full p-2 border rounded"
                  />
                </div>
              </form>
              <button
                type="button"
                onClick={generateWorkoutPlan}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Generate Plan
              </button>
            </>
          )}

          {workoutPlan.map((week, weekIndex) => (
            <div key={weekIndex} className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Week {weekIndex + 1}</h2>
              {week.map((day, dayIndex) => (
                <div key={dayIndex} className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Day {day.day}</h3>
                  {!isEditingExistingPlan && <div className="flex items-center mb-2">
                    <input
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
                      className="w-full p-2 border rounded mr-2"
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
                          <span className='bg-gray-600 px-2 rounded-md'>{exercise}</span>
                          {isEditingExistingPlan && isExerciseCompleted(weekIndex, dayIndex, exerciseIndex) && (
                            <span className="ml-2 text-green-500" title="Completed">&#10004;</span>
                          )}
                          {!isEditingExistingPlan && <button
                            onClick={() => removeExercise(weekIndex, dayIndex, exerciseIndex)}
                            className="ml-2 text-red-500 text-sm"
                          >
                            Remove
                          </button>}
                          
                          {isEditingExistingPlan && !isExerciseCompleted(weekIndex, dayIndex, exerciseIndex) && (
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
                        {isEditingExistingPlan && !isExerciseCompleted(weekIndex, dayIndex, exerciseIndex) && (
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
                </div>
              ))}
            </div>
          ))}

          {workoutPlan.length > 0 && (
            <button
              onClick={savePlan}
              className="mt-6 bg-green-500 text-white px-4 py-2 rounded"
            >
              {isEditingExistingPlan ? 'Update Plan' : 'Save Plan'}
            </button>
          )}
        </>
      ) : (
        <div>
          <h2 className="text-xl font-bold mb-4 text-black">Saved Plans</h2>
          {savedPlans.length > 0 ? (
            <ul>
              {savedPlans.map((plan, index) => (
                <li key={index} className="mb-2">
                  <button
                    onClick={() => loadPlan(plan)}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                  >
                    {plan.name} ({plan.weeks} weeks, {plan.daysPerWeek} days/week)
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No saved plans found.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomPlanPage;
