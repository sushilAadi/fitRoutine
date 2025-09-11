// app/new/[plan]/ExerciseCardSelected.jsx
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
import { calculateNextDay } from "@/utils";
import { doc, setDoc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

const ExerciseCardSelected = ({
  exercisesBasedOnDay,
  selectedPlanId,
  selectedDay,
  setSelectedDay,
  selectedWeek,
  setSelectedWeek,
  dayData,
  weekStructure,
  totalWeeksCount,
  allWeeksData,
  // *** ACCEPT FIREBASE DATA ***
  firebaseStoredData,
  transFormedData,
  updateProgressStats,
  progressStats
}) => {
  const router = useRouter();
  const { userId } = useContext(GlobalContext);
  const [open, setOpen] = useState(false);
  const swiperRef = useRef(null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const { exercises, dayName, weekName, day: currentDayNumber, week: currentWeekIndex } = exercisesBasedOnDay || {};

  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  ) || [];

  const workoutProgressKey = `workout-progress-${selectedPlanId || 'default'}`;
  const selectedWeekKey = `selectedWeekIndex_${selectedPlanId || 'default'}`;
  const selectedDayKey = `selectedDayNumber_${selectedPlanId || 'default'}`;
  const slideIndexKeyBase = `slideIndex-${selectedPlanId || 'default'}`;

  // --- useEffect hooks for Swiper (No change needed, uses localStorage correctly for slide index) ---
  useEffect(() => {
    // Reset slide to 0 when the selected day or week changes
    const resetSlide = () => {
        setCurrentSlideIndex(0);
        if (swiperRef.current?.swiper) {
            swiperRef.current.swiper.slideTo(0, 0);
        }
        // Clear the slide index for the *previous* day from local storage if needed
        // This depends on how you want state preserved when user navigates back and forth manually
        // For simplicity, we only load/save based on the *current* day.
    };
    resetSlide();
  }, [selectedDay, selectedWeek?.week]); // Depend on week index specifically if week object identity might change

  useEffect(() => {
    // Load saved slide index for the *current* day/week when component mounts or view changes
    if (selectedDay !== null && selectedWeek?.week !== undefined) {
      const currentDaySlideKey = `${slideIndexKeyBase}-W${selectedWeek.week}-D${selectedDay}`;
      const savedSlideIndex = localStorage.getItem(currentDaySlideKey);
      const savedIndexInt = savedSlideIndex ? parseInt(savedSlideIndex, 10) : 0;
      const validIndex = (savedIndexInt >= 0 && savedIndexInt < filteredExercises.length) ? savedIndexInt : 0;

      // Update state only if it's different to avoid potential loops
      if (currentSlideIndex !== validIndex) {
          setCurrentSlideIndex(validIndex);
      }
      // Ensure swiper updates, using timeout for safety after potential resets
      setTimeout(() => {
        if (swiperRef.current?.swiper && swiperRef.current.swiper.activeIndex !== validIndex) {
          swiperRef.current.swiper.slideTo(validIndex, 0);
        }
      }, 0);
    } else {
       // Reset if day/week become invalid
       if (currentSlideIndex !== 0) setCurrentSlideIndex(0);
       setTimeout(() => {
           if (swiperRef.current?.swiper && swiperRef.current.swiper.activeIndex !== 0) {
                swiperRef.current.swiper.slideTo(0, 0);
           }
       }, 0);
    }
  }, [selectedDay, selectedWeek?.week, filteredExercises.length, slideIndexKeyBase, currentSlideIndex]); // Re-run if view changes or exercises load

  // --- Other functions (No changes needed) ---
  const toggleOpen = () => setOpen((cur) => !cur);
  const goNext = () => swiperRef.current?.swiper?.slideNext();
  const goPrev = () => swiperRef.current?.swiper?.slidePrev();

  const handleSlideChange = (swiper) => {
    const newIndex = swiper.activeIndex;
    setCurrentSlideIndex(newIndex);
    // Save slide index for the *current* selected day/week
    if (selectedDay !== null && selectedWeek?.week !== undefined) {
      const currentDaySlideKey = `${slideIndexKeyBase}-W${selectedWeek.week}-D${selectedDay}`;
      localStorage.setItem(currentDaySlideKey, newIndex.toString());
    }
  };


  // --- Skip Day Logic (No changes needed in this part regarding Firebase data) ---
  const handleSkipDay = () => {
    if (!allWeeksData || !dayData || totalWeeksCount <= 0 || typeof currentWeekIndex !== 'number' || typeof currentDayNumber !== 'number') {
        console.error("Cannot skip day: Plan structure data missing or invalid.");
        toast.error("Cannot skip day: Plan data missing.");
        return;
    }

    const proceedWithSkip = () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Update localStorage for each exercise on the skipped day
        // IMPORTANT: Skipping STILL modifies localStorage because that's where the *active* session state is temporarily held.
        // When "Finish Day" happens (implicitly by skipping the last exercise or explicitly later), this localStorage state gets saved.
        if (filteredExercises && filteredExercises.length > 0) {
          
          filteredExercises.forEach((exercise, index) => {
            const exerciseId = exercise.id || `${currentDayNumber}-${index}`;
            const storageKey = `workout-${currentWeekIndex}-${currentDayNumber}-${exerciseId}-${selectedPlanId}`;
            const numberOfSets = exercise?.weeklySetConfig?.sets || 1;
            try {
                let exerciseData = [];
                const savedData = localStorage.getItem(storageKey);
                if (savedData) try { exerciseData = JSON.parse(savedData); if (!Array.isArray(exerciseData)) exerciseData = []; } catch { exerciseData = []; }

                let updatedExerciseData = exerciseData.length === 0
                    ? Array(numberOfSets).fill().map((_, setIndex) => ({ id: setIndex + 1, weight: "", reps: "", duration: "00:00:00", rest: "00:00", isCompleted: false, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false, date: today, exerciseId: exerciseId, skipped: true, skippedDates: [today] }))
                    : exerciseData.map(set => { const dates = Array.isArray(set.skippedDates) ? [...set.skippedDates] : []; if (!dates.includes(today)) dates.push(today); return { ...set, isCompleted: false, isActive: false, isEditing: false, isDurationRunning: false, isRestRunning: false, skipped: true, skippedDates: dates }; });
                localStorage.setItem(storageKey, JSON.stringify(updatedExerciseData));
            } catch (error) { console.error(`Error updating localStorage for exercise ${exerciseId} on skipped day ${currentDayNumber}:`, error); }
          });
        } else { console.warn(`No exercises found for Day ${currentDayNumber} (Week ${currentWeekIndex}) to mark as skipped.`); }

        // 2. Calculate the next day
        const nextStep = calculateNextDay(currentWeekIndex, currentDayNumber, allWeeksData, totalWeeksCount);
        if (nextStep === 'error') { toast.error("Error calculating the next day, but current day marked as skipped."); return; }

        // Clear slide index for the day being skipped
        const skippedDaySlideKey = `${slideIndexKeyBase}-W${currentWeekIndex}-D${currentDayNumber}`;
        localStorage.removeItem(skippedDaySlideKey);

        // --- Handle Plan Completion or Continuation (Saves progress to localStorage for next load/finish) ---
        if (nextStep === null) {
          toast.success("Workout Plan Completed! Finishing up...");
          // !! IMPORTANT: Simulate "Finish Day" to save the skipped state to Firebase !!
          // Get all current LS data (which now includes the skipped day's flags)
          const finalLocalStorageData = getAllLocalStorageDataForFinish(); // Need a helper to get all relevant LS keys
          // Store this final state to DB
          storeFinalStateToDatabase(finalLocalStorageData); // Need helper
          // Clear LS for this plan
          removeLocalStorageDataByPlanIdForFinish(); // Need helper
          // Clear progress markers
          localStorage.removeItem(workoutProgressKey);
          localStorage.removeItem(selectedWeekKey);
          localStorage.removeItem(selectedDayKey);
          router.push("/SavedPlan");
          return;
        }

        // 3. Plan continues: Get details for the *next* step
        const { nextWeekIndex, nextDayNumber, nextWeekName, nextDayName } = nextStep;

        // PERSIST Global Progress (to the *next* day/week) using numeric identifiers IN LOCALSTORAGE
        // This ensures that if the user leaves *now*, the next load will pick up from the correct *next* day.
        // This progress will eventually be saved to Firebase when the *next* day is finished.
        const newProgress = { currentWeekIndex: nextWeekIndex, currentDayNumber: nextDayNumber, weekName: nextWeekName, dayName: nextDayName };
        localStorage.setItem(workoutProgressKey, JSON.stringify(newProgress));
        localStorage.setItem(selectedWeekKey, nextWeekIndex.toString());
        localStorage.setItem(selectedDayKey, nextDayNumber.toString());

        // UPDATE React state in PlanDetail (to the *next* day/week)
        const nextWeekObject = allWeeksData.find(w => w.week === nextWeekIndex);
        if(nextWeekObject) {
            setSelectedWeek(nextWeekObject); // Update PlanDetail's week state
            setSelectedDay(nextDayNumber);   // Update PlanDetail's day state
            toast.success(`Skipped to ${nextDayName || `Day ${nextDayNumber}`}, ${nextWeekName || `Week ${nextWeekIndex + 1}`}`);
        } else {
            console.error("Could not find next week object after skip calculation.", { nextWeekIndex });
            toast.error("Skipped day, but failed to load next week's data.");
        }
      } catch (error) {
        console.error("Error encountered in proceedWithSkip:", error);
        toast.error("An unexpected error occurred while skipping the day.");
      }
    };

    // Show confirmation toast
    toast((t) => ( <ConfirmationToast t={t} message="Skip this entire day's workout?" onConfirm={proceedWithSkip} /> ), { duration: Infinity, position: "top-center" });
  };

    // --- Helper functions needed for Skip Day -> Finish Flow ---
    // These should be similar/identical to those in SetAndRepsForm
    function getAllLocalStorageDataForFinish() {
      let data = {};
      for (let i = 0; i < localStorage.length; i++) {
          let key = localStorage.key(i);
          if (key && key.endsWith(selectedPlanId)) {
              try { data[key] = JSON.parse(localStorage.getItem(key)); } catch { data[key] = localStorage.getItem(key); }
          }
      } return data;
    }
    async function storeFinalStateToDatabase(allDataToSave) {
        if (!userId || !selectedPlanId || Object.keys(allDataToSave).length === 0) return;
        const userProgressRef = doc(db, "userWorkoutProgress", userId);
        const firestorePayload = { [selectedPlanId]: allDataToSave };
        try {
            await setDoc(userProgressRef, firestorePayload, { merge: true });
            console.log("Successfully saved final skipped state to Firestore for plan:", selectedPlanId);
        } catch (error) {
            console.error("Error saving final skipped state to Firestore:", error);
            toast.error("Error saving final workout state.");
        }
    }
    function removeLocalStorageDataByPlanIdForFinish() {
        if (!selectedPlanId) return;
        for (let i = localStorage.length - 1; i >= 0; i--) {
            let key = localStorage.key(i);
            if (key && key.endsWith(selectedPlanId)) {
                try { localStorage.removeItem(key); } catch (e) { console.error(`Error removing item ${key}:`, e); }
            }
        }
        console.log(`Cleared localStorage for plan ${selectedPlanId} after skip/finish.`);
    }
    // --- End Helpers ---


  // Data passed down to SetAndRepsForm
  const necessaryDataForSetForm = {
    selectedPlanId, userId, selectedDay: currentDayNumber, selectedWeek,
    setSelectedDay, setSelectedWeek, dayData, weekStructure, totalWeeksCount,
    allWeeksData, currentWeekIndex,
    // *** PASS FIREBASE DATA DOWN ***
    firebaseStoredData,transFormedData,updateProgressStats,progressStats
  };

  // --- JSX Return (No changes needed here) ---
  if (!filteredExercises || filteredExercises.length === 0) {
     return ( <div className="p-6 text-center"> <p className="text-gray-500">No exercises scheduled for {dayName || `Day ${currentDayNumber}`}, {weekName || `Week ${currentWeekIndex + 1}`}.</p> <button className="block px-4 py-2 mx-auto mt-4 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50" onClick={handleSkipDay}>Skip This Day</button> </div> );
  }
  return (
    <div className="w-full ">
      {/* Skip Day Button */}
      {/* <div className="flex justify-end p-2 bg-white"> <button className="px-3 py-1 text-sm text-red-600 border border-red-300 rounded hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50" onClick={handleSkipDay}>Skip Day</button> </div> */}
      {/* Swiper */}
      <Swiper
        ref={swiperRef} slidesPerView={1} spaceBetween={10} pagination={{ clickable: true, dynamicBullets: false }} modules={[Pagination]}
        className="w-full exercise-swiper" onSlideChange={handleSlideChange}
        // Key ensures Swiper remounts/updates on major context change
        key={`${selectedWeek?.week}-${selectedDay}`}
        initialSlide={currentSlideIndex} observer={true} observeParents={true}
      >
        {filteredExercises.map((exercise, index) => {
          const setData = exercise?.weeklySetConfig;
          const isLastExercise = index === filteredExercises.length - 1;
          const exerciseId = exercise.id || `${currentDayNumber}-${index}`; // Use consistent ID generation
          return (
            <SwiperSlide key={`${currentDayNumber}-${exerciseId}`} className="w-full ">
              <div className="w-full">
                <ExerciseDetailHeader data={exercise} toggleOpen={toggleOpen} open={open}/>
                <div className="p-3">
                  <SetAndRepsForm
                    sets={setData?.sets || 1} selectedDay={currentDayNumber} exerciseId={exerciseId}
                    exerciseName={exercise.name} goPrev={goPrev} goNext={goNext}
                    necessaryData={necessaryDataForSetForm} // Pass the whole object
                    exerciseIndex={index} isLastExercise={isLastExercise}
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