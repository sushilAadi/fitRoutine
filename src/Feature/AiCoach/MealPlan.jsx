"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

// FontAwesome icons
const icons = {
  Breakfast: "fa-solid fa-mug-hot",
  Lunch: "fa-solid fa-utensils",
  Snack: "fa-solid fa-apple-whole",
  Dinner: "fa-solid fa-moon",
}

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

  return (
    <div className="w-full min-h-screen ">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className=""
      >
        <div className="overflow-hidden backdrop-blur-lg ">
          <div className="relative flex flex-col gap-4 md:flex-row">
            <div>
              <h3 className="text-2xl font-bold text-white">Daily Meal Plan</h3>
              <p className="mt-1 text-gray-300">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </p>
            </div>

            <div className="flex flex-col w-full">
              <div className="flex items-center justify-center gap-2 text-white">
                <span className="text-xl font-bold">{calories}</span>
                <span className="text-sm opacity-70">calories</span>
              </div>
              <hr/>
              <div className="flex justify-between gap-4 mt-2 text-center">
                <div className="flex flex-col items-center">
                  <span className="text-sm text-white/70">Protein</span>
                  <span className="font-medium text-white">{totalNutrients.protein}g</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-white/70">Carbs</span>
                  <span className="font-medium text-white">{totalNutrients.carbs}g</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-sm text-white/70">Fats</span>
                  <span className="font-medium text-white">{totalNutrients.fats}g</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-2">
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
                    className={`rounded-xl p-4 h-full transition-all duration-300 ${
                      selectedMeal === meal.meal
                        ? "bg-gradient-to-r from-blue-500/30 to-purple-500/30 border "
                        : "bg-white/5 hover:bg-white/10 border "
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          selectedMeal === meal.meal ? "bg-gradient-to-r from-blue-500 to-purple-500" : "bg-gray-800"
                        }`}
                      >
                        <i className={`${icons[meal.meal]} text-white`}></i>
                      </div>
                      <div>
                        <h5 className="text-lg font-medium text-white">{meal.meal}</h5>
                        <p className="text-sm text-gray-300">{meal.food}</p>
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
                          <div className="pt-4 mt-4 border-t border-white/10">
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <p className="text-gray-400">Quantity</p>
                                <p className="text-white">{meal.quantity}</p>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <p className="text-gray-400">Protein</p>
                                  <p className="text-white">{meal.protein}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Carbs</p>
                                  <p className="text-white">{meal.carbs}</p>
                                </div>
                                <div>
                                  <p className="text-gray-400">Fats</p>
                                  <p className="text-white">{meal.fats}</p>
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

