"use client";

import { useState, useContext, useEffect } from "react";
import { Plus, Minus, Save } from "lucide-react";
import { GlobalContext } from "@/context/GloablContext";
import { addStepsData, calculatePersonalizedStepGoal, getStepGoalRecommendation } from "@/utils/steps";
import toast from "react-hot-toast";

export default function StepCounter() {
  const { userId, latestSteps, userStepsRefetch, userDetailData, latestWeight } = useContext(GlobalContext);
  const [steps, setSteps] = useState(latestSteps?.steps || 0);
  const [goal, setGoal] = useState(latestSteps?.goal || 10000);
  const [personalizedGoal, setPersonalizedGoal] = useState(10000);
  const [isLoading, setIsLoading] = useState(false);
  const [lastClick, setLastClick] = useState(null);

  // Calculate personalized goal
  useEffect(() => {
    if (userDetailData && latestWeight) {
      const pGoal = calculatePersonalizedStepGoal(userDetailData, latestWeight);
      setPersonalizedGoal(pGoal);
      if (!latestSteps?.goal) {
        setGoal(pGoal);
      }
    }
  }, [userDetailData, latestWeight, latestSteps]);

  const handleStepChange = (delta) => {
    console.log('Button clicked with delta:', delta);
    const newSteps = Math.max(0, steps + delta);
    setSteps(newSteps);
    setLastClick(new Date().toLocaleTimeString());
    
    // Immediate feedback
    toast.success(`Steps ${delta > 0 ? 'increased' : 'decreased'} by ${Math.abs(delta)}! Total: ${newSteps}`, {
      duration: 1000,
      position: 'bottom-center'
    });
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const result = await addStepsData(userId, steps, goal);
      if (result.success) {
        await userStepsRefetch();
        toast.success("Steps updated successfully!");
      } else {
        toast.error("Failed to update steps");
      }
    } catch (error) {
      toast.error("An error occurred while updating steps");
    } finally {
      setIsLoading(false);
    }
  };

  const recommendation = getStepGoalRecommendation(personalizedGoal);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Step Counter</h2>
      
      <div className="space-y-4">
        {/* Debug Info */}
        <div className="bg-gray-50 rounded-lg p-3 text-sm">
          <h3 className="font-semibold text-gray-800 mb-2">Debug Info</h3>
          <p>Current Steps: {steps}</p>
          <p>Goal: {goal}</p>
          <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
          <p>Last Click: {lastClick || 'None'}</p>
          <p>User ID: {userId ? 'Available' : 'Missing'}</p>
        </div>
        
        {/* Personalized Goal Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Your Personalized Goal</h3>
          <p className="text-xl font-bold text-blue-600">{personalizedGoal.toLocaleString()} steps</p>
          <p className="text-sm text-blue-600">{recommendation}</p>
        </div>
        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Current Steps
          </label>
          <div className="flex items-center justify-center space-x-4 mb-4">
            <button
              onClick={() => handleStepChange(-100)}
              className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              disabled={isLoading}
            >
              <Minus className="w-6 h-6" />
            </button>
            <span className="text-4xl font-bold text-blue-600 min-w-[140px]">
              {steps.toLocaleString()}
            </span>
            <button
              onClick={() => handleStepChange(100)}
              className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              disabled={isLoading}
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>
          
          {/* Quick increment buttons */}
          <div className="flex justify-center space-x-2">
            <button
              onClick={() => handleStepChange(-10)}
              className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              -10
            </button>
            <button
              onClick={() => handleStepChange(-1)}
              className="bg-red-400 hover:bg-red-500 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              -1
            </button>
            <button
              onClick={() => handleStepChange(1)}
              className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              +1
            </button>
            <button
              onClick={() => handleStepChange(10)}
              className="bg-green-400 hover:bg-green-500 text-white px-3 py-1 rounded-md text-sm"
              disabled={isLoading}
            >
              +10
            </button>
          </div>
        </div>

        <div className="text-center">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Daily Goal
          </label>
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            className="w-32 p-2 border border-gray-300 rounded-md text-center"
            min="0"
            disabled={isLoading}
          />
        </div>

        <div className="text-center">
          <div className="text-sm text-gray-600 mb-2">
            Progress: {Math.round((steps / goal) * 100)}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((steps / goal) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Big Add Step Button */}
        <div className="text-center">
          <button
            onClick={() => handleStepChange(1)}
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-4 px-8 rounded-full text-lg font-semibold shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 mb-4"
            disabled={isLoading}
          >
            🚶 Add One Step
          </button>
          <p className="text-sm text-gray-600">Tap here each time you take a step</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isLoading ? "Saving..." : "Save Steps"}</span>
        </button>
      </div>
    </div>
  );
}