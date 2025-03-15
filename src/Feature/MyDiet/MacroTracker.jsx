import React from "react";
import { Progress } from "@material-tailwind/react";

const MacroTracker = ({
  macroData,
  caloriesLeft,
  macrosLeft,
  totalCaloriesPlanned, // Rename prop
  plannedCarbs,
  plannedProtein,
  plannedFat,
}) => {
  const carbsPercentage =
    plannedCarbs > 0 ? ((plannedCarbs - macrosLeft.carbs) / plannedCarbs) * 100 : 0;
  const proteinPercentage =
    plannedProtein > 0 ? ((plannedProtein - macrosLeft.protein) / plannedProtein) * 100 : 0;
  const fatPercentage =
    plannedFat > 0 ? ((plannedFat - macrosLeft.fat) / plannedFat) * 100 : 0;

  return (
    <div className="p-4 mt-2">
      <div className="flex items-center justify-between">
        <div className="">
          <div className="relative w-36 h-36">
            <div className="inset-0 flex flex-col">
              <span className="text-3xl font-bold text-gray-800">
                {caloriesLeft}
              </span>
              <span className="text-xs text-gray-500">KCALS LEFT</span>
              <span className="text-xs text-gray-500">
                Total KCALS Planned: {totalCaloriesPlanned}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="w-[16px] h-[16px] bg-[red]"></span>CARBS
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[16px] h-[16px] bg-blue-500"></span>PROTEIN
            </div>
            <div className="flex items-center gap-2">
              <span className="w-[16px] h-[16px] bg-[#ffc107]"></span>FAT
            </div>
          </div>
        </div>
        <div className="w-1/2 space-y-3">
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-600">
              <span>CARBS</span>
              <span>{macrosLeft.carbs}g left</span>
            </div>
            <Progress value={carbsPercentage} color="red" className="h-2" />
          </div>
          <div>
            <div className="flex justify-between my-2 text-xs text-gray-600">
              <span>PROTEIN</span>
              <span>{macrosLeft.protein}g left</span>
            </div>
            <Progress value={proteinPercentage} color="blue" className="h-2" />
          </div>
          <div>
            <div className="flex justify-between mb-1 text-xs text-gray-600">
              <span>FAT</span>
              <span>{macrosLeft.fat}g left</span>
            </div>
            <Progress value={fatPercentage} color="amber" className="h-2" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MacroTracker;