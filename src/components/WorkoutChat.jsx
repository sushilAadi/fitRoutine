"use client";
import React, { useContext, useEffect, useState, useRef } from "react";
import { generateWorkoutPlan, extractPlansFromResponse } from "@/utils/aiService";
import { GlobalContext } from "@/context/GloablContext";
import { calculateAge, repeatInnerArray } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/service/exercise";
import ExerciseAiCard from "@/Feature/AiCoach/ExerciseAiCard";
import MealPlanCard from "@/Feature/AiCoach/MealPlan";
import { motion, AnimatePresence } from "framer-motion";
import PaymentComponent from "@/components/PaymentComponent";
import { addDoc, collection, doc, setDoc, getDoc } from "@firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import { debounce } from 'lodash';
import jsonToSpreadsheet from "@/utils/excel";

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

const WorkoutChat = ({ onPlanGenerated }) => {
  const { userDetailData, userId } = useContext(GlobalContext);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState("");
  const [currentStep, setCurrentStep] = useState("welcome");
  const [isLoading, setIsLoading] = useState(false);
  const [fitnessLevel, setFitnessLevel] = useState("");
  const [goal, setGoal] = useState("");
  const [daysPerWeek, setDaysPerWeek] = useState("");
  const [timePerWorkout, setTimePerWorkout] = useState("");
  const [equipment, setEquipment] = useState("");
  const [preferences, setPreferences] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [totalCaloriesRequied, setTotalCaloriesRequied] = useState(null);
  const [generatedExercises, setGeneratedExercises] = useState([]);
  const [diet, setDiet] = useState([]);
  const [showCopyButton, setShowCopyButton] = useState(false);
  const [isPaymentSuccessful, setIsPaymentSuccessful] = useState(false);
  const [isReadyForPayment, setIsReadyForPayment] = useState(false);
  const [userInputData, setUserInputData] = useState("");
  const chatContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const [totalWeeks, setTotalWeeks] = useState(0);
  const [saved, setSaved] = useState(false);
  const [isPlanGenerationFailed, setIsPlanGenerationFailed] = useState(false);
  const [hasPaymentBeenAttempted, setHasPaymentBeenAttempted] = useState(false);

  const { data: exercisesData = [] } = useQuery({
    queryKey: ["exercise"],
    queryFn: getExercises,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    cacheTime: 20 * 60 * 1000,
  });

  const exerciseList = exercisesData?.map(i => ({ id: i?.id, name: i?.name, target: i?.target, bodyPart: i?.bodyPart }));

  const {
    userName,
    userBirthDate,
    userGender,
    userHeight,
    userWeight,
    helpYou,
    activityLevel,
  } = userDetailData || {};

  const userAgeCal = calculateAge(userBirthDate);

  // Initialize chat with welcome message
  useEffect(() => {
    if (!hasPaymentBeenAttempted) {
      setMessages([
        {
          type: "ai",
          content: "Welcome to FitnessAI! I'm here to help you create personalized workout and diet plans tailored to your needs.",
          isCaption: true,
          id: Date.now()
        }
      ]);
    }
  }, [hasPaymentBeenAttempted]);

  // Improved scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to save generated plan data to localStorage
  const saveGeneratedPlanToLocalStorage = (planData) => {
    const generatedPlanData = {
      generatedPlan: planData.generatedPlan,
      generatedExercises: planData.generatedExercises,
      diet: planData.diet,
      totalCaloriesRequied: planData.totalCaloriesRequied,
      totalWeeks: planData.totalWeeks,
      timestamp: Date.now()
    };
    localStorage.setItem(`generatedPlanData_${userId}`, JSON.stringify(generatedPlanData));
  };

  // Function to load generated plan data from localStorage
  const loadGeneratedPlanFromLocalStorage = () => {
    const storedData = localStorage.getItem(`generatedPlanData_${userId}`);
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        setGeneratedPlan(parsedData.generatedPlan);
        setGeneratedExercises(parsedData.generatedExercises);
        setDiet(parsedData.diet);
        setTotalCaloriesRequied(parsedData.totalCaloriesRequied);
        setTotalWeeks(parsedData.totalWeeks);
        return true;
      } catch (error) {
        console.error("Error parsing stored plan data:", error);
        localStorage.removeItem(`generatedPlanData_${userId}`);
        return false;
      }
    }
    return false;
  };

  // Function to clear generated plan data from localStorage
  const clearGeneratedPlanFromLocalStorage = () => {
    localStorage.removeItem(`generatedPlanData_${userId}`);
  };

  // Function to update preferences based on user selections
  const updateDefaultPreferences = () => {
    if (!userDetailData) return;
    
    const { userName, userGender, userHeight, userWeight, helpYou, activityLevel } = userDetailData;
    
    if (!userName || !userGender || !userHeight || !userWeight || !helpYou || !activityLevel) return;
    
    let updatedPreferences = `I am ${userName}, a ${userAgeCal}-year-old, ${userGender.toLowerCase()} with a height of ${userHeight} cm and weight of ${userWeight} kg.I have an activity level of "${activityLevel.subtitle}".`;
    
    // Add all the collected information
    if (fitnessLevel) {
      updatedPreferences += ` My fitness level is ${fitnessLevel}.`;
    }
    
    if (goal) {
      updatedPreferences += ` Specifically, I want to ${goal}.`;
    }
    
    if (daysPerWeek) {
      updatedPreferences += ` I plan to train ${daysPerWeek} days per week.`;
    }
    
    if (timePerWorkout) {
      updatedPreferences += ` Each workout session will be ${timePerWorkout} minutes long.`;
    }
    
    if (equipment && equipment.toLowerCase() !== 'none') {
      updatedPreferences += ` I have access to ${equipment}.`;
    } else if (equipment && equipment.toLowerCase() === 'none') {
      updatedPreferences += ` I don't have access to any gym equipment.`;
    }
    
    updatedPreferences += ` My training focuses on both strength and endurance to achieve my fitness goals.`;
    
    setPreferences(updatedPreferences);
  };

  // Update preferences when user data or selections change
  useEffect(() => {
    updateDefaultPreferences();
  }, [userDetailData, userAgeCal, fitnessLevel, goal, daysPerWeek, timePerWorkout, equipment]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && currentStep === "preferences") {
      textareaRef.current.style.height = "240px";
    }
  }, [currentStep]);

  const addMessage = (content, type = "user", isCaption = false, isSuggestion = false) => {
    const newMessage = { type, content, isCaption, id: Date.now(), isSuggestion };
    setMessages(prev => [...prev, newMessage]);

    if (isSuggestion) {
      setShowCopyButton(true);
    }
  };

  const handleStartChat = () => {
    setCurrentStep("fitnessLevel");
    addMessage("Let's start", "user");
    addMessage("What's your fitness level?", "ai");
  };

  const handleOptionSelect = (option, step) => {
    addMessage(option, "user");

    switch (step) {
      case "fitnessLevel":
        setFitnessLevel(option);
        setCurrentStep("goal");
        setTimeout(() => {
          addMessage("What's your fitness goal?", "ai");
        }, 500);
        break;

      case "daysPerWeek":
        setDaysPerWeek(option);
        setCurrentStep("timePerWorkout");
        setTimeout(() => {
          addMessage("How long would you like each workout to be (in minutes)?", "ai");
        }, 500);
        break;

      default:
        break;
    }
  };

  const handleCopySuggestion = () => {
    setUserInput(preferences);
    setShowCopyButton(false);
  };

  const generatePlan = async () => {
    try {
      setIsLoading(true);
      setIsPlanGenerationFailed(false);

      if (!exerciseList || exerciseList.length === 0) {
        throw new Error("No exercise data available. Please try again later.");
      }

      const plan = await generateWorkoutPlan(userInputData, exerciseList, true);
      console.log("plan",plan)
      const plans = extractPlansFromResponse(plan);
      setTotalWeeks(plans?.Totalweeks);

      if (plans) {
        setGeneratedPlan(plan);
        setGeneratedExercises(plans?.workoutPlan);
        setDiet(plans?.dietPlan);
        setTotalCaloriesRequied(plans?.totalCaloriesRequired)
        
        // Save generated plan data to localStorage
        saveGeneratedPlanToLocalStorage({
          generatedPlan: plan,
          generatedExercises: plans?.workoutPlan,
          diet: plans?.dietPlan,
          totalCaloriesRequied: plans?.totalCaloriesRequired,
          totalWeeks: plans?.Totalweeks
        });

        onPlanGenerated(plan);

        addMessage("Your workout and diet plan is ready!", "ai");
        setCurrentStep("complete");
        sessionStorage.setItem(`planGenerated_${userId}`, 'true');
      } else {
        addMessage("We are sorry for the inconvenience. The workout plan generation failed. Please try again. If the issue persists, contact 7892808101.", "ai");
        setIsPlanGenerationFailed(true);
        setCurrentStep("complete");
        sessionStorage.removeItem(`planGenerated_${userId}`);
      }
    } catch (err) {
      console.error("Error generating workout plan:", err);
      addMessage("We are sorry for the inconvenience. The workout plan generation failed. Please try again. If the issue persists, contact 7892808101.", "ai");
      setIsPlanGenerationFailed(true);
      setCurrentStep("complete");
      sessionStorage.removeItem(`planGenerated_${userId}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;

    addMessage(userInput);
    setUserInput("");
    setShowCopyButton(false);

    switch (currentStep) {
      case "goal":
        setGoal(userInput);
        setCurrentStep("daysPerWeek");
        setTimeout(() => {
          addMessage("How many days per week would you like to train?", "ai");
        }, 500);
        break;

      case "timePerWorkout":
        setTimePerWorkout(userInput);
        setCurrentStep("equipment");
        setTimeout(() => {
          addMessage("What equipment do you have access to? (Type 'none' if not applicable)", "ai");
        }, 500);
        break;

      case "equipment":
        setEquipment(userInput);
        setCurrentStep("preferences");
        setTimeout(() => {
          addMessage("Any specific preferences or details you'd like to share?", "ai");

          if (preferences) {
            setTimeout(() => {
              addMessage("Here's a suggestion based on your profile:", "ai");
              addMessage(preferences, "ai", true, true);
            }, 800);
          }
        }, 500);
        break;

      case "preferences":
        const finalPreferences = userInput === "yes" ? preferences : userInput;
        setPreferences(finalPreferences);
        setCurrentStep("payment");

        const inputData = `
          Fitness level: ${fitnessLevel}
          Goal: ${goal}
          Days per week: ${daysPerWeek}
          Time per workout: ${timePerWorkout} minutes
          Equipment: ${equipment || "None"}
          Preferences: ${finalPreferences || "None"}
        `;
        setUserInputData(inputData);

        addMessage("Thanks! Your information has been collected. Please complete payment to generate your personalized workout and diet plan.", "ai");
        setIsReadyForPayment(true);
        break;

      default:
        if (userInput.toLowerCase().includes("restart")) {
          handleReset()
          addMessage("Let's start over with a new plan.", "ai");
        } else {
          addMessage("Is there anything else you'd like to know about your plan?", "ai");
        }
    }
  };

  const debouncedHandleSendMessage = debounce(handleSendMessage, 300);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && currentStep !== "preferences") {
      e.preventDefault();
      if (currentStep !== "welcome" && currentStep !== "fitnessLevel" && currentStep !== "daysPerWeek") {
        debouncedHandleSendMessage();
      }
    }
  };

  // Process exercise data
  function extractId(exerciseName) {
    const match = exerciseName.match(/\$\$ID: (\d+)\$\$/);
    return match ? match[1] : null;
  }

  function findExerciseData(id, exercisesData) {
    return exercisesData.find(exercise => exercise.id === id);
  }

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

  const getInputType = () => {
    switch (currentStep) {
      case "timePerWorkout":
        return "number";
      default:
        return "text";
    }
  };

  const handleReset = () => {
    setMessages([
      {
        type: "ai",
        content: "Welcome to FitnessAI! I'm here to help you create personalized workout and diet plans tailored to your needs.",
        isCaption: true,
        id: Date.now()
      }
    ]);
    setUserInput("");
    setCurrentStep("welcome");
    setFitnessLevel("");
    setGoal("");
    setDaysPerWeek("");
    setTimePerWorkout("");
    setEquipment("");
    setUserInputData("");
    setGeneratedPlan(null);
    setGeneratedExercises([]);
    setTotalCaloriesRequied(null)
    setDiet([]);
    setShowCopyButton(false);
    setIsLoading(false);
    setIsReadyForPayment(false);
    setIsPlanGenerationFailed(false)
    setHasPaymentBeenAttempted(false)
    setIsPaymentSuccessful(false);
    setTotalWeeks(0);

    // Clear all storage
    sessionStorage.removeItem(`paymentSuccessful_${userId}`);
    sessionStorage.removeItem(`planGenerated_${userId}`);
    sessionStorage.removeItem(`workoutData_${userId}`);
    clearGeneratedPlanFromLocalStorage();
    setSaved(false)
  };

  const renderInputArea = () => {
    if (currentStep === "welcome") {
      return (
        <button
          onClick={handleStartChat}
          className="w-full px-4 py-2 font-semibold text-white transition duration-200 rounded-lg outline-none bg-tprimary "
        >
          Let's Start
        </button>
      );
    } else if (currentStep === "fitnessLevel") {
      return (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOptionSelect("beginner", "fitnessLevel")}
            className="px-3 py-2 font-medium text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600"
          >
            Beginner
          </button>
          <button
            onClick={() => handleOptionSelect("intermediate", "fitnessLevel")}
            className="px-3 py-2 font-medium text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600"
          >
            Intermediate
          </button>
          <button
            onClick={() => handleOptionSelect("advanced", "fitnessLevel")}
            className="px-3 py-2 font-medium text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600"
          >
            Advanced
          </button>
        </div>
      );
    } else if (currentStep === "daysPerWeek") {
      return (
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(day => (
            <button
              key={day}
              onClick={() => handleOptionSelect(day.toString(), "daysPerWeek")}
              className="flex items-center justify-center w-10 h-10 font-medium transition duration-200 rounded-lg text-tprimary glass-lite hover:bg-red-600"
            >
              {day}
            </button>
          ))}
        </div>
      );
    } else if (currentStep === "preferences") {
      return (
        <div className="flex flex-col w-full gap-2">
          {showCopyButton && (
            <div className="flex justify-end w-full mb-1">
              <button
                onClick={handleCopySuggestion}
                className="px-3 py-1 text-xs text-white transition duration-200 bg-gray-600 rounded hover:bg-gray-700"
              >
                Use Suggestion
              </button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            <textarea
              ref={textareaRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Share your preferences, health conditions, or any specific details..."
              className="flex-1 w-full px-3 py-2 bg-white border rounded-lg outline-none text-tprimary resize-none min-h-[240px] "
              disabled={isLoading}
            />
            <button
              onClick={debouncedHandleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="p-2 text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center">
                <i className="mr-2 text-white fa-sharp fa-solid fa-paper-plane-top"></i>
                Send
              </span>
            </button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="flex flex-col w-full gap-2">
          {showCopyButton && (
            <div className="flex justify-end w-full mb-1">
              <button
                onClick={handleCopySuggestion}
                className="px-3 py-1 text-xs text-white transition duration-200 bg-gray-600 rounded hover:bg-gray-700"
              >
                Use Suggestion
              </button>
            </div>
          )}
          {!saved ? 
          <div className="flex items-center gap-2">
            <input
              type={getInputType()}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              min={currentStep === "timePerWorkout" ? "10" : undefined}
              max={currentStep === "timePerWorkout" ? "180" : undefined}
              className="flex-1 px-3 py-2 bg-white border rounded-lg outline-none text-tprimary "
              disabled={isLoading || currentStep === "complete" || currentStep === "payment"}
            />
            <button
              onClick={debouncedHandleSendMessage}
              disabled={!userInput.trim() || isLoading || currentStep === "payment"}
              className="p-2 text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="text-white fa-sharp fa-solid fa-paper-plane-top"></i>
            </button>
          </div>:<button onClick={handleReset}>Start Again</button>}
        </div>
      );
    }
  };

  const handlePaymentSuccess = () => {
    setHasPaymentBeenAttempted(true);
    setIsPaymentSuccessful(true);

    sessionStorage.setItem(`paymentSuccessful_${userId}`, 'true');

    const workoutData = {
      fitnessLevel,
      goal,
      daysPerWeek,
      timePerWorkout,
      equipment,
      preferences,
      userInputData,
    };
    sessionStorage.setItem(`workoutData_${userId}`, JSON.stringify(workoutData));

    addMessage("Payment successful! Generating your personalized workout and diet plan...", "ai");
    generatePlan();
  };

  const handleRetryPlanGeneration = () => {
    setIsPlanGenerationFailed(false);
    generatePlan();
  };

  function updateWorkoutPlanWithFullDetails(workoutPlan, exercisesData) {
    if (!Array.isArray(workoutPlan) || !Array.isArray(exercisesData) || workoutPlan.length === 0 || exercisesData.length === 0) {
      return null;
    }

    const exercisesById = {};
    exercisesData.forEach(exercise => {
      if (exercise.id) {
        exercisesById[exercise.id] = exercise;
      }
    });

    const enrichedWorkoutPlan = JSON.parse(JSON.stringify(workoutPlan));

    enrichedWorkoutPlan.forEach(day => {
      if (day.Workout && Array.isArray(day.Workout)) {
        day.Workout = day.Workout.map(exercise => {
          if (!exercise.id) {
            console.warn("Skipping exercise with missing ID:", exercise);
            return exercise;
          }

          const fullExerciseDetails = exercisesById[exercise.id];

          if (fullExerciseDetails) {
            return {
              ...fullExerciseDetails,
              Sets: exercise.Sets,
              Reps: exercise.Reps
            };
          } else {
            console.warn(`Exercise with ID ${exercise.id} not found in exercisesData`);
            return exercise;
          }
        });
      }
    });

    return enrichedWorkoutPlan;
  }

  const fullyUpdatedWorkoutPlan = updateWorkoutPlanWithFullDetails(updatedWorkoutPlan, exercisesData);

  function transformWorkoutPlan(originalPlan) {
    const planName = `workoutPlan_AiGenerated_${goal}`;
    const daysPerWeek = originalPlan.length;
    const currentDate = new Date().toISOString();

    const workoutPlan = [];
    const firstWeek = [];

    originalPlan.forEach(day => {
      const transformedDay = {
        day: day.Day,
        exercises: day.Workout.map(exercise => {
          return {
            bodyPart: exercise.bodyPart,
            equipment: exercise.equipment,
            gifUrl: exercise.gifUrl,
            id: exercise.id,
            name: exercise.name,
            target: exercise.target,
            secondaryMuscles: exercise.secondaryMuscles,
            instructions: exercise.instructions,
            weeklySetConfig: [
              { sets: exercise.Sets, isConfigured: true },
              { sets: 0, isConfigured: false }
            ]
          };
        })
      };
      firstWeek.push(transformedDay);
    });

    workoutPlan.push(firstWeek);

    const weekNames = Array.from({ length: totalWeeks }, (_, i) => `Week ${i + 1}`);
    const dayNames = originalPlan.map(day => day.targetMuscle);

    const workPlan = repeatInnerArray(workoutPlan,+totalWeeks)

    const transformedWorkoutPlan = {
      userIdCl: userId,
      planName: planName,
      workoutPlanDB: {
        name: goal,
        weeks: totalWeeks,
        daysPerWeek: daysPerWeek,
        workoutPlan: JSON.stringify(workPlan),
        exerciseHistory: {},
        weekNames: JSON.stringify(weekNames),
        dayNames: JSON.stringify(dayNames),
        date: currentDate,
        setUpdate: false
      }
    };

    return transformedWorkoutPlan;
  }

  const savePlan = async () => {
    const transformedPlan = transformWorkoutPlan(fullyUpdatedWorkoutPlan);

    try {
      const planDocRef = await addDoc(collection(db, 'workoutPlans'), transformedPlan);
      const dietDocRef = await addDoc(collection(db, 'diet_AI'),{
        ...diet,
        totalWeeks: totalWeeks,
        userIdCl: userId,
        totalCaloriesRequied:totalCaloriesRequied,
        planName: goal
      });
      toast.success('Plan Saved Successfully');
      setSaved(true);
      
      // Clear all storage after successful save
      sessionStorage.removeItem(`paymentSuccessful_${userId}`);
      sessionStorage.removeItem(`planGenerated_${userId}`);
      sessionStorage.removeItem(`workoutData_${userId}`);
      clearGeneratedPlanFromLocalStorage();
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error('Failed to save plan. Please try again.');
    }
  };

  const handleExport = () => {
    jsonToSpreadsheet(fullyUpdatedWorkoutPlan,goal,totalWeeks);
  };

  useEffect(() => {
    const paymentSuccessful = sessionStorage.getItem(`paymentSuccessful_${userId}`) === 'true';
    const planGenerated = sessionStorage.getItem(`planGenerated_${userId}`) === 'true';

    if (paymentSuccessful) {
      setHasPaymentBeenAttempted(true)
      setIsPaymentSuccessful(true);
      setIsReadyForPayment(false);
      setCurrentStep("complete");

      const storedWorkoutData = sessionStorage.getItem(`workoutData_${userId}`);
      if (storedWorkoutData) {
        const workoutData = JSON.parse(storedWorkoutData);
        setFitnessLevel(workoutData.fitnessLevel);
        setGoal(workoutData.goal);
        setDaysPerWeek(workoutData.daysPerWeek);
        setTimePerWorkout(workoutData.timePerWorkout);
        setEquipment(workoutData.equipment);
        setPreferences(workoutData.preferences);
        setUserInputData(workoutData.userInputData);
      }

      // Try to load generated plan data from localStorage first
      const planLoadedFromLocalStorage = loadGeneratedPlanFromLocalStorage();
      
      if (planLoadedFromLocalStorage) {
        // Plan data found in localStorage, display it
        addMessage("Your workout and diet plan is ready!", "ai");
      } else if (!planGenerated) {
        // No plan data in localStorage and plan not generated, generate new plan
        generatePlan();
      }
    }
  }, [userId]);

  return (
    <div className="flex flex-col justify-between h-full overflow-hidden">
      <div className="flex-grow mb-2 overflow-auto exerciseCard no-scrollbar">
        <div
          ref={chatContainerRef}
          className="flex-1 space-y-2 overflow-y-auto no-scrollbar"
        >
          <div>
            {messages.map((message, index) => (
              <motion.div
                key={message.id + `_${Date.now() + index}`}
                className={`flex mb-2 ${message.type === 'user' ? 'justify-end' : 'justify-start '}`}
              >
                <div
                  className={`max-w-[85%] rounded-lg p-2 text-sm ${message.type === 'user'
                    ? 'bg-red-500 text-white'
                    : message.isCaption
                      ? ' glass-lite text-tprimary'
                      : ' glass-lite text-tprimary'
                    } ${message.isSuggestion ? 'cursor-pointer' : ''}`}
                  onClick={() => message.isSuggestion && handleCopySuggestion()}
                >
                  {message.content}
                  {message.isSuggestion && (
                    <div className="mt-1 text-xs text-gray-300">(Click to use)</div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {currentStep === "payment" && isReadyForPayment && !isPaymentSuccessful && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2"
            >
              <PaymentComponent
                onSuccess={handlePaymentSuccess}
                transactionId={`AIWORKOUT_${userId}${Date.now()}`}
                amount={20}
              />
            </motion.div>
          )}

          {currentStep === "complete" && isPaymentSuccessful && fullyUpdatedWorkoutPlan && !isPlanGenerationFailed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2 space-y-3"
            >
              {fullyUpdatedWorkoutPlan?.map((day) => (
                <ExerciseAiCard
                  key={day.Day}
                  day={day.Day}
                  targetMuscle={day.targetMuscle}
                  workout={day.Workout}
                  color={colorMap[day.Day] || 'bg-gray-50'}
                  dotColor={dotColorMap[day.Day] || 'bg-gray-500'}
                />
              ))}
              {diet && diet.length > 0 && (
                <MealPlanCard mealData={diet} />
              )}

              <button onClick={handleExport} className="text-green-500 w-100"><i className="mr-2 fa-duotone fa-solid fa-download"></i>Export Workout Plan to Excel</button>
              <button
                type="button"
                onClick={!saved ? savePlan : undefined}
                disabled={saved}
                className={`p-2 text-white transition duration-200 rounded-lg w-100
    ${saved ? "bg-gray-500 cursor-not-allowed" : "bg-tprimary hover:bg-red-600"}
  `}
              >
                <span className="flex items-center justify-center">
                  <i className="mr-2 text-white fa-duotone fa-solid fa-floppy-disk-circle-arrow-right"></i>
                  {saved ? "Saved" : "Save Plan"}
                </span>
              </button>
            </motion.div>
          )}

          {currentStep === "complete" && isPaymentSuccessful && isPlanGenerationFailed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2"
            >
              <button
                onClick={handleRetryPlanGeneration}
                className="px-4 py-2 font-semibold text-white transition duration-200 rounded-lg outline-none bg-tprimary hover:bg-red-600"
              >
                Retry Workout Plan Generation
              </button>
            </motion.div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center p-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-red-500 rounded-full border-t-transparent"
              />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="mt-auto inputContainer">
        {renderInputArea()}
      </div>
    </div>
  );
};

export default WorkoutChat;