'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import WorkoutProgressCard from '@/components/WorkoutProgressCard';

const CustomPlanPage = () => {
  const router = useRouter()
  const [savedPlans, setSavedPlans] = useState([]);

  useEffect(() => {
    const plans = Object.keys(localStorage)
      .filter(key => key.startsWith('workoutPlan_'))
      .map(key => JSON.parse(localStorage.getItem(key)));
    setSavedPlans(plans);
  }, []);

  const deletePlan = (planName) => {
    if (window.confirm(`Are you sure you want to delete the plan "${planName}"?`)) {
      localStorage.removeItem(`workoutPlan_${planName}`);
      setSavedPlans(prevPlans => prevPlans.filter(plan => plan.name !== planName));
    }
  };

  return (
    <div className="container px-4 mx-auto">
      <h1 className="mb-4 text-2xl font-bold">Saved Plans</h1>
      {savedPlans.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {savedPlans.map((plan, index) => (
            <div key={index} className="flex flex-col">
              <WorkoutProgressCard plan={plan} />
              <div className="flex justify-between mt-2">
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => router.push(`/SavedPlan/${plan.name}`)}
                >
                  {`View ${plan.name.charAt(0).toUpperCase() + plan.name.slice(1)}`}
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deletePlan(plan.name)}
                >
                  <i className="fa-regular fa-trash-can" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p>No saved plans found.</p>
      )}
    </div>
  );
};

export default CustomPlanPage;

