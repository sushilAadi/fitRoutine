"use client";

import { useState, useContext } from "react";
import { Smartphone, Edit, Activity, TestTube } from "lucide-react";
import { GlobalContext } from "@/context/GloablContext";
import AutoStepDetector from "./AutoStepDetector";
import SimpleStepDetector from "./SimpleStepDetector";
import StepCounter from "./StepCounter";
import TestStepCounter from "./TestStepCounter";

export default function StepTracker() {
  const [activeTab, setActiveTab] = useState("test");
  const { userDetailData, latestWeight } = useContext(GlobalContext);

  return (
    <div className="max-w-md mx-auto">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
        <button
          onClick={() => setActiveTab("test")}
          className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 rounded-md transition-colors text-xs ${
            activeTab === "test"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>Test</span>
        </button>
        <button
          onClick={() => setActiveTab("simple")}
          className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 rounded-md transition-colors text-xs ${
            activeTab === "simple"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Simple</span>
        </button>
        <button
          onClick={() => setActiveTab("auto")}
          className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 rounded-md transition-colors text-xs ${
            activeTab === "auto"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Advanced</span>
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`flex-1 flex items-center justify-center space-x-1 py-2 px-1 rounded-md transition-colors text-xs ${
            activeTab === "manual"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-blue-600"
          }`}
        >
          <Edit className="w-4 h-4" />
          <span>Manual</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === "test" ? (
          <TestStepCounter />
        ) : activeTab === "simple" ? (
          <SimpleStepDetector />
        ) : activeTab === "auto" ? (
          <AutoStepDetector />
        ) : (
          <StepCounter />
        )}
      </div>

      {/* Info Section */}
      <div className="mt-6 bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-2">Step Goal Calculation</h3>
        <p className="text-sm text-gray-600 mb-2">
          Your personalized step goal is calculated based on:
        </p>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Age and gender</li>
          <li>• Height and weight (BMI)</li>
          <li>• Activity level</li>
          <li>• Fitness goals</li>
        </ul>
        {userDetailData && latestWeight && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Age:</span>
                <span className="ml-1 font-medium">{userDetailData.userBirthDate ? new Date().getFullYear() - new Date(userDetailData.userBirthDate).getFullYear() : 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Gender:</span>
                <span className="ml-1 font-medium">{userDetailData.userGender || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Weight:</span>
                <span className="ml-1 font-medium">{latestWeight.userWeights || 'N/A'} kg</span>
              </div>
              <div>
                <span className="text-gray-500">Height:</span>
                <span className="ml-1 font-medium">{userDetailData.userHeight || 'N/A'} cm</span>
              </div>
              <div>
                <span className="text-gray-500">Activity:</span>
                <span className="ml-1 font-medium">{userDetailData.activityLevel?.level || 'N/A'}</span>
              </div>
              <div>
                <span className="text-gray-500">Goal:</span>
                <span className="ml-1 font-medium">{userDetailData.helpYou || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}