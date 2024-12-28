'use client'
import { useState, useEffect } from 'react';

const AngleChecker = () => {
  const [beta, setBeta] = useState(0); // Tilt front-to-back
  const [gamma, setGamma] = useState(0); // Tilt left-to-right
  const [isFlat, setIsFlat] = useState(false);

  useEffect(() => {
    const handleOrientation = (event) => {
      const { beta: tiltFB, gamma: tiltLR } = event;

      setBeta(tiltFB);
      setGamma(tiltLR);

      // Check if the device is flat
      if (Math.abs(tiltFB) < 5 && Math.abs(tiltLR) < 5) {
        setIsFlat(true);
      } else {
        setIsFlat(false);
      }
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h1>Angle Checker</h1>
      <p>Beta (Front-to-Back): {beta?.toFixed(2)}°</p>
      <p>Gamma (Left-to-Right): {gamma?.toFixed(2)}°</p>
      <h2>{isFlat ? 'Device is flat on the surface!' : 'Device is not flat!'}</h2>
    </div>
  );
};

export default AngleChecker;
