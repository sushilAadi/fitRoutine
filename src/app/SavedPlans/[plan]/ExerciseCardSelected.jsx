"use client";

import _ from "lodash";
import React, { useState, useRef } from "react";
import ExerciseDetailHeader from "./ExerciseDetailHeader";
import SetAndRepsForm from "./SetAndRepsForm";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import RegularButton from "@/components/Button/RegularButton";
import Stopwatch from "@/components/StopWatch/StopWatch";
import { useStopwatch } from "react-timer-hook";


const ExerciseCardSelected = ({ exercisesBasedOnDay }) => {
  const [open, setOpen] = useState(false);
  const swiperRef = useRef(null);

  const { exercises } = exercisesBasedOnDay || {};
  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  );
  console.log("exercisesBasedOnDay", filteredExercises);

  const toggleOpen = () => setOpen((cur) => !cur);

  const goNext = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slideNext();
    }
  };

  const goPrev = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.slidePrev();
    }
  };

  const { milliseconds, seconds, minutes, hours, days, isRunning, start, pause, reset} = useStopwatch({ autoStart: false, interval: 20 });

  const timerdata = {
    milliseconds, seconds, minutes, hours, days, isRunning, start, pause, reset
  }

  return (
    <div className="w-full">
      <Swiper
        ref={swiperRef}
        slidesPerView={1}
        spaceBetween={20}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        modules={[Pagination]}
        className="w-full"
      >
        {filteredExercises?.map((exercise, index) => {
          const setData = exercise?.weeklySetConfig?.find(
            (i) => i?.isConfigured
          );
          return (
            <SwiperSlide key={index} className="w-full">
              <div className="w-full mb-4">
                <ExerciseDetailHeader
                  data={exercise}
                  toggleOpen={toggleOpen}
                  open={open}
                />
                <div className="p-3">
                <div className="my-2 mb-4">
                {isRunning && <Stopwatch timerdata={timerdata} />}
                
                </div>
                
                  <SetAndRepsForm sets={setData?.sets} timerdata={timerdata} />
                  <RegularButton title="Stop Rest (1 m 20 sec)" className="font-medium bg-red-600 hover:bg-red-400"/>
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Custom Navigation Buttons */}
      <div className="flex justify-end">
        <i
          className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-left"
          onClick={goPrev}
        ></i>
        <i
          className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-right"
          onClick={goNext}
        ></i>
      </div>
    </div>
  );
};

export default ExerciseCardSelected;
