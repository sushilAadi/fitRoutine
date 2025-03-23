"use client";
import React, { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { GlobalContext } from "@/context/GloablContext";
import { doc, setDoc, getFirestore } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";

const CaloriesBurnt = ({ exerciseDetails, workoutData, selectedWeek, selectedDay, userWeight = 60, selectedPlanId }) => {
  const { userId } = useContext(GlobalContext);
  const [totalCalories, setTotalCalories] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  // MET values for different exercise types
  const MET_VALUES = {
    "strength": 5, // Weight lifting/strength training
    "cardio": 8,   // Cardio exercises
    "bodyweight": 4, // Bodyweight exercises
    "band": 3.5,   // Resistance band exercises
    "default": 4   // Default value if exercise type is unknown
  };

  useEffect(() => {
    // Calculate calories when component mounts or when exercise details change
    calculateTotalCalories();
    
    // Animation timing
    setTimeout(() => setIsVisible(true), 300);
  }, [exerciseDetails, selectedWeek, selectedDay]);

  useEffect(() => {
    if (totalCalories > 0) {
      storeCaloriesInFirebase();
    }
  }, [totalCalories]);

  const calculateTotalCalories = () => {
    if (!workoutData || !exerciseDetails) return;

    let calories = 0;
    
    // Get exercises for the selected week and day
    const exercises = workoutData?.workoutPlan?.[selectedWeek]?.[selectedDay]?.exercises || [];
    
    exercises.forEach((exercise, exerciseIndex) => {
      const key = `${selectedWeek}-${selectedDay}-${exerciseIndex}`;
      const exerciseSets = exerciseDetails[key] || [];
      
      // Get completed sets
      const completedSets = exerciseSets.filter(set => set.isCompleted);
      
      // Skip if no completed sets
      if (completedSets.length === 0) return;
      
      // Get exercise history for this exercise
      const exerciseHistory = workoutData?.exerciseHistory?.[key] || [];
      
      // Calculate total duration for this exercise (in minutes)
      let totalDuration = 0;
      exerciseHistory.forEach(set => {
        if (set?.duration) {
          totalDuration += set.duration / 60; // Convert seconds to minutes
        }
      });
      
      // Determine exercise type and corresponding MET value
      let metValue = MET_VALUES.default;
      if (exercise.equipment === "body weight") {
        metValue = MET_VALUES.bodyweight;
      } else if (exercise.equipment === "band") {
        metValue = MET_VALUES.band;
      } else if (exercise.target === "cardio") {
        metValue = MET_VALUES.cardio;
      } else {
        metValue = MET_VALUES.strength;
      }
      
      // Calculate calories for this exercise
      // Formula: Calories = Duration (minutes) × MET × Weight (kg) / 60
      const exerciseCalories = totalDuration * metValue * userWeight / 60;
      
      // Add to total calories
      calories += exerciseCalories;
    });
    
    // Round to nearest whole number
    setTotalCalories(Math.round(calories));
  };

  const storeCaloriesInFirebase = async () => {
    const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
    const docRef = doc(db, "caloriesBurnt", `${userId}_${selectedPlanId}_${currentDate}`);

    try {
      await setDoc(docRef, {
        userId,
        selectedPlanId,
        date: currentDate,
        totalCalories
      }, { merge: true }); // Use merge to update the document if it exists, or create it if it doesn't
      
    } catch (error) {
      console.error("Error storing calories: ", error);
    }
  };

  return (
    <motion.div 
      className="text-white "
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : -20 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="mb-1 text-xl font-bold">Calories Burnt</h2>
        </div>
        <motion.div 
          className="text-3xl font-bold text-red-500 fire-effect glow-effect"
          initial={{ scale: 0.8 }}
          animate={{ scale: isVisible ? 1 : 0.8 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {totalCalories}
          <span className="ml-1 text-lg">kcal</span>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default CaloriesBurnt;