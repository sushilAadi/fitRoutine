// components/WorkoutForm.js
"use client";
import React, { useState } from "react";
import { generateWorkoutPlan } from "@/utils/aiService";

const WorkoutForm = ({ onPlanGenerated }) => {
  const [fitnessLevel, setFitnessLevel] = useState("beginner");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [timePerWorkout, setTimePerWorkout] = useState(30);
  const [equipment, setEquipment] = useState("");
  const [preferences, setPreferences] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goalError, setGoalError] = useState(null);
  const [daysPerWeekError, setDaysPerWeekError] = useState(null);
  const [timePerWorkoutError, setTimePerWorkoutError] = useState(null);

  // State to track if the user input is fitness-related
  const [isFitnessRelated, setIsFitnessRelated] = useState(true);

  // Function to check if the input is fitness-related
  const checkFitnessRelated = (text) => {
    const fitnessKeywords = ["fitness", "workout", "exercise", "gym", "diet", "muscle", "cardio", "strength"];
    const lowerCaseText = text.toLowerCase();
    const isRelated = fitnessKeywords.some(keyword => lowerCaseText.includes(keyword));
    setIsFitnessRelated(isRelated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic Validation
    let isValid = true;
    if (goal.length < 3) {
      setGoalError("Goal must be at least 3 characters.");
      isValid = false;
    } else {
      setGoalError(null);
    }

    if (daysPerWeek < 1 || daysPerWeek > 7) {
      setDaysPerWeekError("Days per week must be between 1 and 7.");
      isValid = false;
    } else {
        setDaysPerWeekError(null);
    }

    if (timePerWorkout < 10 || timePerWorkout > 120) {
      setTimePerWorkoutError("Time per workout must be between 10 and 120 minutes.");
      isValid = false;
    } else {
        setTimePerWorkoutError(null);
    }

    if (!isValid) {
      return;
    }

    // Check if the input is fitness-related
    const userInput = `Fitness level: ${fitnessLevel}, Goal: ${goal}, Days per week: ${daysPerWeek}, Time per workout: ${timePerWorkout} minutes, Equipment: ${equipment || "None"}, Preferences: ${preferences || "None"}`;
    checkFitnessRelated(userInput);

    setIsLoading(true);
    setError(null);

    try {
      const plan = await generateWorkoutPlan(userInput, isFitnessRelated);
      onPlanGenerated(plan);
    } catch (err) {
      console.error("Error in handleSubmit:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md p-6 mx-auto bg-white rounded-md shadow-md">
      <h2 className="mb-4 text-2xl font-semibold">
        Generate Your Workout Plan
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Fitness Level */}
        <div className="mb-4">
          <label
            htmlFor="fitnessLevel"
            className="block mb-2 text-sm font-bold text-gray-700"
          >
            Fitness Level
          </label>
          <select
            id="fitnessLevel"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            value={fitnessLevel}
            onChange={(e) => setFitnessLevel(e.target.value)}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        {/* Goal */}
        <div className="mb-4">
          <label
            htmlFor="goal"
            className="block mb-2 text-sm font-bold text-gray-700"
          >
            Goal
          </label>
          <input
            type="text"
            id="goal"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            value={goal}
            onChange={(e) => {
              setGoal(e.target.value);
            }}
          />
          {goalError && (
            <p className="text-xs italic text-red-500">{goalError}</p>
          )}
        </div>

        {/* Days Per Week */}
        <div className="mb-4">
          <label
            htmlFor="daysPerWeek"
            className="block mb-2 text-sm font-bold text-gray-700"
          >
            Days Per Week
          </label>
          <input
            type="number"
            id="daysPerWeek"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
          />
          {daysPerWeekError && (
            <p className="text-xs italic text-red-500">
              {daysPerWeekError}
            </p>
          )}
        </div>

        {/* Time Per Workout */}
        <div className="mb-4">
          <label
            htmlFor="timePerWorkout"
            className="block mb-2 text-sm font-bold text-gray-700"
          >
            Time Per Workout (minutes)
          </label>
          <input
            type="number"
            id="timePerWorkout"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            value={timePerWorkout}
            onChange={(e) => setTimePerWorkout(parseInt(e.target.value))}
          />
          {timePerWorkoutError && (
            <p className="text-xs italic text-red-500">
              {timePerWorkoutError}
            </p>
          )}
        </div>

        {/* Equipment */}
        <div className="mb-4">
          <label
            htmlFor="equipment"
            className="block mb-2 text-sm font-bold text-gray-700"
          >
            Equipment (optional)
          </label>
          <input
            type="text"
            id="equipment"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            value={equipment}
            onChange={(e) => setEquipment(e.target.value)}
          />
        </div>

        {/* Preferences */}
        <div className="mb-4">
          <label
            htmlFor="preferences"
            className="block mb-2 text-sm font-bold text-gray-700"
          >
            Preferences (optional)
          </label>
          <textarea
            id="preferences"
            className="w-full px-3 py-2 leading-tight text-gray-700 border rounded shadow appearance-none focus:outline-none focus:shadow-outline"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 font-bold text-white bg-blue-500 rounded hover:bg-blue-700 focus:outline-none focus:shadow-outline"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Plan"}
        </button>

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </form>
    </div>
  );
};

export default WorkoutForm;