"use client";
import React, { useContext, useEffect, useState, useRef } from "react";
import { generateWorkoutPlan, extractPlansFromResponse } from "@/utils/aiService";
import { GlobalContext } from "@/context/GloablContext";
import { calculateAge } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/service/exercise";
import ExerciseAiCard from "@/Feature/AiCoach/ExerciseAiCard";
import MealPlanCard from "@/Feature/AiCoach/MealPlan";
import { motion, AnimatePresence } from "framer-motion";
import PaymentComponent from "@/components/PaymentComponent";

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
  const { userDetailData } = useContext(GlobalContext);
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
    setMessages([
      {
        type: "ai",
        content: "Welcome to FitnessAI! I'm here to help you create personalized workout and diet plans tailored to your needs.",
        isCaption: true,
        id: Date.now()
      }
    ]);
  }, []);

  // Improved scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Create default preferences from user data
  useEffect(() => {
    if (userDetailData) {
      const { userName, userGender, userHeight, userWeight, helpYou, activityLevel } = userDetailData;
  
      if (userName && userGender && userHeight && userWeight && helpYou && activityLevel) {
        const defaultPreferences = `I am ${userName}, a ${userAgeCal}-year-old, ${userGender.toLowerCase()} with a height of ${userHeight} cm and weight of ${userWeight} kg. My goal is ${helpYou}, and I have an activity level of "${activityLevel.subtitle}". I go to the gym regularly and have access to all necessary equipment. My training focuses on both strength and endurance to achieve my fitness goals.`;
        setPreferences(defaultPreferences);
      }
    }
  }, [userDetailData, userAgeCal]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && currentStep === "preferences") {
      textareaRef.current.style.height = "240px";
    }
  }, [currentStep]);

  const addMessage = (content, type = "user", isCaption = false, isSuggestion = false) => {
    const newMessage = { type, content, isCaption, id: Date.now(), isSuggestion };
    setMessages(prev => [...prev, newMessage]);
    
    // Show copy button if this is a suggestion message
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
    
    switch(step) {
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
        // Handle other option selections if needed
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
      
      const plan = await generateWorkoutPlan(userInputData, exerciseList, true);
      const plans = extractPlansFromResponse(plan);
      setTotalWeeks(plans?.Totalweeks);
      
      if (plans) {
        setGeneratedPlan(plan);
        setGeneratedExercises(plans?.workoutPlan);
        setDiet(plans?.dietPlan);
        onPlanGenerated(plan);
        
        addMessage("Your workout and diet plan is ready!", "ai");
        setCurrentStep("complete");
      } else {
        addMessage("Sorry, I couldn't generate a plan. Please try again.", "ai");
        setCurrentStep("welcome");
      }
    } catch (err) {
      addMessage(`Error: ${err.message || "An unexpected error occurred"}`, "ai");
      setCurrentStep("welcome");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!userInput.trim()) return;
    
    addMessage(userInput);
    setUserInput("");
    setShowCopyButton(false);
    
    switch(currentStep) {
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
          
          // If we have default preferences, show them as suggestion
          if (preferences) {
            setTimeout(() => {
              addMessage("Here's a suggestion based on your profile:", "ai");
              addMessage(preferences, "ai", true, true);
            }, 800);
          }
        }, 500);
        break;
        
      case "preferences":
        // Use either user input or default preferences
        const finalPreferences = userInput === "yes" ? preferences : userInput;
        setPreferences(finalPreferences);
        setCurrentStep("payment");
        
        // Store the user input data for later use after payment
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
        // Handle restart or other interactions
        if (userInput.toLowerCase().includes("restart")) {
          setCurrentStep("welcome");
          addMessage("Let's start over with a new plan.", "ai");
        } else {
          addMessage("Is there anything else you'd like to know about your plan?", "ai");
        }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && currentStep !== "preferences") {
      e.preventDefault();
      if (currentStep !== "welcome" && currentStep !== "fitnessLevel" && currentStep !== "daysPerWeek") {
        handleSendMessage();
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

  // Get input type based on current step
  const getInputType = () => {
    switch(currentStep) {
      case "timePerWorkout":
        return "number";
      default:
        return "text";
    }
  };
  
  const handleReset = () => {
    // Reset all state variables
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
    // Don't reset preferences entirely, as we want to keep the user profile data
    setGeneratedPlan(null);
    setGeneratedExercises([]);
    setDiet([]);
    setShowCopyButton(false);
    setIsLoading(false);
    setIsReadyForPayment(false);
    
    // Reset the completed state if necessary
    setIsPaymentSuccessful(false);
    setTotalWeeks(0);
  };
  
  // Render appropriate input controls based on current step
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
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading}
              className="p-2 text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center justify-center">
              <i className="mr-2 text-white fa-sharp fa-solid fa-paper-plane-top"></i>
                Send
              </span>
            </button>
            <button onClick={handleReset}>Reset</button>
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
              onClick={handleSendMessage}
              disabled={!userInput.trim() || isLoading || currentStep === "payment"}
              className="p-2 text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="text-white fa-sharp fa-solid fa-paper-plane-top"></i>
            </button>
            <button
              onClick={handleReset}
              className="p-2 text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <i className="text-white fa-duotone fa-solid fa-arrows-rotate"></i>
            </button>
          </div>
        </div>
      );
    }
  };

  const handlePaymentSuccess = () => {
    setIsPaymentSuccessful(true);
    // Generate the workout plan only after payment is successful
    addMessage("Payment successful! Generating your personalized workout and diet plan...", "ai");
    generatePlan();
  };

  function updateWorkoutPlanWithFullDetails(workoutPlan, exercisesData) {
    // Validate inputs
    if (!Array.isArray(workoutPlan) || !Array.isArray(exercisesData) || workoutPlan.length === 0 || exercisesData.length === 0) {
      return null;
    }
  
    // Create a map of exercises by ID for quick lookup
    const exercisesById = {};
    exercisesData.forEach(exercise => {
      if (exercise.id) {
        exercisesById[exercise.id] = exercise;
      }
    });
  
    // Deep clone the workout plan to avoid modifying the original
    const enrichedWorkoutPlan = JSON.parse(JSON.stringify(workoutPlan));
  
    // Update each exercise in the workout plan with full details
    enrichedWorkoutPlan.forEach(day => {
      if (day.Workout && Array.isArray(day.Workout)) {
        day.Workout = day.Workout.map(exercise => {
          if (!exercise.id) {
            console.warn("Skipping exercise with missing ID:", exercise);
            return exercise;
          }
  
          const fullExerciseDetails = exercisesById[exercise.id];
  
          if (fullExerciseDetails) {
            // Return exercise with all details from exercisesData plus the workout-specific details
            return {
              ...fullExerciseDetails,
              Sets: exercise.Sets,
              Reps: exercise.Reps
            };
          } else {
            // If exercise ID not found in exercisesData, return original exercise
            console.warn(`Exercise with ID ${exercise.id} not found in exercisesData`);
            return exercise;
          }
        });
      }
    });
  
    return enrichedWorkoutPlan;
  }

  const fullyUpdatedWorkoutPlan = updateWorkoutPlanWithFullDetails(updatedWorkoutPlan, exercisesData);

  console.log("fullyUpdatedWorkoutPlan",fullyUpdatedWorkoutPlan,totalWeeks)

  return (
    <div className="flex flex-col justify-between h-full overflow-hidden">
      {/* Chat messages */}
      <div className="flex-grow mb-2 overflow-auto exerciseCard no-scrollbar">
        <div 
          ref={chatContainerRef} 
          className="flex-1 space-y-2 overflow-y-auto no-scrollbar" 
        >
          <div>
            {messages.map((message,index) => (
              <motion.div 
                key={message.id+`_${Date.now()+index}`}
                className={`flex mb-2 ${message.type === 'user' ? 'justify-end' : 'justify-start '}`}
              >
                <div 
                  className={`max-w-[85%] rounded-lg p-2 text-sm ${
                    message.type === 'user' 
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
          
          {/* Show payment form or generated workout plan based on status */}
          {currentStep === "payment" && isReadyForPayment && !isPaymentSuccessful && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mt-2"
            >
              <PaymentComponent 
                onSuccess={handlePaymentSuccess} 
                transactionId="AIWORKOUT123313"
                amount={20} 
              />
            </motion.div>
          )}
          
          {/* Show generated workout plan after payment and plan generation */}
          {currentStep === "complete" && isPaymentSuccessful && updatedWorkoutPlan && (
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
            </motion.div>
          )}
          
          {/* Loading indicator */}
          {isLoading && (
            <div className="flex items-center justify-center p-2">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-red-500 rounded-full border-t-transparent"
              />
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Fixed input area at bottom */}
      <div className="mt-auto inputContainer">
        {renderInputArea()}
      </div>
    </div>
  );
};

export default WorkoutChat;