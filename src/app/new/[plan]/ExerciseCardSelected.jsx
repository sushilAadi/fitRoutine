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
import toast from "react-hot-toast"; // Make sure toast is imported
import ConfirmationToast from "@/components/Toast/ConfirmationToast";




// --- Helper function (keep as before) ---
const calculateNextDay = (currentWeekNumber, currentDayValue, dayData, totalWeeks, weekStructure) => {
  // ... (keep existing implementation)
   const totalDays = dayData.length;
  let nextWeekNumber = currentWeekNumber;
  let nextDayValue = currentDayValue;
  const currentDayIndex = dayData.findIndex(d => d.day === currentDayValue); // Use .day here based on dayData structure

  if (currentDayIndex === -1) {
      console.error("Current day not found in dayData during calculation");
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
  const nextDayObj = dayData.find(d => d.day === nextDayValue); // Use .day

  if (!nextWeekObj || !nextDayObj) {
      console.error("Error calculating next step: Could not find next week or day object.", { nextWeekNumber, nextDayValue, nextWeekObj, nextDayObj });
      return 'error'; // Indicate an error occurred
  }

  return {
    nextWeekNumber,
    nextDayValue,
    nextWeekName: nextWeekObj.weekName,
    nextDayName: nextDayObj.label // Use .label
  };
};


// --- Component START ---
const ExerciseCardSelected = ({
  exercisesBasedOnDay,
  selectedPlanId,
  selectededDay,
  setSelectedWeek,
  selectedWeek,
  setSelectededDay,
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

  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  );

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
    // Clear slide index moved to handleSkipDay
  }, [selectededDay]);

  useEffect(() => {
    if (selectededDay) {
      const savedSlideIndex = localStorage.getItem(`${slideIndexKeyBase}-${selectededDay}`);
      const savedIndexInt = savedSlideIndex ? parseInt(savedSlideIndex) : 0;
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

    // --- Define the actual skip logic ---
    const proceedWithSkip = () => {
      try {
        const totalWeeks = parseInt(noOfweeks);
        let currentWeekNumber = selectedWeek.week;
        let currentDayValue = selectededDay;

        const nextStep = calculateNextDay(currentWeekNumber, currentDayValue, dayData, totalWeeks, weekStructure);

        if (nextStep === 'error') {
          // toast.error("Error calculating the next day to skip to.");
          router.push("/new")
          return;
        }

        if (nextStep === null) {
          toast.success("Workout Plan Completed!");
          localStorage.removeItem(workoutProgressKey);
          localStorage.removeItem(selectedDayKey);
          localStorage.removeItem(selectedWeekKey);
          localStorage.removeItem(`${slideIndexKeyBase}-${currentDayValue}`);
          router.push("/new");
          return;
        }

        const { nextWeekNumber, nextDayValue, nextWeekName, nextDayName } = nextStep;

        // 1. PERSIST
        const newProgress = { currentWeek: nextWeekNumber, currentDay: nextDayValue, weekName: nextWeekName, dayName: nextDayName };
        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        localStorage.setItem(selectedWeekKey, nextWeekNumber.toString());
        localStorage.setItem(selectedDayKey, nextDayValue.toString());
        localStorage.removeItem(`${slideIndexKeyBase}-${currentDayValue}`); // Clear old slide index

        // 2. UPDATE React state
        setSelectedWeek(nextWeekNumber);
        setSelectededDay(nextDayValue);

        toast.success(`Skipped to ${nextDayName || `Day ${nextDayValue}`}, Week ${nextWeekNumber}`);

      } catch (error) {
        console.error("Error encountered in proceedWithSkip:", error);
        toast.error("An unexpected error occurred while skipping the day.");
      }
    };

   
    toast((t) => ( 
      <ConfirmationToast
        t={t} // Pass the toast object
        message="Are you sure you want to skip this day?"
        onConfirm={proceedWithSkip}
      />
    ), {
      duration: Infinity, 
      position: "top-center", 
    });
  };
  


  const necessaryData = {
    day: selectededDay,
    dayName: exercisesBasedOnDay?.dayName,
    weekName: selectedWeek?.weekName,
    selectedPlanId,
    userId,
    selectededDay,
    setSelectedWeek,
    selectedWeek,
    setSelectededDay,
    noOfweeks,
    dayData,
    weekStructure,
    exercises: filteredExercises
  };

  // --- JSX Return (keep as before) ---
  if (!filteredExercises || filteredExercises.length === 0) {
     return (
        <div className="p-4 text-center text-gray-500">
             No exercises found for Day {selectededDay}, Week {selectedWeek?.week}.
             <button
               className="block px-4 py-2 mx-auto mt-4 text-red-500 border border-red-300 rounded hover:bg-red-50"
               onClick={handleSkipDay} // Still allow skipping
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
        key={selectededDay}
        initialSlide={currentSlideIndex}
      >
        {filteredExercises?.map((exercise, index) => {
          const setData = exercise?.weeklySetConfig;
          const isLastExercise = index === filteredExercises.length - 1;

          return (
            <SwiperSlide key={`${selectededDay}-${exercise.id || index}`} className="w-full">
              <div className="w-full mb-4">
                <ExerciseDetailHeader
                  data={exercise}
                  toggleOpen={toggleOpen}
                  open={open}
                />
                <div className="p-3">
                  <SetAndRepsForm
                    sets={setData?.sets || 1}
                    selectedDay={selectededDay}
                    exerciseId={exercise.id || `${selectededDay}-${index}`}
                    exerciseName={exercise.name}
                    goPrev={goPrev}
                    goNext={goNext}
                    necessaryData={necessaryData}
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