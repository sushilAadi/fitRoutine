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

const AgeSelection = ({ step, setStep }) => {
    const { user } = useUser();
    const {id,fullName,primaryEmailAddress} = user || {}
    const {age,height,gender,weight, setAge,userRefetch} = useContext(GlobalContext)
    

    const postUserDetail =async()=>{
      const { data, error } = await supabase
        .from('users')
        .insert(
          {
            "userIdCl": id,
            "userName": fullName,
            "userAge": age,
            "userGender": gender,
            "userWeight": weight,
            "userHeight": height,
            "userEmail":primaryEmailAddress?.emailAddress
          }
        );
      if (error) {
        console.log("Error while posting user details: ", error);
      } else {
        console.log("User details posted successfully: ", data);
        userRefetch()
      }
    }

   


    return (
        <div className="flex justify-between logScreen flex-column">
            <div className="px-4 pt-4 w-100">
            
                <h5 className="text-center text-red-500">Step {step} of 6</h5>
                <br />
                <h5 className="text-center animate__animated animate__slideInRight">
                    How old are you?
                </h5>
                <p className="text-center text-gray-500">
                    This is used to set up recommendations
                </p>
                <p className="text-center text-gray-500">
                    just for you.
                </p>
            </div>
            <div className="animate__animated animate__slideInRight ">
                <div className="flex justify-center">
                       <WheelPickerCS items={_.range(18, 81)} onChange={setAge}/>
                </div>
            </div>
            <FooterButton backClick={() => setStep(2)} btnClick={() => postUserDetail()} btnTitle="Complete"/>
        </div>
    );
};

export default AgeSelection;
