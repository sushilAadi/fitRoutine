"use client";

import { motion } from "framer-motion";
import { Flame, Leaf } from "lucide-react";
import { RadialBarChart, RadialBar, Legend } from "recharts";

const CaloriesCard = () => {
  const data = [
    { name: "Calories Burned", value: 2118, fill: "#6366F1" },
  ];

  const progressData = [
    { name: "Protein", current: 27, total: 29 },
    { name: "Fat", current: 40, total: 42 },
    { name: "Carbs", current: 32, total: 120 },
  ];

  return (
    <motion.div
      className="max-w-md bg-white "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Radial Chart Section */}
      <div className="flex flex-col items-center mb-6">
        <RadialBarChart
          width={200}
          height={200}
          innerRadius="80%"
          outerRadius="100%"
          data={data}
        >
          <RadialBar minAngle={15} background dataKey="value" />
          <Legend
            iconSize={10}
            layout="vertical"
            verticalAlign="middle"
            align="center"
          />
        </RadialBarChart>
        <div className="-mt-16 text-center">
          <p className="text-4xl font-bold text-gray-800">{data[0].value}</p>
          <p className="text-sm text-gray-500">Your calories burned today</p>
        </div>
      </div>

      {/* Calories Eaten and Burned Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-500" />
          <div>
            <p className="text-lg font-semibold text-gray-800">2100 Kcal</p>
            <p className="text-xs text-gray-500">Eaten</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-red-500" />
          <div>
            <p className="text-lg font-semibold text-gray-800">3120 Kcal</p>
            <p className="text-xs text-gray-500">Burned</p>
          </div>
        </div>
      </div>

      {/* Nutrients Progress Section */}
      <div>
        {progressData.map((item, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between text-sm font-semibold text-gray-700">
              <span>{item.name}</span>
              <span>
                {item.current}/{item.total} g
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-300 rounded-full">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${(item.current / item.total) * 100}%`,
                }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                className={`absolute h-full rounded-full ${
                  item.name === "Protein"
                    ? "bg-purple-500"
                    : item.name === "Fat"
                    ? "bg-yellow-500"
                    : "bg-blue-500"
                }`}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

export default CaloriesCard;
