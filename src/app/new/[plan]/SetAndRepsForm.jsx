"use client";

import React, { useState, useEffect, useRef } from "react";
import RegularButton from "@/components/Button/RegularButton";
import { useRouter } from "next/navigation";

const SetAndRepsForm = ({
  sets: initialSets,
  selectedDay,
  exerciseId,
  exerciseName,
  goPrev,
  goNext,
  necessaryData,
  exerciseIndex,
  isLastExercise,
}) => {
  const router = useRouter();

  
  const {day, dayName, weekName, selectedPlanId, userId, selectededDay, setSelectedWeek, selectedWeek, setSelectededDay, noOfweeks,dayData,weekStructure} = necessaryData || {};
  
  const workoutProgressKey = `workout-progress-${selectedPlanId}`;
  const selectedDayKey = `selectedDay_${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeek_${selectedPlanId || 'default'}`;
  
  console.log("+++++++++++++++", {day, dayName, weekName, selectedPlanId, userId, selectededDay,selectedWeek,noOfweeks,dayData,weekStructure});
  // Initialize sets data from local storage or create new
  const getInitialSets = () => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`workout-${selectedDay}-${exerciseId}`);
      if (savedData) {
        return JSON.parse(savedData);
      }
    }
    return Array(parseInt(initialSets) || 1).fill().map((_, index) => ({
      id: index + 1,
      weight: "",
      reps: "",
      duration: "00:00:00",
      rest: "00:00",
      isCompleted: false,
      isActive: index === 0, // Only first set is active initially
      isEditing: false, // Track editing state
      date: new Date().toISOString().split('T')[0],
    }));
  };

  const [sets, setSets] = useState([]);
  const [activeTimer, setActiveTimer] = useState(null); // 'workout' or 'rest' or null
  const [seconds, setSeconds] = useState(0);
  const [isAllSetsCompleted, setIsAllSetsCompleted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const timerRef = useRef(null);
  const activeSetRef = useRef(null);
  const waitingForRestCompletion = useRef(false);

  // Load data on mount
  useEffect(() => {
    setSets(getInitialSets());
    // Check if all sets are completed
    checkAllSetsCompleted();
  }, [selectedDay, exerciseId]);

  // Save data to localStorage whenever sets change
  useEffect(() => {
    if (sets.length > 0) {
      localStorage.setItem(`workout-${selectedDay}-${exerciseId}`, JSON.stringify(sets));
      checkAllSetsCompleted();
    }
  }, [sets, selectedDay, exerciseId]);

  useEffect(() => {
    if (isAllSetsCompleted && !isLastExercise) {
      const moveToNextTimeout = setTimeout(() => {
        goNext();
      }, 500); // Small delay to allow user to see completion

      return () => clearTimeout(moveToNextTimeout);
    }
  }, [isAllSetsCompleted, isLastExercise, goNext]);

  // Timer logic
  useEffect(() => {
    if (activeTimer) {
      timerRef.current = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [activeTimer]);

  // Update the active set's duration or rest time
  useEffect(() => {
    if (!activeTimer || activeSetRef.current === null) return;

    const updatedSets = [...sets];
    const activeSetIndex = updatedSets.findIndex(set => set.id === activeSetRef.current);
    
    if (activeSetIndex === -1) return;

    const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    const timeString = `${hours}:${minutes}:${secs}`;

    if (activeTimer === 'workout') {
      updatedSets[activeSetIndex].duration = timeString;
    } else if (activeTimer === 'rest') {
      updatedSets[activeSetIndex].rest = `${minutes}:${secs}`;
    }

    setSets(updatedSets);
  }, [seconds, activeTimer]);

  // Check if all sets are completed
  const checkAllSetsCompleted = () => {
    const allCompleted = sets.length > 0 && 
      sets.every(set => set.isCompleted) && 
      !waitingForRestCompletion.current;

    setIsAllSetsCompleted(allCompleted);
    
    return allCompleted;
  };

  const handleWorkoutCompletion = () => {
    try {
      // Retrieve current workout progress
      const savedProgress = JSON.parse(localStorage.getItem(workoutProgressKey) || '{}');

      // Determine next progression
      const totalWeeks = parseInt(noOfweeks);
      const totalDays = dayData.length;

      // Current week and day
      let nextWeek = selectedWeek.week;
      let nextDay = selectededDay;

      // Progress logic
      if (nextDay < totalDays) {
        // Move to next day in current week
        nextDay++;
      } else if (nextWeek < totalWeeks - 1) {
        // Move to next week and reset to first day
        nextWeek++;
        nextDay = 1;
      } else {
        // Completed entire plan
        router.push("/new");
        
        // Clear workout progress
        localStorage.removeItem(workoutProgressKey);
        return;
      }

      // Find the corresponding week and day objects
      const nextWeekObj = weekStructure.find(w => w.week === nextWeek);
      const nextDayObj = dayData.find(d => d.value === nextDay);

      // Save progress
      const newProgress = {
        currentWeek: nextWeek,
        currentDay: nextDay,
        weekName: nextWeekObj?.weekName,
        dayName: nextDayObj?.label
      };

      localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
      localStorage.setItem(selectedWeekKey, nextWeekObj?.weekName);
      localStorage.setItem(selectedDayKey, nextDay.toString());

      // Update state or trigger navigation
      setSelectedWeek(nextWeekObj);
      setSelectededDay(nextDay);

      // Navigate or reset for next workout
      router.push("/new");
    } catch (error) {
      console.error("Error in workout completion:", error);
      toast.error("An error occurred while completing the workout");
    }
  };

  // Start workout timer for a set
  const startWorkout = (setId) => {
    // Only allow if this set is active and not waiting for rest completion
    const setIndex = sets.findIndex(set => set.id === setId);
    if (setIndex === -1 || !sets[setIndex].isActive || waitingForRestCompletion.current) return;

    // If set is in editing mode, restart duration timer from 0
    setActiveTimer('workout');
    setSeconds(0);
    activeSetRef.current = setId;
  };

  // Complete a set
  const completeSet = (setId) => {
    const updatedSets = [...sets];
    const setIndex = updatedSets.findIndex(set => set.id === setId);
    
    if (setIndex === -1 || !updatedSets[setIndex].isActive) return;
    if (!updatedSets[setIndex].weight || !updatedSets[setIndex].reps) {
      alert("Please enter weight and reps before completing the set");
      return;
    }

    // Stop workout timer
    setActiveTimer(null);
    
    // Mark as completed and not editing
    updatedSets[setIndex].isCompleted = true;
    updatedSets[setIndex].isEditing = false;
    
    // Start rest timer for the completed set (even if it's the last set)
    waitingForRestCompletion.current = true;
    activeSetRef.current = setId;
    setActiveTimer('rest');
    setSeconds(0);
    
    // Activate next set if exists (this part remains unchanged)
    if (setIndex < updatedSets.length - 1) {
      // Next set will be activated when rest timer is stopped
    } else {
      // This is the last set, we'll still show the rest timer
    }
    
    setSets(updatedSets);
  };

  // Stop rest timer and activate next set
  const stopRestTimer = () => {
    setActiveTimer(null);
    waitingForRestCompletion.current = false;
    
    // Find the last completed set and activate the next one
    const lastCompletedIndex = sets.findIndex(set => set.isCompleted && 
      sets.findIndex(s => s.id > set.id && !s.isCompleted) === 
      sets.findIndex(s => s.id > set.id));
    
    if (lastCompletedIndex !== -1 && lastCompletedIndex < sets.length - 1) {
      const updatedSets = [...sets];
      updatedSets[lastCompletedIndex + 1].isActive = true;
      setSets(updatedSets);
    }
    
    // If all sets are completed, run checkAllSetsCompleted again
    if (sets.every(set => set.isCompleted)) {
      checkAllSetsCompleted();
    }
  };

  // Edit a set
  const editSet = (setId) => {
    const updatedSets = [...sets];
    const setIndex = updatedSets.findIndex(set => set.id === setId);
    
    if (setIndex === -1) return;
    
    // Allow editing only completed sets
    if (updatedSets[setIndex].isCompleted) {
      // Toggle editing mode (don't change completion status yet)
      updatedSets[setIndex].isEditing = true;
      updatedSets[setIndex].isActive = true;
      
      // Deactivate subsequent sets
      for (let i = setIndex + 1; i < updatedSets.length; i++) {
        updatedSets[i].isCompleted = false;
        updatedSets[i].isActive = false;
        updatedSets[i].isEditing = false;
      }
      
      waitingForRestCompletion.current = false;
      
      setSets(updatedSets);
    }
  };

  // Delete a set
  const deleteSet = (setId) => {
    if (sets.length <= 1) {
      alert("Cannot delete the only set");
      return;
    }
    
    if (confirm("Are you sure you want to delete this set?")) {
      const updatedSets = sets.filter(set => set.id !== setId);
      
      // Reassign IDs and ensure proper active state
      const reindexedSets = updatedSets.map((set, index) => ({
        ...set,
        id: index + 1,
        isActive: set.isCompleted ? set.isActive : index === 0 || 
                 (index > 0 && updatedSets[index - 1]?.isCompleted)
      }));
      
      setSets(reindexedSets);
    }
  };

  // Add a new set
  const addSet = () => {
    const newSetId = sets.length + 1;
    const lastSetCompleted = sets.length > 0 && sets[sets.length - 1].isCompleted;
    
    const newSet = {
      id: newSetId,
      weight: "",
      reps: "",
      duration: "00:00:00",
      rest: "00:00",
      isCompleted: false,
      isActive: lastSetCompleted && !waitingForRestCompletion.current,
      isEditing: false,
      date: new Date().toISOString().split('T')[0],
    };
    
    setSets([...sets, newSet]);
  };

  // Handle input changes
  const handleInputChange = (setId, field, value) => {
    const updatedSets = [...sets];
    const setIndex = updatedSets.findIndex(set => set.id === setId);
    
    if (setIndex === -1 || (!updatedSets[setIndex].isActive && !updatedSets[setIndex].isEditing)) return;
    
    updatedSets[setIndex][field] = value;
    setSets(updatedSets);
  };

  // Get history for this exercise
  const getExerciseHistory = () => {
    const history = [];
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.includes(`workout-`) && key.includes(`-${exerciseId}`)) {
          const data = JSON.parse(localStorage.getItem(key));
          if (data.length > 0) {
            history.push({
              date: data[0].date,
              day: key.split('-')[1],
              sets: data
            });
          }
        }
      }
    }
    return history.sort((a, b) => new Date(b.date) - new Date(a.date));
  };

  // Navigate to next exercise only if all sets are completed
  const handleGoNext = () => {
    if (isAllSetsCompleted) {
      goNext();
    } else {
      alert("Please complete all sets before moving to the next exercise");
    }
  };

  // Toggle history display
  const toggleHistory = () => {
    setShowHistory(!showHistory);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold">{exerciseName}</h2>
          <p className="text-sm text-gray-500">Track your progress for each set</p>
        </div>
        <button 
          onClick={toggleHistory}
          className="text-sm text-blue-500 hover:underline"
        >
          {showHistory ? "Hide History" : "Show History"}
        </button>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 font-normal">Weight</th>
            <th className="p-2 font-normal">Reps</th>
            <th className="p-2 font-normal text-center">
              <span 
                className="px-2 py-1 text-white cursor-pointer rounded-pill bg-tprimary"
                onClick={addSet}
              >
                Add Set
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sets.map((set) => (
            <tr key={set.id} className={!set.isActive && !set.isCompleted && !set.isEditing ? "opacity-50" : ""}>
              <td className="p-2">
                <div className="flex flex-col">
                  <input 
                    type="number" 
                    className="w-full border h-[40px] px-2" 
                    placeholder="Weight"
                    value={set.weight}
                    onChange={(e) => handleInputChange(set.id, "weight", e.target.value)}
                    disabled={(!set.isActive && !set.isEditing) || (set.isCompleted && !set.isEditing)}
                  />
                  <span className="text-[12px] text-gray-800">
                    Duration: {set.duration}
                  </span>
                </div>
              </td>
              <td className="p-2">
                <div className="flex flex-col">
                  <input 
                    type="number" 
                    className="w-full border h-[40px] px-2" 
                    placeholder="Reps"
                    value={set.reps}
                    onChange={(e) => handleInputChange(set.id, "reps", e.target.value)}
                    disabled={(!set.isActive && !set.isEditing) || (set.isCompleted && !set.isEditing)}
                  />
                  <span className="text-[12px] text-gray-800">
                    Rest: {set.rest}
                  </span>
                </div>
              </td>
              <td className="p-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  {/* Show both play and check buttons when in editing mode */}
                  {set.isEditing && (
                    <>
                      <i 
                        className="p-2 text-green-500 cursor-pointer fa-duotone fa-thin fa-play"
                        onClick={() => startWorkout(set.id)}
                        title="Restart workout timer"
                      ></i>
                      <i 
                        className="p-2 text-green-500 cursor-pointer fa-duotone fa-thin fa-check"
                        onClick={() => completeSet(set.id)}
                        title="Complete set"
                      ></i>
                    </>
                  )}
                  
                  {/* Show play button for active, non-editing, non-completed sets */}
                  {!set.isCompleted && set.isActive && !set.isEditing && !waitingForRestCompletion.current && activeTimer !== 'workout' && (
                    <i 
                      className="p-2 text-green-500 cursor-pointer fa-duotone fa-thin fa-play"
                      onClick={() => startWorkout(set.id)}
                    ></i>
                  )}
                  
                  {/* Show check button when workout timer is active */}
                  {!set.isCompleted && set.isActive && !set.isEditing && activeTimer === 'workout' && activeSetRef.current === set.id && (
                    <i 
                      className="p-2 text-green-500 cursor-pointer fa-duotone fa-thin fa-check"
                      onClick={() => completeSet(set.id)}
                    ></i>
                  )}
                  
                  {/* Show lock for inactive sets */}
                  {!set.isActive && !set.isCompleted && !set.isEditing && (
                    <i className="text-gray-400 fa-solid fa-lock"></i>
                  )}
                  
                  {/* Edit button only for completed sets that are not in editing mode AND not waiting for rest completion */}
                  {set.isCompleted && !set.isEditing && !waitingForRestCompletion.current && (
                    <i 
                      className="p-2 text-orange-500 cursor-pointer fa-duotone fa-light fa-pen-to-square"
                      onClick={() => editSet(set.id)}
                    ></i>
                  )}
                  
                  {/* Delete button always available */}
                  <i 
                    className="p-2 text-red-500 cursor-pointer fa-duotone fa-solid fa-trash"
                    onClick={() => deleteSet(set.id)}
                  ></i>
                </div>
                <span className="text-[12px] text-gray-800 block mt-1">
                  Total Weight: {set.weight && set.reps ? (parseInt(set.weight) * parseInt(set.reps)) : 0} kg
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {activeTimer === 'rest' && (
        <RegularButton 
          title={`Stop Rest Time (${Math.floor(seconds / 60)} min ${seconds % 60} sec)`} 
          className="w-full mt-4 font-medium bg-red-500 hover:bg-red-700"
          onClick={stopRestTimer}
        />
      )}

      {isLastExercise && isAllSetsCompleted && (
        <div className="mt-4">
          <RegularButton 
            title="Workout Completed" 
            className="w-full bg-green-500 hover:bg-green-700"
            onClick={handleWorkoutCompletion}
          />
        </div>
      )}

      {showHistory && (
        <div className="mt-6 mb-4">
          <h3 className="text-lg font-semibold">Previous Records</h3>
          <div className="overflow-y-auto max-h-40">
            {getExerciseHistory().length > 0 ? (
              getExerciseHistory().map((record, index) => (
                <div key={index} className="py-2 border-b">
                  <div className="font-medium">{record.date} ({record.day})</div>
                  <div className="text-sm">
                    {record.sets.map((set, i) => (
                      <div key={i} className="text-gray-600">
                        Set {set.id}: {set.weight}kg × {set.reps} reps
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <p className="italic text-gray-500">No previous records found</p>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between mt-4">
        <i 
          className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-left" 
          onClick={goPrev}
        ></i>
        <i 
          className={`p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-right ${!isAllSetsCompleted ? 'opacity-50' : ''}`} 
          onClick={handleGoNext}
        ></i>
      </div>
    </>
  );
};

export default SetAndRepsForm;