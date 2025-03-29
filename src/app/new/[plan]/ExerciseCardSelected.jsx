// app/new/[plan]/ExerciseCardSelected.jsx
"use client";

import _ from "lodash";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import ExerciseDetailHeader from "./ExerciseDetailHeader"; // Adjust path
import SetAndRepsForm from "./SetAndRepsForm"; // Adjust path
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { GlobalContext } from "@/context/GloablContext";
import toast from "react-hot-toast";
import ConfirmationToast from "@/components/Toast/ConfirmationToast"; // Adjust path
import { calculateNextDay } from "@/utils";


// --- Component START ---
const ExerciseCardSelected = ({
  exercisesBasedOnDay, // { dayName, day (number), exercises, weekName, week (index) }
  selectedPlanId,
  // State and Setters from PlanDetail
  selectedDay,        // numeric day number
  setSelectedDay,     // function to set PlanDetail's selectedDay
  selectedWeek,       // week object
  setSelectedWeek,    // function to set PlanDetail's selectedWeek
  // Context for calculateNextDay
  dayData,            // Array of { label, value, day } for the *current* week
  weekStructure,      // Array of { week (index), weekName } for the *whole plan*
  totalWeeksCount,    // Numeric total weeks count
  allWeeksData        // The complete weeksExercise array from transformedData
}) => {
  const router = useRouter();
  const { userId } = useContext(GlobalContext);
  const [open, setOpen] = useState(false);
  const swiperRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { exercises, dayName, weekName, day: currentDayNumber, week: currentWeekIndex } = exercisesBasedOnDay || {};

  // Filter exercises once
  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  ) || [];

  // Define keys consistently
  const workoutProgressKey = `workout-progress-${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId || 'default'}`;
  const selectedDayKey = `selectedDayNumber_${selectedPlanId || 'default'}`;
  const slideIndexKeyBase = `slideIndex-${selectedPlanId || 'default'}`; // Add planId scope

  // --- useEffect hooks for Swiper ---
  useEffect(() => {
    // Reset slide to 0 when the selected day changes
    setCurrentSlideIndex(0);
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(0, 0); // Slide immediately without animation
    }
    // Clear slide index for the *previous* day if needed (optional)
    // const prevDay = /* logic to get previous day */;
    // if (prevDay) localStorage.removeItem(`${slideIndexKeyBase}-${prevDay}`);
  }, [selectedDay, selectedWeek]); // Reset on day OR week change

  useEffect(() => {
    // Load saved slide index for the *current* day when component mounts or day changes
    if (selectedDay !== null) {
      const savedSlideIndex = localStorage.getItem(`${slideIndexKeyBase}-${selectedDay}`);
      const savedIndexInt = savedSlideIndex ? parseInt(savedSlideIndex, 10) : 0;
      // Validate index range
      const validIndex = (savedIndexInt >= 0 && savedIndexInt < filteredExercises.length) ? savedIndexInt : 0;

      setCurrentSlideIndex(validIndex);
      // Use setTimeout to ensure swiper is initialized after potential day change reset
      setTimeout(() => {
        if (swiperRef.current?.swiper) {
          swiperRef.current.swiper.slideTo(validIndex, 0); // Slide without animation
        }
      }, 0);
    } else {
        // If selectedDay is null, reset to 0
        setCurrentSlideIndex(0);
        setTimeout(() => {
            if (swiperRef.current?.swiper) {
                 swiperRef.current.swiper.slideTo(0, 0);
            }
        }, 0);
    }
  }, [selectedDay, selectedWeek, filteredExercises.length]); // Re-run if day/week/exercises change

  // --- Other functions ---
  const toggleOpen = () => setOpen((cur) => !cur);

  const goNext = () => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  const goPrev = () => {
    if (swiperRef.current?.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const handleSlideChange = (swiper) => {
    const newIndex = swiper.activeIndex;
    setCurrentSlideIndex(newIndex);
    // Save slide index for the *current* selected day
    if (selectedDay !== null) {
      localStorage.setItem(`${slideIndexKeyBase}-${selectedDay}`, newIndex.toString());
    }
  };


  // --- Skip Day Logic ---
  const handleSkipDay = () => {
    // Basic validation checks
    if (!allWeeksData || allWeeksData.length === 0 || !dayData || dayData.length === 0 || totalWeeksCount <= 0) {
        console.error("Cannot skip day: Plan structure data missing or invalid.", { allWeeksData, dayData, totalWeeksCount });
        toast.error("Cannot skip day: Plan structure data missing.");
        return;
    }
    if (typeof currentWeekIndex !== 'number' || currentWeekIndex < 0) {
        console.error("Cannot skip day: currentWeekIndex is invalid.", { currentWeekIndex });
        toast.error("Cannot skip day: Current week information missing.");
        return;
    }
    if (typeof currentDayNumber !== 'number' || currentDayNumber <= 0) {
        console.error("Cannot skip day: currentDayNumber is invalid.", { currentDayNumber });
        toast.error("Cannot skip day: Current day information missing.");
        return;
    }

    // --- Define the actual skip logic ---
    const proceedWithSkip = () => {
      try {
        const today = new Date().toISOString().split('T')[0]; // Date of the skip

        // 1. Update localStorage for each exercise on the skipped day
        if (filteredExercises && filteredExercises.length > 0) {
          console.log(`Skipping Day ${currentDayNumber} (Week ${currentWeekIndex}). Updating ${filteredExercises.length} exercises.`);
          filteredExercises.forEach((exercise, index) => {
            const exerciseId = exercise.id || `${currentDayNumber}-${index}`; // Consistent ID
            const storageKey = `workout-${currentDayNumber}-${exerciseId}`; // Key specific to the day being skipped
            const numberOfSets = exercise?.weeklySetConfig?.sets || 1;

            try {
                let exerciseData = [];
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    try {
                      exerciseData = JSON.parse(savedData);
                      if (!Array.isArray(exerciseData)) exerciseData = [];
                    } catch (parseError){
                      console.warn(`Failed to parse existing data for ${storageKey}, will overwrite. Error:`, parseError);
                      exerciseData = [];
                    }
                }

                let updatedExerciseData;
                if (exerciseData.length === 0) {
                    // Create default sets marked as skipped
                    updatedExerciseData = Array(numberOfSets).fill().map((_, setIndex) => ({
                        id: setIndex + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
                        isCompleted: false, isActive: false, isEditing: false,
                        isDurationRunning: false, isRestRunning: false,
                        date: today, exerciseId: exerciseId, skipped: true, skippedDates: [today]
                    }));
                } else {
                    // Modify existing sets
                    updatedExerciseData = exerciseData.map(set => {
                        const updatedSkippedDates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : [];
                        if (!updatedSkippedDates.includes(today)) updatedSkippedDates.push(today);
                        return {
                            ...set, isCompleted: false, isActive: false, isEditing: false,
                            isDurationRunning: false, isRestRunning: false,
                            skipped: true, skippedDates: updatedSkippedDates
                        };
                    });
                }
                localStorage.setItem(storageKey, JSON.stringify(updatedExerciseData));

            } catch (error) {
              console.error(`Error updating localStorage for exercise ${exerciseId} on skipped day ${currentDayNumber}:`, error);
            }
          });
        } else {
             console.warn(`No exercises found for Day ${currentDayNumber} (Week ${currentWeekIndex}) to mark as skipped.`);
        }

        // 2. Calculate the next day using the standardized function
        // Pass currentWeekIndex, currentDayNumber, the *full* week data, and total weeks count
        const nextStep = calculateNextDay(currentWeekIndex, currentDayNumber, allWeeksData, totalWeeksCount);

        if (nextStep === 'error') {
          toast.error("Error calculating the next day, but current day marked as skipped.");
          // Potentially redirect or handle recovery - maybe stay on the current view but disable actions?
          // For now, let's just show the error. User might manually navigate.
          return;
        }

        // Clear slide index for the day being skipped
        localStorage.removeItem(`${slideIndexKeyBase}-${currentDayNumber}`);

        if (nextStep === null) { // Plan complete
          toast.success("Workout Plan Completed!");
          localStorage.removeItem(workoutProgressKey);
          localStorage.removeItem(selectedWeekKey); // Clean up individual keys too
          localStorage.removeItem(selectedDayKey);
          // Consider clearing all slide indexes for this planId?
          router.push("/new"); // Navigate to overview or completion page
          return;
        }

        // 3. Plan continues: Get details for the *next* step
        const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } = nextStep;

        // PERSIST Global Progress (to the *next* day/week) using numeric identifiers
        const newProgress = {
            currentWeekIndex: nextWeekIndex,
            currentDayNumber: nextDayNumber,
            weekName: nextWeekName, // Store names for display convenience if needed
            dayName: nextDayName
        };
        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        // Store individual keys as well (using numeric identifiers)
        localStorage.setItem(selectedWeekKey, nextWeekIndex.toString());
        localStorage.setItem(selectedDayKey, nextDayNumber.toString());


        // UPDATE React state in PlanDetail (to the *next* day/week)
        // Find the week object corresponding to nextWeekIndex
        const nextWeekObject = allWeeksData.find(w => w.week === nextWeekIndex);
        if(nextWeekObject) {
            setSelectedWeek(nextWeekObject); // Update PlanDetail's week state
            setSelectedDay(nextDayNumber);   // Update PlanDetail's day state
            toast.success(`Skipped to ${nextDayName || `Day ${nextDayNumber}`}, ${nextWeekName || `Week ${nextWeekIndex + 1}`}`);
        } else {
            console.error("Could not find next week object after skip calculation.", { nextWeekIndex });
            toast.error("Skipped day, but failed to load next week's data.");
            // Might need to redirect or show a more critical error
        }


      } catch (error) {
        console.error("Error encountered in proceedWithSkip:", error);
        toast.error("An unexpected error occurred while skipping the day.");
      }
    };

    // Show confirmation toast
    toast((t) => (
      <ConfirmationToast
        t={t}
        message="Are you sure you want to skip this entire day's workout?"
        onConfirm={proceedWithSkip}
      />
    ), { duration: Infinity, position: "top-center" });
  };


  // Data passed down to SetAndRepsForm
  const necessaryDataForSetForm = {
    selectedPlanId,
    userId,
    // Pass current state down
    selectedDay: currentDayNumber, // Pass numeric day
    selectedWeek: selectedWeek, // Pass week object
    // Pass setters down
    setSelectedDay,
    setSelectedWeek,
    // Pass context for calculateNextDay
    dayData: dayData, // Day data for *current* week
    weekStructure: weekStructure, // Simplified structure for display/context [{ week, weekName }]
    totalWeeksCount: totalWeeksCount, // Numeric count
    allWeeksData: allWeeksData // Full data for calculation
  };

  // --- JSX Return ---
  if (!filteredExercises || filteredExercises.length === 0) {
     return (
        <div className="p-6 text-center">
             <p className="text-gray-500">
                No exercises scheduled for {dayName || `Day ${currentDayNumber}`}, {weekName || `Week ${currentWeekIndex + 1}`}.
             </p>
             <button
               className="block px-4 py-2 mx-auto mt-4 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
               onClick={handleSkipDay}
             >
               Skip This Day
             </button>
        </div>
     );
  }

  return (
    <div className="w-full px-2 pb-4 md:px-4"> {/* Add some padding */}
      {/* Skip Day Button */}
      <div className="flex justify-end pt-2 mb-2">
         <button
           className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
           onClick={handleSkipDay}
         >
           Skip Day
         </button>
      </div>

      {/* Swiper */}
      <Swiper
        ref={swiperRef}
        slidesPerView={1}
        spaceBetween={10} // Reduced space
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        modules={[Pagination]}
        className="w-full exercise-swiper" // Add a class for potential styling
        onSlideChange={handleSlideChange}
        key={`${selectedWeek?.week}-${selectedDay}`} // Key ensures Swiper remounts/updates on day/week change
        initialSlide={currentSlideIndex} // Set initial slide based on state
        observer={true} // Helps update swiper on parent changes
        observeParents={true} // Helps update swiper on parent changes
      >
        {filteredExercises.map((exercise, index) => {
          const setData = exercise?.weeklySetConfig;
          const isLastExercise = index === filteredExercises.length - 1;
          const exerciseId = exercise.id || `${currentDayNumber}-${index}`; // Consistent ID

          return (
            <SwiperSlide key={`${currentDayNumber}-${exerciseId}`} className="w-full bg-white rounded-lg shadow-sm"> {/* Add slide styling */}
              <div className="w-full pb-10 mb-4"> {/* Increased bottom padding for pagination */}
                <ExerciseDetailHeader
                  data={exercise}
                  toggleOpen={toggleOpen}
                  open={open}
                />
                <div className="p-3">
                  <SetAndRepsForm
                    // Core exercise data
                    sets={setData?.sets || 1}
                    selectedDay={currentDayNumber} // Pass numeric day number
                    exerciseId={exerciseId}
                    exerciseName={exercise.name}
                    // Navigation helpers
                    goPrev={goPrev}
                    goNext={goNext}
                    exerciseIndex={index}
                    isLastExercise={isLastExercise}
                    // Pass down necessary data object
                    necessaryData={necessaryDataForSetForm}
                  />
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default ExerciseCardSelected;