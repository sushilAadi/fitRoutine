"use client";

import React, {useContext,} from "react";
import { motion } from "framer-motion";

import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { calculateAge, calculateBMI } from "@/utils";

import HealthMetricsRange from "@/components/Card/HealthMetricsRange";




const healthReport = () => {
  const { userDetailData,handleOpenClose,latestWeight,latestHeight } = useContext(GlobalContext);

  if (!userDetailData) {
    return (
      <SecureComponent>
        <div className="p-4 text-center">Loading user data...</div>
      </SecureComponent>
    );
  }

  const {
    userName = '',
    userBirthDate,
    userGender,
    userHeight,
    helpYou,
    activityLevel,
  } = userDetailData;

  

  // Use latest metrics when available, fallback to user details
  const currentWeight = latestWeight?.userWeights;
  const currentHeight = latestHeight || userHeight;

  const missingFields = [];
  if (!currentWeight) missingFields.push('Weight data');
  if (!currentHeight) missingFields.push('Height');
  if (!userBirthDate) missingFields.push('Birth date');
  if (!userGender) missingFields.push('Gender');

  if (missingFields.length > 0) {
    return (
      <SecureComponent>
        <div className="flex flex-col h-screen overflow-hidden">
          <div className="top-0 p-3 bg-tprimary sticky-top stickyCard">
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="pt-3 pb-4 text-white bg-tprimary "
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  
                  <div>
                    <h1 className="text-2xl font-semibold">
                      Hi, {userName?.split(" ")[0]}
                    </h1>
                    <p className="text-sm text-gray-500">
                      Your Health Report
                    </p>
                  </div>
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
          </div>
          <div className="p-3 mb-2 overflow-auto overflow-x-hidden overflow-y-auto exerciseCard no-scrollbar">
            <div className="p-4 text-red-700 bg-red-100 rounded">
              <p className="font-medium">Missing required health data:</p>
              <ul className="mt-2 ml-4 list-disc">
                {missingFields.map((field, index) => (
                  <li key={index}>{field}</li>
                ))}
              </ul>
              <p className="mt-3 text-sm">Please complete your profile to view your health report.</p>
            </div>
          </div>
        </div>
      </SecureComponent>
    );
  }

  const userAgeCal = calculateAge(userBirthDate);
  const heightInMeters = currentHeight / 100;
  const weightInKg = Number(currentWeight);
  

  const safeCalculate = (calculation, fallback = 0) => {
    try {
      const result = calculation();
      return isNaN(result) || !isFinite(result) ? fallback : result;
    } catch (error) {
      console.error('Calculation error:', error);
      return fallback;
    }
  };

  const bmi = safeCalculate(() => Number(calculateBMI(weightInKg, currentHeight)));

  const bmr = safeCalculate(() => {
    if (userGender.toLowerCase() === "male") {
      return (10 * weightInKg) + (6.25 * currentHeight) - (5 * userAgeCal) + 5;
    } else {
      return (10 * weightInKg) + (6.25 * currentHeight) - (5 * userAgeCal) - 161;
    }
  });

  const bodyFat = safeCalculate(() => {
    if (userGender.toLowerCase() === "male") {
      return (1.20 * bmi) + (0.23 * userAgeCal) - 16.2;
    } else {
      return (1.20 * bmi) + (0.23 * userAgeCal) - 5.4;
    }
  });

  const leanBodyMass = safeCalculate(() => weightInKg * (1 - (bodyFat / 100)));
  const muscleMass = safeCalculate(() => leanBodyMass * 0.5);
  const bodyMoistureRate = safeCalculate(() => 60 + (0.1 * (100 - bodyFat)));
  const visceralFat = safeCalculate(() => (bmi - 15) * 0.5);
  const boneMass = safeCalculate(() => leanBodyMass * 0.15);
  const protein = safeCalculate(() => weightInKg * 1.6);
  const subcutaneousFat = safeCalculate(() => bodyFat * 0.8);
  const standardWeight = safeCalculate(() => 22 * (heightInMeters * heightInMeters));

  const metrics = [
    {
      label: "BMI (Body Mass Index)",
      value: bmi,
      segments: [
        { start: 0, end: 18.5, color: 'bg-blue-300' },
        { start: 18.5, end: 25, color: 'bg-green-300' },
        { start: 25, end: 30, color: 'bg-yellow-300' },
        { start: 30, end: 40, color: 'bg-red-300' }
      ],
      ranges: [
        "Low: < 18.5 - Underweight",
        "Optimal: 18.5-24.9 - Healthy",
        "High: 25-29.9 - Overweight",
        "Very High: ≥ 30 - Obese"
      ],
      maxValue: 40,
      description: "BMI is a measure of body fat based on height and weight.",
      recommendations: "Maintain a balanced diet and regular exercise routine."
    },
    {
      label: "BMR (Basal Metabolic Rate)",
      value: bmr,
      unit: 'kcal',
      segments: [
        { start: 1200, end: 1500, color: 'bg-blue-300' },
        { start: 1500, end: 2000, color: 'bg-green-300' },
        { start: 2000, end: 2500, color: 'bg-yellow-300' }
      ],
      ranges: [
        "Low: < 1500 kcal - May indicate low muscle mass",
        "Average: 1500-2000 kcal - Typical for sedentary adults",
        "High: > 2000 kcal - Common for active individuals"
      ],
      maxValue: 2500,
      description: "Daily calories burned at complete rest.",
      recommendations: "Never eat below BMR. Add activity calories for total needs."
    },
    {
      label: "Body Fat Percentage",
      value: bodyFat,
      unit: '%',
      segments: [
        { start: 0, end: 15, color: 'bg-green-300' },
        { start: 15, end: 25, color: 'bg-yellow-300' },
        { start: 25, end: 50, color: 'bg-red-300' }
      ],
      ranges: [
        "Athletic: 6-13% (men), 14-20% (women)",
        "Fit: 14-17% (men), 21-24% (women)",
        "Average: 18-24% (men), 25-31% (women)"
      ],
      maxValue: 50,
      description: "Total body fat as percentage of total weight.",
      recommendations: "Maintain through balanced diet and exercise."
    },
    {
      label: "Muscle Mass",
      value: muscleMass,
      unit: 'kg',
      segments: [
        { start: 20, end: 30, color: 'bg-blue-300' },
        { start: 30, end: 40, color: 'bg-green-300' },
        { start: 40, end: 60, color: 'bg-yellow-300' }
      ],
      ranges: [
        "Low: <30% of body weight",
        "Average: 30-40% of body weight",
        "High: >40% of body weight"
      ],
      maxValue: 60,
      description: "Total weight of muscle tissue in body.",
      recommendations: "Strength train 2-3 times weekly, adequate protein intake."
    },
    {
      label: "Body Moisture Rate",
      value: bodyMoistureRate,
      unit: '%',
      segments: [
        { start: 45, end: 55, color: 'bg-blue-300' },
        { start: 55, end: 65, color: 'bg-green-300' },
        { start: 65, end: 75, color: 'bg-yellow-300' }
      ],
      ranges: [
        "Low: <55% - Dehydration risk",
        "Optimal: 55-65% - Well hydrated",
        "High: >65% - Excess hydration"
      ],
      maxValue: 75,
      description: "Percentage of body weight that is water.",
      recommendations: "Drink 8-10 glasses of water daily."
    },
    {
      label: "Visceral Fat",
      value: visceralFat,
      segments: [
        { start: 0, end: 10, color: 'bg-green-300' },
        { start: 10, end: 15, color: 'bg-yellow-300' },
        { start: 15, end: 30, color: 'bg-red-300' }
      ],
      ranges: [
        "Healthy: 1-9 - Optimal range",
        "Borderline: 10-14 - Monitor closely",
        "High Risk: >15 - Reduce immediately"
      ],
      maxValue: 30,
      description: "Fat stored around vital organs.",
      recommendations: "Maintain level under 10 through diet and exercise."
    },
    {
      label: "Bone Mass",
      value: boneMass,
      unit: 'kg',
      segments: [
        { start: 0, end: 2.5, color: 'bg-blue-300' },
        { start: 2.5, end: 3.5, color: 'bg-green-300' },
        { start: 3.5, end: 5, color: 'bg-yellow-300' }
      ],
      ranges: [
        "Low: <2.5kg",
        "Normal: 2.5-3.5kg",
        "High: >3.5kg"
      ],
      maxValue: 5,
      description: "Total bone mineral content.",
      recommendations: "Regular exercise and calcium-rich diet."
    },
    {
      label: "Protein",
      value: protein,
      unit: 'g',
      segments: [
        { start: 0, end: 50, color: 'bg-blue-300' },
        { start: 50, end: 80, color: 'bg-green-300' },
        { start: 80, end: 120, color: 'bg-yellow-300' }
      ],
      ranges: [
        "Low: <0.8g per kg body weight",
        "Adequate: 0.8-1.2g per kg body weight",
        "Athletic: >1.2g per kg body weight"
      ],
      maxValue: 120,
      description: "Daily protein requirement.",
      recommendations: "Consume 0.8-1.2g protein per kg body weight."
    },
    {
      label: "Subcutaneous Fat",
      value: subcutaneousFat,
      unit: '%',
      segments: [
        { start: 0, end: 20, color: 'bg-green-300' },
        { start: 20, end: 30, color: 'bg-yellow-300' },
        { start: 30, end: 50, color: 'bg-red-300' }
      ],
      ranges: [
        "Low: <20%",
        "Moderate: 20-30%",
        "High: >30%"
      ],
      maxValue: 50,
      description: "Fat stored directly under the skin.",
      recommendations: "Reduce through cardio and strength training."
    },
    {
      label: "Standard Weight",
      value: standardWeight,
      unit: 'kg',
      segments: [
        { start: 50, end: 65, color: 'bg-blue-300' },
        { start: 65, end: 80, color: 'bg-green-300' },
        { start: 80, end: 100, color: 'bg-yellow-300' }
      ],
      ranges: [
        "Below: <65kg",
        "Ideal: 65-80kg",
        "Above: >80kg"
      ],
      maxValue: 100,
      description: "Ideal weight based on height.",
      recommendations: "Use as general guide, consider body composition."
    }
  ];

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0 p-3 bg-tprimary sticky-top stickyCard">
        <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="pt-3 pb-4 text-white bg-tprimary "
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-semibold">
                    Hi, {userName?.split(" ")[0]}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Your Health Report
                  </p>
                </div>
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
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-x-hidden overflow-y-auto exerciseCard no-scrollbar">
        
          <div className="mb-6">
            <h1>
              Health Metrics Dashboard
            </h1>
            <div>
              <div className="space-y-6">
                {metrics?.map((metric, index) => (
                  <HealthMetricsRange key={index} {...metric} />
                ))}
              </div>
              <div className="p-4 mt-6 rounded-lg bg-blue-50">
                <h3 className="text-lg font-medium text-blue-900">Body Type Assessment</h3>
                <p className="mt-2 text-sm text-blue-700">
                  Based on your metrics:
                  {bmi < 18.5 ? " Ectomorph (lean/long)" :
                    bmi > 30 ? " Endomorph (higher body fat)" :
                   " Mesomorph (muscular/athletic)"}
                </p>
                <div className="mt-4">
                  <h4 className="font-medium text-blue-900">Characteristics:</h4>
                  <ul className="pl-0 mt-2 space-y-1 text-sm text-blue-700">
                    {bmi < 18.5 ? (
                      <>
                        <li>• Naturally lean and long limbed</li>
                        <li>• Fast metabolism</li>
                        <li>• Difficulty gaining weight</li>
                      </>
                    ) : bmi > 30 ? (
                      <>
                        <li>• Larger bone structure</li>
                        <li>• Higher body fat storage</li>
                        <li>• Slower metabolism</li>
                      </>
                    ) : (
                      <>
                        <li>• Athletic build</li>
                        <li>• Efficient metabolism</li>
                        <li>• Good muscle development potential</li>
                      </>
                    )}
                  </ul>
                </div>
                <div className="mt-4">
                  <h4 className="font-medium text-blue-900">Recommendations:</h4>
                  <ul className="pl-0 mt-2 space-y-1 text-sm text-blue-700">
                    {bmi < 18.5 ? (
                      <>
                        <li>• Increase caloric intake</li>
                        <li>• Focus on strength training</li>
                        <li>• Eat frequent meals</li>
                      </>
                    ) : bmi > 30 ? (
                      <>
                        <li>• Monitor caloric intake</li>
                        <li>• Regular cardio exercise</li>
                        <li>• Balance strength training</li>
                      </>
                    ) : (
                      <>
                        <li>• Maintain balanced workout routine</li>
                        <li>• Focus on compound exercises</li>
                        <li>• Keep consistent nutrition</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
              <div className="p-4 mt-6 rounded-lg bg-yellow-50">
                <h3 className="text-lg font-medium text-yellow-900">Important Notes</h3>
                <ul className="pl-0 mt-2 space-y-2 text-sm text-yellow-700">
                  <li>• These measurements are estimates based on standard calculations</li>
                  <li>• Individual results may vary based on factors like genetics, age, and activity level</li>
                  <li>• Consult healthcare professionals for personalized advice</li>
                  <li>• Regular monitoring is recommended for tracking progress</li>
                </ul>
              </div>
            </div>
          </div>
        
      </div>
      </div>
    </SecureComponent>
  );
};

export default healthReport;

