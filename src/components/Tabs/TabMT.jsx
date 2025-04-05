// components/Tabs/TabMT.jsx
import React from "react"; // Removed useEffect, not needed here
import ExerciseCardSelected from "@/app/new/[plan]/ExerciseCardSelected"; // Adjust path

function TabMT({
    tab,
    selectedDay,
    setSelectedDay,
    exercisesBasedOnDay,
    selectedPlanId,
    transFormedData,
    selectedWeek,
    setSelectedWeek,
    weekStructure,
    setSelectedDayDirectly,
    setSelectedWeekDirectly,
    // *** ACCEPT FIREBASE DATA ***
    firebaseStoredData
 }) {

  const handleTabClick = (dayNumber) => {
      setSelectedDay(dayNumber);
  };

  const dayDataForCard = tab?.map(i => ({
      label: i.label, value: i.value, day: i.day
  })) || [];

  return (
    <div className="sticky top-0 z-10 bg-gray-50">
      {/* Day Tabs */}
      <div className="flex px-2 py-2 space-x-2 overflow-x-auto border-b border-blue-gray-50 no-scrollbar">
        {tab?.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => handleTabClick(value)}
            className={`px-4 py-2 rounded-md text-sm whitespace-nowrap ${
              selectedDay === value
                ? "bg-black text-white font-semibold"
                : "bg-white text-gray-700 hover:bg-gray-200 border border-gray-200"
            } `}
            // disabled={selectedDay !== value}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Exercise Content Area */}
      {selectedDay !== null && exercisesBasedOnDay?.exercises ? (
        <div className="mt-0">
          <ExerciseCardSelected
             exercisesBasedOnDay={exercisesBasedOnDay}
             selectedPlanId={selectedPlanId}
             selectedDay={selectedDay}
             setSelectedDay={setSelectedDayDirectly}
             selectedWeek={selectedWeek}
             setSelectedWeek={setSelectedWeekDirectly}
             dayData={dayDataForCard}
             weekStructure={weekStructure}
             totalWeeksCount={parseInt(transFormedData?.weeks || '0', 10)}
             allWeeksData={transFormedData?.weeksExercise}
             // *** PASS FIREBASE DATA DOWN ***
             firebaseStoredData={firebaseStoredData}
          />
        </div>
      ) : (
          <div className="p-4 text-center text-gray-500">Select a day to view exercises.</div>
      )}
    </div>
  );
}

export default TabMT;