"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { Play, Pause, RotateCcw, AlertCircle, CheckCircle, Wifi } from "lucide-react";
import { GlobalContext } from "@/context/GloablContext";
import { addStepsData, calculatePersonalizedStepGoal, getStepGoalRecommendation } from "@/utils/steps";
import toast from "react-hot-toast";

export default function AutoStepDetector() {
  const { userId, userDetailData, latestWeight, latestSteps, userStepsRefetch } = useContext(GlobalContext);
  
  const [isTracking, setIsTracking] = useState(false);
  const [steps, setSteps] = useState(latestSteps?.steps || 0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [personalizedGoal, setPersonalizedGoal] = useState(10000);
  const [debugInfo, setDebugInfo] = useState({
    isHttps: false,
    hasDeviceMotion: false,
    hasAcceleration: false,
    lastMotionTime: null,
    motionCount: 0,
    currentMagnitude: 0,
    threshold: 0
  });
  
  const stepCountRef = useRef(0);
  const lastAcceleration = useRef({ x: 0, y: 0, z: 0 });
  const stepBuffer = useRef([]);
  const lastStepTime = useRef(0);
  const motionEventRef = useRef(null);
  const debugRef = useRef(debugInfo);

  // Calculate personalized goal
  useEffect(() => {
    if (userDetailData && latestWeight) {
      const goal = calculatePersonalizedStepGoal(userDetailData, latestWeight);
      setPersonalizedGoal(goal);
    }
  }, [userDetailData, latestWeight]);

  // Check device motion support and environment
  useEffect(() => {
    const checkSupport = () => {
      const newDebugInfo = {
        isHttps: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
        hasDeviceMotion: typeof DeviceMotionEvent !== 'undefined',
        hasAcceleration: false,
        lastMotionTime: null,
        motionCount: 0,
        currentMagnitude: 0,
        threshold: 1.2
      };

      setDebugInfo(newDebugInfo);
      debugRef.current = newDebugInfo;

      if (newDebugInfo.hasDeviceMotion && newDebugInfo.isHttps) {
        setIsSupported(true);
        
        // Check if permission is needed (iOS 13+)
        if (typeof DeviceMotionEvent.requestPermission === 'function') {
          setPermissionGranted(false);
        } else {
          setPermissionGranted(true);
        }
      } else {
        setIsSupported(false);
      }
    };

    checkSupport();
  }, []);

  // Request permission for iOS devices
  const requestPermission = async () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          toast.success("Motion permission granted!");
        } else {
          toast.error("Motion permission denied");
        }
      } catch (error) {
        console.error('Error requesting permission:', error);
        toast.error("Error requesting permission");
      }
    }
  };

  // Improved step detection algorithm
  const detectStep = (acceleration) => {
    const { x, y, z } = acceleration;
    
    // Calculate magnitude of acceleration
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Update debug info
    const newDebugInfo = {
      ...debugRef.current,
      hasAcceleration: magnitude > 0,
      lastMotionTime: new Date().toLocaleTimeString(),
      motionCount: debugRef.current.motionCount + 1,
      currentMagnitude: magnitude.toFixed(2)
    };
    debugRef.current = newDebugInfo;
    setDebugInfo(newDebugInfo);
    
    // Add to buffer
    stepBuffer.current.push(magnitude);
    
    // Keep only last 20 readings for better pattern detection
    if (stepBuffer.current.length > 20) {
      stepBuffer.current.shift();
    }
    
    // Need at least 10 readings to detect patterns
    if (stepBuffer.current.length < 10) return;
    
    // Calculate moving average
    const average = stepBuffer.current.reduce((sum, val) => sum + val, 0) / stepBuffer.current.length;
    
    // Dynamic threshold based on user activity
    const baseThreshold = 1.2;
    const dynamicThreshold = Math.max(0.8, average * 0.3);
    const threshold = Math.max(baseThreshold, dynamicThreshold);
    
    // Update threshold in debug info
    debugRef.current.threshold = threshold.toFixed(2);
    
    // Step detection parameters
    const minStepInterval = 200; // Minimum 200ms between steps (faster detection)
    const maxStepInterval = 2000; // Maximum 2s between steps
    
    const currentTime = Date.now();
    const timeSinceLastStep = currentTime - lastStepTime.current;
    
    // Check if current magnitude is significantly above average
    if (magnitude > average + threshold && timeSinceLastStep > minStepInterval) {
      // More sophisticated step pattern detection
      const recent = stepBuffer.current.slice(-5);
      const isValidStep = recent[4] > recent[3] && recent[4] > recent[2] && recent[4] > recent[1];
      
      // Additional validation: check for reasonable step frequency
      const stepFrequencyValid = timeSinceLastStep < maxStepInterval;
      
      if (isValidStep && stepFrequencyValid) {
        stepCountRef.current++;
        setSteps(stepCountRef.current);
        lastStepTime.current = currentTime;
        
        // Visual feedback for step detection
        toast.success(`Step detected! Total: ${stepCountRef.current}`, {
          duration: 1000,
          position: 'bottom-center'
        });
      }
    }
    
    lastAcceleration.current = { x, y, z };
  };

  // Handle device motion events
  const handleDeviceMotion = (event) => {
    if (!event.acceleration) return;
    
    const acceleration = {
      x: event.acceleration.x || 0,
      y: event.acceleration.y || 0,
      z: event.acceleration.z || 0
    };
    
    detectStep(acceleration);
  };

  // Start/stop tracking
  const toggleTracking = () => {
    if (!isSupported) {
      toast.error("Device motion not supported");
      return;
    }
    
    if (!permissionGranted) {
      toast.error("Permission not granted");
      return;
    }
    
    if (isTracking) {
      // Stop tracking
      if (motionEventRef.current) {
        window.removeEventListener('devicemotion', motionEventRef.current);
        motionEventRef.current = null;
      }
      setIsTracking(false);
      saveSteps();
      toast.success("Step tracking stopped");
    } else {
      // Start tracking
      stepCountRef.current = latestSteps?.steps || 0;
      setSteps(stepCountRef.current);
      
      motionEventRef.current = handleDeviceMotion;
      window.addEventListener('devicemotion', motionEventRef.current);
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
      if (motionEventRef.current) {
        window.removeEventListener('devicemotion', motionEventRef.current);
      }
    };
  }, []);

  const progress = Math.min((steps / personalizedGoal) * 100, 100);
  const recommendation = getStepGoalRecommendation(personalizedGoal);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Auto Step Detector</h2>
      
      {/* System Status */}
      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-sm mb-2">System Status</h3>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span>HTTPS:</span>
            <span className={debugInfo.isHttps ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.isHttps ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Device Motion:</span>
            <span className={debugInfo.hasDeviceMotion ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.hasDeviceMotion ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Acceleration:</span>
            <span className={debugInfo.hasAcceleration ? 'text-green-600' : 'text-red-600'}>
              {debugInfo.hasAcceleration ? '✓' : '✗'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Motion Count:</span>
            <span className="text-blue-600">{debugInfo.motionCount}</span>
          </div>
          <div className="flex justify-between">
            <span>Current Magnitude:</span>
            <span className="text-purple-600">{debugInfo.currentMagnitude}</span>
          </div>
          <div className="flex justify-between">
            <span>Threshold:</span>
            <span className="text-orange-600">{debugInfo.threshold}</span>
          </div>
          {debugInfo.lastMotionTime && (
            <div className="flex justify-between">
              <span>Last Motion:</span>
              <span className="text-gray-600">{debugInfo.lastMotionTime}</span>
            </div>
          )}
        </div>
      </div>
      
      {!isSupported ? (
        <div className="text-center py-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-2" />
          <p className="text-red-500 mb-2">Device motion not supported</p>
          <p className="text-sm text-gray-600">
            {!debugInfo.isHttps ? 'Requires HTTPS connection' : 'Browser not supported'}
          </p>
          <p className="text-sm text-gray-600 mt-2">Use the manual step counter instead</p>
        </div>
      ) : (
        <>
          {!permissionGranted && (
            <div className="text-center mb-4">
              <AlertCircle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
              <p className="text-amber-600 mb-2">Motion permission required</p>
              <button
                onClick={requestPermission}
                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md"
              >
                Grant Permission
              </button>
            </div>
          )}
          
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

            {/* Controls */}
            <div className="flex space-x-2">
              <button
                onClick={toggleTracking}
                disabled={!permissionGranted}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md ${
                  isTracking 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}
              >
                {isTracking ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isTracking ? 'Stop' : 'Start'}</span>
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
                <span className="text-green-600">🟢 Tracking active</span>
              ) : (
                <span className="text-gray-500">⚪ Tracking stopped</span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}