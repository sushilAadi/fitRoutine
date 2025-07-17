"use client";

import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import toast from "react-hot-toast";

export default function TestStepCounter() {
  const [steps, setSteps] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = (delta) => {
    console.log('Button clicked with delta:', delta);
    setClickCount(prev => prev + 1);
    setSteps(prev => Math.max(0, prev + delta));
    
    toast.success(`Button clicked! Steps: ${steps + delta}, Click #${clickCount + 1}`, {
      duration: 1000,
      position: 'bottom-center'
    });
  };

  const resetAll = () => {
    setSteps(0);
    setClickCount(0);
    toast.success('Reset!');
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">Test Step Counter</h2>
      
      <div className="space-y-4">
        {/* Debug Info */}
        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Debug Info</h3>
          <p>Steps: {steps}</p>
          <p>Total Clicks: {clickCount}</p>
          <p>Time: {new Date().toLocaleTimeString()}</p>
        </div>

        {/* Big Number Display */}
        <div className="text-center">
          <div className="text-6xl font-bold text-blue-600 mb-4">
            {steps}
          </div>
          <p className="text-gray-600">Current Steps</p>
        </div>

        {/* Large Buttons */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => handleClick(-1)}
            className="bg-red-500 hover:bg-red-600 active:bg-red-700 text-white p-6 rounded-full text-2xl font-bold shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
            style={{ minWidth: '80px', minHeight: '80px' }}
          >
            <Minus className="w-8 h-8" />
          </button>
          
          <button
            onClick={() => handleClick(1)}
            className="bg-green-500 hover:bg-green-600 active:bg-green-700 text-white p-6 rounded-full text-2xl font-bold shadow-lg transition-all duration-200 transform hover:scale-110 active:scale-95"
            style={{ minWidth: '80px', minHeight: '80px' }}
          >
            <Plus className="w-8 h-8" />
          </button>
        </div>

        {/* Quick Buttons */}
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handleClick(-10)}
            className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-md"
          >
            -10
          </button>
          <button
            onClick={() => handleClick(-5)}
            className="bg-red-400 hover:bg-red-500 text-white px-4 py-2 rounded-md"
          >
            -5
          </button>
          <button
            onClick={() => handleClick(5)}
            className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-md"
          >
            +5
          </button>
          <button
            onClick={() => handleClick(10)}
            className="bg-green-400 hover:bg-green-500 text-white px-4 py-2 rounded-md"
          >
            +10
          </button>
        </div>

        {/* Giant Add Step Button */}
        <div className="text-center">
          <button
            onClick={() => handleClick(1)}
            className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white py-6 px-12 rounded-full text-xl font-bold shadow-lg transition-all duration-200 transform hover:scale-105 active:scale-95 w-full"
          >
            🚶 TAP TO ADD STEP
          </button>
        </div>

        {/* Reset Button */}
        <button
          onClick={resetAll}
          className="w-full bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
        >
          Reset All
        </button>

        {/* Instructions */}
        <div className="bg-yellow-50 rounded-lg p-3">
          <h4 className="font-semibold text-yellow-800 mb-2">Test Instructions:</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>1. Try clicking the big blue button</li>
            <li>2. Try the +/- circular buttons</li>
            <li>3. Try the small number buttons</li>
            <li>4. Watch for toast notifications</li>
            <li>5. Check console for logs</li>
          </ul>
        </div>
      </div>
    </div>
  );
}