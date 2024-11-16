import React, { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import PillButton from "../Button/PillButton";
import { useQuery } from "@tanstack/react-query";
import { getExercises } from "@/service/exercise";
import CCard from "../CCard";
import ButtonCs from "../Button/ButtonCs";

const ExerciseCard = ({ onSelectExercise, handleClose, formData,currentWeekIndex, currentDayIndex  }) => {
  const { planName, weeks, daysPerWeek, workoutPlan } = formData;

  const isExerciseSelected = (exercise) => {
    if (!workoutPlan || !workoutPlan[currentWeekIndex] || !workoutPlan[currentWeekIndex][currentDayIndex]) {
      return false;
    }
    
    // Only check exercises for the current day
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

  useEffect(() => {
    if (!workoutPlan[currentWeekIndex] || !workoutPlan[currentWeekIndex][currentDayIndex]) {
      setButtonText("Please select and proceed");
      return;
    }
    
    const currentDayExercises = workoutPlan[currentWeekIndex][currentDayIndex].exercises;
    setButtonText(currentDayExercises.length === 0 ? "Please select and proceed" : "Complete");
  }, [workoutPlan, currentWeekIndex, currentDayIndex]);

  const {
    data: exercisesData,
    error: exerciseError,
    refetch: exerciseRefetch,
    isFetching,
  } = useQuery({
    queryKey: ["exercise"],
    queryFn: getExercises,
    refetchOnWindowFocus: false,
    infinite: false,
  });

  const [filterToggle, setFilterToggle] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const getFilterArray = _.memoize((exercisesData) => {
    if (!exercisesData) return ["All"];
    return ["All", ..._.sortBy(_.uniq(exercisesData.map((i) => i?.target)))];
  });

  const getFilteredExercises = _.memoize((exercisesData, selectedFilter) => {
    if (!exercisesData) return [];
    return exercisesData.filter(
      (exercise) => selectedFilter === "All" || exercise.target === selectedFilter
    );
  });

  const getSearchedExercises = _.memoize((filteredExercises, searchTerm) => {
    return filteredExercises.filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.bodyPart.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getSortedExercises = _.memoize((searchedExercises, selectedFilter) => {
    return _.sortBy(searchedExercises, (exercise) =>
      exercise.target === selectedFilter ? -1 : 1
    );
  });

  const filterArray = useMemo(
    () => getFilterArray(exercisesData),
    [exercisesData]
  );
  const shortedFilter = [..._.sortBy(filterArray)];
  const filteredExercises = useMemo(
    () => getFilteredExercises(exercisesData, selectedFilter),
    [exercisesData, selectedFilter]
  );
  const searchedExercises = useMemo(
    () => getSearchedExercises(filteredExercises, searchTerm),
    [filteredExercises, searchTerm]
  );
  const sortedExercises = useMemo(
    () => getSortedExercises(searchedExercises, selectedFilter),
    [searchedExercises, selectedFilter]
  );

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
            {filterToggle &&
              shortedFilter?.map((i) => (
                <PillButton
                  key={i}
                  onClick={() => {
                    setSelectedFilter(i);
                    setSearchTerm("");
                  }}
                  className={`${
                    i === selectedFilter ? "bg-black text-white" : "bg-white"
                  } borderOne mr-2 h-[36px] flex items-center justify-center w-100`}
                  title={_.upperFirst(i)}
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
      <div className="flex flex-wrap justify-between p-3 mb-2 overflow-auto overflow-y-auto exerciseCard no-scrollbar">
        {sortedExercises.map((i) => {
          const image = i?.gifUrl;
          const isSelected = isExerciseSelected(i);
          
          return (
            <div className="relative" key={i.id}>
              <CCard
                onClick={() => handleExerciseClick(i)}
                img={image}
                bgColor="bg-[#DBFE02]"
                parentStyle="min-w-[166px] max-w-[166px] mb-3"
                caption={i?.bodyPart}
                title={i?.target}
                name={i?.name}
              />
              {isSelected && (
                <div className="absolute w-[20px] h-[20px] bg-white rounded bottom-[8px] right-[-6px] z-10 flex justify-center items-center">
                  <i className="text-red-500 fa-regular fa-circle-check"/>
                </div>
              )}
            </div>
          );
        })}
      </div>
      {sortedExercises?.length !== 0 && (
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