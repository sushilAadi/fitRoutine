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
import ExerciseAiCard from "@/Feature/AiCoach/ExerciseAiCard";
import MealPlanCard from "@/Feature/AiCoach/MealPlan";

const colorMap = {
  1: 'bg-blue-50',
  2: 'bg-green-50',
  3: 'bg-orange-50',
  4: 'bg-purple-50',
};

const dotColorMap = {
  1: 'bg-blue-500',
  2: 'bg-green-500',
  3: 'bg-orange-500',
  4: 'bg-purple-500',
};


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
  const [diet,setDiet] = useState([])


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
        const defaultPreferences = `I am ${userName}, a ${userAgeCal}-year-old, ${userGender.toLowerCase()} with a height of ${userHeight} cm and weight of ${userWeight} kg. My goal is ${helpYou}, and I have an activity level of "${activityLevel.subtitle}". I go to the gym regularly and have access to all necessary equipment. My training focuses on both strength and endurance to achieve my fitness goals.`;
        setPreferences(defaultPreferences);
      }
    }
  }, [userDetailData]);

 



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

  console.log("generatedExercises",{generatedExercises,exercisesData:exercisesData?.slice(0,2)})


  function extractId(exerciseName) {
    const match = exerciseName.match(/$$ID: (\d+)$$/);
    return match ? match[1] : null;
  }
  
  // Function to find exercise data by ID
  function findExerciseData(id, exercisesData) {
    return exercisesData.find(exercise => exercise.id === id);
  }
  
  // Update generatedExercises with full exercise data
  const updatedWorkoutPlan = generatedExercises?.map(day => {
    const updatedWorkout = day.Workout.map(exercise => {
      const id = extractId(exercise.Exercise);
      const fullExerciseData = findExerciseData(id, exercisesData);
      
      if (fullExerciseData) {
        return {
          Exercise: exercise.Exercise,
          Sets: exercise.Sets,
          Reps: exercise.Reps,
          bodyPart: fullExerciseData.bodyPart,
          equipment: fullExerciseData.equipment,
          gifUrl: fullExerciseData.gifUrl,
          id: fullExerciseData.id,
          name: fullExerciseData.name,
          target: fullExerciseData.target,
          secondaryMuscles: fullExerciseData.secondaryMuscles,
          instructions: fullExerciseData.instructions
        };
      }
      return exercise;
    });
  
    return {
      ...day,
      Workout: updatedWorkout
    };
  });
  
  console.log({updatedWorkoutPlan,diet},"updatedWorkoutPlan");

  const formatMarkdown = (data) => {
    // Remove the JSON section
    let cleanedData = data.replace(/```json[\s\S]*?```/g, "");
  
    // Ensure no extra blank spaces
    return cleanedData.trim();
  };

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
          inputClass="h-[240px]"
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
          {updatedWorkoutPlan?.map((day) => (
          <ExerciseAiCard 
            key={day.Day}
            day={day.Day}
            targetMuscle={day.targetMuscle}
            workout={day.Workout}
            color={colorMap[day.Day] || 'bg-gray-50'}
            dotColor={dotColorMap[day.Day] || 'bg-gray-500'}
          />
        ))}
        <MealPlanCard mealData={diet}/>
          {/* <ReactMarkdown children={formatMarkdown(generatedPlan)} remarkPlugins={[remarkGfm]} /> */}
        </div>
      )}
    </div>
  );
};

export default WorkoutForm;