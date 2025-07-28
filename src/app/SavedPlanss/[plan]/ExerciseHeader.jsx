import React from "react";
import _ from "lodash";

const ExerciseHeader = ({
  exercise,
  addExerciseDetails,
  selectedWeek,
  selectedDay,
  exerciseIndex,
}) => {
  return (
    <div className="pb-4 mx-auto overflow-hidden bg-white border-b">
      <div className="flex items-center">
        <div className="flex items-center justify-center w-12 h-12 mr-4 bg-gray-200 rounded-full">
          <img
            src={exercise?.gifUrl}
            alt=""
            className="w-[60px] cursor-pointer"
          />
        </div>
        <div>
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-900 cursor-pointer">
              {_.upperFirst(exercise?.name)}
            </h2>
            <i className="mt-1 ml-4 cursor-pointer fa-duotone fa-solid fa-memo-circle-info" />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm text-gray-600 line-clamp-1">
              {_.upperFirst(exercise?.bodyPart)} (
              {_.upperFirst(exercise?.target)})
            </p>
            <span className="px-3 py-1 mr-2 text-xs text-white bg-black rounded-full">
              Sets :{" "}
              {exercise?.weeklySetConfig?.find((i) => i?.isConfigured)?.sets ??
                0}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="mt-2">
          <p className="text-sm font-medium text-black">Secondary Muscles</p>
          {exercise?.secondaryMuscles?.map((muscle) => (
            <span
              key={muscle}
              className="px-3 py-1 mr-2 text-xs text-gray-800 bg-gray-100 rounded-full"
            >
              #{muscle}
            </span>
          ))}
        </div>
        <i
          className="text-xl cursor-pointer fa-solid fa-circle-plus"
          onClick={() =>
            addExerciseDetails(selectedWeek, selectedDay, exerciseIndex)
          }
        />
      </div>
    </div>
  );
};

export default ExerciseHeader;
