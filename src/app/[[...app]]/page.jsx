'use client'
import React, { useContext, useEffect, useState } from 'react';
import Splash from '@/Feature/Splash/Splash';
import GenderSelection from '@/Feature/Splash/GenderSelection';
import WeightSelection from '@/Feature/Splash/WeightSelection';
import HeightSelection from '@/Feature/Splash/HeightSelection';
import AgeSelection from '@/Feature/Splash/AgeSelection';
import { GlobalContext } from '@/context/GloablContext';
import { useAuth } from '@clerk/nextjs'
import HelpYou from '@/Feature/Splash/HelpYou';
import ActivityLevel from '@/Feature/Splash/ActivityLevel';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Dashboard from '@/Feature/Home/Dashboard';


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
        {step === 4 && <HelpYou setStep={setStep} step={step} />}
        {step === 5 && <ActivityLevel setStep={setStep} step={step} />}
        {step === 6 && <AgeSelection setStep={setStep} step={step} />}
      </>
    )
  }
console.log("userDetailData",userDetailData)
  return (
    <>
      <Dashboard/>
    </>
  );
}
