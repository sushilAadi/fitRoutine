'use client';

import React, { useState, useEffect } from 'react';
import ButtonCs from '@/components/Button/ButtonCs';
import { useRouter } from 'next/navigation';
import _ from 'lodash';
import SecureComponent from '@/components/SecureComponent/[[...SecureComponent]]/SecureComponent';

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
    <SecureComponent>
    <div className="px-4">
      <h1 className="text-2xl font-bold mb-4">
        Saved Plan
      </h1>

      <div>
        {savedPlans.length > 0 ? (
          <div>
            {savedPlans.map((plan, index) => (
              <li key={index} className="mb-2 flex items-center">
                <ButtonCs title={`${_.upperFirst(plan.name)} (${plan.weeks} weeks, ${plan.daysPerWeek} days/week)`} className="mb-2 mr-2 !text-sm" onClick={() => router.push(`/SavedPlan/${plan.name}`)} />
                <i class="fa-regular fa-trash-can text-red-500 cursor-pointer" onClick={() => deletePlan(plan.name)} />
              </li>
            ))}
          </div>
        ) : (
          <p>No saved plans found.</p>
        )}
      </div>

    </div>
    </SecureComponent>
  );
};

export default CustomPlanPage;