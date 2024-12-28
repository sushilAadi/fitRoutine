"use client";
import FooterButton from "@/components/Button/FooterButton";
import { GlobalContext } from "@/context/GloablContext";
import { goals } from "@/utils";
import React, { useContext } from "react";

const HelpYou = ({ step, setStep }) => {
  const { selectedGoals, setSelectedGoals } = useContext(GlobalContext);

 

  const toggleGoal = (goalId) => {
    const newSelectedGoals = new Set(selectedGoals || []);
    if (newSelectedGoals.has(goalId)) {
      newSelectedGoals.delete(goalId);
    } else {
      newSelectedGoals.add(goalId);
    }
    setSelectedGoals(newSelectedGoals);
  };

  return (
    <div className="flex flex-col items-center justify-between h-screen ">
      <div className="px-4 pt-4 w-100">
        <h5 className="text-center text-red-500">Step {step} of 6</h5>
        <br />
        <h5 className="text-center animate__animated animate__slideInRight">
          Help us understand your goals
        </h5>
        <p className="text-center text-gray-500">
          Select one or more goals. You can always change this later.
        </p>
      </div>
      <div className="animate__animated animate__slideInRight">
        <div className="max-w-md mx-auto">
          {/* Goals */}
          <div className="space-y-3">
            {goals.map((goal) => (
              <button
                key={goal.id}
                onClick={() => toggleGoal(goal?.id)}
                className={`flex w-full items-center justify-between rounded-xl p-4 text-left transition-colors ${
                  selectedGoals?.has(goal.id) ? "bg-orange-300" : "bg-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{goal.icon}</span>
                  <span className="font-medium">{goal.title}</span>
                </div>
                {selectedGoals?.has(goal.id) && (
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
        disabled={selectedGoals?.size === 0}
      />
    </div>
  );
};

export default HelpYou;
