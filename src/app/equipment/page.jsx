'use client';

import React, { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEquipmentList, getExercisesByEquipment } from '@/service/exercise';
import { GlobalContext } from '@/context/GloablContext';

const EquipmentPage = () => {
  const { addExercise } = useContext(GlobalContext);
  const [selectedEquipment, setSelectedEquipment] = useState("barbell");

  const { data: equipmentList, isLoading: isLoadingEquipment, error: equipmentError } = useQuery({
    queryKey: ['equipmentList'],
    queryFn: getEquipmentList
  });

  const { data: exercises, isLoading: isLoadingExercises, error: exercisesError } = useQuery({
    queryKey: ['exercisesByEquipment', selectedEquipment],
    queryFn: () => getExercisesByEquipment(selectedEquipment),
    enabled: !!selectedEquipment
  });

  if (isLoadingEquipment) return <div>Loading equipment list...</div>;
  if (equipmentError) return <div>Error loading equipment list: {equipmentError.message}</div>;

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold mb-4">Equipment Selector</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {equipmentList?.map((equipment) => (
          <button
            key={equipment}
            className={`p-2 rounded text-black ${selectedEquipment === equipment ? 'bg-blue-500' : 'bg-gray-200'}`}
            onClick={() => setSelectedEquipment(equipment)}
          >
            {equipment}
          </button>
        ))}
      </div>
      {selectedEquipment && (
        <div>
          <h2 className="text-2xl font-semibold mb-4">Exercises for {selectedEquipment}</h2>
          {isLoadingExercises && <div>Loading exercises...</div>}
          {exercisesError && <div>Error loading exercises: {exercisesError.message}</div>}
          {exercises && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {exercises.map((exercise) => (
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
  );
};

export default EquipmentPage;