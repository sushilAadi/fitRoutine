"use client";
import FooterButton from "@/components/Button/FooterButton";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext } from "react";

const ActivityLevel = ({ step, setStep }) => {
  const { activityLevel, setActivityLevel } = useContext(GlobalContext);

  const goals = [
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

  // Set selected activity level with its factor
  const selectActivityLevel = (goal) => {
    setActivityLevel({
      id: goal.id,
      subtitle: goal.subtitle,
      factor: goal.factor,
    });
  };
  

  return (
    <div className="flex flex-col items-center justify-between h-screen">
      <div className="px-4 pt-4 w-100">
        <h5 className="text-center text-red-500">Step {step} of 6</h5>
        <br />
        <h5 className="text-center animate__animated animate__slideInRight">
        Help us understand your daily activity level
        </h5>
        <p className="text-center text-gray-500">
          You can always change this later
        </p>
      </div>
      <div className="animate__animated animate__slideInRight">
        <div className="max-w-md mx-auto">
          {/* Goals */}
          <div className="space-y-3">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => selectActivityLevel(goal)}
                className={`flex flex-col items-start w-full rounded-xl p-4 text-left transition-colors ${
                  activityLevel?.id === goal.id ? "bg-orange-300" : goal.color
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{goal.icon}</span>
                  <div>
                    <span className="font-medium">{goal.title}</span>
                    <p className="text-sm text-gray-500">{goal.subtitle}</p>
                  </div>
                </div>
                {activityLevel?.id === goal.id && (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
      <FooterButton
        backClick={() => setStep(step - 1)}
        btnClick={() => setStep(step + 1)}
        btnTitle="Next"
        disabled={!activityLevel} 
      />
    </div>
  );
};

export default ActivityLevel;
