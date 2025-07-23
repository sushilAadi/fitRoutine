"use client";
import ButtonCs from "@/components/Button/ButtonCs";
import FooterButton from "@/components/Button/FooterButton";
import WeightScale from "@/components/WeightScale/WeightScale";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext, useState } from "react";

const WeightSelection = ({ step, setStep }) => {
    const {weight, setWeight} = useContext(GlobalContext)

    return (
        <div className="flex items-center justify-between h-screen flex-column">
            <div className="px-4 pt-4 w-100">
            
                <h5 className="text-center text-red-500">Step {step} of 6</h5>
                <br />
                <h5 className="text-center animate__animated animate__slideInRight">
                    How much do you weight
                </h5>
                <p className="text-center text-gray-500">
                    This is used to set up recommendations
                </p>
                <p className="text-center text-gray-500">
                    just for you.
                </p>
            </div>
            <div className="w-[300px] animate__animated animate__slideInRight ">

                <div className="">
                    <div className="flex gap-4">
                        <WeightScale initialValue={weight} setInitialValue={setWeight} initialShowValue={50}  measurtype="kg" />
                    </div>
                    <br />
                    <br />

                </div>
            </div>
            <FooterButton backClick={() => setStep(1)} btnClick={() => setStep(3)} btnTitle="Next" disabled={weight == null}/>
            
            
        </div>
    );
};

export default WeightSelection;
