"use client";
import ButtonCs from "@/components/Button/ButtonCs";
import FooterButton from "@/components/Button/FooterButton";
import WeightScale from "@/components/WeightScale/WeightScale";
import WheelPickerCS from "@/components/WheelPicker/WheelPickerCS";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext } from "react";
import { useUser } from '@clerk/clerk-react';

import {  doc, setDoc } from "firebase/firestore";  // Import doc and setDoc for specifying document IDs
import { Calendar } from 'primereact/calendar';
import { format } from 'date-fns';
import { normalizeToLocalDate } from "@/utils";
import { db } from "@/firebase/firebaseConfig";

const AgeSelection = ({ step, setStep }) => {
    const { user } = useUser();
    const { id, fullName, primaryEmailAddress } = user || {};
    const { age, height, gender, weight, setAge, userRefetch, selectedGoals, activityLevel, userWeightRefetch } = useContext(GlobalContext);

    // Using userIdCl as the document ID in Firestore for users collection
    const postUserDetail = async () => {
        try {
            const formattedAge = age ? format(age, 'yyyy-MM-dd') : null;

            const userDetails = {
                userIdCl: id,
                userName: fullName,
                userBirthDate: formattedAge,
                userGender: gender,
                userWeight: weight,
                userHeight: height,
                userEmail: primaryEmailAddress?.emailAddress,
                helpYou: Array.from(selectedGoals).join(", "),
                activityLevel: activityLevel,
            };

            // Use userIdCl as the document ID in the "users" collection
            const userDocRef = doc(db, "users", id);  // Set user ID as the document ID
            await setDoc(userDocRef, userDetails);

            
            userRefetch();
        } catch (error) {
            console.error("Error while posting user details:", error);
        }
    };

    // Using userIdCl as the document ID in Firestore for weight collection
    const insertWeight = async () => {
        try {
            const weightDetails = {
                userIdCl: id,
                userWeights: weight,
                created_at: new Date().toISOString(),
            };

            // Use userIdCl as the document ID in the "weight" collection
            const weightDocRef = doc(db, "weight", id);  // Set user ID as the document ID
            await setDoc(weightDocRef, weightDetails);

            
            userWeightRefetch();
        } catch (error) {
            console.error("Error while inserting weight:", error);
        }
    };

    return (
        <div className="flex justify-between h-screen flex-column ageSelector">
            <div className="px-4 pt-4 w-100">
                <h5 className="text-center text-red-500">Step {step} of 6</h5>
                <br />
                <h5 className="text-center animate__animated animate__slideInRight">
                    What is your date of birth?
                </h5>
                <p className="text-center text-gray-500">
                    This helps us provide personalized recommendations tailored just for you.
                </p>
                <div className="flex justify-center">
                    <Calendar 
                        value={age} 
                        onChange={(e) => setAge(e.value)} 
                        inline 
                        showWeek 
                        className="px-4 mt-5" 
                        maxDate={new Date()} 
                        showButtonBar 
                    />
                </div>
            </div>
            <FooterButton 
                backClick={() => setStep(5)} 
                btnClick={() => { postUserDetail(); insertWeight(); }} 
                btnTitle="Complete" 
            />
        </div>
    );
};

export default AgeSelection;
