"use client";
import React, { useContext, useEffect, useState } from "react";
import { generateWorkoutPlan, extractPlansFromResponse } from "@/utils/aiService";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import InputBlk from "./InputCs/InputBlk";
import { GlobalContext } from "@/context/GloablContext";
import TextBlk from "./InputCs/TextArea";
import { calculateAge } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/service/exercise";


const WorkoutForm = ({ onPlanGenerated }) => {
  const { userDetailData } = useContext(GlobalContext);
  const [fitnessLevel, setFitnessLevel] = useState("beginner");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [timePerWorkout, setTimePerWorkout] = useState(120);
  const [equipment, setEquipment] = useState("");
  const [preferences, setPreferences] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [goalError, setGoalError] = useState(null);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [generatedExercises, setGeneratedExercises] = useState([]);

  console.log("generatedExercises",generatedExercises)

  const { data: exercisesData = [] } = useQuery({
    queryKey: ["exercise"],
    queryFn: getExercises,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    cacheTime: 20 * 60 * 1000,
  });

  const exerciseList = exercisesData?.map(i=>({id:i?.id,name:i?.name,target:i?.target,bodyPart:i?.bodyPart}));

  const {
    userName,
    userBirthDate,
    userGender,
    userHeight,
    helpYou,
    activityLevel,
  } = userDetailData || {};

  const userAgeCal = calculateAge(userBirthDate);

  useEffect(() => {
    if (userDetailData) {
      const { userName, userGender, userHeight, userWeight, helpYou, activityLevel } = userDetailData;
  
      if (userName && userGender && userHeight && userWeight && helpYou && activityLevel) {
        const defaultPreferences = `I am ${userName}, a ${userAgeCal}-year-old, ${userGender.toLowerCase()} with a height of ${userHeight} cm and weight of ${userWeight} kg. My goal is ${helpYou}, and I have an activity level of "${activityLevel.subtitle}".`;
        setPreferences(defaultPreferences);
      }
    }
  }, [userDetailData]);

  const extractExercisesFromPlan = (planText) => {
    try {
        const parsedPlan = JSON.parse(planText);
        if (!parsedPlan || !parsedPlan.workoutPlan) {
            console.error("No valid workout plan found in response");
            return [];
        }

        const exercises = [];
        parsedPlan.workoutPlan.forEach(day => {
            if (!day.Workout || !Array.isArray(day.Workout)) {
                console.warn(`Day ${day.Day} has no valid workout data`);
                return;
            }

            day.Workout.forEach(exercise => {
                if (!exercise || !exercise.Exercise) {
                    return;
                }

                if (exercise.Exercise.toLowerCase().includes('rest')) {
                    return;
                }

                const idMatch = exercise.Exercise.match(/\(ID:\s*(\d+)\)/);
                const exerciseId = idMatch ? idMatch[1] : null;
                const exerciseName = exercise.Exercise.replace(/\(ID:\s*\d+\)/, '').trim();

                if (exerciseId) {
                    const exerciseDetails = exerciseList.find(ex => ex.id.toString() === exerciseId.toString());

                    if (exerciseDetails) {
                        exercises.push({
                            ...exerciseDetails,
                            name: exerciseName,
                            day: `Day ${day.Day}`,
                            sets: exercise.Sets?.toString() || "0",
                            reps: exercise.Reps?.toString() || "0"
                        });
                    } else {
                        console.warn(`Exercise ID ${exerciseId} not found in exerciseList`);
                    }
                } else {
                    console.warn(`Exercise ID missing for: ${exercise.Exercise}`);
                }
            });
        });

        exercises.sort((a, b) => {
            const dayA = parseInt(a.day.match(/\d+/)?.[0] || "0");
            const dayB = parseInt(b.day.match(/\d+/)?.[0] || "0");
            return dayA - dayB;
        });

        return exercises;
    } catch (error) {
        console.error("Error extracting exercises:", error);
        console.error("Error details:", error.message);
        console.error("Input text:", planText);
        return [];
    }
};

  const [diet,setDiet] = useState([])

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGeneratedExercises([]);
    
    let isValid = true;
    if (goal.length < 3) {
      setGoalError("Goal must be at least 3 characters.");
      isValid = false;
    } else {
      setGoalError(null);
    }
    if (!isValid) return;
  
    setIsLoading(true);
    setError(null);
    
    try {
      const userInput = `
        Fitness level: ${fitnessLevel}
        Goal: ${goal}
        Days per week: ${daysPerWeek}
        Time per workout: ${timePerWorkout} minutes
        Equipment: ${equipment || "None"}
        Preferences: ${preferences || "None"}
      `;
      
      const plan = await generateWorkoutPlan(userInput, exerciseList, true);
      const plans = extractPlansFromResponse(plan);
      console.log("plans",plans)
      
      if (plans) {
        setGeneratedPlan(plan);
        setGeneratedExercises(plans?.workoutPlan);
        setDiet(plans?.dietPlan)
        onPlanGenerated(plan);
      } else {
        setError("Failed to parse workout plan");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  console.log("generatedExercises",{generatedExercises,diet})

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block mb-2 text-sm font-bold text-gray-700">Fitness Level</label>
            <select
              className="w-full px-3 py-2 text-white rounded shadow focus:outline-none bg-[#2a2a2a]"
              value={fitnessLevel}
              onChange={(e) => setFitnessLevel(e.target.value)}
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
          <InputBlk
            title="Goal"
            name="goal"
            placeholder="Enter Your Goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <InputBlk
            title="Days Per Week"
            name="daysPerWeek"
            type="number"
            placeholder="Enter Days"
            value={daysPerWeek}
            onChange={(e) => setDaysPerWeek(parseInt(e.target.value))}
            required
          />
          <InputBlk
            title="Time Per Workout (minutes)"
            name="timePerWorkout"
            type="number"
            placeholder="Enter Time"
            value={timePerWorkout}
            onChange={(e) => setTimePerWorkout(parseInt(e.target.value))}
            required
          />
        </div>

        <InputBlk
          title="Equipment (optional)"
          name="equipment"
          placeholder="Enter Equipment"
          value={equipment}
          onChange={(e) => setEquipment(e.target.value)}
        />
        <br/>
        <TextBlk
          title="Preferences"
          name="preferences"
          placeholder="Enter Preferences"
          value={preferences}
          onChange={(e) => setPreferences(e.target.value)}
          required={true}
        />

        <button
          type="submit"
          className="w-full px-4 py-2 mt-4 font-bold text-white bg-red-500 rounded hover:bg-red-700 focus:outline-none"
          disabled={isLoading}
        >
          {isLoading ? "Generating..." : "Generate Plan"}
        </button>

        {error && <p className="mt-4 text-red-500">{error}</p>}
      </form>

      {generatedPlan && (
        <div className="mt-8 text-white">
          <h3 className="mb-2 text-xl font-semibold">Generated Plan:</h3>
          <ReactMarkdown children={generatedPlan} remarkPlugins={[remarkGfm]} />
          
          <h3 className="mt-6 mb-2 text-xl font-semibold">Workout Exercises:</h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {generatedExercises.map((exercise, index) => (
              <div key={index} className="p-4 rounded-lg bg-[#2a2a2a]">
        <h4 className="mb-2 text-lg font-semibold">{exercise.name}</h4>
        <p>Day: {exercise.day}</p>
        <p>Target: {exercise.target}</p>
        <p>Body Part: {exercise.bodyPart}</p>
        <p>Sets: {exercise.sets}</p>
        <p>Reps: {exercise.reps}</p>
      </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkoutForm;