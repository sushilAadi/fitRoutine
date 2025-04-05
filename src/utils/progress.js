/**
 * Calculates detailed workout progress metrics based on planned exercises and completed data.
 *
 * @param {Object} transformData - The workout plan data structure. Expected properties: id, weeksExercise (array).
 * @param {Object} firebaseStoreData - The stored workout completion data keyed by storageKey.
 * @returns {Object|null} - An object containing progress metrics, or null if inputs are invalid.
 *                           Metrics include:
 *                           - totalPlannedSets: Total sets defined in the plan.
 *                           - totalCompletedPlannedSets: Planned sets marked as completed (not skipped).
 *                           - totalSkippedPlannedSets: Planned sets marked as skipped.
 *                           - totalUnloggedPlannedSets: Planned sets with no corresponding entry or not marked completed/skipped.
 *                           - totalCompletedExtraSets: Completed sets found in storage beyond the planned count for an exercise.
 *                           - totalSkippedExtraSets: Skipped sets found in storage beyond the planned count for an exercise.
 *                           - progressPlannedOnlyPercent: (Completed Planned / Total Planned) * 100
 *                           - completionRateOfAttemptedPercent: (Completed Planned / (Completed Planned + Skipped Planned)) * 100
 *                           - overallAttemptRatePercent: ((Completed Planned + Skipped Planned) / Total Planned) * 100
 *                           - progressIncludingExtraPercent: ((Completed Planned + Completed Extra) / Total Planned) * 100
 */
