import { parseISO, differenceInYears, isValid } from 'date-fns';

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

export const calculateAge = (dateString) => {
  if (!dateString) {
    // Handle null or undefined input
    console.warn("Date string is null or undefined.");
    return "Invalid date";
  }

  try {
    const birthDate = parseISO(dateString); // Parse ISO date string

    if (!isValid(birthDate)) {
      // Handle invalid date format
      console.warn("Invalid date format:", dateString);
      return "Invalid date";
    }

    const currentAge = differenceInYears(new Date(), birthDate); // Calculate age
    return currentAge;
  } catch (error) {
    console.error("Error parsing date:", error);
    return "Invalid date";
  }
};

export const calculateBMI = (weight, height) => {
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

export const normalizeToLocalDate = (date) => {
  if (!date) return null;
  // Create a new Date object with only the date part (set hours to 0)
  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return normalizedDate.toISOString().split('T')[0]; // Return "YYYY-MM-DD"
};