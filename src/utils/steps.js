import { collection, addDoc, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/firebaseConfig";
import { calculateAge } from "@/utils";

export const addStepsData = async (userId, steps, goal = 10000) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stepsCollectionRef = collection(db, "steps");
    const stepsQuery = query(
      stepsCollectionRef, 
      where("userIdCl", "==", userId),
      where("date", "==", today)
    );
    
    const existingSteps = await getDocs(stepsQuery);
    
    if (existingSteps.empty) {
      await addDoc(stepsCollectionRef, {
        userIdCl: userId,
        steps: steps,
        goal: goal,
        date: today,
        created_at: new Date().toISOString(),
      });
    } else {
      const docRef = doc(db, "steps", existingSteps.docs[0].id);
      await updateDoc(docRef, {
        steps: steps,
        goal: goal,
        updated_at: new Date().toISOString(),
      });
    }
    
    return { success: true };
  } catch (error) {
    console.error("Error adding/updating steps data:", error);
    return { success: false, error };
  }
};

export const getTodaysSteps = async (userId) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const stepsCollectionRef = collection(db, "steps");
    const stepsQuery = query(
      stepsCollectionRef, 
      where("userIdCl", "==", userId),
      where("date", "==", today)
    );
    
    const stepsSnapshot = await getDocs(stepsQuery);
    
    if (!stepsSnapshot.empty) {
      return stepsSnapshot.docs[0].data();
    }
    
    return null;
  } catch (error) {
    console.error("Error fetching today's steps:", error);
    return null;
  }
};

export const calculatePersonalizedStepGoal = (userDetailData, latestWeight) => {
  if (!userDetailData || !latestWeight) {
    return 10000; // Default goal
  }

  const {
    userBirthDate,
    userGender,
    userHeight,
    helpYou,
    activityLevel
  } = userDetailData;

  const age = calculateAge(userBirthDate);
  const weight = latestWeight.userWeights;
  const height = userHeight;
  const gender = userGender;
  const goal = helpYou;
  const activity = activityLevel;

  // Base steps calculation
  let baseSteps = 8000;

  // Age factor (younger people need more steps)
  if (age < 30) {
    baseSteps += 2000;
  } else if (age < 50) {
    baseSteps += 1500;
  } else if (age < 65) {
    baseSteps += 1000;
  } else {
    baseSteps += 500;
  }

  // Gender factor (men generally need slightly more steps)
  if (gender === "Male") {
    baseSteps += 500;
  }

  // BMI factor
  const bmi = weight / ((height / 100) ** 2);
  if (bmi > 30) {
    baseSteps += 2000; // Obesity - need more steps
  } else if (bmi > 25) {
    baseSteps += 1500; // Overweight
  } else if (bmi < 18.5) {
    baseSteps += 1000; // Underweight
  }

  // Activity level factor
  if (activity) {
    switch (activity.level) {
      case "Sedentary":
        baseSteps += 2000;
        break;
      case "Lightly Active":
        baseSteps += 1500;
        break;
      case "Moderately Active":
        baseSteps += 1000;
        break;
      case "Very Active":
        baseSteps += 500;
        break;
      case "Super Active":
        baseSteps += 0;
        break;
      default:
        baseSteps += 1000;
    }
  }

  // Goal factor
  if (goal) {
    switch (goal.toLowerCase()) {
      case "lose weight":
        baseSteps += 3000;
        break;
      case "gain weight":
        baseSteps += 1000;
        break;
      case "maintain weight":
        baseSteps += 1500;
        break;
      case "build muscle":
        baseSteps += 2000;
        break;
      case "improve fitness":
        baseSteps += 2500;
        break;
      default:
        baseSteps += 1500;
    }
  }

  // Ensure minimum of 6000 and maximum of 20000 steps
  return Math.max(6000, Math.min(20000, baseSteps));
};

export const getStepGoalRecommendation = (personalizedGoal) => {
  const recommendations = {
    6000: "Perfect for beginners and seniors",
    8000: "Good baseline for sedentary individuals",
    10000: "Standard health recommendation",
    12000: "Great for weight maintenance",
    15000: "Excellent for weight loss",
    18000: "High activity level goal",
    20000: "Elite fitness level"
  };

  const closest = Object.keys(recommendations).reduce((prev, curr) => 
    Math.abs(curr - personalizedGoal) < Math.abs(prev - personalizedGoal) ? curr : prev
  );

  return recommendations[closest];
};