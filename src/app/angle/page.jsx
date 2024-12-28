'use client'
import { useState, useEffect, useRef } from 'react';

const AngleDetector = () => {
    const [angle, setAngle] = useState(0);
    const [isCalibrated, setIsCalibrated] = useState(false);
    const [calibrationOffset, setCalibrationOffset] = useState({ beta: 0, gamma: 0 });
    const [debouncedAngle, setDebouncedAngle] = useState(0);
    const previousDataRef = useRef({
        beta: 0,
        gamma: 0
    });
    const debounceTimeoutRef = useRef(null);

    // Filter constant
    const ALPHA = 0.1; // Adjust this value to fine-tune smoothing (lower = more smoothing)
    // Debounce timeout
    const DEBOUNCE_TIMEOUT = 100; // Adjust this to fine-tune the time before values are recalculated (lower = more reactivity)


    useEffect(() => {
        const handleOrientation = (event) => {
            if (!event || event.beta == null || event.gamma == null || event.alpha == null) return;
            let { beta, gamma, alpha } = event;

            // Correct if inverted
            let correctedBeta = beta;
            let correctedGamma = gamma;

            if (alpha > 180) {
                correctedBeta = -beta;
                correctedGamma = -gamma;
            }

            // Apply EMA filtering
            const filteredBeta = ALPHA * correctedBeta + (1 - ALPHA) * previousDataRef.current.beta;
            const filteredGamma = ALPHA * correctedGamma + (1 - ALPHA) * previousDataRef.current.gamma;
            previousDataRef.current = { beta: filteredBeta, gamma: filteredGamma };

            let newAngle = 0;

            if (isCalibrated) {
                // Calculate angle with calibration offset
                newAngle = Math.atan2(filteredGamma - calibrationOffset.gamma, filteredBeta - calibrationOffset.beta) * (180 / Math.PI);
            } else {
                // Initial calibration
                setCalibrationOffset({ beta: filteredBeta, gamma: filteredGamma });
                setIsCalibrated(true);
                return; // Don't calculate angle on first update
            }

            // Debounce the change
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
            debounceTimeoutRef.current = setTimeout(() => {
                setDebouncedAngle(newAngle);
            }, DEBOUNCE_TIMEOUT);

        };

        window.addEventListener('deviceorientation', handleOrientation);

        return () => {
            window.removeEventListener('deviceorientation', handleOrientation);
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current)
            }
        };
    }, [isCalibrated, calibrationOffset]);

    useEffect(() => {
        setAngle(debouncedAngle);
    }, [debouncedAngle])


    return (
        <div>
            <h1>Device Angle:</h1>
            {angle !== null ? <p>{angle.toFixed(2)} degrees </p> : <p>Calibrating...</p>}
        </div>
    );
};

export default AngleDetector;