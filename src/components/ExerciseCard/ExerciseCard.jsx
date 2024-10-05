import React, { useState } from 'react'
import { exercises } from '@/utils/exercise';
import _ from 'lodash';
import PillButton from '../Button/PillButton';

const ExerciseCard = ({onSelectExercise,handleClose}) => {
    
    const [filterToggle, setFilterToggle] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState("All")
    const [searchTerm, setSearchTerm] = useState("")

    const filterArray = _.uniq(exercises?.map(i => i?.target))
    const shortedFilter = ["All", ..._.sortBy(filterArray)]

    const filteredExercises = exercises.filter(exercise => {
        if (selectedFilter === "All") {
            return true;
        } else {
            return exercise.target === selectedFilter;
        }
    });

    const searchedExercises = filteredExercises.filter(exercise => {
        return exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) || exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase());
    });

    const sortedExercises = _.sortBy(searchedExercises, exercise => exercise.target === selectedFilter ? -1 : 1);

    return (
        <div>
            
        
        <div className='w-full flex flex-column '>
            <div className=" sticky top-0 bg-white z-10 pb-2 gap-1 ">
                
                <span className='cursor-pointer  bg-white block mb-2' onClick={handleClose}><i className="fa-solid fa-angle-left  pr-2" />{_.upperFirst("Go back")}</span>
                <div className='flex gap-1'>
                <PillButton onClick={() => setFilterToggle(!filterToggle)} className="!bg-gray-200  h-[36px] flex items-center justify-center " title="Filter" icon={<i className="fa-solid fa-arrow-right-arrow-left pr-2" />} />
                
                <div className='flex  overflow-y-scroll no-scrollbar rounded-pill'>{filterToggle && shortedFilter?.map(i => (
                    <PillButton onClick={() => {setSelectedFilter(i);setSearchTerm('')}} className={` ${i === selectedFilter ? "bg-black text-white" : "bg-white"} borderOne mr-2 h-[36px] flex items-center justify-center w-100`} title={_.upperFirst(i)} />
                ))}
                </div>
                <div className={`flex items-center justfy-end border-2 rounded-pill overflow-hidden h-[36px] min-w-[36px] inputContainer ${!filterToggle ? 'w-full' : 'w-0'}`}>
                    <input type="text" placeholder='Search exercise' className={`outline-none px-2 py-1 w-100 ${!filterToggle ? 'block' : 'hidden'}`} onChange={_.debounce((e) => setSearchTerm(e.target.value), 300)} />
                    <i className="fa-solid fa-magnifying-glass mx-2 cursor-pointer" onClick={() => {filterToggle && setFilterToggle(!filterToggle); setSelectedFilter("All")}} />
                </div>
                </div>
                
            </div>
            <div className='bodyWrapper mt-3'>
                <h6 className='font-semibold mb-2'>{_.upperFirst(selectedFilter)} ({sortedExercises?.length})</h6>
                <div className='flex overflow-auto no-scrollbar gap-3 flex-wrap  justify-between '>
                    {sortedExercises.map(i => {
                        const image = i?.gifUrl
                        return (
                            <div key={i.id} onClick={()=>onSelectExercise(i)} className="min-w-[45%] max-w-[45%] cursor-pointer rounded-md overflow-hidden h-[260px] relative imgFilter" style={{ backgroundImage: `url(${image})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat', boxShadow: '#dcdcdc 0px 0px 5px 6px inset' }}>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t to-transparent from-[#032238] bg-opacity-50 p-2" >
                                    <h6 className="text-black font-bold text-[13px] mb-0 mt-5">{_.upperFirst(i.name)}</h6>
                                    <p className="text-white text-[11px] mb-0">{_.upperFirst(i.target)} ({i.secondaryMuscles.join(', ')})</p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
        </div>
    )
}

export default ExerciseCard