'use client'
import ButtonCs from '@/components/Button/ButtonCs'
import React, { useEffect } from 'react'
import splashImag from '@/assets/splash.jpeg'
import logo from '../../assets/logo.png'
import Link from 'next/link'
import { useAuth } from '@clerk/nextjs'
import Image from 'next/image'

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
    <div className='relative flex flex-col overflow-hidden bg-white ch-screen animate__animated animate__slideInLeft'>
      {/* Background geometric elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 translate-x-32 -translate-y-32 rounded-full w-96 h-96 bg-gradient-to-bl from-orange-100 to-transparent"></div>
        <div className="absolute bottom-0 left-0 -translate-x-32 translate-y-32 rounded-full w-80 h-80 bg-gradient-to-tr from-purple-100 to-transparent"></div>
      </div>

      {/* Main Image */}
      <div className="relative z-10 flex items-center justify-center flex-1 px-6 pt-12">
        <div className="relative">
          <Image 
            src={logo} 
            alt="splash" 
            width={180}
            height={120}
            className='object-cover  h-[120px] '
          />
          
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 pt-8 pb-8">
        <div className="text-center">
          <h1 className='mb-4 text-2xl font-bold text-gray-900'>NEEEDFIT</h1>
          <p className='mb-8 text-sm leading-relaxed text-gray-600'>lets you create personalized workout plans tailored to your fitness goals. Take control of your journey and build the workout routine that fits your needs!</p>
        </div>

        {/* Button */}
        <div className="flex justify-center">
          <Link href="/sign-in">
            <ButtonCs title="Let's Go" icon={<i className="ml-2 fa-solid fa-arrow-right "></i>} type="submit" className="mt-[36px] btnStyle min-w-[184px] " />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Splash