export const calculateDetailedWorkoutProgress = (transformData, firebaseStoreData) => {
    try {
      // --- Input Validation ---
      if (!transformData || typeof transformData !== 'object' || !firebaseStoreData || typeof firebaseStoreData !== 'object') {
        console.error("Missing or invalid required data for progress calculation");
        return null; // Return null for clearer error handling upstream
      }
      if (!transformData.id || !transformData.weeksExercise || !Array.isArray(transformData.weeksExercise)) {
        console.error("Invalid transformData structure: Missing id or weeksExercise array");
        return null;
      }
  
      // --- Initialization ---
      const planId = transformData.id;
      let totalPlannedSets = 0;
      let totalCompletedPlannedSets = 0;
      let totalSkippedPlannedSets = 0;
      let totalCompletedExtraSets = 0;
      let totalSkippedExtraSets = 0;
  
      // --- Data Processing ---
      // Iterate through the PLAN (transformData)
      transformData.weeksExercise.forEach((weekData) => {
        // Validate week structure
        if (!weekData || typeof weekData.week === "undefined" || !weekData.days || !Array.isArray(weekData.days)) {
          console.warn("Skipping invalid week data:", weekData);
          return;
        }
        const weekIndex = weekData.week;
  
        weekData.days.forEach((dayData) => {
          // Validate day structure
          if (!dayData || typeof dayData.day === "undefined" || !dayData.exercises || !Array.isArray(dayData.exercises)) {
            console.warn(`Skipping invalid day data in week ${weekIndex}:`, dayData);
            return;
          }
          const dayNumber = dayData.day;
  
          dayData.exercises.forEach((exercise) => {
            // Validate exercise structure
            if (!exercise || !exercise.id || !exercise.weeklySetConfig) {
              console.warn(`Skipping invalid exercise data in week ${weekIndex}, day ${dayNumber}:`, exercise);
              return;
            }
            const exerciseId = exercise.id;
  
            // 1. Get Planned Sets for this exercise
            const plannedSetsCount = exercise.weeklySetConfig.sets || 0;
            totalPlannedSets += plannedSetsCount;
  
            // 2. Get Actual Data from Storage
            const storageKey = `workout-${weekIndex}-${dayNumber}-${exerciseId}-${planId}`;
            const actualSetsData = firebaseStoreData[storageKey];
  
            let completedInStorage = 0;
            let skippedInStorage = 0;
  
            // Check if data exists and is an array
            if (Array.isArray(actualSetsData)) {
              actualSetsData.forEach(set => {
                if (set && typeof set === 'object') {
                  if (set.isCompleted === true && set.skipped !== true) { // Explicitly check skipped is not true
                    completedInStorage++;
                  } else if (set.skipped === true) {
                    skippedInStorage++;
                  }
                  // Ignore sets that are neither completed nor skipped (e.g., pending, deleted locally but not in store yet)
                } else {
                   console.warn(`Invalid set item found in ${storageKey}:`, set);
                }
              });
            }
             // Else: No data found for this planned exercise in storage
  
            // 3. Categorize Stored Sets vs Planned Sets
            const completedForThisExercisePlanned = Math.min(plannedSetsCount, completedInStorage);
            const completedForThisExerciseExtra = Math.max(0, completedInStorage - completedForThisExercisePlanned);
  
            // How many planned sets are remaining after accounting for completed ones?
            const remainingPlannedSets = plannedSetsCount - completedForThisExercisePlanned;
  
            const skippedForThisExercisePlanned = Math.min(remainingPlannedSets, skippedInStorage);
            const skippedForThisExerciseExtra = Math.max(0, skippedInStorage - skippedForThisExercisePlanned);
  
            // 4. Accumulate Totals
            totalCompletedPlannedSets += completedForThisExercisePlanned;
            totalSkippedPlannedSets += skippedForThisExercisePlanned;
            totalCompletedExtraSets += completedForThisExerciseExtra;
            totalSkippedExtraSets += skippedForThisExerciseExtra;
  
          }); // End exercises loop
        }); // End days loop
      }); // End weeks loop
  
      // --- Calculate Derived Metrics ---
      const totalUnloggedPlannedSets = Math.max(0, totalPlannedSets - totalCompletedPlannedSets - totalSkippedPlannedSets);
  
      // Helper for safe percentage calculation
      const calculatePercentage = (numerator, denominator) => {
        if (denominator === 0) {
          // Decide behavior: 0% or 100% if numerator is also 0? Usually 0.
          return (numerator === 0) ? 0 : 0; // Or potentially 100 if num>0, den=0, depends on context
        }
        const percentage = Math.round((numerator / denominator) * 100);
        return Math.min(100, Math.max(0, percentage)); // Clamp standard percentages between 0-100
      };
  
       const calculatePercentageUnclamped = (numerator, denominator) => {
          if (denominator === 0) {
              return (numerator === 0) ? 0 : Infinity; // Or handle as error
          }
          const percentage = Math.round((numerator / denominator) * 100);
          return Math.max(0, percentage); // Allow > 100%
      };
  
      const progressPlannedOnlyPercent = calculatePercentage(totalCompletedPlannedSets, totalPlannedSets);
      const completionRateOfAttemptedPercent = calculatePercentage(totalCompletedPlannedSets, totalCompletedPlannedSets + totalSkippedPlannedSets);
      const overallAttemptRatePercent = calculatePercentage(totalCompletedPlannedSets + totalSkippedPlannedSets, totalPlannedSets);
      const progressIncludingExtraPercent = calculatePercentageUnclamped(totalCompletedPlannedSets + totalCompletedExtraSets, totalPlannedSets); // Can exceed 100%
  
      // --- Return Results Object ---
      return {
        totalPlannedSets,
        totalCompletedPlannedSets,
        totalSkippedPlannedSets,
        totalUnloggedPlannedSets,
        totalCompletedExtraSets,
        totalSkippedExtraSets,
        // --- Percentages ---
        progressPlannedOnlyPercent,         // Original metric: % of planned sets completed
        completionRateOfAttemptedPercent, // % of (completed + skipped) planned sets that were completed
        overallAttemptRatePercent,        // % of planned sets that were either completed or skipped
        progressIncludingExtraPercent,    // % of planned sets completed (incl. extra ones done) - can be > 100%
      };
  
    } catch (error) {
      console.error("Error during detailed progress calculation:", error);
      return null; // Indicate failure
    }
  };
  
  // Optional: Keep countSkippedSets if you need a *raw* count of ALL skipped flags
  // in firebaseStoreData, independent of the plan. The new function counts
  // skipped sets *relative* to the plan (planned vs extra).
  export const countAllSkippedInStorage = data => {
      // Original countSkippedSets logic remains the same...
      if (typeof data !== 'object' || data === null) return 0;
      let skippedCount = 0;
      try {
        for (const key in data) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            if (key.startsWith('workout-')) {
              const sets = data[key];
              if (Array.isArray(sets)) {
                for (const set of sets) {
                  if (typeof set === 'object' && set !== null && set.skipped === true) {
                    skippedCount++;
                  }
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('countAllSkippedInStorage: An unexpected error occurred:', error);
        return 0;
      }
      return skippedCount;
  };