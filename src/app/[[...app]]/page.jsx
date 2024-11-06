'use client'
import React, { useContext, useEffect, useState } from 'react';
import Splash from '@/Feature/Splash/Splash';
import GenderSelection from '@/Feature/Splash/GenderSelection';
import WeightSelection from '@/Feature/Splash/WeightSelection';
import HeightSelection from '@/Feature/Splash/HeightSelection';
import AgeSelection from '@/Feature/Splash/AgeSelection';
import { GlobalContext } from '@/context/GloablContext';
import { useAuth } from '@clerk/nextjs'
import CCard from '@/components/CCard';

export default function Home() {
  const { userDetailData, isFetching } = useContext(GlobalContext);
  const [step, setStep] = useState(0)
  const { isLoaded, userId } = useAuth()
  const { userEmail, userName } = userDetailData || {}


  useEffect(() => {
    if (userId && step === 0) {
      setStep(1);
    }
  }, [userId, step, isLoaded]);

  if (isLoaded && !userId) return <Splash setStep={setStep} />;

  if (isFetching) {
    return "Fetching...."
  }
  if (Object.keys(userDetailData).length === 0 || !userDetailData) {
    return (
      <>
        {step == 1 && <GenderSelection setStep={setStep} step={step} />}
        {step === 2 && <WeightSelection setStep={setStep} step={step} />}
        {step === 3 && <HeightSelection setStep={setStep} step={step} />}
        {step === 4 && <AgeSelection setStep={setStep} step={step} />}
      </>
    )
  }

  return (
    <div className="p-4 overflow-hidden">
      Hello {userName} your email is {userEmail}
      
    </div>
  );
}
