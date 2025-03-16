"use client";

import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext, useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import _ from 'lodash';

const Diet = () => {
  const { handleOpenClose, userDetailData, user, userId, fetchDietPlans, dietPlans } = useContext(GlobalContext);

  // Use useCallback to memoize fetchDietPlans
  const memoizedFetchDietPlans = useCallback(fetchDietPlans, [userId]);

  useEffect(() => {
    memoizedFetchDietPlans();
  }, [userId, memoizedFetchDietPlans]);

  // Define the MealPlanCard component directly here
  const MealPlanCard = ({ mealData, planName, weeks }) => {
    const [selectedMeal, setSelectedMeal] = useState(null);

    const icons = {
      Breakfast: "fa-solid fa-mug-hot",
      Lunch: "fa-solid fa-utensils",
      Snack: "fa-solid fa-apple-whole",
      Dinner: "fa-solid fa-moon",
    };

    const COLORS = ["#F6D776", "#1F4E46", "#25A244"];

    const totalNutrients = mealData.reduce(
      (acc, meal) => {
        acc.protein += Number.parseInt(meal.protein);
        acc.carbs += Number.parseInt(meal.carbs);
        acc.fats += Number.parseInt(meal.fats);
        return acc;
      },
      { protein: 0, carbs: 0, fats: 0 }
    );

    const calories = totalNutrients.protein * 4 + totalNutrients.carbs * 4 + totalNutrients.fats * 9;

    const proteinPercentage = Math.round((totalNutrients.protein * 4 / calories) * 100);
    const fatPercentage = Math.round((totalNutrients.fats * 9 / calories) * 100);
    const carbPercentage = Math.round((totalNutrients.carbs * 4 / calories) * 100);

    const pieData = [
      { name: "Protein", value: proteinPercentage },
      { name: "Fats", value: fatPercentage },
      { name: "Carbohydrates", value: carbPercentage },
    ];

    return (
      <div className="border border-gray-200 shadow-md rounded-xl w-full max-w-[350px h-full flex-shrink-0">
        <div className="overflow-hidden">
          <div className="relative flex flex-col gap-3 p-3 bg-white rounded-xl">
            <div className="px-2 pt-2">
              <h3 className="text-lg font-bold text-gray-800">{_.capitalize(planName)}</h3>
              <p className="mt-0.5 text-gray-600 text-sm">
                {weeks} Weeks Plan.
              </p>
            </div>

            <div className="flex flex-col w-full">
              <div className="flex flex-col items-center gap-4 mt-2 md:mt-0 md:flex-row md:justify-between">
                {/* Pie chart and Macro Percentages */}
                <div className="flex items-center justify-center w-full">
                  <div className="w-[100px] h-[100px]">
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
                          <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
                            <tspan x="50%" dy="-8" fontSize="14" fontWeight="bold" fill="#333">{calories}</tspan>
                            <tspan x="50%" dy="15" fontSize="10" fill="#666">kcal</tspan>
                          </text>
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Macro Percentages */}
                  <div className="flex flex-col ml-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[0] }}></div>
                      <div>
                        <div className="text-xs font-medium">Protein {proteinPercentage}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 my-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[1] }}></div>
                      <div>
                        <div className="text-xs font-medium">Fats {fatPercentage}%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[2] }}></div>
                      <div>
                        <div className="text-xs font-medium">Carbs {carbPercentage}%</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between gap-4 mt-1 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Protein</span>
                  <span className="text-sm font-medium text-gray-800">{totalNutrients.protein}g</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Carbs</span>
                  <span className="text-sm font-medium text-gray-800">{totalNutrients.carbs}g</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Fats</span>
                  <span className="text-sm font-medium text-gray-800">{totalNutrients.fats}g</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-xs text-gray-500">Calories</span>
                  <span className="text-sm font-medium text-gray-800">{calories}Kcal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-1 bg-gray-50 rounded-xl">
            <h4 className="mb-1 text-lg font-bold text-gray-800">Meals</h4>
            <div className="grid grid-cols-1 gap-1">
              {mealData.map((meal, index) => (
                <motion.div
                  key={meal.meal}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="cursor-pointer"
                  onClick={() => setSelectedMeal(selectedMeal === meal.meal ? null : meal.meal)}
                >
                  <div
                    className={`rounded-xl p-1.5 h-full transition-all duration-200 ${
                      selectedMeal === meal.meal
                        ? "bg-gradient-to-r from-blue-50 to-green-50 border border-green-200"
                        : "bg-white shadow-sm hover:shadow border border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedMeal === meal.meal ? "bg-gradient-to-r from-blue-500 to-green-500" : "bg-gray-200"
                        }`}
                      >
                        <i className={`${icons[meal.meal]} ${selectedMeal === meal.meal ? "text-white text-xs" : "text-gray-600 text-xs"}`}></i>
                      </div>
                      <div>
                        <h5 className="text-sm font-medium text-gray-800">{meal.meal}</h5>
                        <p className="text-sm text-gray-600 line-clamp-2" title={meal.food}>{meal.food}</p>
                      </div>
                    </div>

                    <AnimatePresence>
                      {selectedMeal === meal.meal && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 mt-2 border-t border-gray-200">
                            <div className="grid grid-cols-2 gap-1 text-xs">
                              <div>
                                <p className="text-gray-500">Quantity</p>
                                <p className="text-gray-800">{meal.quantity}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
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
      </div>
    );
  };

  return (
    <SecureComponent>
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="top-0 p-3 text-tprimary sticky-top">
          <h1>My Diet</h1>
        </div>
        <div className="p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dietPlans.length > 0 ? (
              dietPlans.map((plan) => {
                // Convert the plan object into an array of meals
                const mealsArray = Object.keys(plan)
                  .filter((key) => !isNaN(parseInt(key)))
                  .map((key) => plan[key]);

                return (
                  <div key={plan.id}>
                    <MealPlanCard mealData={mealsArray} planName={plan?.planName} weeks={plan?.totalWeeks} />
                  </div>
                );
              })
            ) : (
              <p>No diet plans found.</p>
            )}
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default Diet;