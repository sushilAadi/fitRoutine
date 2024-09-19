'use client';

import React, { useState, useEffect, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getTargetList, getExercisesByTarget, getEquipmentList } from '@/service/exercise';
import { GlobalContext } from '@/context/GloablContext';

const BodyTarget = () => {

  const { addExercise } = useContext(GlobalContext);

  const [selectedTab, setSelectedTab] = useState('biceps');
  const [selectedEquipment, setSelectedEquipment] = useState('');
  const [filteredExercises, setFilteredExercises] = useState([]);

  const { data: targetList, isLoading: isLoadingTargets, error: targetError } = useQuery({
    queryKey: ['targetList'],
    queryFn: getTargetList
  });

  const { data: equipmentList, isLoading: isLoadingEquipment, error: equipmentError } = useQuery({
    queryKey: ['equipmentList'],
    queryFn: getEquipmentList
  });

  const { data: exercises, isLoading: isLoadingExercises, error: exercisesError } = useQuery({
    queryKey: ['exercises', selectedTab],
    queryFn: () => getExercisesByTarget(selectedTab),
    enabled: !!selectedTab
  });

  useEffect(() => {
    if (exercises) {
      setFilteredExercises(
        selectedEquipment
          ? exercises.filter(exercise => exercise.equipment === selectedEquipment)
          : exercises
      );
    }
  }, [exercises, selectedEquipment]);

  if (isLoadingTargets || isLoadingEquipment) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (targetError || equipmentError) return <div className="text-red-500 text-center">Error: {targetError?.message || equipmentError?.message}</div>;

  return (
    <div className="py-6">
      <div className="fixed top-10 left-0 right-0 z-10 bg-gray-300 w-full">
        <div className="flex space-x-1 overflow-x-auto w-full">
          {targetList?.sort((a, b) => a.localeCompare(b)).map((target) => (
            <button
              key={target}
              className={`px-4 py-2 font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                selectedTab === target
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
              onClick={() => setSelectedTab(target)}
            >
              {target}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-20">
        <div className="mb-4">
          <select
            value={selectedEquipment}
            onChange={(e) => setSelectedEquipment(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">All Equipment</option>
            {equipmentList?.map((equipment) => (
              <option key={equipment} value={equipment}>
                {equipment}
              </option>
            ))}
          </select>
        </div>
        {selectedTab && (
          <div className="animate-fade-in space-y-8">
            {isLoadingExercises ? (
              <div className="text-center text-xl text-gray-600">Loading exercises...</div>
            ) : exercisesError ? (
              <div className="text-center text-xl text-red-500">Error: {exercisesError.message}</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExercises.map((exercise) => (
                  <div key={exercise.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                    <div className="relative w-full h-48">
                      <img 
                        src={exercise.gifUrl} 
                        alt={exercise.name} 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-white opacity-20"></div>
                    </div>
                    <div className="p-4">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">{exercise.name}</h3>
                      <p className="text-gray-600 mb-2"><span className="font-medium">Body Part:</span> {exercise.bodyPart}</p>
                      <p className="text-gray-600 mb-2"><span className="font-medium">Equipment:</span> {exercise.equipment}</p>
                      <details className="text-sm text-gray-700">
                        <summary className="font-medium cursor-pointer hover:text-blue-600">Instructions</summary>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                          {exercise.instructions.map((instruction, index) => (
                            <li key={index}>{instruction}</li>
                          ))}
                        </ul>
                      </details>
                      <button 
                        onClick={() => addExercise(exercise)}
                        className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                      >
                        Add Exercise
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BodyTarget;