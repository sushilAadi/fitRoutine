"use client";
import FooterButton from "@/components/Button/FooterButton";
import WheelPickerCS from "@/components/WheelPicker/WheelPickerCS";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext } from "react";
import { useUser } from '@clerk/clerk-react';

import {  doc, setDoc } from "firebase/firestore";
import { format } from 'date-fns';
import { db } from "@/firebase/firebaseConfig";
import { insertUserMetrics } from "@/utils/metricsHelper";

const AgeSelection = ({ step, setStep }) => {
    const { user } = useUser();
    const { id, fullName, primaryEmailAddress } = user || {};
    const { age, height, gender, weight, setAge, userRefetch, selectedGoals, activityLevel, userWeightRefetch } = useContext(GlobalContext);
    
    // State for wheel picker
    const [selectedDay, setSelectedDay] = React.useState(1);
    const [selectedMonth, setSelectedMonth] = React.useState(0);
    const [selectedYear, setSelectedYear] = React.useState(2000);

    // Generate options for wheel pickers
    const days = Array.from({ length: 31 }, (_, i) => i + 1);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: currentYear - 1940 + 1 }, (_, i) => currentYear - i);

    // Update age when wheel picker values change
    React.useEffect(() => {
        try {
            const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
            // Check if the date is valid
            if (selectedDate.getMonth() === selectedMonth && selectedDate.getDate() === selectedDay) {
                setAge(selectedDate);
            }
        } catch (error) {
            console.log('Invalid date selected');
        }
    }, [selectedDay, selectedMonth, selectedYear, setAge]);

    // Initialize wheel picker from existing age
    React.useEffect(() => {
        if (age) {
            const date = new Date(age);
            setSelectedDay(date.getDate());
            setSelectedMonth(date.getMonth());
            setSelectedYear(date.getFullYear());
        }
    }, []);

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

    // Insert user metrics using utility function
    const handleInsertMetrics = async () => {
        try {
            const metricsData = {
                weight: weight,
                height: height
            };

            const result = await insertUserMetrics(id, metricsData, 'initial_setup', 'onboarding');
            
            if (result.success) {
                userWeightRefetch();
            } else {
                console.error("Failed to insert metrics:", result.error);
            }
        } catch (error) {
            console.error("Error while inserting user metrics:", error);
        }
    };

    // Check if date is selected for validation
    const isDateSelected = age !== null && age !== undefined;

    return (
        <div className="flex flex-col justify-between h-screen bg-white ageSelector">
            <div className="flex flex-col items-center flex-1 px-6 pt-8">
                {/* Progress indicator */}
                <div className="w-full max-w-md mb-8">
                    <div className="flex items-center justify-between mb-2 text-sm text-gray-600">
                        <span>Step {step} of 6</span>
                        <span>{Math.round((step / 6) * 100)}% Complete</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                        <div 
                            className="h-2 transition-all duration-300 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" 
                            style={{ width: `${(step / 6) * 100}%` }}
                        ></div>
                    </div>
                </div>

                {/* Title and description */}
                <div className="max-w-md mb-8 text-center">
                    <h2 className="mb-4 text-2xl font-bold text-gray-800 animate__animated animate__slideInRight">
                        What's your date of birth?
                    </h2>
                    <p className="leading-relaxed text-gray-600">
                        This helps us provide personalized recommendations and track your fitness journey more effectively.
                    </p>
                </div>

                {/* Date Wheel Pickers */}
                <div className="flex items-center justify-center flex-1 w-full px-4">
                    <div className="flex items-center justify-center w-full max-w-sm gap-5 sm:gap-4">
                        {/* Day Picker */}
                        <div className="flex-1 text-center">
                            <p className="mb-2 font-medium text-gray-700 sm:text-sm">Day</p>
                            <WheelPickerCS 
                                items={days}
                                defaultIndex={selectedDay - 1}
                                onChange={(day) => setSelectedDay(day)}
                            />
                        </div>
                        
                        {/* Month Picker */}
                        <div className="flex-1 text-center">
                            <p className="mb-2 font-medium text-gray-700 sm:text-sm">Month</p>
                            <WheelPickerCS 
                                items={months.map(month => month.slice(0, 3))}
                                defaultIndex={selectedMonth}
                                onChange={(month) => setSelectedMonth(months.findIndex(m => m.startsWith(month)))}
                            />
                        </div>
                        
                        {/* Year Picker */}
                        <div className="flex-1 text-center">
                            <p className="mb-2 font-medium text-gray-700 sm:text-sm">Year</p>
                            <WheelPickerCS 
                                items={years}
                                defaultIndex={years.indexOf(selectedYear)}
                                onChange={(year) => setSelectedYear(year)}
                            />
                        </div>
                    </div>
                </div>
                
                {/* Selected Date Display */}
                {age && (
                    <div className="w-full pb-4">
                        <div className="w-full px-2 py-2 text-center bg-black">
                            <p className="text-sm font-semibold text-white">
                                {format(age, 'MMMM d, yyyy')} - Age: {Math.floor((new Date() - new Date(age)) / (365.25 * 24 * 60 * 60 * 1000))} years old
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer with validation */}
            <FooterButton 
                backClick={() => setStep(5)} 
                btnClick={() => { 
                    if (isDateSelected) {
                        postUserDetail(); 
                        handleInsertMetrics(); 
                    }
                }} 
                btnTitle="Complete" 
                disabled={!isDateSelected}
                className={!isDateSelected ? "opacity-50 cursor-not-allowed" : ""}
            />
            
            {/* Validation message */}
            {!isDateSelected && (
                <div className="px-6 pb-4">
                    <p className="px-4 py-2 text-sm text-center rounded-lg text-amber-600 bg-amber-50">
                        Please select your date of birth to continue
                    </p>
                </div>
            )}
        </div>
    );
};

export default AgeSelection;
