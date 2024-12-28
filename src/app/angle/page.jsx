'use client'
import { useState, useEffect } from 'react';

const AngleDetector = () => {
  const [angle, setAngle] = useState(null);
  const [previousData, setPreviousData] = useState({
    alpha: 0,
    beta: 0,
    gamma: 0
  });


  useEffect(() => {
    const handleOrientation = (event) => {
      const { alpha, beta, gamma } = event;

      // Implement a basic filter to reduce noise. You may need to adjust constants.
      const alphaFiltered = previousData.alpha * 0.9 + alpha * 0.1;
      const betaFiltered = previousData.beta * 0.9 + beta * 0.1;
      const gammaFiltered = previousData.gamma * 0.9 + gamma * 0.1;

      setPreviousData({
        alpha: alphaFiltered,
        beta: betaFiltered,
        gamma: gammaFiltered
      })

      // Correct if it has been inverted
      let correctedBeta = betaFiltered;
      let correctedGamma = gammaFiltered;
      
      if(alphaFiltered>180){
        correctedBeta = -betaFiltered;
        correctedGamma = -gammaFiltered;
      }

      // Calculate the angle. For our "surface angle", we primarily use beta and gamma.
      const tiltAngle = Math.atan2(correctedGamma, correctedBeta) * (180 / Math.PI); // Angle in degrees

      setAngle(tiltAngle);
    };

    window.addEventListener('deviceorientation', handleOrientation);

    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
    };
  }, [previousData]);

  return (
    <div>
      <h1>Device Angle:</h1>
      {angle !== null ? <p>{angle.toFixed(2)} degrees</p> : <p>Measuring...</p>}
    </div>
  );
};

export default AngleDetector;