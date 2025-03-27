import React, { useEffect, useState, useMemo } from "react";
import ExerciseCardSelected from "@/app/new/[plan]/ExerciseCardSelected";

function TabMT({ tab, selectededDay, setSelectededDay, exercisesBasedOnDay }) {
  const data = tab;

  // Use useMemo to calculate the initial tab value
  const initialTab = useMemo(() => {
    return data && data.length > 0 ? data[0].value : null;
  }, [data]);

  console.log("called", initialTab);

  // Set the selected day when the component mounts or data changes
  useEffect(() => {
    console.log("called useEffect running");
    if (data?.length > 0 && !selectededDay) {
      console.log("called Setting selected day to", initialTab);
      setSelectededDay(initialTab);
    }
  }, [data, initialTab, selectededDay, setSelectededDay]);

  console.log("called outside Current selectededDay:", selectededDay);

  // Use a fallback value if selectededDay is null
  const activeTab = selectededDay || initialTab;

  return (
    <div>
      <div className="flex space-x-2 border-b border-blue-gray-50">
        {data?.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setSelectededDay(value)}
            className={`px-4 py-2 rounded-md ${
              activeTab === value
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
          <ExerciseCardSelected exercisesBasedOnDay={exercisesBasedOnDay} />
        </div>
      )}
    </div>
  );
}

export default TabMT;