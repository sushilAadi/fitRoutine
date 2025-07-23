"use client";

import { motion } from "framer-motion";
import { X } from "lucide-react";

const BMICard = ({ bmi, lastUpdate = "9 Jan, 2024 at 10:12",hideDoc=true }) => {
  const maxBMI = 40;

  const getColor = (value) => {
    if (value < 18.5) return "bg-blue-500";
    if (value < 25) return "bg-gradient-to-r from-green-600 to-green-800";
    if (value < 30) return "bg-yellow-500";
    return "bg-red-500";
  };

  const segments = [
    {
      start: 0,
      end: 18.5,
      color: "bg-gradient-to-r from-cyan-800 to-green-600",
    },
    {
      start: 18.5,
      end: 25,
      color: "bg-gradient-to-r from-green-600 to-green-800",
    },
    {
      start: 25,
      end: 30,
      color: "bg-gradient-to-r from-amber-400 to-orange-600",
    },
    {
      start: 30,
      end: maxBMI,
      color: "bg-gradient-to-r from-orange-600 to-red-600",
    },
  ];

  const ticks = [0, 18.5, 25, 30, maxBMI];
  // const getIndicatorPosition = () => {
  //   const min = 18
  //   const max = 30
  //   const position = ((bmi - min) / (max - min)) * 100
  //   return Math.min(Math.max(position, 0), 100)
  // }

  // Function to determine BMI status and message
  const getBMIStatus = () => {
    if (bmi < 18.5)
      return "Your BMI is below the healthy range. Consider consulting a healthcare professional for advice on gaining weight safely.";
    if (bmi >= 18.5 && bmi < 25)
      return "Your BMI is within the healthy range. Keep up the good work with your diet and exercise routine!";
    if (bmi >= 25 && bmi < 40)
      return "Your BMI indicates you're overweight. Consider adopting a healthier lifestyle with balanced diet and regular exercise.";
    return "Your BMI indicates obesity. It's recommended to consult a healthcare professional for a personalized weight management plan.";
  };

  return (
    <div className="px-4 mx-auto mt-4 bg-white ">
      {/* BMI Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">BMI</h2>
            {/* <p className="text-sm text-gray-500">Last Update: {lastUpdate}</p> */}
          </div>
          <i className="text-2xl fa-duotone fa-light fa-weight-scale text-tprimary " />
        </div>

        <div className="text-3xl font-bold">{bmi}</div>

        <div className="relative h-4 my-5">
          {segments.map(({ start, end, color }, i) => (
            <div
              key={i}
              className={`absolute top-0 h-full ${color} first:rounded-l-lg  ${
                end === 40 && "rounded-r-lg"
              }`}
              style={{
                left: `${(start / maxBMI) * 100}%`,
                width: `${((end - start) / maxBMI) * 100}%`,
              }}
            />
          ))}
          {ticks.map((value) => (
            <div
              key={value}
              className="absolute top-full mt-2 w-0.5 h-2 bg-gray-300 "
              style={{ left: `${(value / maxBMI) * 100}%` }}
            >
              <div className="absolute mt-1 text-xs text-gray-500 transform -translate-x-1/2 top-full">
                {value}
              </div>
            </div>
          ))}
          <div
            className={`absolute top-1/2 w-8 h-8 -mt-4 -ml-4 flex items-center justify-center rounded-full ${getColor(
              bmi
            )} text-white shadow-md transition-all duration-300`}
            style={{ left: `${(bmi / maxBMI) * 100}%` }}
            aria-label={`Current BMI: ${bmi}`}
          >
            <span className="text-[10px] font-bold leading-none">{bmi}</span>
          </div>
        </div>

        {/* Progress Bar */}
        {/* <div className="relative pt-6 pb-8">
          <div className="h-4 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-red-500" />
          <motion.div 
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="absolute top-0"
            style={{ left: `${getIndicatorPosition()}%` }}
          >
            <div className="relative flex items-center -mt-2">
              <div className="text-lg font-semibold">{bmi}</div>
              <i className="ml-1 text-xl text-black fas fa-sort-down"></i>
            </div>
          </motion.div>
        </div> */}
{hideDoc && <div className="mt-8">
          <h2 className="mb-2 text-lg font-semibold">BMI Categories:</h2>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 ">
            <p className="font-semibold text-blue-500 text-[12px]">
              Underweight: &lt; 18.5
            </p>
            <p className="font-semibold text-green-500 text-[12px]">
              Normal weight: 18.5 - 24.9
            </p>
            <p className="font-semibold text-yellow-800 text-[12px]">
              Overweight: 25 - 29.9
            </p>
            <p className="font-semibold text-red-500 text-[12px]">
              Obese: 30 or greater
            </p>
          </div>
        </div>}
        

        <p className="mt-3 text-sm text-gray-700">{getBMIStatus()}</p>
      </div>
    </div>
  );
};

export default BMICard;
