"use client";
import ButtonCs from "@/components/Button/ButtonCs";
import FooterButton from "@/components/Button/FooterButton";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext, useState } from "react";

const GenderSelection = ({ step, setStep }) => {
const {gender, setGender} = useContext(GlobalContext)

  const genderData = [
    {
      label: "Male",
      img: "https://img.freepik.com/free-photo/fit-cartoon-character-training_23-2151148939.jpg",
      bgColor: "bg-[#E9DED3]",
    },
    {
      label: "Female",
      img: "https://img.freepik.com/free-photo/fit-cartoon-character-training_23-2151148995.jpg",
      bgColor: "bg-[#304061] text-white",
    },
  ];
  return (
    <div className="flex items-center justify-between h-screen flex-column">
      <div className="px-4 pt-4 w-100">
            
            <h5 className="text-center text-red-500">Step {step} of 6</h5>
            <br />
            <h5 className="text-center animate__animated animate__slideInRight">
                Which one are you?
            </h5>
            <p className="text-center text-gray-500">
                To give you a customize experience
            </p>
            <p className="text-center text-gray-500">
                we need to know your gender.
            </p>
        </div>
      <div className="animate__animated animate__slideInRight">
        <div className="">
          <div className="flex gap-4">
            {genderData?.map((i) => (
              <div
                key={i?.label}
                className={`w-[120px]  h-[160px] cursor-pointer flex justify-center items-center  rounded-md overflow-hidden flex-column ${
                  i?.bgColor
                } ${i?.label === gender ? "scale" : "filter grayscale"}`}
                onClick={() => setGender(i?.label)}
              >
                <img src={i?.img} alt="gender"  className="object-cover " />
                <h6 className="mt-2 text-center">{i?.label}</h6>
              </div>
            ))}
          </div>
          <br />
          <br />
          <p className="text-center text-gray-500">
            To give you a customize experience
          </p>
          <p className="text-center text-gray-500">
            we need to know your gender
          </p>
        </div>
      </div>
      <FooterButton backClick={() => setStep(0)} btnClick={() => setStep(2)} btnTitle="Next"  disabled={gender == null}/>
      
    </div>
  );
};

export default GenderSelection;
