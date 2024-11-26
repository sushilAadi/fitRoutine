"use client";
import ButtonCs from "@/components/Button/ButtonCs";
import FooterButton from "@/components/Button/FooterButton";
import WeightScale from "@/components/WeightScale/WeightScale";
import { GlobalContext } from "@/context/GloablContext";
import React, { useContext, useState } from "react";

const HeightSelection = ({ step, setStep }) => {
    const {height, setHeight} = useContext(GlobalContext)

    return (
        <div className="flex justify-between h-screen flex-column">
            <div className="px-4 pt-4 w-100">
            
                <h5 className="text-center text-red-500">Step {step} of 6</h5>
                <br />
                <h5 className="text-center animate__animated animate__slideInRight">
                    How tall are you?
                </h5>
                <p className="text-center text-gray-500">
                    This is used to set up recommendations
                </p>
                <p className="text-center text-gray-500">
                    just for you.
                </p>
            </div>
            <div className="animate__animated animate__slideInRight h-[300px] overflow-hidden">
                <div className="rotate-90">
                        <WeightScale initialValue={height} setInitialValue={setHeight} measurtype="cm" roateText="rotate-[270deg]" initialShowValue={152} />
                </div>
            </div>
            <FooterButton backClick={() => setStep(2)} btnClick={() => setStep(4)} btnTitle="Next"  disabled={height == null}/>
        </div>
    );
};

export default HeightSelection;
