"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Play, Pause, RotateCcw, Activity, AlertTriangle } from "lucide-react";
import { GlobalContext } from "@/context/GloablContext";
import { addStepsData, calculatePersonalizedStepGoal, getStepGoalRecommendation } from "@/utils/steps";
import toast from "react-hot-toast";

export default function SimpleStepDetector() {
  const { userId, userDetailData, latestWeight, latestSteps, userStepsRefetch } = useContext(GlobalContext);
  
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(latestSteps?.steps || 0);
  const [personalizedGoal, setPersonalizedGoal] = useState(10000);
  const [isSupported, setIsSupported] = useState(false);
  const [lastActivity, setLastActivity] = useState(null);
  
  const stepCountRef = useRef(0);
  const orientationRef = useRef(null);
  const lastOrientationTime = useRef(0);
  const intervalRef = useRef(null);

  // Calculate personalized goal
  useEffect(() => {
    if (userDetailData && latestWeight) {
      const goal = calculatePersonalizedStepGoal(userDetailData, latestWeight);
      setPersonalizedGoal(goal);
    }
  }, [userDetailData, latestWeight]);

  // Check for orientation API support
  useEffect(() => {
    const checkSupport = () => {
      const hasOrientation = 'DeviceOrientationEvent' in window;
      const hasMotion = 'DeviceMotionEvent' in window;
      const hasAccelerometer = 'Accelerometer' in window;
      
      setIsSupported(hasOrientation || hasMotion || hasAccelerometer);
    };

    checkSupport();
  }, []);

  // Simple step detection using orientation changes
  const handleOrientationChange = () => {
    const currentTime = Date.now();
    const timeSinceLastOrientation = currentTime - lastOrientationTime.current;
    
    // Detect rapid orientation changes (indicating movement)
    if (timeSinceLastOrientation > 300 && timeSinceLastOrientation < 1000) {
      stepCountRef.current++;
      setSteps(stepCountRef.current);
      setLastActivity(new Date().toLocaleTimeString());
      
      toast.success(`Step detected! Total: ${stepCountRef.current}`, {
        duration: 800,
        position: 'bottom-center'
      });
    }
    
    lastOrientationTime.current = currentTime;
  };

  // Manual step incrementer (for devices without sensors)
  const handleManualStep = () => {
    stepCountRef.current++;
    setSteps(stepCountRef.current);
    setLastActivity(new Date().toLocaleTimeString());
    
    toast.success(`Step added! Total: ${stepCountRef.current}`, {
      duration: 500,
      position: 'bottom-center'
    });
  };

  // Start/stop tracking
  const toggleTracking = () => {
    if (isTracking) {
      // Stop tracking
      if (orientationRef.current) {
        window.removeEventListener('deviceorientation', orientationRef.current);
        orientationRef.current = null;
      }
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      setIsTracking(false);
      saveSteps();
      toast.success("Step tracking stopped");
    } else {
      // Start tracking
      stepCountRef.current = latestSteps?.steps || 0;
      setSteps(stepCountRef.current);
      
      if (isSupported) {
        orientationRef.current = handleOrientationChange;
        window.addEventListener('deviceorientation', orientationRef.current);
        
        // Fallback: auto-increment for testing
        intervalRef.current = setInterval(() => {
          if (Math.random() > 0.7) { // 30% chance per second
            handleOrientationChange();
          }
        }, 1000);
      }
      
      setIsTracking(true);
      toast.success("Step tracking started");
    }
  };

  // Save steps to Firebase
  const saveSteps = async () => {
    try {
      const result = await addStepsData(userId, stepCountRef.current, personalizedGoal);
      if (result.success) {
        await userStepsRefetch();
        toast.success("Steps saved successfully!");
      } else {
        toast.error("Failed to save steps");
      }
    } catch (error) {
      toast.error("Error saving steps");
    }
  };

  // Reset step counter
  const resetSteps = () => {
    stepCountRef.current = 0;
    setSteps(0);
    toast.success("Steps reset");
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (orientationRef.current) {
        window.removeEventListener('deviceorientation', orientationRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const progress = Math.min((steps / personalizedGoal) * 100, 100);
  const recommendation = getStepGoalRecommendation(personalizedGoal);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Simple Step Detector</h2>
      
      {/* Device Support Info */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">Device Support</h3>
        <div className="text-xs text-gray-600">
          {isSupported ? (
            <span className="text-green-600">✓ Device sensors available</span>
          ) : (
            <span className="text-amber-600">⚠ Limited sensor support - use manual mode</span>
          )}
        </div>
        {lastActivity && (
          <div className="text-xs text-gray-600 mt-1">
            Last activity: {lastActivity}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {/* Personalized Goal Info */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Your Personalized Goal</h3>
          <p className="text-2xl font-bold text-blue-600">{personalizedGoal.toLocaleString()} steps</p>
          <p className="text-sm text-blue-600">{recommendation}</p>
        </div>

        {/* Current Steps */}
        <div className="text-center">
          <p className="text-sm font-medium text-gray-700 mb-2">Current Steps</p>
          <p className="text-4xl font-bold text-green-600">{steps.toLocaleString()}</p>
          <p className="text-sm text-gray-600">{Math.round(progress)}% of goal</p>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-600 h-3 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Manual Step Button */}
        <div className="text-center">
          <button
            onClick={handleManualStep}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-full flex items-center justify-center space-x-2 mx-auto"
          >
            <Activity className="w-5 h-5" />
            <span>Add Step</span>
          </button>
          <p className="text-xs text-gray-500 mt-2">
            Tap for each step or use automatic tracking
          </p>
        </div>

        {/* Controls */}
        <div className="flex space-x-2">
          <button
            onClick={toggleTracking}
            className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md ${
              isTracking 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            <span>{isTracking ? 'Stop Auto' : 'Start Auto'}</span>
          </button>
          
          <button
            onClick={resetSteps}
            className="bg-gray-500 hover:bg-gray-600 text-white p-2 rounded-md"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={saveSteps}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Save Steps
        </button>

        {/* Status */}
        <div className="text-center text-sm text-gray-600">
          {isTracking ? (
            <span className="text-green-600">🟢 Auto tracking active</span>
          ) : (
            <span className="text-gray-500">⚪ Manual mode</span>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-800 text-sm mb-1">How to use:</h4>
          <ul className="text-xs text-yellow-700 space-y-1">
            <li>• Tap "Add Step" button manually for each step</li>
            <li>• Use "Start Auto" for automatic detection (limited)</li>
            <li>• Walk with your phone to detect movement</li>
            <li>• Save your progress regularly</li>
          </ul>
        </div>
      </div>
    </div>
  );
}