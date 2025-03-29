"use client";

import _ from "lodash";
import React, { useState, useRef, useEffect, useContext } from "react";
import { useRouter } from "next/navigation";
import ExerciseDetailHeader from "./ExerciseDetailHeader";
import SetAndRepsForm from "./SetAndRepsForm";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { GlobalContext } from "@/context/GloablContext";
import toast from "react-hot-toast";
import ConfirmationToast from "@/components/Toast/ConfirmationToast";

// --- Helper function (calculateNextDay - keep as before) ---
const calculateNextDay = (currentWeekNumber, currentDayValue, dayData, totalWeeks, weekStructure) => {
  const totalDays = dayData.length;
  let nextWeekNumber = currentWeekNumber;
  let nextDayValue = currentDayValue;
  // Ensure we use the correct property for matching, assuming 'day' from provided context
  const currentDayIndex = dayData.findIndex(d => d.day === currentDayValue);

  if (currentDayIndex === -1) {
      console.error("Current day not found in dayData during calculation", { currentDayValue, dayData });
      return 'error';
  }

  if (currentDayIndex < totalDays - 1) {
    // Advance to next day in the same week
    nextDayValue = dayData[currentDayIndex + 1].day; // Use .day
  } else if (currentWeekNumber < totalWeeks) {
    // Advance to the first day of the next week
    nextWeekNumber = currentWeekNumber + 1;
    nextDayValue = dayData[0].day; // Use .day
  } else {
    // Last day of the last week - plan complete
    return null;
  }

  const nextWeekObj = weekStructure.find(w => w.week === nextWeekNumber);
  // Ensure we use the correct property for matching, assuming 'day' from provided context
  const nextDayObj = dayData.find(d => d.day === nextDayValue);

  if (!nextWeekObj || !nextDayObj) {
      console.error("Error calculating next step: Could not find next week or day object.", { nextWeekNumber, nextDayValue, nextWeekObj, nextDayObj });
      return 'error'; // Indicate an error occurred
  }

  return {
    nextWeekNumber,
    nextDayValue,
    nextWeekName: nextWeekObj.weekName,
    // Ensure we use the correct property for label, assuming 'label' from provided context
    nextDayName: nextDayObj.label
  };
};


