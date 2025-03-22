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



const ExerciseCardSelected = ({ exercisesBasedOnDay }) => {
  const [open, setOpen] = useState(false);
  const swiperRef = useRef(null);

  const { exercises,day } = exercisesBasedOnDay || {};
  const filteredExercises = exercises?.filter(
    (exercise) => exercise.name && exercise.bodyPart && exercise.gifUrl
  );
  console.log("exercisesBasedOnDay", exercisesBasedOnDay);

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
                  <SetAndRepsForm sets={setData?.sets} day={day} goPrev={goPrev} goNext={goNext} />
                </div>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
};

export default ExerciseCardSelected;
