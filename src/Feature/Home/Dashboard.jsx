"use client";

import { motion } from "framer-motion";
import {  useContext } from "react";
import {
  Flame,
  Clock,
  Footprints,
  Scale,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import { GlobalContext } from "@/context/GloablContext";

import BMICard from "./BMICard";
import { calculateAge, calculateBMI } from "@/utils";
import { calculatePersonalizedStepGoal } from "@/utils/steps";
import Link from "next/link";

// Helper functions


const calculateCalories = (weight, height, age, gender, activityFactor) => {
  const bmr =
    gender === "Male"
      ? 88.362 + 13.397 * weight + 4.799 * height - 5.677 * age
      : 447.593 + 9.247 * weight + 3.098 * height - 4.33 * age;
  return Math.round(bmr * activityFactor);
};


export default function FitnessTrackerDashboard() {
  const { userDetailData, handleOpenClose, latestWeight, latestSteps } = useContext(GlobalContext);


  if (!userDetailData) {
    return <div>Loading...</div>;
  }

  const {
    userName,
    userBirthDate,
    userGender,
    userHeight,
    helpYou,
    activityLevel,
  } = userDetailData;

  
  const userAgeCal = calculateAge(userBirthDate);
  

  const bmi = calculateBMI(latestWeight?.userWeights, userHeight);
  const maintenanceCalories = calculateCalories(
    latestWeight?.userWeights,
    userHeight,
    userAgeCal,
    userGender,
    activityLevel.factor
  );
  
  const currentSteps = latestSteps?.steps || 0;
  const personalizedStepGoal = calculatePersonalizedStepGoal(userDetailData, latestWeight);
  const stepsGoal = latestSteps?.goal || personalizedStepGoal;
  

  const goals = [
    {
      name: "Calories",
      value: `${maintenanceCalories} kcal/day`,
      trend: "up",
      color: "bg-[#FFD7CC]",
      textColor: "text-[#FF6B6B]",
      requirement: `Maintain at ${maintenanceCalories} kcal/day`,
      progress: 0,
    },
    {
      name: "Active time",
      value: "30 min/day",
      trend: "up",
      color: "bg-[#E8FFCC]",
      textColor: "text-[#7AB55C]",
      requirement: "Target: 30 min/day",
      progress: 0,
    },
    {
      name: "Steps",
      value: `${currentSteps.toLocaleString()} / ${stepsGoal.toLocaleString()}`,
      trend: currentSteps >= stepsGoal ? "up" : "down",
      color: "bg-[#CCF6FF]",
      textColor: "text-[#5CB5C2]",
      requirement: `Goal: ${stepsGoal.toLocaleString()} steps/day`,
      progress: Math.min((currentSteps / stepsGoal) * 100, 100),
    },
    {
      name: "Weight",
      value: `${latestWeight?.userWeights} kg`,
      trend: "down",
      color: "bg-[#F2CCFF]",
      textColor: "text-[#B55CC2]",
      requirement: `Current: ${latestWeight?.userWeights} kg`,
      progress: 0,
    },
  ];

 

  return (
    <>
      <div className="flex flex-col items-center h-screen overflow-hidden">
        
        <div className="mb-2 overflow-auto overflow-y-auto no-scrollbar h-100 innerContainer">
        <div className="sticky top-0 z-40 w-full bg-tprimary stickyCard">
        
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="px-4 pt-3 pb-4 text-white bg-tprimary"
          >
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold">
                  Hi, {userName.split(" ")[0]} 
                </h1>
                <p className="text-sm text-gray-500">
                  Just a little more to reach today's goals
                </p>
              </div>
              <motion.img
                whileHover={{ scale: 1.1 }}
                src="https://www.aiscribbles.com/img/variant/large-preview/43289/?v=cbd7a5"
                alt="Profile"
                className="object-cover w-10 h-10 border-2 border-gray-100 rounded-full"
                onClick={handleOpenClose}
              />
            </div>
          </motion.div>
          <div className="px-4 text-white bg-red-500 ">
          <span>Check your Health Report . </span>
          <Link href="/healthReport" className="font-semibold text-black no-underline text-inherit"> &nbsp;Click here</Link>
        </div>
        </div>
        
        <BMICard bmi={bmi}/>
          <div className="z-10 px-4 py-6 ">
            {/* Goals Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Today's goals</h2>
                <button className="flex items-center text-sm text-gray-500">
                  Edit goals <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
                {goals.map((goal, index) => (
                  <motion.div
                    key={goal.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`${goal.color} rounded-lg p-4 relative overflow-hidden flex flex-col justify-between`}
                    style={{ minHeight: "180px" }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      {goal.name === "Calories" && (
                        <Flame className={`w-5 h-5 ${goal.textColor}`} />
                      )}
                      {goal.name === "Active time" && (
                        <Clock className={`w-5 h-5 ${goal.textColor}`} />
                      )}
                      {goal.name === "Steps" && (
                        <Footprints className={`w-5 h-5 ${goal.textColor}`} />
                      )}
                      {goal.name === "Weight" && (
                        <Scale className={`w-5 h-5 ${goal.textColor}`} />
                      )}
                    </div>
                    <div className="flex flex-col justify-between flex-grow">
                      <div className="mb-3">
                        <p className="text-sm font-medium">{goal.name}</p>
                        <p className="text-xs text-gray-500">
                          {goal.requirement}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          <span
                            className={`${goal.textColor} text-sm font-bold`}
                          >
                            {goal.value}
                          </span>
                          {goal.trend === "up" ? (
                            <ChevronUp
                              className={`${goal.textColor} w-5 h-5`}
                            />
                          ) : (
                            <ChevronDown
                              className={`${goal.textColor} w-5 h-5`}
                            />
                          )}
                        </div>
                        <div className="w-full h-1 rounded-full bg-tprimary">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${goal.progress || 0}%` }}
                            transition={{ duration: 1, delay: index * 0.2 }}
                            className={`h-full rounded-full ${goal.textColor.replace(
                              "text",
                              "bg"
                            )}`}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            
          </div>
          
        </div>
        
      </div>
    </>
  );
}
