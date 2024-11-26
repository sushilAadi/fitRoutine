'use client'

import React, { useContext } from 'react';
import { motion } from 'framer-motion';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { GlobalContext } from '@/context/GloablContext';

// Helper functions
const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

const calculateCalories = (weight, height, age, gender, activityFactor) => {
  const bmr = gender === 'Male' 
    ? 88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age)
    : 447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age);
  return Math.round(bmr * activityFactor);
};

const Dashboard = () => {
  const { userDetailData } = useContext(GlobalContext);
  const {
    userName,
    userAge,
    userGender,
    userWeight,
    userHeight,
    helpYou,
    activityLevel,
  } = userDetailData;

  const bmi = calculateBMI(userWeight, userHeight);
  const maintenanceCalories = calculateCalories(userWeight, userHeight, userAge, userGender, activityLevel.factor);
  const weightGainCalories = maintenanceCalories + 500;
  const weightLossCalories = maintenanceCalories - 500;

  const weightData = [
    { name: 'Week 1', weight: userWeight },
    { name: 'Week 2', weight: userWeight - 0.5 },
    { name: 'Week 3', weight: userWeight - 0.8 },
    { name: 'Week 4', weight: userWeight - 1.2 },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <motion.div 
          className="space-y-1 "
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="flex items-center gap-2 text-sm text-indigo-600">
            <span className="text-lg">✧</span> {new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-3xl font-semibold">Hi, {userName}</h1>
        </motion.div>

        {/* Health Score */}
        <motion.div 
          className="p-6 bg-white border rounded-lg shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-20 h-20 text-3xl font-bold text-white bg-indigo-600 rounded-xl">
              {Math.round((parseFloat(bmi) / 30) * 100)}
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-medium">Health Score</h2>
              <p className="text-gray-600">
                Your BMI is {bmi}, which is considered {parseFloat(bmi) < 18.5 ? 'underweight' : parseFloat(bmi) < 25 ? 'normal' : parseFloat(bmi) < 30 ? 'overweight' : 'obese'}.
              </p>
              <button className="text-sm text-indigo-600 hover:underline">Read more</button>
            </div>
          </div>
        </motion.div>

        {/* Metrics */}
        <div>
          <h2 className="flex items-center justify-between mb-4 text-2xl font-medium">
            Metrics
            <button className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-ellipsis-h"></i>
            </button>
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {/* Weight Card */}
            <motion.div 
              className="p-4 text-white bg-indigo-600 rounded-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="space-y-3">
                <p className="text-sm opacity-90">WEIGHT</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-weight opacity-80"></i>
                  <span className="text-2xl font-semibold">{userWeight}</span>
                  <span className="text-sm opacity-90">kg</span>
                </div>
              </div>
            </motion.div>

            {/* Height Card */}
            <motion.div 
              className="p-4 text-white bg-purple-600 rounded-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="space-y-3">
                <p className="text-sm opacity-90">HEIGHT</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-ruler-vertical opacity-80"></i>
                  <span className="text-2xl font-semibold">{userHeight}</span>
                  <span className="text-sm opacity-90">cm</span>
                </div>
              </div>
            </motion.div>

            {/* BMI Card */}
            <motion.div 
              className="p-4 text-white bg-blue-600 rounded-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="space-y-3">
                <p className="text-sm opacity-90">BMI</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-calculator opacity-80"></i>
                  <span className="text-2xl font-semibold">{bmi}</span>
                </div>
              </div>
            </motion.div>

            {/* Activity Level Card */}
            <motion.div 
              className="p-4 text-white bg-green-600 rounded-lg"
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <div className="space-y-3">
                <p className="text-sm opacity-90">ACTIVITY LEVEL</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-running opacity-80"></i>
                  <span className="text-lg font-semibold">{activityLevel.id}</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Calorie Requirements */}
        <motion.div 
          className="p-6 bg-white border rounded-lg shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <h2 className="mb-4 text-2xl font-medium">Calorie Requirements</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-4 bg-green-100 rounded-lg">
              <h3 className="mb-2 font-medium">Maintenance</h3>
              <p className="text-2xl font-bold text-green-700">{maintenanceCalories} cal</p>
            </div>
            <div className="p-4 bg-blue-100 rounded-lg">
              <h3 className="mb-2 font-medium">Weight Gain</h3>
              <p className="text-2xl font-bold text-blue-700">{weightGainCalories} cal</p>
            </div>
            <div className="p-4 bg-red-100 rounded-lg">
              <h3 className="mb-2 font-medium">Weight Loss</h3>
              <p className="text-2xl font-bold text-red-700">{weightLossCalories} cal</p>
            </div>
          </div>
        </motion.div>

        {/* Weight Progress Chart */}
        <motion.div 
          className="p-6 bg-white border rounded-lg shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <h2 className="mb-4 text-2xl font-medium">Weight Progress</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weightData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Goals */}
        <motion.div 
          className="p-6 bg-white border rounded-lg shadow-sm"
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5, delay: 0.9 }}
        >
          <h2 className="mb-4 text-2xl font-medium">Your Goals</h2>
          <div className="space-y-2">
            {helpYou.split(', ').map((goal, index) => (
              <div key={index} className="flex items-center gap-2">
                <i className="text-green-500 fas fa-check-circle"></i>
                <span>{goal.replace('-', ' ')}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;

