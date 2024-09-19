"use client";

import { createContext, useMemo, useState, useEffect } from "react";
import Dexie from "dexie";

// Initialize Dexie database
const db = new Dexie("WorkoutApp");
db.version(1).stores({
  exercises: "++id,name"
});

export const GlobalContext = createContext("");

export default function GlobalContextProvider({ children }) {
  const [name, setName] = useState("Sushil");
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
      name,
      selectedExercises,
      addExercise
    };
  }, [name, selectedExercises]);

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
}
