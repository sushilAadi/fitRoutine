import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CCardRow from '@/components/CCardRow';

const WorkoutDayAccordion = ({ 
  day, 
  dayIndex, 
  weekIndex, 
  dayName, 
  isEditingExistingPlan, 
  isEditingDraft = false, // New prop to handle draft editing
  updateDayName, 
  handleOpenClose, 
  setSelectedWeekIndex, 
  setSelectedDayIndex, 
  removeExercise,
  isOpen,
  toggleAccordion,
  openAccordionWithoutClosing,
  updateExerciseSets
}) => {
  // Show add exercise button if:
  // 1. Not editing an existing completed plan, OR
  // 2. Currently editing a draft
  const showAddExerciseButton = !isEditingExistingPlan || isEditingDraft;

  return (
    <div className="mb-4 overflow-hidden border rounded-xl">
      <motion.header
        className="flex items-center gap-2 px-2 py-1 bg-white cursor-pointer"
        onClick={() => toggleAccordion(weekIndex, dayIndex)}
      >
        <h3 className="flex-grow text-lg font-medium">
          {dayName} 
          <i
            className="text-gray-500 cursor-pointer fa-regular fa-pen-to-square text-[16px] ml-2"
            onClick={(e) => {
              e.stopPropagation();
              const newName = prompt("Enter new day name:", dayName);
              if (newName) updateDayName(dayIndex, newName);
            }}
          />
        </h3>
        
        {showAddExerciseButton && (
          <i
            className="mx-2 cursor-pointer fa-duotone fa-solid fa-rectangle-history-circle-plus"
            onClick={(e) => {
              e.stopPropagation();
              handleOpenClose();
              setSelectedWeekIndex(weekIndex);
              setSelectedDayIndex(dayIndex);
              openAccordionWithoutClosing(weekIndex, dayIndex)
            }}
          />
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
            className='bg-gray-100'
          >
            <ul className="p-2 m-0 overflow-y-auto">
              {day?.exercises.map((exercise, exerciseIndex) => (
                <li
                  key={exerciseIndex}
                  className={`relative mb-2 bg-white p-2 rounded-xl`} 
                  style={{boxShadow: "0px 0px 0px 0px #ffd2aa"}}
                >
                  <CCardRow
                    img={exercise.gifUrl}
                    bgColor="bg-[#DBFE02]"
                    parentStyle="w-full min-w-[180px] max-w-[180px]"
                    caption={exercise.bodyPart}
                    title={exercise.target}
                    name={exercise.name}
                    deleteClick={showAddExerciseButton ? () => removeExercise(weekIndex, dayIndex, exerciseIndex) : undefined}
                    onSetChange={(newSets) => updateExerciseSets(weekIndex, dayIndex, exerciseIndex, newSets)}
                    weekIndex={weekIndex}
                    sets={exercise}
                  />
                </li>
              ))}
              {day.exercises?.length === 0 && (
                <li className="py-4 text-center text-gray-500">
                  {showAddExerciseButton ? "Add an exercise" : "No exercises added"}
                </li>
              )}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WorkoutDayAccordion;