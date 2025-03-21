"use client";
import CCollapse from "@/components/Tabs/CCollapse";
import _ from "lodash";
import React, { useState, useRef } from "react";
import ExerciseDetailHeader from "./ExerciseDetailHeader";
import SetAndRepsForm from "./SetAndRepsForm";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';

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
  
  return (
    <div className="w-full p-3">
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
          const setData = exercise?.weeklySetConfig?.find((i) => i?.isConfigured);
          return (
            <SwiperSlide key={index} className="w-full">
              <div className="w-full mb-4">
                <ExerciseDetailHeader 
                  data={exercise} 
                  toggleOpen={toggleOpen} 
                  open={open}
                />
                <SetAndRepsForm sets={setData?.sets} />
                <p className="text-sm font-medium text-black">Previous Data</p>
                <ul className="pl-0">
                  <li>23/01/2025 -  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12</li>
                  <li>26/01/2025 -  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12</li>
                  <li>01/02/2025 -  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12</li>
                  <li>06/02/2025 -  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12, &nbsp;&nbsp;&nbsp;   30 * 12</li>
                  
                </ul>
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      
      {/* Custom Navigation Buttons */}
      <div className="flex justify-end">
        
        <i className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-left"  onClick={goPrev}></i>
        <i className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-right"  onClick={goNext}></i>
      
      </div>
    </div>
  );
};

export default ExerciseCardSelected;