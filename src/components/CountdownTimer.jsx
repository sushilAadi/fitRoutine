// components/CountdownTimer.js
import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const TimeUnit = ({ value, label }) => (
  <div className="flex flex-col items-center">
    <div className="flex items-center justify-center w-8 h-8 mb-1 font-bold text-white bg-gray-600 rounded-lg text-md">
      {value.toString().padStart(2, '0')}
    </div>
    <span className="text-xs text-gray-400">{label}</span>
  </div>
);

const CountdownTimer = ({ endDate }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(endDate) - new Date();
      
      if (difference <= 0) return null;

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    };

    // Only set up interval if we have a valid end date
    if (endDate) {
      setTimeLeft(calculateTimeLeft());
      const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000);
      return () => clearInterval(timer);
    }
  }, [endDate]);

  if (!timeLeft) return <p className="text-red-400">Program Expired</p>;

  return (
    <div className="flex flex-wrap items-center gap-4">
      
      <div className="flex gap-2">
        <TimeUnit value={timeLeft.days} label="Days" />
        <TimeUnit value={timeLeft.hours} label="Hours" />
        <TimeUnit value={timeLeft.minutes} label="Minutes" />
        <TimeUnit value={timeLeft.seconds} label="Seconds" />
      </div>
    </div>
  );
};

export default CountdownTimer;