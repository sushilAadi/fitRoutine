'use client';

import React, { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getBodyPartList, getExercisesByBodyPart } from '@/service/exercise';
import { GlobalContext } from '@/context/GloablContext';

const BodyParts = () => {
  const { addExercise } = useContext(GlobalContext);
  const [selectedTab, setSelectedTab] = useState('chest');
  const { data: bodyParts, isLoading: isLoadingBodyParts, error: bodyPartsError } = useQuery({
    queryKey: ['bodyParts'],
    queryFn: getBodyPartList
  });

  const { data: exercises, isLoading: isLoadingExercises, error: exercisesError } = useQuery({
    queryKey: ['exercises', selectedTab],
    queryFn: () => getExercisesByBodyPart(selectedTab),
    enabled: !!selectedTab
  });

  if (isLoadingBodyParts) return <div className="flex justify-center items-center h-screen">Loading body parts...</div>;
  if (bodyPartsError) return <div className="text-red-500 text-center">Error: {bodyPartsError.message}</div>;

  return (
    <div className=" py-6">
      <div className="fixed top-6 left-0 right-0 z-10 bg-gray-300 w-full">
        <div className="flex space-x-1 overflow-x-auto w-full">
          {bodyParts?.sort((a, b) => a.localeCompare(b)).map((bodyPart) => (
            <button
              key={bodyPart}
              className={`px-4 py-2 font-medium transition-all duration-300 cursor-pointer whitespace-nowrap ${
                selectedTab === bodyPart
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-blue-600'
              }`}
              onClick={() => setSelectedTab(bodyPart)}
            >
              {bodyPart}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-20">
      
        {selectedTab && (
          <div className="animate-fade-in space-y-8">
            {/* <h2 className="text-3xl font-bold text-center text-blue-600 mb-6">{selectedTab}</h2> */}
            {isLoadingExercises ? (
              <div className="text-center text-xl text-gray-600">Loading exercises...</div>
            ) : exercisesError ? (
              <div className="text-center text-xl text-red-500">Error: {exercisesError.message}</div>
            ) : (
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" >
                {exercises?.map((exercise) => (
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
                      <p className="text-gray-600 mb-2"><span className="font-medium">Target:</span> {exercise.target}</p>
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

export default BodyParts;