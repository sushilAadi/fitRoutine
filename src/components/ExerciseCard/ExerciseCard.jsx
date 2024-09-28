import React, { useState } from 'react'
import { exercises } from '@/utils/exercise';
import _ from 'lodash';
import PillButton from '../Button/PillButton';

const ExerciseCard = () => {
    // console.log("exercises",exercises)
    const [filterToggle, setFilterToggle] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState(null)


    const filterArray = _.uniq(exercises?.map(i => i?.bodyPart))
    // output: ["waist","upper legs","back","lower legs","chest","upper arms","cardio","shoulders","lower arms","neck"]

    // console.log("filterArraya",filterArraya)

    return (
        <div className='w-full overflow-hidden'>
            <div className="flex">
                <PillButton onClick={() => setFilterToggle(!filterToggle)} className="!bg-gray-200 mr-2 h-[36px] flex items-center justify-center" title="Filter" icon={<i className="fa-solid fa-arrow-right-arrow-left mr-2" />} />
                <div className='flex  overflow-y-scroll no-scrollbar rounded-pill'>{filterToggle && filterArray?.map(i => (
                    <PillButton onClick={()=>setSelectedFilter(i)} className={` ${i === selectedFilter?"bg-black text-white":"bg-white"} borderOne mr-2 h-[36px] flex items-center justify-center w-100`} title={i} />
                ))}
                </div>
                <div className={`flex items-center justfy-end border-2 rounded-pill overflow-hidden h-[36px] min-w-[36px] inputContainer ${!filterToggle ? 'w-full' : 'w-0'}`}>
                    <input type="text" placeholder='Search exercise' className={`outline-none px-2 py-1 w-100 ${!filterToggle ? 'block' : 'hidden'}`} />
                    <i className="fa-solid fa-magnifying-glass mx-2 cursor-pointer" onClick={() =>filterToggle && setFilterToggle(!filterToggle)}/>
                </div>
            </div>
        </div>
    )
}

export default ExerciseCard