// utils/caloriesCalculation.js

// MET values database for common exercises
// MET = Metabolic Equivalent of Task (energy cost of physical activities)
const EXERCISE_MET_VALUES = {
  // Strength Training (varies by intensity)
  '0001': 3.5, // Light strength training
  '0006': 5.0, // Moderate strength training
  '0007': 6.0, // Heavy strength training
  '0009': 4.5, // Bodyweight exercises
  '0037': 4.0, // Light weights
  '0038': 5.5, // Moderate weights
  '0041': 6.5, // Heavy compound movements
  '0042': 4.5, // Isolation exercises
  
  // Default values for unknown exercises
  'default_strength': 5.0,
  'default_cardio': 8.0,
  'default_bodyweight': 4.0,
};

/**
 * Get MET value for a specific exercise
 * @param {string} exerciseId - The exercise ID
 * @param {number} weight - Weight used in kg
 * @param {number} bodyWeight - User's body weight in kg
 * @returns {number} MET value
 */
export const getExerciseMET = (exerciseId, weight = 0, bodyWeight = 70) => {
  const baseMET = EXERCISE_MET_VALUES[exerciseId] || EXERCISE_MET_VALUES['default_strength'];
  
  // Adjust MET based on weight used relative to body weight
  if (weight && bodyWeight) {
    const weightRatio = weight / bodyWeight;
    // Higher weight ratio increases MET value
    const intensityMultiplier = Math.min(1 + (weightRatio * 0.3), 2.0); // Cap at 2x
    return baseMET * intensityMultiplier;
  }
  
  return baseMET;
};

/**
 * Parse duration string to seconds
 * @param {string} duration - Duration in format "HH:MM:SS" or "MM:SS"
 * @returns {number} Duration in seconds
 */
export const parseDurationToSeconds = (duration) => {
  if (!duration || duration === "00:00:00" || duration === "00:00") return 0;
  
  const parts = duration.split(':').map(Number);
  
  if (parts.length === 3) {
    // HH:MM:SS format
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // MM:SS format
    return parts[0] * 60 + parts[1];
  }
  
  return 0;
};

/**
 * Calculate calories burnt for a single set
 * @param {Object} set - Set data containing weight, reps, duration, etc.
 * @param {string} exerciseId - Exercise ID
 * @param {number} userWeight - User's weight in kg
 * @returns {number} Calories burnt for this set
 */
export const calculateSetCalories = (set, exerciseId, userWeight) => {
  if (!set.isCompleted || set.skipped || set.isDeleted) {
    return 0;
  }
  
  const weight = parseFloat(set.weight) || 0;
  const duration = parseDurationToSeconds(set.duration);
  
  if (duration === 0) return 0;
  
  const met = getExerciseMET(exerciseId, weight, userWeight);
  const durationHours = duration / 3600;
  
  // Calories = MET × Weight(kg) × Duration(hours)
  return met * userWeight * durationHours;
};

/**
 * Calculate total calories burnt for a workout session
 * @param {Object} userWorkoutProgress - User's workout progress data
 * @param {number} userWeight - User's weight in kg
 * @param {string} selectedPlanId - Plan ID to filter data
 * @param {string} date - Date to filter (YYYY-MM-DD format), optional
 * @returns {Object} Calories breakdown
 */
export const calculateWorkoutCalories = (userWorkoutProgress, userWeight, selectedPlanId, date = null) => {
  if (!userWorkoutProgress || !userWeight || !selectedPlanId) {
    return { totalCalories: 0, exerciseBreakdown: [], date: date };
  }
  
  let totalCalories = 0;
  const exerciseBreakdown = [];
  const currentDate = date || new Date().toISOString().split('T')[0];
  
  // Filter workout data for the specific plan and date
  Object.keys(userWorkoutProgress).forEach(key => {
    if (key.startsWith('workout-') && key.endsWith(`-${selectedPlanId}`)) {
      const sets = userWorkoutProgress[key];
      if (!Array.isArray(sets)) return;
      
      // Extract exercise info from key: workout-week-day-exerciseId-planId
      const keyParts = key.split('-');
      if (keyParts.length < 4) return;
      
      const exerciseId = keyParts[3];
      let exerciseCalories = 0;
      let completedSets = 0;
      
      sets.forEach(set => {
        // Filter by date if specified
        if (date && set.date !== currentDate) return;
        
        const setCalories = calculateSetCalories(set, exerciseId, userWeight);
        exerciseCalories += setCalories;
        
        if (set.isCompleted && !set.skipped && !set.isDeleted) {
          completedSets++;
        }
      });
      
      if (exerciseCalories > 0) {
        exerciseBreakdown.push({
          exerciseId,
          calories: Math.round(exerciseCalories * 10) / 10, // Round to 1 decimal
          completedSets,
          key
        });
        totalCalories += exerciseCalories;
      }
    }
  });
  
  return {
    totalCalories: Math.round(totalCalories * 10) / 10, // Round to 1 decimal
    exerciseBreakdown,
    date: currentDate,
    planId: selectedPlanId
  };
};

/**
 * Calculate calories for the current workout session (today only)
 * @param {Object} userWorkoutProgress - User's workout progress data
 * @param {number} userWeight - User's weight in kg
 * @param {string} selectedPlanId - Plan ID
 * @returns {number} Today's calories burnt
 */
export const calculateTodayCalories = (userWorkoutProgress, userWeight, selectedPlanId) => {
  const today = new Date().toISOString().split('T')[0];
  const result = calculateWorkoutCalories(userWorkoutProgress, userWeight, selectedPlanId, today);
  return result.totalCalories;
};

/**
 * Save calories data to Firestore
 * @param {string} userId - User ID
 * @param {string} selectedPlanId - Plan ID
 * @param {number} totalCalories - Total calories burnt
 * @param {string} date - Date (YYYY-MM-DD)
 * @returns {Promise<boolean>} Success status
 */
export const saveCaloriesToFirestore = async (userId, selectedPlanId, totalCalories, date = null) => {
  if (!userId || !selectedPlanId || totalCalories === undefined) {
    console.warn("Missing required parameters for saving calories");
    return false;
  }
  
  try {
    const { doc, setDoc } = await import('firebase/firestore');
    const { db } = await import('@/firebase/firebaseConfig');
    
    const currentDate = date || new Date().toISOString().split('T')[0];
    const docId = `${userId}_${selectedPlanId}_${currentDate}`;
    const caloriesRef = doc(db, "caloriesBurnt", docId);
    
    const caloriesData = {
      userId,
      planId: selectedPlanId,
      totalCalories: Math.round(totalCalories * 10) / 10,
      date: currentDate,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    await setDoc(caloriesRef, caloriesData, { merge: true });
    console.log(`Calories saved: ${totalCalories} for plan ${selectedPlanId} on ${currentDate}`);
    return true;
  } catch (error) {
    console.error("Error saving calories to Firestore:", error);
    return false;
  }
};

export default {
  getExerciseMET,
  parseDurationToSeconds,
  calculateSetCalories,
  calculateWorkoutCalories,
  calculateTodayCalories,
  saveCaloriesToFirestore
};