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
        {step === 5 && <AgeSelection setStep={setStep} step={step} />}
      </>
    )
  }
console.log("userDetailData",userDetailData)
  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-md mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm text-[#8B80F8]">
            <span className="text-lg">✧</span> TUES 13 OCT
          </p>
          <h1 className="text-2xl font-semibold">Hi, Grace</h1>
        </div>

        {/* Health Score */}
        <div className="p-4 bg-white border rounded-lg shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white bg-[#8B80F8] rounded-xl">
              84
            </div>
            <div className="space-y-1">
              <h2 className="font-medium">Health Score</h2>
              <p className="text-sm text-gray-600">
                Based on your overall health test, your score is 84 and consider good.
              </p>
              <button className="text-sm text-[#8B80F8]">Read more</button>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div>
          <h2 className="flex items-center justify-between mb-3 text-lg font-medium">
            Metrics
            <button className="text-gray-400">⋯</button>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            {/* Calories Card */}
            <div className="p-4 text-white bg-[#8B80F8] rounded-lg">
              <div className="space-y-3">
                <p className="text-sm opacity-90">CALORIES</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-chart-pie opacity-80"></i>
                  <span className="text-xl font-semibold">500</span>
                  <span className="text-sm opacity-90">cal</span>
                </div>
                <p className="text-xs opacity-75">last update 3m</p>
              </div>
            </div>

            {/* Weight Card */}
            <div className="p-4 text-white bg-[#AF8FFF] rounded-lg">
              <div className="space-y-3">
                <p className="text-sm opacity-90">WEIGHT</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-weight opacity-80"></i>
                  <span className="text-xl font-semibold">{userDetailData?.userWeight}</span>
                  <span className="text-sm opacity-90">kg</span>
                </div>
                <p className="text-xs opacity-75">last update 3d</p>
              </div>
            </div>

            {/* Water Card */}
            <div className="p-4 text-white bg-[#3887FE] rounded-lg">
              <div className="space-y-3">
                <p className="text-sm opacity-90">WATER</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-tint opacity-80"></i>
                  <span className="text-xl font-semibold">750</span>
                  <span className="text-sm opacity-90">ml</span>
                </div>
                <p className="text-xs opacity-75">last update 5d</p>
              </div>
            </div>

            {/* Steps Card */}
            <div className="p-4 text-white bg-[#4C5A81] rounded-lg">
              <div className="space-y-3">
                <p className="text-sm opacity-90">STEPS</p>
                <div className="flex items-center gap-2">
                  <i className="w-8 h-8 fas fa-walking opacity-80"></i>
                  <span className="text-xl font-semibold">9,890</span>
                </div>
                <p className="text-xs opacity-75">last update 3m</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
