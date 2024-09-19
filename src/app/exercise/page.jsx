'use client';

import React, { useState, useContext, useCallback } from 'react';
import { Accordion, AccordionHeader, AccordionBody } from "@material-tailwind/react";
import { GlobalContext } from '@/context/GloablContext';
import { exercises } from '@/utils/exercise';
import debounce from 'lodash/debounce';

const ExercisePage = () => {
  const { addExercise } = useContext(GlobalContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [openAccordion, setOpenAccordion] = useState({});
  const [filteredExercises, setFilteredExercises] = useState(exercises);

  const debouncedSearch = useCallback(
    debounce((term) => {
      const filtered = exercises.filter(exercise => 
        exercise.name.toLowerCase().includes(term) ||
        exercise.bodyPart.toLowerCase().includes(term) ||
        exercise.equipment.toLowerCase().includes(term) ||
        exercise.target.toLowerCase().includes(term)
      );
      setFilteredExercises(filtered);
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    debouncedSearch(term);
  };

  const handleAccordionToggle = (id) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-4">Exercise List</h1>
      <input
        type="text"
        placeholder="Search exercises..."
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full p-2 mb-4 border rounded"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredExercises.map((exercise) => (
          <div key={exercise.id} className="border p-4 rounded shadow">
            <h2 className="text-xl font-semibold mb-2">{exercise.name}</h2>
            <img 
              src={exercise.gifUrl} 
              alt={exercise.name} 
              className="w-full h-48 object-contain mb-2" 
            />
            <p><strong>Body Part:</strong> {exercise.bodyPart}</p>
            <p><strong>Equipment:</strong> {exercise.equipment}</p>
            <p><strong>Target:</strong> {exercise.target}</p>
            <p><strong>Secondary Muscles:</strong> {exercise.secondaryMuscles.join(', ')}</p>
            <Accordion open={openAccordion[exercise.id]} className=" pb-1">
              <AccordionHeader onClick={() => handleAccordionToggle(exercise.id)} className="border-b-0 transition-colors text-blue-gray-900 hover:!text-blue-500 flex justify-between items-center">
                <span className="flex-grow">Instructions</span>
                <span className="transform transition-transform duration-300 ml-2">
                  {openAccordion[exercise.id] ? '▲' : '▼'}
                </span>
              </AccordionHeader>
              <AccordionBody className="text-base font-normal pt-0">
                <ol className="list-decimal list-inside">
                  {exercise.instructions.map((instruction, index) => (
                    <li key={index} className="mb-1">{instruction}</li>
                  ))}
                </ol>
              </AccordionBody>
            </Accordion>
            <button 
              onClick={() => addExercise(exercise)}
              className="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              Add Exercise
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExercisePage;