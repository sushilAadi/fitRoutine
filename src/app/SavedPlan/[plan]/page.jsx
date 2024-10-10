'use client'
import React, { useState, useEffect } from 'react';
import _ from 'lodash';
import OffCanvasComp from '@/components/OffCanvas/OffCanvasComp';
import ExerciseDeatil from './ExerciseDeatil';

const TabButton = ({ active, onClick, children, disabled }) => (
  <button
    className={`px-4 py-2 mx-1 rounded-t-lg ${
      active 
        ? 'bg-black text-white border-b-2 border-red-500' 
        : disabled 
          ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
          : 'bg-gray-100 hover:bg-gray-200'
    }`}
    onClick={onClick}
    disabled={disabled}
  >
    {children}
  </button>
);

const PlanDetail = ({ params }) => {
  const [workoutData, setWorkoutData] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState(0);
  const [selectedDay, setSelectedDay] = useState(0);
  const [exerciseDetails, setExerciseDetails] = useState({});
  const [selectedExercise,setSelectedExercise] = useState(null)
  const [show, setShow] = useState(false);
  const handleOpenClose = () => setShow(!show);

  console.log("selectedExercise",selectedExercise)

  useEffect(() => {
    const plans = Object.keys(localStorage)
      .filter(key => key.startsWith('workoutPlan_'))
      .map(key => JSON.parse(localStorage.getItem(key)));
    
    const findPlan = plans?.find(i => i?.name === params?.plan);
    if (findPlan) {
      setWorkoutData(findPlan);
    }
  }, [params?.plan]);

  const isExerciseCompleted = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    return workoutData?.exerciseHistory[key] && workoutData.exerciseHistory[key].length > 0;
  };

  const isExerciseEnabled = (weekIndex, dayIndex, exerciseIndex) => {
    // First exercise is always enabled
    if (exerciseIndex === 0) return true;

    // Check if previous exercise is completed
    return isExerciseCompleted(weekIndex, dayIndex, exerciseIndex - 1);
  };

  const isDayCompleted = (weekIndex, dayIndex) => {
    const exercises = workoutData?.workoutPlan[weekIndex][dayIndex].exercises || [];
    return exercises.every((_, index) => isExerciseCompleted(weekIndex, dayIndex, index));
  };

  const isWeekCompleted = (weekIndex) => {
    return Array.from({ length: workoutData?.daysPerWeek || 0 }).every((_, dayIndex) => 
      isDayCompleted(weekIndex, dayIndex)
    );
  };

  const isDayAccessible = (weekIndex, dayIndex) => {
    if (weekIndex === 0 && dayIndex === 0) return true;
    if (dayIndex === 0) return isWeekCompleted(weekIndex - 1);
    return isDayCompleted(weekIndex, dayIndex - 1);
  };

  const isWeekAccessible = (weekIndex) => {
    if (weekIndex === 0) return true;
    return isWeekCompleted(weekIndex - 1);
  };

  const moveToNextDay = () => {
    if (selectedDay < workoutData.daysPerWeek - 1) {
      setSelectedDay(selectedDay + 1);
    } else if (selectedWeek < workoutData.weeks - 1) {
      setSelectedWeek(selectedWeek + 1);
      setSelectedDay(0);
    }
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

  const removeExerciseDetail = (weekIndex, dayIndex, exerciseIndex, detailIndex) => {
    const updatedExerciseDetails = { ...exerciseDetails };
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    updatedExerciseDetails[key].splice(detailIndex, 1);
    setExerciseDetails(updatedExerciseDetails);
  };

  const areAllSetsComplete = (details, exercise) => {
    if (!details || details.length === 0) return false;
    return details.every(detail => 
      detail.reps && (!exercise || exercise.equipment === "body weight" || exercise.equipment === "band" || detail.weight)
    );
  };

  const submitExerciseDetails = (weekIndex, dayIndex, exerciseIndex) => {
    const key = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
    const details = exerciseDetails[key];
    const exercise = workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];

    if (details && details.length > 0 && areAllSetsComplete(details, exercise)) {
      const setCount = details.length;
      const confirmMessage = `You have completed ${setCount} set${setCount > 1 ? 's' : ''}. Do you want to submit?`;

      if (window.confirm(confirmMessage)) {
        const updatedHistory = { ...workoutData.exerciseHistory };
        if (!updatedHistory[key]) {
          updatedHistory[key] = [];
        }
        updatedHistory[key].push(details);

        const updatedWorkoutData = {
          ...workoutData,
          exerciseHistory: updatedHistory
        };
        localStorage.setItem(`workoutPlan_${workoutData.name}`, JSON.stringify(updatedWorkoutData));
        setWorkoutData(updatedWorkoutData);

        const updatedExerciseDetails = { ...exerciseDetails };
        updatedExerciseDetails[key] = [];
        setExerciseDetails(updatedExerciseDetails);
      }
    }
  };

  const getPreviousRecord = (weekIndex, dayIndex, exerciseIndex) => {
    if (!workoutData || weekIndex === 0) return null;

    const currentExercise = workoutData.workoutPlan[weekIndex][dayIndex].exercises[exerciseIndex];
    
    for (let i = weekIndex - 1; i >= 0; i--) {
      if (workoutData.workoutPlan[i]?.[dayIndex]?.exercises[exerciseIndex]?.name === currentExercise.name) {
        const key = `${i}-${dayIndex}-${exerciseIndex}`;
        const records = workoutData.exerciseHistory[key];
        if (records?.length > 0) return records[records.length - 1];
      }
    }
    return null;
  };

  if (!workoutData) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{workoutData.name}</h1>
      
      {/* Week Tabs */}
      <div className=" mb-4">
        <div className="flex">
          {workoutData.weekNames.map((weekName, index) => (
            <TabButton
              key={index}
              active={selectedWeek === index}
              onClick={() => setSelectedWeek(index)}
              disabled={!isWeekAccessible(index)}
            >
              {weekName}
            </TabButton>
          ))}
        </div>
      </div>

      {/* Day Tabs */}
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

      {/* Exercise List */}
      <div className="space-y-4">
        {workoutData.workoutPlan[selectedWeek][selectedDay].exercises.map((exercise, exerciseIndex) => (
          <div 
            key={exerciseIndex} 
            className={`border rounded-lg p-4 bg-white shadow-sm mb-3 ${
              !isExerciseEnabled(selectedWeek, selectedDay, exerciseIndex) 
                ? 'opacity-50' 
                : ''
            }`}
          >
            <div className="flex items-center gap-4">
              <img 
                src={exercise.gifUrl} 
                alt={exercise.name} 
                className="w-16 h-16 object-cover rounded"
                onClick={()=>{setSelectedExercise(exercise);handleOpenClose()}}
              />
              <div className="flex-1">
                <h3 className="font-semibold text-lg" onClick={()=>{setSelectedExercise(exercise);handleOpenClose()}}>
                  {_.upperFirst(exercise.name)}
                </h3>
                <p className="text-sm text-gray-600">
                  Target: {exercise.target}
                </p>
              </div>
              {!isExerciseCompleted(selectedWeek, selectedDay, exerciseIndex) && (
                <button
                  onClick={() => addExerciseDetails(selectedWeek, selectedDay, exerciseIndex)}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-blue-600"
                  disabled={!isExerciseEnabled(selectedWeek, selectedDay, exerciseIndex)}
                >
                  Add Set
                </button>
              )}
            </div>

            {/* Exercise Details Input */}
            {exerciseDetails[`${selectedWeek}-${selectedDay}-${exerciseIndex}`]?.map((detail, detailIndex) => (
              <div key={detailIndex} className="flex items-center gap-2 mt-2">
                {exercise.equipment !== "body weight" && exercise.equipment !== "band" && (
                  <input
                    type="number"
                    placeholder="Weight"
                    value={detail.weight}
                    onChange={(e) => updateExerciseDetail(selectedWeek, selectedDay, exerciseIndex, detailIndex, 'weight', e.target.value)}
                    className="w-24 p-2 border rounded"
                  />
                )}
                <input
                  type="number"
                  placeholder="Reps"
                  value={detail.reps}
                  onChange={(e) => updateExerciseDetail(selectedWeek, selectedDay, exerciseIndex, detailIndex, 'reps', e.target.value)}
                  className="w-24 p-2 border rounded"
                />
                <button
                  onClick={() => removeExerciseDetail(selectedWeek, selectedDay, exerciseIndex, detailIndex)}
                  className="text-red-500 hover:text-red-700"
                >
                  <i className="fa-solid fa-xmark text-red-500 cursor-pointer" />
                </button>
              </div>
            ))}

            {exerciseDetails[`${selectedWeek}-${selectedDay}-${exerciseIndex}`]?.length > 0 && 
             areAllSetsComplete(exerciseDetails[`${selectedWeek}-${selectedDay}-${exerciseIndex}`], exercise) && (
              <button
                onClick={() => submitExerciseDetails(selectedWeek, selectedDay, exerciseIndex)}
                className="mt-2 bg-black text-white px-4 py-2 rounded"
              >
                Submit Sets
              </button>
            )}

            {/* Previous Record */}
            {selectedWeek > 0 && getPreviousRecord(selectedWeek, selectedDay, exerciseIndex) && (
              <div className="mt-2 text-sm text-gray-600">
                Previous: {getPreviousRecord(selectedWeek, selectedDay, exerciseIndex).map((set, index) => (
                  <span key={index}>
                    {set.weight && `${set.weight} lbs x `}{set.reps} reps
                    {index < getPreviousRecord(selectedWeek, selectedDay, exerciseIndex).length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>
            )}

            {/* Completed Sets */}
            {workoutData.exerciseHistory[`${selectedWeek}-${selectedDay}-${exerciseIndex}`] && (
              <div className="mt-2 text-sm text-green-600">
                Completed Sets: {workoutData.exerciseHistory[`${selectedWeek}-${selectedDay}-${exerciseIndex}`].map((record, recordIndex) => (
                  <span key={recordIndex}>
                    {record.map((set, setIndex) => (
                      <span key={setIndex}>
                        {set.weight && `${set.weight} Kg x `}{set.reps} reps
                        {setIndex < record.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Next Day/Week Button */}
      {isDayCompleted(selectedWeek, selectedDay) && (
        (selectedDay < workoutData.daysPerWeek - 1 || selectedWeek < workoutData.weeks - 1) && (
          <button
            onClick={moveToNextDay}
            className="mt-4 bg-black text-white px-6 py-2 rounded-lg  float-right"
          >
            {selectedDay < workoutData.daysPerWeek - 1 
              ? `Next Day (${workoutData.dayNames[selectedDay + 1]})` 
              : `Next Week (${workoutData.weekNames[selectedWeek + 1]}, ${workoutData.dayNames[0]})`}
          </button>
        )
      )}
      <OffCanvasComp placement="end" name="sidebar" show={show} handleClose={handleOpenClose} customStyle="pl-4 py-4">
            <ExerciseDeatil handleClose={handleOpenClose} data={selectedExercise}/>
          </OffCanvasComp>
    </div>
  );
};

export default PlanDetail;