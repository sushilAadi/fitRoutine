"use client";

import { createContext, useMemo, useState, useEffect } from "react";
import { useAuth,useUser } from '@clerk/nextjs';
import { supabase } from '@/createClient';
import { useQuery } from '@tanstack/react-query';
import Dexie from "dexie";
import _ from "lodash";
import { getExercisesGif } from "@/service/exercise";
import { calculateAge } from "@/utils";

// Initialize Dexie database
const db = new Dexie("WorkoutApp");
db.version(1).stores({
  exercises: "++id,name"
});



export const GlobalContext = createContext("");

export default function GlobalContextProvider({ children }) {

  const { isLoaded, userId, sessionId, getToken } = useAuth();
  const { user } = useUser();

  const userRole = user?.publicMetadata?.role??"user";
  

  const fetchUserDetail = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('userIdCl', userId);
      if (error) {
        throw error;
      } else {
        return data;
      }
    }
  };
  const fetchUserWeight = async () => {
    if (userId) {
      const { data, error } = await supabase
        .from('weight')
        .select('*')
        .eq('userIdCl', userId);
      if (error) {
        throw error;
      } else {
        return data;
      }
    }
  };
  const fetchPlans = async () => {
    if (!userId) {
      throw new Error("User ID is required to fetch workout plans.");
    }
  
    const { data, error } = await supabase
      .from('workoutPlan')
      .select('*')
      .eq('userIdCl', userId);
  
    if (error) {
      throw error; // This will propagate to React Query's `error` state
    }
  
    return data || []; // Ensure a valid return value, even if no data exists
  };
  


  const { data: userDetail, error: userDetailError,refetch:userRefetch,isFetching } = useQuery({
    queryKey: ['userDetail', userId],
    queryFn: fetchUserDetail,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    infinite: false,
  });
  const { data: userWeightData, error: userWeightError,refetch:userWeightRefetch,isFetching:userWeightisFetching } = useQuery({
    queryKey: ['userWeightData', userId],
    queryFn: fetchUserWeight,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    infinite: false,
  });
  // const { data: userPlanData, error: userPlanError,refetch:userPlanRefetch,isLoading:userPlanisLoading } = useQuery({
  //   queryKey: ['userPlanData', userId],
  //   queryFn: fetchPlans,
  //   enabled: !!userId,
  //   refetchOnWindowFocus: false,
  //   infinite: false,
  // });
  // const planList = {
  //   userPlanData,
  //   userPlanError,
  //   userPlanRefetch,
  //   userPlanisLoading
  // }
  
  const userDetailData = userDetail?.[0] || {}

  
  const [gender, setGender] = useState(null);
  const [weight, setWeight] = useState(50);
  const [height, setHeight] = useState(152);
  const [age, setAge] = useState(null);
  const [selectedGoals, setSelectedGoals] = useState(
    new Set([])
  );
  const [activityLevel,setActivityLevel] = useState(null);
  

  const userAgeCal = calculateAge(userDetailData?.userBirthDate);

  const [show, setShow] = useState(false);

  const handleOpenClose = () => setShow(!show);
  const latestWeight = _.maxBy(userWeightData, (entry) => new Date(entry?.created_at));

  const handleImage=async()=>{
    const data =await  getExercisesGif()
    console.log("process image",data)
  }

  // useEffect(()=>{
  //   handleImage()
  // },[])
  

  const contextValue = useMemo(() => {
    return {

      gender, setGender,
      weight, setWeight,
      height, setHeight,
      age, setAge,
      userDetailData,
      userRefetch,
      isFetching,
      handleOpenClose,
      show,
      selectedGoals, setSelectedGoals,
      activityLevel,setActivityLevel,
      userWeightRefetch,
      latestWeight,
      userId,
      fetchPlans,
      userAgeCal
    };
  }, [ gender, weight, height, age,userDetailData,isFetching,show,selectedGoals,activityLevel,latestWeight,userAgeCal]);

  return (
   
      <GlobalContext.Provider value={contextValue}>
        {children}
      </GlobalContext.Provider>

  );
}
