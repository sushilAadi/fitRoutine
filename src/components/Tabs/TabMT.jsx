import React, { useEffect, useState, useMemo } from "react";
import ExerciseCardSelected from "@/app/new/[plan]/ExerciseCardSelected";

function TabMT({ tab, selectededDay,setSelectedWeek,selectedWeek, setSelectededDay, exercisesBasedOnDay,selectedPlanId,noOfweeks,weekStructure }) {
  const data = tab;

  const selectedDayKey = `selectedDay_${selectedPlanId || 'default'}`;

  useEffect(() => {
    try {
     
      const storedSelectedDay = localStorage.getItem(selectedDayKey);
      
      if (!selectededDay && storedSelectedDay) {
        setSelectededDay(+storedSelectedDay);
      }
    } catch (error) {
      console.error("Error retrieving from localStorage:", error);
    }
  }, []); 
  
  
  useEffect(() => {
    try {
      if (data?.length > 0 && !selectededDay) {
        setSelectededDay(+data[0].value);
        localStorage.setItem(selectedDayKey, data[0].value);
      }
    } catch (error) {
      console.error("Error storing in localStorage:", error);
    }
  }, [data, selectededDay, selectedPlanId]);
  


  const shareNecessaryData = data?.map(i=>({label:i.label,value:i.value,day:i?.day})) || [];


  return (
    <div>
      <div className="flex space-x-2 border-b border-blue-gray-50">
        {data?.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSelectededDay(value)}
            className={`px-4 py-2 rounded-md ${
              selectededDay === value
                ? "bg-gray-200 text-gray-900 font-semibold"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            } whitespace-nowrap`}
          >
            {label}
          </button>
        ))}
      </div>

      {selectededDay && (
        <div className="mt-4">
          <ExerciseCardSelected dayData={shareNecessaryData} weekStructure={weekStructure} selectedPlanId={selectedPlanId} noOfweeks={noOfweeks} setSelectedWeek={setSelectedWeek} selectedWeek={selectedWeek} selectededDay={selectededDay} setSelectededDay={setSelectededDay} exercisesBasedOnDay={exercisesBasedOnDay} />
        </div>
      )}
    </div>
  );
}

export default TabMT;