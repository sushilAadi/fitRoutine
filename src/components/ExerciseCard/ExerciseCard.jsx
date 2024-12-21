import React, { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { FixedSizeList } from 'react-window';
import PillButton from "../Button/PillButton";
import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/service/exercise";
import CCard from "../CCard";
import ButtonCs from "../Button/ButtonCs";

const ExerciseCard = ({ onSelectExercise, handleClose, formData, currentWeekIndex, currentDayIndex }) => {
  const { planName, workoutPlan } = formData;
  const CARD_WIDTH = 166; // Width of each card
  const ROW_HEIGHT = 280; // Increased height to accommodate vertical spacing
  const ROW_PADDING = 16; // Horizontal padding
  const VERTICAL_SPACING = 24; // Vertical spacing between cards

  const isExerciseSelected = (exercise) => {
    if (!workoutPlan?.[currentWeekIndex]?.[currentDayIndex]) return false;
    const currentDayExercises = workoutPlan[currentWeekIndex][currentDayIndex].exercises;
    return currentDayExercises.some(e => e.id === exercise.id);
  };

  const handleExerciseClick = (exercise) => {
    if (isExerciseSelected(exercise)) {
      onSelectExercise(null, exercise);
    } else {
      onSelectExercise(exercise);
    }
  };

  const [buttonText, setButtonText] = useState("Please select and proceed");
  const [filterToggle, setFilterToggle] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Ref for the container div
  const containerRef = React.useRef(null);

  // Update container size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { data: exercisesData = [] } = useQuery({
    queryKey: ["exercise"],
    queryFn: getExercises,
    refetchOnWindowFocus: false,
  });

  // Memoized filter and sort operations
  const filterArray = useMemo(() => 
    ["All", ..._.sortBy(_.uniq(exercisesData.map(i => i?.target)))],
    [exercisesData]
  );

  const sortedExercises = useMemo(() => {
    let filtered = exercisesData;
    
    if (selectedFilter !== "All") {
      filtered = filtered.filter(exercise => exercise.target === selectedFilter);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return _.sortBy(filtered, exercise => 
      exercise.target === selectedFilter ? -1 : 1
    );
  }, [exercisesData, selectedFilter, searchTerm]);

  // Calculate items per row based on container width
  const itemsPerRow = Math.floor((containerSize.width - (ROW_PADDING * 2)) / CARD_WIDTH);
  const rows = Math.ceil(sortedExercises.length / itemsPerRow);

  // Row renderer for react-window
  const Row = ({ index, style }) => {
    const startIndex = index * itemsPerRow;
    const rowExercises = sortedExercises.slice(startIndex, startIndex + itemsPerRow);
    
    return (
      <div style={{
        ...style,
        display: 'flex',
        justifyContent: 'space-between',
        padding: `0 ${ROW_PADDING}px`,
        marginBottom: VERTICAL_SPACING,
      }}>
        {rowExercises.map((exercise) => (
          <div 
            className="relative" 
            key={exercise.id}
            style={{ marginBottom: VERTICAL_SPACING }}
          >
            <CCard
              onClick={() => handleExerciseClick(exercise)}
              img={exercise.gifUrl}
              bgColor="bg-[#DBFE02]"
              parentStyle="min-w-[166px] max-w-[166px]"
              caption={exercise.bodyPart}
              title={exercise.target}
              name={exercise.name}
            />
            {isExerciseSelected(exercise) && (
              <div className="absolute w-[20px] h-[20px] bg-white rounded bottom-[8px] right-[-6px] z-10 flex justify-center items-center">
                <i className="text-red-500 fa-regular fa-circle-check"/>
              </div>
            )}
          </div>
        ))}
        {/* Add spacer elements to maintain justify-between alignment */}
        {rowExercises.length < itemsPerRow && 
          [...Array(itemsPerRow - rowExercises.length)].map((_, i) => (
            <div 
              key={`spacer-${i}`} 
              style={{ width: CARD_WIDTH }}
            />
          ))
        }
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="top-0 p-3 bg-black sticky-top">
        <div className="flex items-center cursor-pointer" onClick={handleClose}>
          <i className="pr-2 text-gray-400 fa-solid fa-angle-left" />       
          <h1 className="text-white">{planName}</h1>
        </div>
        
        <p className="my-2 text-gray-400">Week {currentWeekIndex + 1} | Day {currentDayIndex + 1}</p>
        
        <div className="flex gap-1">
          <PillButton
            onClick={() => setFilterToggle(!filterToggle)}
            className="!text-black bg-white h-[36px] flex items-center justify-center"
            title="Filter"
            icon={<i className="pr-2 fa-solid fa-arrow-right-arrow-left" />}
          />
          
          <div className="flex overflow-y-scroll no-scrollbar rounded-pill">
            {filterToggle && filterArray.map(filter => (
              <PillButton
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter);
                  setSearchTerm("");
                }}
                className={`${
                  filter === selectedFilter ? "bg-black text-white" : "bg-white"
                } borderOne mr-2 h-[36px] flex items-center justify-center w-100`}
                title={_.upperFirst(filter)}
              />
            ))}
          </div>
          
          <div className={`flex items-center bg-white justfy-end border-2 rounded-pill overflow-hidden h-[36px] min-w-[36px] inputContainer ${
            !filterToggle ? "w-full" : "w-0"
          }`}>
            <input
              type="text"
              placeholder="Search exercise"
              className={`outline-none px-2 py-1 w-100 ${
                !filterToggle ? "block" : "hidden"
              }`}
              onChange={_.debounce((e) => setSearchTerm(e.target.value), 300)}
            />
            <i
              className="mx-2 cursor-pointer fa-solid fa-magnifying-glass"
              onClick={() => {
                filterToggle && setFilterToggle(!filterToggle);
                setSelectedFilter("All");
              }}
            />
          </div>
        </div>
        
        <h6 className="mt-2 font-semibold text-white">
          {_.upperFirst(selectedFilter)} ({sortedExercises?.length})
        </h6>
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden">
        {containerSize.width > 0 && (
          <FixedSizeList
            className="my-4 no-scrollbar"
            height={containerSize.height}
            itemCount={rows}
            itemSize={ROW_HEIGHT}
            width={containerSize.width}
            overscanCount={2}
          >
            {Row}
          </FixedSizeList>
        )}
      </div>

      {sortedExercises?.length > 0 && (
        <div className="p-3">
          <ButtonCs
            title={buttonText}
            type="button"
            className="w-100 min-w-[184px]"
            onClick={handleClose}
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseCard;