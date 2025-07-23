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
import { db, geminiModel } from "@/firebase/firebaseConfig";
import toast from "react-hot-toast";
import { debounce } from 'lodash';
import jsonToSpreadsheet from "@/utils/excel";
import ReactMarkdown from 'react-markdown';

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
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [workoutSuggestions, setWorkoutSuggestions] = useState([]);
  const [bodyReport, setBodyReport] = useState(null);
  const [focusAreas, setFocusAreas] = useState([]);
  const [selectedFocusArea, setSelectedFocusArea] = useState(null);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

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
    
    // Don't override if we already have enhanced preferences from photo analysis
    if (preferences && preferences.includes("BODY ANALYSIS RESULTS")) {
      return; // Keep the enhanced preferences with photo analysis
    }
    
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

  const addMessage = (content, type = "user", isCaption = false, isSuggestion = false, isMarkdown = false) => {
    setMessages(prev => {
      // Check if the same content was just added to prevent immediate duplicates
      const lastMessage = prev[prev.length - 1];
      if (lastMessage && lastMessage.content === content && lastMessage.type === type) {
        return prev; // Don't add duplicate message
      }
      
      const newMessage = { type, content, isCaption, id: Date.now() + Math.random(), isSuggestion, isMarkdown };
      return [...prev, newMessage];
    });

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
        setCurrentStep("imageUpload");
        setTimeout(() => {
          addMessage("Would you like to upload a photo for personalized workout recommendations based on your current fitness level?", "ai");
        }, 500);
        break;

      case "imageUpload":
        if (userInput.toLowerCase().includes("yes")) {
          setShowImageUpload(true);
          addMessage("Great! Please upload a photo or take one using the options below.", "ai");
        } else {
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
        }
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
        
        console.log("=== FINAL WORKOUT GENERATION DATA ===");
        console.log("Input Data being sent to AI:", inputData);
        console.log("Final Preferences:", finalPreferences);
        console.log("Selected Focus Area:", selectedFocusArea);
        console.log("Body Report:", bodyReport);
        
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

  // Helper function to generate personalized fallback focus areas
  const generatePersonalizedFallbackFocusAreas = (userProfile, fitnessLevel, goal) => {
    const focusAreas = [];
    
    // Analyze user profile to create relevant focus areas
    if (goal?.toLowerCase().includes('lose weight') || goal?.toLowerCase().includes('fat loss')) {
      focusAreas.push({
        id: `fat_loss_${userProfile.age}_${userProfile.gender}`,
        title: "Targeted Fat Loss Program",
        description: `Customized fat loss approach for ${userProfile.age}-year-old ${userProfile.gender} with ${fitnessLevel} fitness level`,
        icon: "🔥",
        suitableFor: `Optimized for your ${goal} goal and current activity level`,
        priority: "high",
        targetAreas: ["Full body fat reduction", "Metabolic enhancement"]
      });
    }
    
    if (goal?.toLowerCase().includes('muscle') || goal?.toLowerCase().includes('strength') || goal?.toLowerCase().includes('build')) {
      focusAreas.push({
        id: `strength_${userProfile.gender}_${fitnessLevel}`,
        title: "Progressive Strength Building",
        description: `Strength development program tailored for ${fitnessLevel} level ${userProfile.gender}`,
        icon: "💪",
        suitableFor: `Perfect match for your ${goal} objective`,
        priority: "high",
        targetAreas: ["Major muscle groups", "Progressive overload"]
      });
    }
    
    // Age-based recommendations
    if (userProfile.age >= 30) {
      focusAreas.push({
        id: `posture_mobility_${userProfile.age}`,
        title: "Posture & Mobility Enhancement",
        description: "Address common posture issues and maintain mobility for long-term health",
        icon: "🧘",
        suitableFor: `Essential for ${userProfile.age}+ age group`,
        priority: "medium",
        targetAreas: ["Spinal alignment", "Joint mobility", "Core stability"]
      });
    }
    
    // Activity level based recommendations
    if (userProfile.activityLevel?.toLowerCase().includes('sedentary') || userProfile.activityLevel?.toLowerCase().includes('low')) {
      focusAreas.push({
        id: `conditioning_${userProfile.activityLevel}`,
        title: "Cardiovascular Conditioning",
        description: "Build endurance and improve overall fitness foundation",
        icon: "❤️",
        suitableFor: `Ideal for improving from ${userProfile.activityLevel} activity level`,
        priority: "medium",
        targetAreas: ["Cardiovascular health", "General conditioning"]
      });
    }
    
    return focusAreas.slice(0, 3); // Return max 3 focus areas
  };

  // Helper function to generate areas needing work based on profile
  const generateAreasNeedingWork = (userProfile, goal) => {
    const areas = [];
    
    if (userProfile.age >= 35) {
      areas.push("Core stability", "Posture alignment");
    }
    
    if (goal?.toLowerCase().includes('lose weight')) {
      areas.push("Metabolic conditioning", "Body composition");
    }
    
    if (goal?.toLowerCase().includes('muscle') || goal?.toLowerCase().includes('strength')) {
      areas.push("Progressive overload", "Muscle activation");
    }
    
    if (userProfile.activityLevel?.toLowerCase().includes('sedentary')) {
      areas.push("Cardiovascular endurance", "Movement quality");
    }
    
    // Default areas if none match
    if (areas.length === 0) {
      areas.push("Overall conditioning", "Movement patterns", "Consistency");
    }
    
    return areas.slice(0, 4); // Return max 4 areas
  };

  const handleImageAnalysis = async (files) => {
    setIsAnalyzingImage(true);
    setPhotoAnalysis(null);

    try {
      const imagePromises = files.map(file => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({
            data: reader.result.split(',')[1],
            type: file.type,
            name: file.name,
            size: file.size
          });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      });

      const images = await Promise.all(imagePromises);
      
      console.log("=== IMAGE ANALYSIS DEBUG ===");
      console.log("Number of images:", files.length);
      console.log("Image details:", images.map(img => ({
        type: img.type,
        name: img.name,
        size: img.size,
        dataLength: img.data.length
      })));

      // Include user profile data for more personalized analysis
      const userProfile = {
        age: userAgeCal,
        gender: userGender,
        height: userHeight,
        weight: userWeight,
        activityLevel: activityLevel?.subtitle,
        goals: helpYou,
        fitnessLevel: fitnessLevel,
        goal: goal,
        daysPerWeek: daysPerWeek,
        timePerWorkout: timePerWorkout,
        equipment: equipment
      };

      const prompt = `You are a professional fitness assessor analyzing body composition photos. Provide a detailed body analysis report and create PERSONALIZED focus areas based on the specific analysis results.

      User Profile: Age ${userProfile.age}, ${userProfile.gender}, Height ${userProfile.height}cm, Weight ${userProfile.weight}kg, Activity Level: ${userProfile.activityLevel}, Goals: ${userProfile.goals}, Fitness Level: ${userProfile.fitnessLevel}

      Analyze these photos and provide:
      1. Body composition assessment (estimated body fat %, muscle development)
      2. Posture analysis (head position, shoulders, spine alignment)
      3. Proportions and muscle imbalances
      4. Areas needing improvement
      5. PERSONALIZED focus areas based on SPECIFIC analysis findings

      Return ONLY valid JSON (no markdown formatting):
      {
        "bodyReport": {
          "bodyFat": "estimated percentage (e.g., 18-22%)",
          "muscleTone": "description of visible muscle development",
          "posture": {
            "head": "forward/neutral/tilted analysis",
            "shoulders": "rounded/squared/uneven analysis", 
            "spine": "curved/straight/tilted analysis"
          },
          "areasNeedingWork": ["area1", "area2", "area3"],
          "strengths": ["strength1", "strength2"],
          "overallAssessment": "2-3 sentence professional assessment"
        },
        "focusAreas": [
          {
            "id": "unique_id_based_on_analysis",
            "title": "Specific title based on actual body analysis findings",
            "description": "Detailed description addressing specific issues found in photos",
            "icon": "appropriate emoji",
            "suitableFor": "Specific reasoning based on photo analysis results",
            "priority": "high/medium/low",
            "targetAreas": ["specific body parts that need work"]
          },
          {
            "id": "another_unique_id", 
            "title": "Another personalized focus based on findings",
            "description": "Another specific description for identified issues",
            "icon": "appropriate emoji",
            "suitableFor": "Another specific reasoning from analysis",
            "priority": "high/medium/low",
            "targetAreas": ["other specific areas"]
          }
        ]
      }

      CRITICAL: Generate 2-4 focus areas that are SPECIFICALLY tailored to this person's visible body analysis results. DO NOT use generic categories. Instead:
      - If you see forward head posture → create "Forward Head Correction" focus
      - If you see rounded shoulders → create "Shoulder Mobility & Strength" focus  
      - If you see lower body fat concentration → create "Lower Body Fat Reduction" focus
      - If you see weak core → create "Core Stabilization Program" focus
      - If you see muscle imbalances → create specific imbalance correction focus
      - If you see good muscle development but high body fat → create "Body Recomposition" focus
      
      Each focus area should address SPECIFIC findings from the photo analysis, not generic fitness goals.`;

      console.log("Prompt being sent:", prompt);

      const contentParts = [prompt, ...images.map(img => ({
        inlineData: {
          mimeType: img.type,
          data: img.data
        }
      }))];

      console.log("Content parts structure:", contentParts.length, "total parts");

      const result = await geminiModel.generateContent(contentParts);
      const response = await result.response;
      let text = response.text();

      console.log("Raw AI response:", text);

      // Extract JSON from response
      const codeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
      const match = text.match(codeBlockRegex);
      if (match) {
        text = match[1];
        console.log("Extracted JSON from code block:", text);
      }

      let analysisData;
      try {
        analysisData = JSON.parse(text);
        console.log("Parsed analysis data:", analysisData);
      } catch (parseError) {
        console.log("JSON parsing failed, using fallback. Error:", parseError);
        console.log("Text that failed to parse:", text);
        
        // Try to extract JSON from different formats
        const cleanText = text.replace(/```json|```/g, '').trim();
        try {
          analysisData = JSON.parse(cleanText);
          console.log("Parsed from cleaned text:", analysisData);
        } catch (secondError) {
          console.log("Second parsing attempt failed, using smart fallback");
          
          // Create personalized fallback based on user profile
          const personalizedFocusAreas = generatePersonalizedFallbackFocusAreas(userProfile, fitnessLevel, goal);
          
          analysisData = {
            bodyReport: {
              bodyFat: "Unable to accurately assess from photo",
              muscleTone: `Moderate muscle development visible for ${fitnessLevel} level`,
              posture: {
                head: "Analysis pending - will focus on general alignment",
                shoulders: "Assessment needed - will include shoulder mobility work",
                spine: "Alignment check required - will add core strengthening"
              },
              areasNeedingWork: generateAreasNeedingWork(userProfile, goal),
              strengths: [`${fitnessLevel.charAt(0).toUpperCase() + fitnessLevel.slice(1)} fitness foundation`, "Commitment to improvement"],
              overallAssessment: `Based on your profile as a ${userProfile.age}-year-old ${userProfile.gender} with ${fitnessLevel} fitness level and goal to ${goal}, we've identified key areas to focus on for optimal results.`
            },
            focusAreas: personalizedFocusAreas
          };
        }
      }

      console.log("Final analysis data being used:", analysisData);

      setBodyReport(analysisData.bodyReport);
      setFocusAreas(analysisData.focusAreas);
      setWorkoutSuggestions([]); // Clear old suggestions to prevent duplication
      
      // Add body analysis report
      addMessage("📊 Body Analysis Report", "ai");
      
      const reportText = `**Body Fat:** ${analysisData.bodyReport.bodyFat}
**Muscle Tone:** ${analysisData.bodyReport.muscleTone}

**Posture Analysis:**
• Head: ${analysisData.bodyReport.posture.head}
• Shoulders: ${analysisData.bodyReport.posture.shoulders}
• Spine: ${analysisData.bodyReport.posture.spine}

**Areas Needing Work:** ${analysisData.bodyReport.areasNeedingWork.join(', ')}

**Strengths:** ${analysisData.bodyReport.strengths.join(', ')}

**Assessment:** ${analysisData.bodyReport.overallAssessment}`;

      addMessage(reportText, "ai", true, false, true);
      
      setTimeout(() => {
        addMessage("👇 Choose your primary focus area:", "ai");
      }, 1500);
      
      setIsAnalyzingImage(false);
    } catch (error) {
      console.error("Error analyzing image:", error);
      console.error("Full error details:", error);
      toast.error("Failed to analyze image. Please try again.");
      setIsAnalyzingImage(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error("Please select only image files");
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Each image should be less than 10MB");
        return;
      }
    }

    if (files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setUploadedImages(files);
    handleImageAnalysis(files);
  };

  const handleFocusAreaSelect = (focusArea) => {
    setSelectedFocusArea(focusArea);
    addMessage(`Selected Focus: ${focusArea.title}`, "user");
    
    // Generate personalized workout plan based on focus area + user profile
    const personalizedPlan = generatePersonalizedWorkoutSuggestion(focusArea);
    
    addMessage("🎯 Personalized Workout Strategy", "ai");
    addMessage(personalizedPlan, "ai", true, false, true);
    
    // Update preferences to include the selected focus area and body analysis
    const updatedPreferencesWithFocus = updatePreferencesWithAnalysis(focusArea, personalizedPlan);
    setPreferences(updatedPreferencesWithFocus);
    
    // Continue to preferences after personalized plan
    setTimeout(() => {
      setFocusAreas([]); // Clear focus areas
      setWorkoutSuggestions([]); // Ensure old suggestions are cleared
      setCurrentStep("preferences");
      addMessage("Any specific preferences or details you'd like to share?", "ai");

      setTimeout(() => {
        addMessage("Here's your updated profile with photo analysis:", "ai");
        addMessage(updatedPreferencesWithFocus, "ai", true, true);
      }, 800);
    }, 2000);
  };

  const generatePersonalizedWorkoutSuggestion = (focusArea) => {
    const userInfo = {
      age: userAgeCal,
      gender: userGender,
      fitnessLevel: fitnessLevel,
      goal: goal,
      timePerWorkout: timePerWorkout,
      daysPerWeek: daysPerWeek,
      equipment: equipment,
      activityLevel: activityLevel?.subtitle
    };

    let strategy = "";

    // Handle dynamic focus areas based on ID patterns and content
    if (focusArea.id.includes("strength") || focusArea.title.toLowerCase().includes("strength") || focusArea.title.toLowerCase().includes("muscle")) {
      strategy = `**${focusArea.title} for ${userInfo.fitnessLevel} Level**

**Training Split (${userInfo.daysPerWeek} days/week):**
${userInfo.daysPerWeek >= 4 ? "• Upper/Lower split with progressive overload" : "• Full body workouts focusing on compound movements"}

**Key Exercises (${userInfo.timePerWorkout} min sessions):**
• Compound movements: Squats, deadlifts, bench press
• Progressive overload: Increase weight by 2.5-5lbs weekly
• Rep ranges: 6-8 reps for strength, 8-12 for muscle growth

**Target Areas:** ${focusArea.targetAreas ? focusArea.targetAreas.join(', ') : 'Major muscle groups'}

**Equipment Adaptation:**
${userInfo.equipment === "none" ? 
  "• Bodyweight progressions: Push-up variations, single-leg squats\n• Resistance bands for added difficulty" :
  `• Utilize ${userInfo.equipment} for optimal resistance training\n• Focus on free weights and compound movements`}

**Timeline:** Expect strength gains in 4-6 weeks with consistent training.`;

    } else if (focusArea.id.includes("fat_loss") || focusArea.title.toLowerCase().includes("fat") || focusArea.title.toLowerCase().includes("toning")) {
      strategy = `**${focusArea.title} for ${userInfo.fitnessLevel} Level**

**Training Approach (${userInfo.daysPerWeek} days/week):**
• Combine strength training with cardio intervals
• High-intensity circuits for maximum calorie burn
• ${userInfo.timePerWorkout}-minute sessions with minimal rest

**Workout Structure:**
• 60% strength training for muscle preservation
• 40% cardio intervals for fat burning
• Circuit training: 30-45 seconds work, 15-30 seconds rest

**Target Areas:** ${focusArea.targetAreas ? focusArea.targetAreas.join(', ') : 'Full body fat reduction'}

**Cardio Integration:**
${userInfo.equipment === "none" ?
  "• Bodyweight circuits: Burpees, mountain climbers, jump squats\n• Walking/running intervals" :
  `• Equipment-based intervals using ${userInfo.equipment}\n• Compound movements in circuit format`}

**Expected Results:** 1-2 lbs fat loss per week with proper nutrition.`;

    } else if (focusArea.id.includes("posture") || focusArea.title.toLowerCase().includes("posture") || focusArea.title.toLowerCase().includes("alignment")) {
      strategy = `**${focusArea.title} for ${userInfo.fitnessLevel} Level**

**Assessment Focus:**
${focusArea.description}

**Daily Routine (${userInfo.timePerWorkout} min sessions):**
• 10 min mobility/stretching
• 15 min strengthening weak muscles
• 10 min posture awareness exercises

**Key Exercise Categories:**
• **Strengthen:** Upper back, deep core, glutes
• **Stretch:** Chest, hip flexors, neck muscles
• **Mobilize:** Thoracic spine, shoulders, hips

**Target Areas:** ${focusArea.targetAreas ? focusArea.targetAreas.join(', ') : 'Spinal alignment, Core stability'}

**Equipment Adaptation:**
${userInfo.equipment === "none" ?
  "• Wall angels, doorway stretches, floor exercises\n• Resistance band exercises for upper back" :
  `• Use ${userInfo.equipment} for targeted strengthening\n• Focus on rowing movements and back extensions`}

**Daily Habits:** Posture check every hour, ergonomic workspace setup.`;

    } else if (focusArea.id.includes("conditioning") || focusArea.title.toLowerCase().includes("cardio") || focusArea.title.toLowerCase().includes("conditioning")) {
      strategy = `**${focusArea.title} for ${userInfo.fitnessLevel} Level**

**Training Approach (${userInfo.daysPerWeek} days/week):**
• Progressive cardiovascular training
• Mix of steady-state and interval training
• ${userInfo.timePerWorkout}-minute sessions building endurance

**Workout Structure:**
• 20% warm-up and mobility
• 60% cardiovascular training
• 20% cool-down and stretching

**Target Areas:** ${focusArea.targetAreas ? focusArea.targetAreas.join(', ') : 'Cardiovascular health, General conditioning'}

**Exercise Selection:**
${userInfo.equipment === "none" ?
  "• Walking/jogging intervals\n• Bodyweight circuits\n• Stair climbing, jumping jacks" :
  `• Equipment-based cardio using ${userInfo.equipment}\n• Rowing, cycling, or treadmill intervals`}

**Expected Results:** Improved endurance and energy levels within 3-4 weeks.`;

    } else {
      // Generic strategy for any other focus area
      strategy = `**${focusArea.title} for ${userInfo.fitnessLevel} Level**

**Training Approach (${userInfo.daysPerWeek} days/week):**
${focusArea.description}

**Session Structure (${userInfo.timePerWorkout} min sessions):**
• Customized approach based on your specific needs
• Progressive training methodology
• Regular assessment and adjustment

**Target Areas:** ${focusArea.targetAreas ? focusArea.targetAreas.join(', ') : 'Comprehensive fitness improvement'}

**Equipment Adaptation:**
${userInfo.equipment === "none" ?
  "• Bodyweight exercises and movements\n• Creative use of household items" :
  `• Optimal use of ${userInfo.equipment}\n• Equipment-specific exercise selection`}

**Focus:** ${focusArea.suitableFor}`;
    }

    return strategy;
  };

  const updatePreferencesWithAnalysis = (selectedFocusArea, personalizedPlan) => {
    // Start with the original profile-based preferences
    let basePreferences = `I am ${userName}, a ${userAgeCal}-year-old, ${userGender.toLowerCase()} with a height of ${userHeight} cm and weight of ${userWeight} kg. I have an activity level of "${activityLevel?.subtitle}".`;
    
    // Add all the collected information
    if (fitnessLevel) {
      basePreferences += ` My fitness level is ${fitnessLevel}.`;
    }
    
    if (goal) {
      basePreferences += ` Specifically, I want to ${goal}.`;
    }
    
    if (daysPerWeek) {
      basePreferences += ` I plan to train ${daysPerWeek} days per week.`;
    }
    
    if (timePerWorkout) {
      basePreferences += ` Each workout session will be ${timePerWorkout} minutes long.`;
    }
    
    if (equipment && equipment.toLowerCase() !== 'none') {
      basePreferences += ` I have access to ${equipment}.`;
    } else if (equipment && equipment.toLowerCase() === 'none') {
      basePreferences += ` I don't have access to any gym equipment.`;
    }

    // Add body analysis results if available
    if (bodyReport) {
      basePreferences += `\n\nBODY ANALYSIS RESULTS:\n`;
      basePreferences += `• Body Fat: ${bodyReport.bodyFat}\n`;
      basePreferences += `• Muscle Tone: ${bodyReport.muscleTone}\n`;
      basePreferences += `• Posture Issues: Head - ${bodyReport.posture?.head}, Shoulders - ${bodyReport.posture?.shoulders}, Spine - ${bodyReport.posture?.spine}\n`;
      basePreferences += `• Areas Needing Work: ${bodyReport.areasNeedingWork?.join(', ')}\n`;
      basePreferences += `• Current Strengths: ${bodyReport.strengths?.join(', ')}\n`;
    }

    // Add selected focus area and personalized strategy
    if (selectedFocusArea) {
      basePreferences += `\n\nSELECTED PRIMARY FOCUS: ${selectedFocusArea.title}\n`;
      basePreferences += `Focus Reasoning: ${selectedFocusArea.suitableFor}\n`;
      basePreferences += `Description: ${selectedFocusArea.description}\n`;
    }

    // Add key points from personalized strategy
    if (personalizedPlan) {
      basePreferences += `\n\nPERSONALIZED STRATEGY HIGHLIGHTS:\n`;
      
      if (selectedFocusArea?.id === "strength") {
        basePreferences += `• Training approach: ${daysPerWeek >= 4 ? "Upper/Lower split with progressive overload" : "Full body workouts focusing on compound movements"}\n`;
        basePreferences += `• Key focus: Compound movements with progressive overload\n`;
        basePreferences += `• Equipment adaptation: ${equipment === "none" ? "Bodyweight progressions and resistance bands" : `Optimal use of ${equipment} for resistance training`}\n`;
      } else if (selectedFocusArea?.id === "fat_loss") {
        basePreferences += `• Training approach: Combine strength training (60%) with cardio intervals (40%)\n`;
        basePreferences += `• Workout style: High-intensity circuits for maximum calorie burn\n`;
        basePreferences += `• Target: 1-2 lbs fat loss per week with proper nutrition\n`;
      } else if (selectedFocusArea?.id === "posture") {
        basePreferences += `• Daily routine: 10 min mobility + 15 min strengthening + 10 min posture awareness\n`;
        basePreferences += `• Key focus: Strengthen upper back/core, stretch chest/hip flexors\n`;
        basePreferences += `• Special emphasis: Posture correction based on identified imbalances\n`;
      }
    }
    
    basePreferences += `\n\nPlease create a comprehensive workout and diet plan that specifically addresses my body analysis results and selected focus area while considering all my personal constraints and goals.`;
    
    return basePreferences;
  };

  const handleUploadOption = () => {
    fileInputRef.current?.click();
  };

  const handleCaptureOption = () => {
    cameraInputRef.current?.click();
  };

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
    setSaved(false);
    setShowImageUpload(false);
    setIsAnalyzingImage(false);
    setPhotoAnalysis(null);
    setUploadedImages([]);
    setWorkoutSuggestions([]);
    setBodyReport(null);
    setFocusAreas([]);
    setSelectedFocusArea(null);
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
          <div className="flex flex-col gap-2">
            {(currentStep === "imageUpload" || showImageUpload) && (
              <div className="flex flex-col gap-2 p-3 border rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600">Upload photos from different angles (front, side, back) for comprehensive analysis. Max 5 images.</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageSelect}
                />
                
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                
                <div className="flex gap-2">
                  <button
                    onClick={handleCaptureOption}
                    disabled={isAnalyzingImage}
                    className="flex-1 p-2 text-white transition duration-200 rounded-lg bg-green-500 hover:bg-green-600 disabled:opacity-50"
                  >
                    📷 Take Photo
                  </button>
                  <button
                    onClick={handleUploadOption}
                    disabled={isAnalyzingImage}
                    className="flex-1 p-2 text-white transition duration-200 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
                  >
                    📁 Upload Images
                  </button>
                </div>
                
                {isAnalyzingImage && (
                  <div className="flex items-center justify-center p-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                      className="w-5 h-5 border-2 border-blue-500 rounded-full border-t-transparent"
                    />
                    <span className="ml-2 text-sm text-gray-600">Analyzing your photo...</span>
                  </div>
                )}
                
                <button
                  onClick={() => {
                    setShowImageUpload(false);
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
                  }}
                  className="p-1 text-sm text-gray-500 hover:text-gray-700"
                >
                  Skip Photo Upload
                </button>
              </div>
            )}

            {currentStep !== "imageUpload" && !showImageUpload && (
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
              </div>
            )}

            {currentStep === "imageUpload" && !showImageUpload && (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type 'yes' to upload photo or 'no' to skip..."
                  className="flex-1 px-3 py-2 bg-white border rounded-lg outline-none text-tprimary"
                  disabled={isLoading}
                />
                <button
                  onClick={debouncedHandleSendMessage}
                  disabled={!userInput.trim() || isLoading}
                  className="p-2 text-white transition duration-200 rounded-lg bg-tprimary hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <i className="text-white fa-sharp fa-solid fa-paper-plane-top"></i>
                </button>
              </div>
            )}
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
                  {message.isMarkdown ? (
                    <ReactMarkdown 
                      className="prose prose-sm max-w-none"
                      components={{
                        p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-tprimary">{children}</strong>,
                        ul: ({children}) => <ul className="ml-4 list-disc">{children}</ul>,
                        li: ({children}) => <li className="mb-1">{children}</li>
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  ) : (
                    message.content
                  )}
                  {message.isSuggestion && (
                    <div className="mt-1 text-xs text-gray-300">(Click to use)</div>
                  )}
                </div>
              </motion.div>
            ))}

            {focusAreas.length > 0 && currentStep === "imageUpload" && workoutSuggestions.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4"
              >
                <div className="p-4 border rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
                  <div className="flex items-center mb-4">
                    <div className="p-2 rounded-lg bg-indigo-500">
                      <i className="text-white fa-solid fa-target"></i>
                    </div>
                    <div className="ml-3">
                      <h4 className="font-bold text-tprimary">Choose Your Primary Focus</h4>
                      <p className="text-sm text-gray-600">Swipe horizontally to see all options</p>
                    </div>
                  </div>
                  
                  {/* Horizontal Scrollable Focus Areas */}
                  <div className="flex gap-4 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-indigo-300">
                    {focusAreas.map((focusArea, index) => (
                      <motion.div
                        key={focusArea.id}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="flex-none w-72"
                      >
                        <button
                          onClick={() => handleFocusAreaSelect(focusArea)}
                          className="w-full p-6 text-left transition duration-300 bg-white border-2 border-gray-200 rounded-xl hover:border-indigo-400 hover:shadow-lg group h-full"
                        >
                          <div className="flex flex-col h-full">
                            <div className="flex items-center mb-3">
                              <span className="text-3xl mr-3">{focusArea.icon}</span>
                              <h5 className="font-bold text-lg text-tprimary group-hover:text-indigo-600">
                                {focusArea.title}
                              </h5>
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-4 leading-relaxed flex-grow">
                              {focusArea.description}
                            </p>
                            
                            <div className="mt-auto">
                              <div className="flex items-center">
                                <i className="text-indigo-500 fa-solid fa-check-circle mr-2"></i>
                                <p className="text-xs text-indigo-700 font-medium">
                                  {focusArea.suitableFor}
                                </p>
                              </div>
                              
                              <div className="flex items-center justify-between mt-3">
                                <span className="text-xs text-gray-500">Click to select</span>
                                <i className="text-gray-400 transition-colors fa-solid fa-arrow-right group-hover:text-indigo-500"></i>
                              </div>
                            </div>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="flex justify-center mt-4 space-x-2">
                    {focusAreas.map((_, index) => (
                      <div key={index} className="w-2 h-2 bg-indigo-200 rounded-full"></div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-indigo-200">
                    <button
                      onClick={() => {
                        setFocusAreas([]);
                        setWorkoutSuggestions([]); // Clear any old suggestions
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
                      }}
                      className="w-full p-2 text-sm text-gray-600 transition duration-200 rounded-lg hover:bg-white hover:text-gray-800"
                    >
                      <i className="mr-2 fa-solid fa-forward"></i>
                      Skip Selection - Continue to Preferences
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
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