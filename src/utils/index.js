export const handleDate = (data) => {
  const dateArray = new Date(data)?.toDateString()?.split(" ");
  const date = `${dateArray[2]} ${dateArray[1]} ${dateArray[3]}`;
  return date;
};

export const calculateProgress = (plan) => {
  let totalExercises = 0;
  let completedExercises = 0;

  plan?.workoutPlan.forEach((week, weekIndex) => {
    week.forEach((day, dayIndex) => {
      day.exercises.forEach((_, exerciseIndex) => {
        totalExercises++;
        if (
          plan.exerciseHistory[`${weekIndex}-${dayIndex}-${exerciseIndex}`]
            ?.length > 0
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
  return progress;
};
