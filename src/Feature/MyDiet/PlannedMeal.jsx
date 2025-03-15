import React from 'react'
import {
    Accordion,
    AccordionHeader,
    AccordionBody,
  } from "@material-tailwind/react";
  import { motion } from "framer-motion";

const PlannedMeal = (props) => {
  return (
    <div className="pb-20 space-y-3 overflow-y-auto">
      {props.dietList?.map((meal, index) => (
        <Accordion
          key={index}
          open={props.openAccordion === index + 1}
          className="overflow-hidden bg-white border border-blue-100 rounded-lg"
        >
          <AccordionHeader
            onClick={() => props.handleOpenAccordion(index + 1)}
            className="px-4 py-2 text-gray-800 border-b-0"
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {meal.meal === "Breakfast" && (
                  <span className="text-xl text-orange-500">🍳</span>
                )}
                {meal.meal === "Lunch" && (
                  <span className="text-xl text-green-500">🍲</span>
                )}
                {meal.meal === "Snack" && (
                  <span className="text-xl text-purple-500">🥪</span>
                )}
                {meal.meal === "Dinner" && (
                  <span className="text-xl text-blue-500">🍽️</span>
                )}
                <span className="font-medium">{meal.meal}</span>
              </div>
              <span className="text-sm text-gray-500">
                {meal.calories} kcal
              </span>
            </div>
          </AccordionHeader>
          <AccordionBody className="px-4 py-2 pt-0">
            <div className="pt-2 border-t border-gray-100">
              <p className="mb-1 font-medium text-gray-800">{meal.food}</p>
              <p className="mb-2 text-sm text-gray-500">{meal.quantity}</p>

              <div className="flex justify-between text-sm">
                <div className="flex gap-3">
                  <span className="text-red-500">C: {meal.carbs}</span>
                  <span className="text-blue-500">P: {meal.protein}</span>
                  <span className="text-amber-500">F: {meal.fats}</span>
                </div>
                <motion.button
                  whileTap={{
                    scale: 0.95,
                  }}
                  className="flex items-center gap-1 text-blue-500"
                >
                  <span className="text-xl">+</span>
                  <span className="text-sm">Add</span>
                </motion.button>
              </div>
            </div>
          </AccordionBody>
        </Accordion>
      ))}
    </div>
  )
}

export default PlannedMeal