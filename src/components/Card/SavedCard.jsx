import React from "react";

const SavedCard = ({ plan, onClick, onClickSecondary, isDisabled, isCompleted }) => {
  const calculateProgress = () => {
    let totalExercises = 0;
    let completedExercises = 0;

    plan?.workoutPlan.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        day.exercises.forEach((exercise, exerciseIndex) => {
          const exerciseKey = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
          totalExercises++;
          if (
            plan.exerciseHistory[exerciseKey] &&
            plan.exerciseHistory[exerciseKey].length > 0
          ) {
            completedExercises++;
          }
        });
      });
    });

    const progress =
      totalExercises > 0
        ? Math.round((completedExercises / totalExercises) * 100)
        : 0;
    return { progress, completedExercises, totalExercises };
  };

  const { progress } = calculateProgress();
  const date = plan?.date ? new Date(plan.date) : null;

  const formattedDate =
    date instanceof Date && !isNaN(date)
      ? date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Invalid Date";

  const segments = Array.from({ length: 30 }, (_, index) => {
    const segmentThreshold = ((index + 1) * 100) / 30;
    return progress >= segmentThreshold;
  });

  return (
    <div className={`max-w-sm p-6 bg-white shadow-lg rounded-xl ${plan.status === "active" && !isCompleted ? "border-2 border-green-500" : ""}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 text-xl font-semibold text-white bg-black rounded-full">
            {plan?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
        {plan.status === "active" && !isCompleted && (
          <span className="px-3 py-1 text-sm text-green-500 rounded-full bg-green-50">
            Active
          </span>
        )}
        {isCompleted && (
          <span className="px-3 py-1 text-sm text-gray-500 bg-gray-200 rounded-full">
            Completed
          </span>
        )}
      </div>

      <div className="mb-4 space-y-1">
        <p className="text-sm text-gray-500">{formattedDate}</p>
        <h2 className="text-xl font-semibold">{plan?.name}</h2>
        <h2 className="text-xl font-semibold">{`${plan.weeks} weeks, ${plan.daysPerWeek} days/week`}</h2>
      </div>

      <p className="mb-2">{`${progress}% complete`}</p>

      <div className="flex gap-1 mb-6">
        {segments.map((isComplete, index) => (
          <div
            key={index}
            className={`h-6 w-2 rounded-sm transition-colors ${
              isComplete
                ? index < 6
                  ? "bg-red-500"
                  : index < 12
                  ? "bg-orange-500"
                  : index < 18
                  ? "bg-yellow-500"
                  : index < 24
                  ? "bg-lime-400"
                  : index < 27
                  ? "bg-green-400"
                  : "bg-green-600"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      {/* Action buttons */}
      <button
        onClick={onClick}
        disabled={isDisabled}
        className={`w-full py-2 mb-2 text-white transition-colors rounded-full ${
          isDisabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-900 hover:bg-gray-800"
        }`}
      >
        {isCompleted
          ? "View Plan (Completed)"
          : plan.status === "active"
          ? "Continue Your Plan"
          : "Start Your Plan"}
      </button>

      <button
        onClick={onClickSecondary}
        disabled={plan.status === "active" && !isCompleted}
        className={`w-full py-2 text-center ${
          plan.status === "active" && !isCompleted
            ? "text-gray-400 cursor-not-allowed"
            : "text-red-500 hover:text-red-900"
        }`}
      >
        <i className="mr-4 fa-regular fa-trash-can" /> Delete Plan
      </button>
    </div>
  );
};

export default SavedCard;
