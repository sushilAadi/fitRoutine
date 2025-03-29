import { parseISO, differenceInYears, isValid } from 'date-fns';

export const handleDate = (data) => {
  const dateArray = new Date(data)?.toDateString()?.split(" ");
  const date = `${dateArray[2]} ${dateArray[1]} ${dateArray[3]}`;
  return date;
};

export const calculateProgress = (plan) => {
  let totalExercises = 0;
  let completedExercises = 0;
const planWOrkoutPlan  = typeof plan?.workoutPlan === 'string' ? JSON.parse(plan?.workoutPlan) : plan?.workoutPlan
planWOrkoutPlan?.forEach((week, weekIndex) => {
    week?.forEach((day, dayIndex) => {
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

export const goals = [
  {
    id: "weight-loss",
    title: "Weight loss",
    icon: "🍎",
    color: "bg-rose-200",
  },
  {
    id: "weight-gain",
    title: "Weight Gain",
    icon: "🍛",
    color: "bg-yellow-200",
  },
  {
    id: "better-sleep",
    title: "Better sleeping habit",
    icon: "🌙",
    color: "bg-slate-700",
  },
  {
    id: "nutrition",
    title: "Track my nutrition",
    icon: "🥑",
    color: "bg-gray-100",
  },
  {
    id: "fitness",
    title: "Improve overall fitness",
    icon: "💪",
    color: "bg-gray-100",
  },
];

export const activity_goals = [
  {
    id: "sedentary",
    title: "Sedentary",
    subtitle: "Little to no exercise",
    icon: "🪑",
    color: "bg-gray-100",
    factor: 1.2,
  },
  {
    id: "lightly-active",
    title: "Lightly Active",
    subtitle: "Light exercise/sports 1-3 days/week",
    icon: "🚶‍♂️",
    color: "bg-green-100",
    factor: 1.375,
  },
  {
    id: "moderately-active",
    title: "Moderately Active",
    subtitle: "Moderate exercise/sports 3-5 days/week",
    icon: "🏃‍♂️",
    color: "bg-yellow-100",
    factor: 1.55,
  },
  {
    id: "very-active",
    title: "Very Active",
    subtitle: "Hard exercise/sports 6-7 days/week",
    icon: "🏋️‍♂️",
    color: "bg-orange-100",
    factor: 1.725,
  },
  {
    id: "super-active",
    title: "Super Active",
    subtitle: "Very hard exercise/physical job",
    icon: "🔥",
    color: "bg-red-100",
    factor: 1.9,
  },
];

export const qualificationOptions = [
  {
    value: "Certified Personal Trainer",
    label: "Certified Personal Trainer",
  },
  { value: "Nutritionist", label: "Nutritionist" },
  { value: "Fitness Instructor", label: "Fitness Instructor" },
];
export const specializationOptions = [
  { value: "Weight Training", label: "Weight Training" },
  { value: "Cardio", label: "Cardio" },
  { value: "Yoga", label: "Yoga" },
  { value: "Nutrition Planning", label: "Nutrition Planning" },
];

export const languageOptions = [
  { value: "Hindi", label: "Hindi" },
  { value: "English", label: "English" },
  { value: "Assamese", label: "Assamese" },
  { value: "Bengali", label: "Bengali" },
  { value: "Gujarati", label: "Gujarati" },
  { value: "Kannada", label: "Kannada" },
  { value: "Malayalam", label: "Malayalam" },
  { value: "Marathi", label: "Marathi" },
  { value: "Punjabi", label: "Punjabi" },
  { value: "Tamil", label: "Tamil" },
  { value: "Telugu", label: "Telugu" },
  { value: "Urdu", label: "Urdu" },
  
];

export const trainingLocationOptions = [
  { value: "Gym", label: "Gym" },
  { value: "Home", label: "Home" },
  { value: "Online", label: "Online" },
];


export const daysOptions = [
  { value: "Monday", label: "Monday" },
  { value: "Tuesday", label: "Tuesday" },
  { value: "Wednesday", label: "Wednesday" },
  { value: "Thursday", label: "Thursday" },
  { value: "Friday", label: "Friday" },
  { value: "Saturday", label: "Saturday" },
  { value: "Sunday", label: "Sunday" },
];

export const hoursOptions = [
  { value: "Morning", label: "Morning" },
  { value: "Afternoon", label: "Afternoon" },
  { value: "Evening", label: "Evening" },
];
export const booleanOptions = [
  { value: true, label: "Yes" },
  { value: false, label: "No" },
];





const DummyContent = () => {
  return (<>
    <div
          key={"dummy-content"}
          className="mb-4 md:p-14 ">
          <p
            className="max-w-3xl mx-auto font-sans text-base text-neutral-600 md:text-2xl">
            <span className="font-bold text-neutral-700">
              sushil The first rule of Apple club is that you boast about Apple club.
            </span>{" "}
            Keep a journal, quickly jot down a grocery list, and take amazing
            class notes. Want to convert those notes to text? No problem.
            Langotiya jeetu ka mara hua yaar is ready to capture every
            thought.
          </p>
          
        </div>
      

  </>);
};

export const Dummydata = [
  {
    category: "Artificial Intelligence",
    title: "You can do more with AI.",
    src: "https://img.freepik.com/premium-photo/fitness-enthusiast-doing-leg-extensions_1154722-1830.jpg?uid=R100761551&ga=GA1.1.1872205971.1727020370",
    content: <DummyContent />,
  },
  {
    category: "Productivity",
    title: "Enhance your productivity.",
    src: "https://img.freepik.com/free-photo/portrait-handsome-man_23-2150770955.jpg?t=st=1735409616~exp=1735413216~hmac=fb922b4d8c509322ebe7cd71210662a7b48d9a54da59e460ef5b5d0064223791&w=740",
    content: <DummyContent />,
  },
  {
    category: "Product",
    title: "Launching the new Apple Vision Pro.",
    src: "https://img.freepik.com/free-photo/fit-individual-doing-sport_23-2151764395.jpg?t=st=1735409704~exp=1735413304~hmac=79805a697ca9056b5ba8446c6c83d10bcf252dabda5fa4c8addb6d7b0c4f38d0&w=740",
    content: <DummyContent />,
  },

  {
    category: "Product",
    title: "Maps for your iPhone 15 Pro Max.",
    src: "https://img.freepik.com/free-photo/cinematic-fitness-man-photography_1409-6468.jpg?uid=R100761551&ga=GA1.1.1872205971.1727020370&semt=ais_hybrid",
    content: <DummyContent />,
  },
  {
    category: "iOS",
    title: "Photography just got better.",
    src: "https://img.freepik.com/free-photo/adult-training-with-dumbbell_23-2151717289.jpg?uid=R100761551&ga=GA1.1.1872205971.1727020370&semt=ais_hybrid",
    content: <DummyContent />,
  },
  {
    category: "Hiring",
    title: "Hiring for a Staff Software Engineer",
    src: "https://img.freepik.com/free-photo/athletic-man-practicing-gymnastics-keep-fit_23-2150989955.jpg?uid=R100761551&ga=GA1.1.1872205971.1727020370&semt=ais_hybrid",
    content: <DummyContent />,
  },
];


export const transformData = (data) => {
  try {
    if (!data) {
      console.error("Error: Data is null or undefined.");
      return null; // Or throw an error, or return a default object
    }

    const {
      id,
      name,
      progress,
      workoutPlan,
      exerciseHistory,
      dayNames,
      daysPerWeek,
      weeks,
      weekNames,
      setUpdate,
      date,
    } = data;

    const weeksData = workoutPlan.map((week, weekIndex) => {
      const days = week.map((dayData, dayIndex) => {
        const exercises = dayData.exercises.map((exercise) => {
          const configuredSet = exercise.weeklySetConfig.find(
            (set) => set.isConfigured
          );

          let weeklySetConfig = null;

          if (configuredSet) {
            weeklySetConfig = {
              sets: configuredSet.sets,
              isConfigured: configuredSet.isConfigured,
            };
          }
          return {
            bodyPart: exercise.bodyPart,
            equipment: exercise.equipment,
            gifUrl: exercise.gifUrl,
            id: exercise.id,
            instructions: exercise.instructions,
            name: exercise.name,
            target: exercise.target,
            secondaryMuscles: exercise.secondaryMuscles,
            weeklySetConfig: weeklySetConfig,
          };
        });

        return {
          day: dayData.day,
          dayName: dayNames[dayIndex],
          exercises: exercises,
        };
      });

      return {
        week:weekIndex,
        weekName: weekNames[weekIndex],
        days: days,
      };
    });

    return {
      id: id,
      name: name,
      progress: progress,
      weeks: weeks,
      weeksExercise: weeksData,
      exerciseHistory: exerciseHistory,
      daysPerWeek: parseInt(daysPerWeek),
      weeksCount: parseInt(weeks),
      setUpdate: setUpdate,
      date: date,
    };
  } catch (error) {
    console.error("An error occurred during data transformation:", error);
    return null; // Or throw the error, or return a default object
  }
};

export const calculateNextDay = (currentWeekIndex, currentDayNumber, weekData, totalWeeksCount) => {
  // weekData should be the structure like: transFormWorkoutData.weeksExercise
  if (!weekData || weekData.length === 0 || currentWeekIndex < 0 || currentWeekIndex >= weekData.length) {
      console.error("Invalid input to calculateNextDay: weekData or currentWeekIndex invalid.", { currentWeekIndex, weekData });
      return 'error';
  }

  const currentWeek = weekData[currentWeekIndex];
  if (!currentWeek || !currentWeek.days || currentWeek.days.length === 0) {
      console.error("Invalid input to calculateNextDay: current week data invalid.", { currentWeek });
      return 'error';
  }

  const dayDataForCurrentWeek = currentWeek.days; // Array of day objects { day: number, dayName: string, ... }
  const totalDaysInWeek = dayDataForCurrentWeek.length;
  const currentDayObjIndex = dayDataForCurrentWeek.findIndex(d => d.day === currentDayNumber);

  if (currentDayObjIndex === -1) {
      console.error("Current day number not found in current week's days data.", { currentDayNumber, dayDataForCurrentWeek });
      return 'error';
  }

  let nextWeekIndex = currentWeekIndex;
  let nextDayNumber;
  let nextDayObj;

  if (currentDayObjIndex < totalDaysInWeek - 1) {
      // Advance to next day in the same week
      nextDayObj = dayDataForCurrentWeek[currentDayObjIndex + 1];
      nextDayNumber = nextDayObj.day;
  } else if (currentWeekIndex < totalWeeksCount - 1) {
      // Advance to the first day of the next week
      nextWeekIndex = currentWeekIndex + 1;
      const nextWeek = weekData[nextWeekIndex];
      if (!nextWeek || !nextWeek.days || nextWeek.days.length === 0) {
           console.error("Error calculating next step: Next week data is invalid.", { nextWeekIndex, weekData });
           return 'error';
      }
      nextDayObj = nextWeek.days[0];
      nextDayNumber = nextDayObj.day;
  } else {
      // Last day of the last week - plan complete
      return null;
  }

  const nextWeekObj = weekData[nextWeekIndex];

  if (!nextWeekObj || !nextDayObj) {
      console.error("Error calculating next step: Could not find next week or day object.", { nextWeekIndex, nextDayNumber, nextWeekObj, nextDayObj });
      return 'error';
  }

  return {
      nextWeekIndex, // Use numeric index
      nextDayNumber, // Use numeric day number
      nextWeekName: nextWeekObj.weekName,
      nextDayName: nextDayObj.dayName
  };
};

export const parseTimeToSeconds = (timeString = "00:00:00") => {
  if (!timeString || typeof timeString !== 'string') return 0;
  const parts = timeString.split(':').map(Number);
  if (parts.length === 3) { // HH:MM:SS
    return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  } else if (parts.length === 2) { // MM:SS
    return (parts[0] * 60) + parts[1];
  }
  return 0; // Default case or invalid format
};