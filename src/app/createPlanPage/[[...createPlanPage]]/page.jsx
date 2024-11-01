'use client';

import React, { useState, useEffect } from 'react';

import InputCs from '@/components/InputCs/InputCs';
import ButtonCs from '@/components/Button/ButtonCs';
import ExerciseCard from '@/components/ExerciseCard/ExerciseCard';
import { exercises } from '@/utils/exercise';
import OffCanvasComp from '@/components/OffCanvas/OffCanvasComp';
import SecureComponent from '@/components/SecureComponent/[[...SecureComponent]]/SecureComponent';


const createPlanPage = () => {
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
  const [show, setShow] = useState(false);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);

  const handleOpenClose = () => setShow(!show);

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
      exerciseHistory: exerciseHistory,
      weekNames: weekNames, // Save week names
      dayNames: dayNames,   // Save day names
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
      setWeekNames([]); // Reset week names
      setDayNames([]);  // Reset day names
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
    <SecureComponent>
          
    <div className="h-screen p-4 ">
      <>
        
        <div className='flex justify-center'>
          <div className=''>
            <>
              <form className="mb-6 " onSubmit={generateWorkoutPlan}>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className='inputBox'>
                    <label htmlFor="planName" className="block mb-2 ">Plan Name:</label>
                    <InputCs
                      type="text"
                      id="planName"
                      value={planName}
                      placeholder="Enter Plan Name"
                      onChange={(e) => {
                        const newName = e.target.value;
                        setPlanName(newName);

                        // Live validation for existing plan names
                        const existingPlan = localStorage.getItem(`workoutPlan_${newName}`);
                        if (existingPlan) {
                          setNameError('A plan with this name already exists');
                        } else {
                          setNameError('');
                        }
                      }}
                      className={` p-2 border rounded inputStyle ${nameError ? 'border-red-500' : ''}`}
                      required
                    />
                    {nameError && <p className="mt-1 text-sm text-red-500">{nameError}</p>}
                  </div>

                </div>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className='inputBox'>
                    <label htmlFor="weeks" className="block mb-2">Number of Weeks:</label>
                    <InputCs
                      type="number"
                      id="weeks"
                      value={weeks}
                      onChange={(e) => {
                        setWeeks(parseInt(e.target.value));
                        setErrors({ ...errors, weeks: '' });
                      }}
                      min="1"
                      placeholder="Enter no of weeks"
                      className={`w-full p-2 border rounded ${errors.weeks ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.weeks && <p className="mt-1 text-sm text-red-500">{errors.weeks}</p>}
                  </div>
                  <div className='inputBox'>
                    <label htmlFor="daysPerWeek" className="block mb-2">Days per Week:</label>
                    <InputCs
                      type="number"
                      id="daysPerWeek"
                      value={daysPerWeek}
                      onChange={(e) => {
                        setDaysPerWeek(parseInt(e.target.value));
                        setErrors({ ...errors, daysPerWeek: '' });
                      }}
                      min="1"
                      max="7"
                      placeholder="Enter no of Days"
                      className={`w-full p-2 border rounded min-w-[184px] ${errors.daysPerWeek ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.daysPerWeek && <p className="mt-1 text-sm text-red-500">{errors.daysPerWeek}</p>}
                  </div>
                </div>
                <ButtonCs title="Generate Plan" type="submit" className="mt-[36px] btnStyle min-w-[184px]" />
              </form>

            </>


            {workoutPlan.map((week, weekIndex) => (
              <div key={weekIndex} className="mb-8">
                <div className="flex items-center mb-4">
                  <h2 className="mr-2 text-xl font-semibold">
                    {weekNames[weekIndex]} {/* Display week name regardless of editing state */}
                  </h2>
                  {!isEditingExistingPlan && (
                    <i
                      className="text-gray-500 cursor-pointer fa-regular fa-pen-to-square"
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
                      <h3 className="mr-2 text-lg font-medium">
                        {dayNames[dayIndex]} {/* Display day name regardless of editing state */}
                      </h3>
                      {!isEditingExistingPlan && (
                        <i
                          className="text-gray-500 cursor-pointer fa-regular fa-pen-to-square"
                          onClick={() => {
                            const newName = prompt('Enter new day name:', dayNames[dayIndex]);
                            if (newName) updateDayName(dayIndex, newName);
                          }}
                        />
                      )}
                    </div>
                    {!isEditingExistingPlan && <div className="flex items-center mb-2">
                      {/* <InputCs
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
                      </datalist> */}
                      <button
                        className="p-2 text-white bg-blue-500 rounded"
                        onClick={() => {
                          handleOpenClose(); setSelectedWeekIndex(weekIndex);
                          setSelectedDayIndex(dayIndex);
                        }}
                      >
                        Add Exercise
                      </button>
                    </div>}

                    <ul className="pl-5 list-disc">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <li key={exerciseIndex} className="mb-4">
                          <div className="flex items-center mb-2">
                            <span className={`bg-gray-600 px-2 rounded-md ${!isExerciseEnabled(weekIndex, dayIndex, exerciseIndex) ? 'opacity-50' : ''}`}>
                              {exercise?.name}
                            </span>

                            {!isEditingExistingPlan &&
                              <i class="ml-2 fa-regular fa-trash-can text-red-500 cursor-pointer" onClick={() => removeExercise(weekIndex, dayIndex, exerciseIndex)} />
                            }


                          </div>


                        </li>
                      ))}
                    </ul>

                  </div>
                ))}
              </div>
            ))}

            {workoutPlan.length > 0 && (
              <ButtonCs onClick={savePlan} title='Save Plan' type="submit" className="mt-[36px] btnStyle min-w-[184px] mb-5" />

            )}
            {/* <ButtonCs onClick={handleOpenClose} title='Open Canvas' type="button" className="mt-[36px] btnStyle min-w-[184px] mb-5" /> */}
          </div>

          <OffCanvasComp placement="end" name="sidebar" show={show} handleClose={handleOpenClose} customStyle="pl-4 py-4">
            <ExerciseCard handleClose={handleOpenClose} onSelectExercise={(exercise) => {
              addExerciseToDay(selectedWeekIndex, selectedDayIndex, exercise);

            }} />
          </OffCanvasComp>

        </div>
      </>

    </div>
    </SecureComponent>
  );
};

export default createPlanPage;