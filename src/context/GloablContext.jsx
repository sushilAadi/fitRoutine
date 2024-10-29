"use client";

import { createContext, useMemo, useState, useEffect } from "react";
import { useAuth } from '@clerk/nextjs';
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
  const [age, setAge] = useState(18);
  
  const [selectedExercises, setSelectedExercises] = useState([]);

  // Load exercises from IndexedDB on component mount
  useEffect(() => {
    const loadExercises = async () => {
      const storedExercises = await db.exercises.toArray();
      setSelectedExercises(storedExercises);
    };
    loadExercises();
  }, []);

  const addExercise = async (exercise) => {
    const isExerciseAlreadyAdded = selectedExercises.some(e => e.id === exercise.id);
    if (isExerciseAlreadyAdded) {
      alert("Exercise already added.");
      return;
    }
    
    // Add exercise to IndexedDB and update state
    await db.exercises.add(exercise);
    setSelectedExercises(prev => [...prev, exercise]);
  };

  const contextValue = useMemo(() => {
    return {
      selectedExercises,
      addExercise,
      gender, setGender,
      weight, setWeight,
      height, setHeight,
      age, setAge,
      userDetailData,
      userRefetch,
      isFetching
    };
  }, [selectedExercises, gender, weight, height, age,userDetailData,isFetching]);

  return (
   
      <GlobalContext.Provider value={contextValue}>
        {children}
      </GlobalContext.Provider>

  );
}
