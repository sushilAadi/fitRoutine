import React from 'react';

const WorkoutProgressCard = ({ plan }) => {
  const calculateProgress = () => {
    let totalExercises = 0;
    let completedExercises = 0;

    plan.workoutPlan.forEach((week, weekIndex) => {
      week.forEach((day, dayIndex) => {
        day.exercises.forEach((exercise, exerciseIndex) => {
          const exerciseKey = `${weekIndex}-${dayIndex}-${exerciseIndex}`;
          totalExercises++;
          if (plan.exerciseHistory[exerciseKey] && plan.exerciseHistory[exerciseKey].length > 0) {
            completedExercises++;
          }
        });
      });
    });

    const progress = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
    return { progress, completedExercises, totalExercises };
  };

  const { progress, completedExercises, totalExercises } = calculateProgress();

  return (
    <div className="w-full max-w-sm card">
      <div className="card-body">
        <h5 className="card-title">{plan.name}</h5>
        <h6 className="mb-2 card-subtitle text-muted">{`${plan.weeks} weeks, ${plan.daysPerWeek} days/week`}</h6>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4 dark:bg-gray-700">
          <div className="bg-blue-600 h-2.5 rounded-full" style={{width: `${progress}%`}}></div>
        </div>
        <p className="text-sm text-gray-600 card-text">{`${progress}% complete`}</p>
        <p className="mt-2 text-sm text-gray-600 card-text">{`${completedExercises} out of ${totalExercises} exercises completed`}</p>
      </div>
    </div>
  );
};

export default WorkoutProgressCard;

