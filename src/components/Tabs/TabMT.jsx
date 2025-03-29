// components/Tabs/TabMT.jsx
import React, { useEffect } from "react";
import ExerciseCardSelected from "@/app/new/[plan]/ExerciseCardSelected"; // Adjust path

// Removed selectedDayKey logic from here, PlanDetail handles initial load.
function TabMT({
    tab,                // Array of day objects for the current week { label, value (day number), day, exercises }
    selectedDay,        // Numeric day number currently selected
    setSelectedDay,     // Function from PlanDetail to handle day selection (takes day number)
    exercisesBasedOnDay,// Object with data for the selected day { dayName, day, exercises, weekName, week }
    selectedPlanId,
    transFormedData,    // Pass the whole transformed data for context if needed lower down
    selectedWeek,       // Pass selected week object
    setSelectedWeek,    // Pass handler from PlanDetail (takes week object)
    weekStructure,      // Pass simplified week structure [{ week, weekName }]
    setSelectedDayDirectly, // Prop to allow deeper components to set day state in PlanDetail
    setSelectedWeekDirectly // Prop to allow deeper components to set week state in PlanDetail
 }) {

  // No local storage logic needed here for initial load, PlanDetail manages it.

  const handleTabClick = (dayNumber) => {
      setSelectedDay(dayNumber); // Call the handler from PlanDetail
  };

  // Prepare data needed by ExerciseCardSelected
  const dayDataForCard = tab?.map(i => ({
      label: i.label,
      value: i.value, // numeric day number
      day: i.day      // numeric day number
  })) || [];

  return (
    <div className="sticky top-0 z-10 bg-gray-50"> {/* Make tabs sticky */}
      {/* Day Tabs */}
      <div className="flex px-2 py-2 space-x-2 overflow-x-auto border-b border-blue-gray-50 no-scrollbar">
        {tab?.map(({ label, value }) => ( // value is the numeric day number
          <button
            key={value}
            onClick={() => handleTabClick(value)}
            className={`px-4 py-2 rounded-md text-sm whitespace-nowrap ${
              selectedDay === value
                ? "bg-gray-200 text-gray-900 font-semibold"
                : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200"
            } `}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Exercise Content Area */}
      {selectedDay !== null && exercisesBasedOnDay?.exercises ? (
        <div className="mt-0"> {/* Removed margin top */}
          <ExerciseCardSelected
             exercisesBasedOnDay={exercisesBasedOnDay} // Data for the specific day/week
             selectedPlanId={selectedPlanId}
             // Pass state and setters down for navigation logic
             selectedDay={selectedDay}                   // numeric day number
             setSelectedDay={setSelectedDayDirectly}     // Function to set day in PlanDetail
             selectedWeek={selectedWeek}                 // week object
             setSelectedWeek={setSelectedWeekDirectly}   // Function to set week in PlanDetail
             // Pass context needed for calculateNextDay
             dayData={dayDataForCard}                    // Array of { label, value, day } for the *current* week
             weekStructure={weekStructure}               // Array of { week, weekName } for the *whole plan*
             totalWeeksCount={parseInt(transFormedData?.weeks || '0', 10)} // Total number of weeks
             allWeeksData={transFormedData?.weeksExercise} // Pass full week data if calculateNext needs it
          />
        </div>
      ) : (
          <div className="p-4 text-center text-gray-500">Select a day to view exercises.</div>
      )}
    </div>
  );
}

export default TabMT;