import React, { useMemo, useState } from 'react'
// import { exercises } from '@/utils/exercise';
import _ from 'lodash';
import PillButton from '../Button/PillButton';
import { useQuery } from '@tanstack/react-query';
import { getExercises } from '@/service/exercise';
import CCard from '../CCard';
import BlurryBlob from '../BlurryBlob/BlurryBlob';

const ExerciseCard = ({onSelectExercise,handleClose}) => {
    const { data: exercisesData, error: exerciseError,refetch:exerciseRefetch,isFetching } = useQuery({
        queryKey: ['exercise'],
        queryFn: getExercises,

        refetchOnWindowFocus: false,
        infinite: false,
      });
      
    
    const [filterToggle, setFilterToggle] = useState(false)
    const [selectedFilter, setSelectedFilter] = useState("All")
    const [searchTerm, setSearchTerm] = useState("")

    const getFilterArray = _.memoize((exercisesData) => {
        if (!exercisesData) return ["All"];
        return ["All", ..._.sortBy(_.uniq(exercisesData.map(i => i?.target)))];
    });
    
    const getFilteredExercises = _.memoize((exercisesData, selectedFilter) => {
        if (!exercisesData) return [];
        return exercisesData.filter(exercise => 
            selectedFilter === "All" || exercise.target === selectedFilter
        );
    });
    
    const getSearchedExercises = _.memoize((filteredExercises, searchTerm) => {
        return filteredExercises.filter(exercise => 
            exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
            exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });
    
    const getSortedExercises = _.memoize((searchedExercises, selectedFilter) => {
        return _.sortBy(searchedExercises, exercise => 
            exercise.target === selectedFilter ? -1 : 1
        );
    });

    const filterArray = useMemo(() => getFilterArray(exercisesData), [exercisesData]);
    const shortedFilter = [..._.sortBy(filterArray)]
    const filteredExercises = useMemo(() => getFilteredExercises(exercisesData, selectedFilter), [exercisesData, selectedFilter]);
    const searchedExercises = useMemo(() => getSearchedExercises(filteredExercises, searchTerm), [filteredExercises, searchTerm]);
    const sortedExercises = useMemo(() => getSortedExercises(searchedExercises, selectedFilter), [searchedExercises, selectedFilter]);

    return (
        <div>
            <BlurryBlob />
        
        <div className='flex w-full flex-column '>
            <div className="sticky top-0 z-[9999] gap-1 pb-2  ">
                
                <span className='block mb-2  cursor-pointer' onClick={handleClose}><i className="pr-2 fa-solid fa-angle-left" />{_.upperFirst("Go back")}</span>
                <div className='flex gap-1'>
                <PillButton onClick={() => setFilterToggle(!filterToggle)} className="!bg-black text-white  h-[36px] flex items-center justify-center " title="Filter" icon={<i className="pr-2 fa-solid fa-arrow-right-arrow-left" />} />
                
                <div className='flex overflow-y-scroll no-scrollbar rounded-pill '>{filterToggle && shortedFilter?.map(i => (
                    <PillButton onClick={() => {setSelectedFilter(i);setSearchTerm('')}} className={` ${i === selectedFilter ? "bg-black text-white" : "bg-white"} borderOne mr-2 h-[36px] flex items-center justify-center w-100`} title={_.upperFirst(i)} />
                ))}
                </div>
                <div className={`flex items-center bg-white justfy-end border-2 rounded-pill overflow-hidden h-[36px] min-w-[36px] inputContainer ${!filterToggle ? 'w-full' : 'w-0'}`}>
                    <input type="text" placeholder='Search exercise' className={`outline-none px-2 py-1 w-100 ${!filterToggle ? 'block' : 'hidden'}`} onChange={_.debounce((e) => setSearchTerm(e.target.value), 300)} />
                    <i className="mx-2 cursor-pointer fa-solid fa-magnifying-glass" onClick={() => {filterToggle && setFilterToggle(!filterToggle); setSelectedFilter("All")}} />
                </div>
                </div>
                
            </div>
            <div className='mt-3 bodyWrapper '>
                <h6 className='mb-2 font-semibold'>{_.upperFirst(selectedFilter)} ({sortedExercises?.length})</h6>
                <div className='flex flex-wrap justify-between mb-2 overflow-auto no-scrollbar '>
                    {sortedExercises.map(i => {
                        const image = i?.gifUrl
                        return (
                            <>
                            
<CCard key={i.id} onClick={()=>onSelectExercise(i)}   img={image} bgColor="bg-[#DBFE02]" parentStyle="min-w-[166px] max-w-[166px] mb-2 " caption={i?.bodyPart} title={i?.target} name={i?.name}   />
                                {/* <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t to-transparent from-[#032238] bg-opacity-50 p-2" >
                                    <h6 className="text-black font-bold text-[13px] mb-0 mt-5">{_.upperFirst(i.name)}</h6>
                                    <p className="text-white text-[11px] mb-0">{_.upperFirst(i.target)} ({i.secondaryMuscles.join(', ')})</p>
                                </div> */}
                            
                            </>
                        )
                    })}
                </div>
            </div>

        </div>
        </div>
    )
}

export default ExerciseCard