import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CCard from '@/components/CCard';

const WorkoutDayAccordion = ({ 
  day, 
  dayIndex, 
  weekIndex, 
  dayName, 
  isEditingExistingPlan, 
  updateDayName, 
  handleOpenClose, 
  setSelectedWeekIndex, 
  setSelectedDayIndex, 
  removeExercise,
  isOpen,
  toggleAccordion
}) => {
  return (
    <div className="mb-4 overflow-hidden border rounded-lg">
      <motion.header
        className="flex items-center gap-2 px-2 py-1 bg-gray-100 cursor-pointer"
        onClick={() => toggleAccordion(weekIndex, dayIndex)}
      >
        <h3 className="flex-grow text-lg font-medium">{dayName}</h3>
        {!isEditingExistingPlan && (
          <>
            <i
              className="text-gray-500 cursor-pointer fa-regular fa-pen-to-square"
              onClick={(e) => {
                e.stopPropagation();
                const newName = prompt("Enter new day name:", dayName);
                if (newName) updateDayName(dayIndex, newName);
              }}
            />
            <i
              className="cursor-pointer fa-duotone fa-solid fa-rectangle-history-circle-plus"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenClose();
                setSelectedWeekIndex(weekIndex);
                setSelectedDayIndex(dayIndex);
                toggleAccordion(weekIndex, dayIndex)
              }}
            />
          </>
        )}
        <motion.i
          className={`fa-solid fa-chevron-down`}
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        />
      </motion.header>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="collapsed"
            animate="open"
            exit="collapsed"
            variants={{
              open: { opacity: 1, height: "auto" },
              collapsed: { opacity: 0, height: 0 }
            }}
            transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
          >
            <ul className="flex p-4 overflow-x-auto">
              {day.exercises.map((exercise, exerciseIndex) => (
                <li
                  key={exerciseIndex}
                  className={`relative ${exerciseIndex !== 0 ? "ml-5" : ""}`}
                >
                  <CCard
                    img={exercise.gifUrl}
                    bgColor="bg-[#DBFE02]"
                    parentStyle="w-full min-w-[180px] max-w-[180px]"
                    caption={exercise?.bodyPart}
                    title={exercise?.target}
                    name={exercise?.name}
                  />
                  {!isEditingExistingPlan && (
                    <div
                      className="absolute w-[30px] h-[20px] rounded-l-lg bg-red-500 top-[44px] right-[0] flex justify-center items-center"
                      onClick={() => removeExercise(weekIndex, dayIndex, exerciseIndex)}
                    >
                      <i className="text-white cursor-pointer fa-solid fa-xmark" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutDayAccordion;

