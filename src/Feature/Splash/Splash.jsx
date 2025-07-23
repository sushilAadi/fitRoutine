'use client'
import ButtonCs from '@/components/Button/ButtonCs'
import React, { useEffect } from 'react'
import splashImag from '@/assets/splash.jpeg'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'

const Splash = ({ setStep }) => {
  const { userId } = useAuth()

  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    setViewportHeight();

    // Recalculate on window resize
    window.addEventListener('resize', setViewportHeight);

    return () => {
      window.removeEventListener('resize', setViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (userId) {
      setStep(2)
    }
  }, [userId])
  return (
    <div className='flex items-center justify-between px-5 py-4 bg-white ch-screen flex-column animate__animated animate__slideInLeft'>
      <div className="w-[200px] h-[230px] ">
        <div className='relative flex justify-center'>
          <img src="https://img.freepik.com/premium-photo/ai-generated-gym-poster-with-glowing-background_694356-53.jpg" alt="" srcSet="" className='absolute w-[100px]  object-cover left-0 rounded-md' />
          <img src="https://img.freepik.com/premium-photo/muscular-young-man-gym-showing-muscles-back-view-fitness-model-gym-generated-by-ai_1038983-22608.jpg" alt="" srcSet="" className='absolute  top-[30px]  right-1 rounded-md w-[80px] h-[100px] object-cover' />
          <img src="https://img.freepik.com/premium-photo/direction-determination-gym-experience-ai-generated_915770-4824.jpg" alt="" srcSet="" className='absolute w-[160px] h-[80px] top-[115px] left-0 object-cover rounded-md border-4 border-white' />
        </div>
      </div>

      <div className="text-center">
        <h1 className='font-bold'>NEEEDFIT</h1>
        <p className='text-gray-500'>lets you create personalized workout plans tailored to your fitness goals. Take control of your journey and build the workout routine that fits your needs!</p>
        <br />
        <br />
      </div>
      <Link href="/sign-in">
        <ButtonCs title="Let's Go" icon={<i className="ml-2 fa-solid fa-arrow-right "></i>} type="submit" className="mt-[36px] btnStyle min-w-[184px] " />
      </Link>
    </div>
  )
}

export default Splash