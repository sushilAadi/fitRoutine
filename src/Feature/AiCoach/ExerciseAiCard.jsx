"use client"

import { useState } from "react"
import { Dumbbell } from "lucide-react"
import { Accordion, AccordionHeader, AccordionBody } from "@material-tailwind/react"

function ExerciseAiCard({ day, targetMuscle, workout, color, dotColor }) {
  const [open, setOpen] = useState(0)

  const handleOpen = (value) => {
    setOpen(open === value ? 0 : value)
  }

  // Custom icon for the accordion header
  function Icon({ id, open }) {
    return (
      <div className="flex items-center">
        <div className="mr-2 text-lg font-bold text-black">{workout.length}</div>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`${open === id ? "rotate-180" : ""} h-5 w-5 transition-transform text-black`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </div>
    )
  }

  return (
    <Accordion
      open={open === 1}
      icon={<Icon id={1} open={open} />}
      className={` ${color}  overflow-hidden mb-1 rounded-xl`}
    >
      <AccordionHeader
        onClick={() => handleOpen(1)}
        className="flex items-center justify-between w-full p-2 transition-colors border-b-0"
      >
        <div className="flex items-center">
          {/* <div className={`w-4 h-4 rounded-full ${dotColor} mr-3`}></div> */}
          <div>
            <div className="font-medium text-black">{targetMuscle}</div>
            <div className="text-sm text-gray-800 text-start">Day {day}</div>
          </div>
        </div>
      </AccordionHeader>
      <AccordionBody className="pt-0 pb-4 ">
        <div className="">
          {workout.map((exercise, index) => (
            <div key={index} className="flex gap-2 p-3 ">
            <img src={exercise.gifUrl} className="w-[50px] h-[50px] rounded-full"  />
              <div className="w-full font-medium text-black ">{exercise.name}
              <div className="flex items-center justify-between w-full mt-1 text-sm text-gray-600">
                <span>
                  {exercise.Sets} sets × {exercise.Reps}
                </span>
                <Dumbbell size={16} className="text-gray-400" />
              </div>
              </div>
              
            </div>
          ))}
        </div>
      </AccordionBody>
    </Accordion>
  )
}

export default ExerciseAiCard

