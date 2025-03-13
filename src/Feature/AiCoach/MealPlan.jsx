"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from "recharts"

// FontAwesome icons
const icons = {
  Breakfast: "fa-solid fa-mug-hot",
  Lunch: "fa-solid fa-utensils",
  Snack: "fa-solid fa-apple-whole",
  Dinner: "fa-solid fa-moon",
}

// Colors for the pie chart (matching your image)
const COLORS = ['#F6D776', '#1F4E46', '#25A244'];

export default function MealPlanCard({mealData}) {
  const [selectedMeal, setSelectedMeal] = useState(null)

  const totalNutrients = mealData.reduce(
    (acc, meal) => {
      acc.protein += Number.parseInt(meal.protein)
      acc.carbs += Number.parseInt(meal.carbs)
      acc.fats += Number.parseInt(meal.fats)
      return acc
    },
    { protein: 0, carbs: 0, fats: 0 },
  )

  const calories = totalNutrients.protein * 4 + totalNutrients.carbs * 4 + totalNutrients.fats * 9
  
  // Calculate percentages for the pie chart
  const proteinPercentage = Math.round((totalNutrients.protein * 4 / calories) * 100);
  const fatPercentage = Math.round((totalNutrients.fats * 9 / calories) * 100);
  const carbPercentage = Math.round((totalNutrients.carbs * 4 / calories) * 100);
  
  // Data for the pie chart
  const pieData = [
    { name: 'Protein', value: proteinPercentage, label: 'P' },
    { name: 'Fats', value: fatPercentage, label: 'F' },
    { name: 'Carbohydrates', value: carbPercentage, label: 'C' },
  ];

  return (
    <div className="">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="overflow-hidden ">
          <div className="relative flex flex-col gap-4 bg-white md:flex-row">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Daily Meal Plan</h3>
              <p className="mt-1 text-gray-600">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>
            
            <div className="flex flex-col w-full">
              <div className="flex flex-col items-center gap-8 mt-4 md:mt-0 md:flex-row">
                {/* Calories summary */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-2 text-gray-800">
                    <span className="text-2xl font-bold">{calories}</span>
                    <span className="text-sm text-gray-500">kcal</span>
                  </div>
                  <div className="flex justify-between gap-8 mt-2 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-500">Protein</span>
                      <span className="font-medium text-gray-800">{totalNutrients.protein}g</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-500">Carbs</span>
                      <span className="font-medium text-gray-800">{totalNutrients.carbs}g</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-gray-500">Fats</span>
                      <span className="font-medium text-gray-800">{totalNutrients.fats}g</span>
                    </div>
                  </div>
                </div>
                
                {/* Pie chart */}
                <div className="w-64 h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="60%"
                        outerRadius="80%"
                        paddingAngle={0}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                        <tspan x="50%" dy="-10" fontSize="16" fontWeight="bold" fill="#333">{calories}</tspan>
                        <tspan x="50%" dy="20" fontSize="12" fill="#666">kcal</tspan>
                      </text>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* Macro percentages legend */}
              <div className="flex flex-col p-4 mt-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: COLORS[0]}}></div>
                    <div>
                      <div className="text-sm font-medium">Protein</div>
                      <div className="text-lg font-bold">{proteinPercentage}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: COLORS[1]}}></div>
                    <div>
                      <div className="text-sm font-medium">Fats</div>
                      <div className="text-lg font-bold">{fatPercentage}%</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full" style={{backgroundColor: COLORS[2]}}></div>
                    <div>
                      <div className="text-sm font-medium">Carbs</div>
                      <div className="text-lg font-bold">{carbPercentage}%</div>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>

          <div className="p-2 bg-gray-50 rounded-xl ">
            <h4 className="mb-2 text-xl font-bold text-gray-800 ">Meals</h4>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {mealData.map((meal, index) => (
                <motion.div
                  key={meal.meal}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedMeal(selectedMeal === meal.meal ? null : meal.meal)}
                >
                  <div
                    className={`rounded-xl p-2 h-full transition-all duration-300 ${
                      selectedMeal === meal.meal
                        ? "bg-gradient-to-r from-blue-50 to-green-50 border border-green-200"
                        : "bg-white shadow-sm hover:shadow border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedMeal === meal.meal ? "bg-gradient-to-r from-blue-500 to-green-500" : "bg-gray-200"
                        }`}
                      >
                        <i className={`${icons[meal.meal]} ${selectedMeal === meal.meal ? "text-white" : "text-gray-600"}`}></i>
                      </div>
                      <div>
                        <h5 className="text-lg font-medium text-gray-800">{meal.meal}</h5>
                        <p className="text-sm text-gray-600">{meal.food}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedMeal === meal.meal && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-4 mt-4 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="text-gray-800">{meal.quantity}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <p className="text-gray-500">Protein</p>
                                  <p className="text-gray-800">{meal.protein}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Carbs</p>
                                  <p className="text-gray-800">{meal.carbs}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Fats</p>
                                  <p className="text-gray-800">{meal.fats}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}