'use client';

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
    <div className="flex flex-col items-center justify-center min-h-screen text-white bg-tprimary">
      <h1 className="mb-1 text-3xl">Angle Checker</h1>
      <div
        style={{
          position: 'relative',
          height: '300px',
          perspective: '1000px', // Enables 3D perspective
          marginBottom: '20px',
        }}
      >
        {/* Animated Rectangle (Represents the Device) */}
        <div
          style={{
            width: '150px',
            height: '100px',
            background: 'linear-gradient(135deg, #3498db, #2980b9)', // Gradient for depth
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: `translate(-50%, -50%) rotateX(${beta}deg) rotateY(${gamma}deg)`,
            transformStyle: 'preserve-3d',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.5)', // Adds depth
            borderRadius: '8px', // Smooth edges
            transition: 'transform 0.1s ease-out, box-shadow 0.1s ease-out',
          }}
        >
          {/* Rectangle Border for 3D */}
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              transform: 'translateZ(10px)',
            }}
          />
        </div>
        {/* Keel/Marker */}
        <div
          style={{
            width: '12px',
            height: '12px',
            background: 'radial-gradient(circle, red, darkred)', // Gradient for the marker
            borderRadius: '50%',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 4px 10px rgba(255, 0, 0, 0.5)', // Glow effect
          }}
        />
      </div>
      <h1 className="text-5xl">{beta?.toFixed(2)}°</h1>
      <p className="mt-2">Beta (Front-to-Back)</p>
      <p className="mt-1">Gamma (Left-to-Right): {gamma?.toFixed(2)}°</p>
      <h2 className="mt-4 text-lg font-semibold">
        {isFlat ? 'Device is flat on the surface!' : 'Device is not flat!'}
      </h2>
    </div>
  );
};

export default AngleChecker;
