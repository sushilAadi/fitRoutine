"use client";

import { createContext, useMemo, useState, useEffect } from "react";
import { useAuth,useUser } from '@clerk/nextjs';
import { supabase } from '@/createClient';
import { useQuery } from '@tanstack/react-query';
import Dexie from "dexie";

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
  console.log("publicMetadata",{userRole,user})

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

  const { data: userDetail, error: userDetailError,refetch:userRefetch,isFetching } = useQuery({
    queryKey: ['userDetail', userId],
    queryFn: fetchUserDetail,
    enabled: !!userId,
    refetchOnWindowFocus: false,
    infinite: false,
  });
  const userDetailData = userDetail?.[0] || {}


  const [gender, setGender] = useState(null);
  const [weight, setWeight] = useState(50);
  const [height, setHeight] = useState(152);
  const [age, setAge] = useState(null);
  const [selectedGoals, setSelectedGoals] = useState(
    new Set([])
  );
  const [activityLevel,setActivityLevel] = useState(null);
  



  const [show, setShow] = useState(false);

  const handleOpenClose = () => setShow(!show);

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
      activityLevel,setActivityLevel
    };
  }, [ gender, weight, height, age,userDetailData,isFetching,show,selectedGoals,activityLevel]);

  return (
   
      <GlobalContext.Provider value={contextValue}>
        {children}
      </GlobalContext.Provider>

  );
}
