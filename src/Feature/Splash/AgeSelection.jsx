"use client";
import ButtonCs from "@/components/Button/ButtonCs";
import FooterButton from "@/components/Button/FooterButton";
import WeightScale from "@/components/WeightScale/WeightScale";
import WheelPickerCS from "@/components/WheelPicker/WheelPickerCS";
import { GlobalContext } from "@/context/GloablContext";
import _ from "lodash";
import React, { useContext } from "react";
import { useUser } from '@clerk/clerk-react';
import { supabase } from '@/createClient'
import { Calendar } from 'primereact/calendar';
import { format } from 'date-fns';
import { normalizeToLocalDate } from "@/utils";

const AgeSelection = ({ step, setStep }) => {
    const { user } = useUser();
    const {id,fullName,primaryEmailAddress} = user || {}
    const {age,height,gender,weight, setAge,userRefetch,selectedGoals,activityLevel,userWeightRefetch} = useContext(GlobalContext)
    


    const postUserDetail =async()=>{
      const localAge = normalizeToLocalDate(age);
      const formattedAge = age ? format(age, 'yyyy-MM-dd') : null;
      const { data, error } = await supabase
        .from('users')
        .insert(
          {
            "userIdCl": id,
            "userName": fullName,
            "userBirthDate": formattedAge,
            "userGender": gender,
            "userWeight": weight,
            "userHeight": height,
            "userEmail":primaryEmailAddress?.emailAddress,
            "helpYou":Array.from(selectedGoals).join(", "),
            "activityLevel":activityLevel
            
          }
        );
      if (error) {
        console.log("Error while posting user details: ", error);
      } else {
        console.log("User details posted successfully: ", data);
        userRefetch()
      }
    }
    const insertWeight =async()=>{
      const { data, error } = await supabase
        .from('weight')
        .insert(
          {
            "userIdCl": id,
            "userWeights": weight,
          }
        );
      if (error) {
        console.log("Weight Error: ", error);
      } else {
        console.log("Weight posted successfully: ", data);
        userWeightRefetch()
      }
    }
   


    return (
        <div className="flex justify-between h-screen flex-column ageSelector">
            <div className="px-4 pt-4 w-100">
            
                <h5 className="text-center text-red-500">Step {step} of 6</h5>
                <br />
                <h5 className="text-center animate__animated animate__slideInRight">
                What is your date of birth?
                </h5>
                <p className="text-center text-gray-500">
                This helps us provide personalized recommendations
                </p>
                <p className="text-center text-gray-500">
                tailored just for you.
                </p>
            <Calendar value={age} onChange={(e) => setAge(e.value)} inline showWeek className="px-4 mt-5" maxDate={new Date()} showButtonBar />
            </div>
            
       
            <FooterButton backClick={() => setStep(5)} btnClick={() => {postUserDetail();insertWeight()}} btnTitle="Complete"/>
        </div>
    );
};

export default AgeSelection;