// --- Component START ---
const ExerciseCardSelected = ({
  exercisesBasedOnDay,
  selectedPlanId,
  selectededDay, // Keep this prop name as it's passed down
  setSelectedWeek,
  selectedWeek,
  setSelectededDay, // Keep this prop name as it's passed down
  noOfweeks,
  dayData,
  weekStructure
}) => {
  const router = useRouter();
  const { userId } = useContext(GlobalContext);
  const [open, setOpen] = useState(false);
  const swiperRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { exercises, dayName, weekName } = exercisesBasedOnDay || {};

  // Filter exercises once
  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  ) || []; // Ensure it's always an array

  // Define keys consistently
  const workoutProgressKey = `workout-progress-${selectedPlanId || 'default'}`;
  const selectedDayKey = `selectedDay_${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeek_${selectedPlanId || 'default'}`;
  const slideIndexKeyBase = `slideIndex`;

  // --- useEffect hooks (keep as before) ---
  useEffect(() => {
    setCurrentSlideIndex(0);
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideTo(0);
    }
  }, [selectededDay]);

  useEffect(() => {
    if (selectededDay) {
      const savedSlideIndex = localStorage.getItem(`${slideIndexKeyBase}-${selectededDay}`);
      const savedIndexInt = savedSlideIndex ? parseInt(savedSlideIndex, 10) : 0;
      setCurrentSlideIndex(savedIndexInt);
      setTimeout(() => {
        if (swiperRef.current?.swiper) {
          swiperRef.current.swiper.slideTo(savedIndexInt, 0);
        }
      }, 0);
    } else {
      setCurrentSlideIndex(0);
       setTimeout(() => {
          if (swiperRef.current?.swiper) {
            swiperRef.current.swiper.slideTo(0, 0);
          }
       }, 0);
    }
  }, [selectededDay]);

  // --- Other functions (toggleOpen, goNext, goPrev, handleSlideChange - keep as before) ---
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
    if (selectededDay) {
      localStorage.setItem(`${slideIndexKeyBase}-${selectededDay}`, newIndex.toString());
    }
  };


  const handleSkipDay = () => {
    // Basic validation checks (keep as before)
    if (!dayData || dayData.length === 0 || !weekStructure || weekStructure.length === 0) {
      console.error("Cannot skip day: dayData or weekStructure is missing.", { dayData, weekStructure });
      toast.error("Cannot skip day: Plan structure data missing.");
      return;
    }
    if (!selectedWeek || typeof selectedWeek.week !== 'number') {
        console.error("Cannot skip day: selectedWeek data is invalid.", { selectedWeek });
        toast.error("Cannot skip day: Current week information is missing.");
        return;
    }
     // Ensure selectededDay is valid (it's the day *being skipped*)
    if (typeof selectededDay === 'undefined' || selectededDay === null) {
        console.error("Cannot skip day: current day value is missing.", { selectededDay });
        toast.error("Cannot skip day: Current day information is missing.");
        return;
    }


    // --- Define the actual skip logic ---
    const proceedWithSkip = () => {
      try {
        const totalWeeks = parseInt(noOfweeks, 10);
        const currentWeekNumber = selectedWeek.week;
        const currentDayValue = selectededDay; // The day we are currently on *and* skipping
        const today = new Date().toISOString().split('T')[0]; // Date of the skip

        // ***** START: Update localStorage for each exercise on the skipped day *****
        if (filteredExercises && filteredExercises.length > 0) {
          console.log(`Skipping Day ${currentDayValue}. Updating ${filteredExercises.length} exercises.`);
          filteredExercises.forEach((exercise, index) => {
            // Construct the unique ID for the storage key, matching SetAndRepsForm logic
            const exerciseId = exercise.id || `${currentDayValue}-${index}`;
            const storageKey = `workout-${currentDayValue}-${exerciseId}`;
            const numberOfSets = exercise?.weeklySetConfig?.sets || 1;

            try {
                // 1. Read existing data for this exercise on this day
                let exerciseData = [];
                const savedData = localStorage.getItem(storageKey);
                if (savedData) {
                    try {
                      exerciseData = JSON.parse(savedData);
                      if (!Array.isArray(exerciseData)) exerciseData = []; // Ensure it's an array
                    } catch (parseError){
                      console.warn(`Failed to parse existing data for ${storageKey}, will overwrite. Error:`, parseError);
                      exerciseData = [];
                    }
                }

                // 2. Modify the data (or create if non-existent)
                let updatedExerciseData;
                if (exerciseData.length === 0) {
                    // If no data exists, create default sets marked as skipped
                    updatedExerciseData = Array(numberOfSets).fill().map((_, setIndex) => ({
                        id: setIndex + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00",
                        isCompleted: false, isActive: false, isEditing: false,
                        isDurationRunning: false, isRestRunning: false,
                        date: today,
                        exerciseId: exerciseId,
                        skipped: true, // Mark as skipped
                        skippedDates: [today] // Add today's date
                    }));
                } else {
                    // If data exists, modify each set
                    updatedExerciseData = exerciseData.map(set => {
                        const updatedSkippedDates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : [];
                        if (!updatedSkippedDates.includes(today)) {
                            updatedSkippedDates.push(today);
                        }
                        return {
                            ...set,
                            isCompleted: false, // Ensure not marked as completed
                            isActive: false,    // Ensure not active
                            isEditing: false,   // Ensure not editing
                            isDurationRunning: false, // Stop any potential timers stored
                            isRestRunning: false,
                            skipped: true, // Mark as skipped
                            skippedDates: updatedSkippedDates // Update dates array
                        };
                    });
                }

                // 3. Save the modified data back to localStorage
                localStorage.setItem(storageKey, JSON.stringify(updatedExerciseData));
                // console.log(`Updated ${storageKey} with skipped status.`);

            } catch (error) {
              console.error(`Error updating localStorage for exercise ${exerciseId} on skipped day ${currentDayValue}:`, error);
              // Optionally notify the user, but maybe too noisy for multiple exercises
              // toast.error(`Failed to update status for ${exercise.name || 'one exercise'}.`);
            }
          });
        } else {
             console.warn(`No exercises found for Day ${currentDayValue} to mark as skipped.`);
        }
        // ***** END: Update localStorage for each exercise on the skipped day *****


        // --- Now, calculate the next day and update global progress ---
        const nextStep = calculateNextDay(currentWeekNumber, currentDayValue, dayData, totalWeeks, weekStructure);

        if (nextStep === 'error') {
          // If calculation fails, we've already marked the current day as skipped,
          // maybe redirect to a safe place or show a specific error.
          toast.error("Error calculating the next day, but current day marked as skipped.");
          // Potentially redirect or handle recovery
          router.push("/new"); // Example redirect
          return;
        }

        if (nextStep === null) { // Plan complete
          toast.success("Workout Plan Completed!");
          // Clear global progress markers and the skipped day's slide index
          localStorage.removeItem(workoutProgressKey);
          localStorage.removeItem(selectedDayKey);
          localStorage.removeItem(selectedWeekKey);
          localStorage.removeItem(`${slideIndexKeyBase}-${currentDayValue}`);
          router.push("/new");
          return;
        }

        // Plan continues: Get details for the *next* step
        const { nextWeekNumber, nextDayValue, nextWeekName, nextDayName } = nextStep;

        // 1. PERSIST Global Progress (to the *next* day/week)
        const newProgress = { currentWeek: nextWeekNumber, currentDay: nextDayValue, weekName: nextWeekName, dayName: nextDayName };
        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        localStorage.setItem(selectedWeekKey, nextWeekNumber.toString());
        localStorage.setItem(selectedDayKey, nextDayValue.toString()); // Store the *next* day's value
        localStorage.removeItem(`${slideIndexKeyBase}-${currentDayValue}`); // Clear old slide index for the day we just skipped

        // 2. UPDATE React state (to the *next* day/week)
        setSelectedWeek(nextWeekNumber); // Update state to the next week
        setSelectededDay(nextDayValue); // Update state to the next day

        toast.success(`Skipped to ${nextDayName || `Day ${nextDayValue}`}, Week ${nextWeekNumber}`);

      } catch (error) {
        console.error("Error encountered in proceedWithSkip:", error);
        toast.error("An unexpected error occurred while skipping the day.");
      }
    };

    // Show confirmation toast (keep as before)
    toast((t) => (
      <ConfirmationToast
        t={t} // Pass the toast object
        message="Are you sure you want to skip this entire day's workout?" // Clarified message
        onConfirm={proceedWithSkip}
      />
    ), {
      duration: Infinity,
      position: "top-center",
    });
  };



  // Necessary data passed down (ensure consistency if used in SetAndRepsForm)
  const necessaryData = {
    day: selectededDay, // Pass the current day value
    dayName: exercisesBasedOnDay?.dayName,
    weekName: selectedWeek?.weekName,
    selectedPlanId,
    userId,
    selectededDay, // Repeat for clarity if needed by child
    setSelectedWeek,
    selectedWeek,
    setSelectededDay, // Repeat for clarity if needed by child
    noOfweeks,
    dayData,
    weekStructure,
    exercises: filteredExercises // Pass the filtered list
  };

  // --- JSX Return ---
  if (!filteredExercises || filteredExercises.length === 0) {
     // Handle case where the day might legitimately have no exercises
     return (
        <div className="p-4 text-center text-gray-500">
             No exercises scheduled for Day {selectededDay}, Week {selectedWeek?.week}.
             <button
               className="block px-4 py-2 mx-auto mt-4 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
               onClick={handleSkipDay} // Allow skipping even if no exercises shown
             >
               Skip This Day
             </button>
        </div>
     );
  }

  return (
    <div className="w-full">
      {/* Skip Day Button */}
      <div className="flex justify-end px-4 mb-2">
         <button
           className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50"
           onClick={handleSkipDay} // onClick now shows the toast first
         >
           Skip Day
         </button>
      </div>

      {/* Swiper */}
      <Swiper
        ref={swiperRef}
        slidesPerView={1}
        spaceBetween={20}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        modules={[Pagination]}
        className="w-full"
        onSlideChange={handleSlideChange}
        key={selectededDay} // Key ensures Swiper remounts/updates on day change
        initialSlide={currentSlideIndex}
      >
        {/* Use filteredExercises here */}
        {filteredExercises.map((exercise, index) => {
          const setData = exercise?.weeklySetConfig;
          const isLastExercise = index === filteredExercises.length - 1;
          // Define exerciseId consistently for key and passing down
          const exerciseId = exercise.id || `${selectededDay}-${index}`;

          return (
            <SwiperSlide key={`${selectededDay}-${exerciseId}`} className="w-full">
              <div className="w-full mb-4">
                <ExerciseDetailHeader
                  data={exercise}
                  toggleOpen={toggleOpen}
                  open={open}
                />
                <div className="p-3">
                  <SetAndRepsForm
                    sets={setData?.sets || 1}
                    selectedDay={selectededDay} // Pass the current day value
                    exerciseId={exerciseId} // Pass the consistent ID
                    exerciseName={exercise.name}
                    goPrev={goPrev}
                    goNext={goNext}
                    necessaryData={necessaryData} // Pass the prepared necessaryData object
                    exerciseIndex={index}
                    isLastExercise={isLastExercise}
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
