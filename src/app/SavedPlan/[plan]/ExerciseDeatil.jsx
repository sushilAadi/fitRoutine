import _ from 'lodash'
import Image from 'next/image'
import React from 'react'

const ExerciseDeatil = ({handleClose,data}) => {
    // {
    //     "bodyPart":"back",
    //     "equipment":"body weight",
    //     "gifUrl":"https://v2.exercisedb.io/image/LJKLgHuxhwle4L",
    //     "id":"3293",
    //     "name":"archer pull up",
    //     "target":"lats",
    //     "secondaryMuscles":[
    //        "biceps",
    //        "forearms"
    //     ],
    //     "instructions":[
    //        "Start by hanging from a pull-up bar with an overhand grip, slightly wider than shoulder-width apart.",
    //        "Engage your core and pull your shoulder blades down and back.",
    //        "As you pull yourself up, bend one arm and bring your elbow towards your side, while keeping the other arm straight.",
    //        "Continue pulling until your chin is above the bar and your bent arm is fully flexed.",
    //        "Lower yourself back down with control, straightening the bent arm and repeating the movement on the other side.",
    //        "Alternate sides with each repetition."
    //     ]
    //  }
  return (
    <div>
        <span className='cursor-pointer sticky top-0 z-10 bg-white block' onClick={handleClose}><i className="fa-solid fa-angle-left  pr-2" />{_.upperFirst("Go back")}</span>
        <div className='bgImage p-3 ' >
    <img src={data?.gifUrl} alt={data?.name} width={"100%"} />
</div>

<div className="glasss">
    <p className='text-[12px]'>{_.upperFirst(data?.target)} <span className='text-gray-500 pl-2'>(secondaryMuscles: {data.secondaryMuscles?.join(', ')})</span></p>
    <h3 className=''>{_.upperFirst(data?.name)}</h3>
    <ul className='list-disc pl-5 mt-4'>
      {data?.instructions?.map((instruction, index) => (
        <li key={index} className='mb-2 text-gray-700 text-[12px]'>
          {instruction}
        </li>
      ))}
    </ul>
</div>
    </div>
  )
}

export default ExerciseDeatil