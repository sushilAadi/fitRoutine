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

  const [bgColor, setBgColor] = useState("#ffffff");
  const [statusBarColor, setStatusBarColor] = useState("#ffffff");

  useEffect(() => {
    const setThemeColors = () => {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);

      if (isIOS) {
        const themeColorMeta = document.querySelector("meta[name=theme-color]");
        if (themeColorMeta) {
          themeColorMeta.setAttribute("content", "#ff6347"); // Set iOS status bar color
        }
        setStatusBarColor("#ff6347");
      }

      if (isMobile) {
        setBgColor("#f0f0f0"); // Set mobile background color
      } else {
        setBgColor("#ffffff"); // Default background for non-mobile devices
      }
    };

    setThemeColors();
    
    window.addEventListener('resize', setThemeColors);
    
    return () => {
      window.removeEventListener('resize', setThemeColors);
    };
  }, []);

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
    <div className="p-4 overflow-hidden" style={{backgroundColor: bgColor}}>
      Hello {userName} your email is {userEmail} {bgColor}
      
    </div>
  );
}
