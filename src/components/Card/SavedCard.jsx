import React from "react";

const SavedCard = ({
  plan,
  onClick,
  onClickSecondary,
  isDisabled,
  isCompleted,
}) => {
  const progress = plan?.progress;
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
    <div
      className={`max-w-sm p-6 bg-white shadow-lg rounded-xl ${
        plan.status === "active" && !isCompleted
          ? "border-2 border-green-500"
          : ""
      }`}
      style={{
        boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
      }}
    >
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
        <h2 className="text-xl font-semibold">{`${plan?.weeks} weeks, ${plan?.daysPerWeek} days/week`}</h2>
        {/* Display calories burnt */}
        <span className="text-sm font-semibold text-black">
  Calories Burnt: <span className="text-lg text-red-500">{plan.caloriesBurnt ?? 0} kcal</span>
</span>
      </div>

      <p className="mb-2">{`${progress ?? 0}% complete`}</p>

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
        className={`w-full py-2 text-center text-red-500 hover:text-red-900 ${
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