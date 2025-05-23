import React, { useEffect, useState } from 'react'

const PreviousHistory = ({firebaseStoredData,exerciseId}) => {
    
    const [history, setHistory] = useState([]);

  const extractHistoryByExerciseId = ({ firebaseStoredData, exerciseId }) => {
    const result = [];

    for (const key in firebaseStoredData) {
      const value = firebaseStoredData[key];
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry.exerciseId === exerciseId) {
            result.push(entry);
          }
        });
      }
    }

    return result;
  };

  useEffect(() => {
    if (firebaseStoredData && exerciseId) {
      const filteredHistory = extractHistoryByExerciseId({ firebaseStoredData, exerciseId });
      setHistory(filteredHistory);
    }
  }, [firebaseStoredData, exerciseId]);


  return (
    <div className="mb-4 overflow-y-auto border rounded bg-gray-50 max-h-48">
          {" "}
          <h4 className="sticky top-0 p-2 text-sm font-semibold bg-gray-100 border-b">
            Previous Records
          </h4>
          <div className="p-2 text-xs">
           
               
                {history.length === 0 ? (
        <p>No previous records found for this exercise.</p>
      ) : (
        <ul className='pl-0'>
          {history.map((item, index) => (
            <li key={index}>
              Reps: {item?.reps || 0}, Weight: {item?.weight || 0},   - Date: {item?.date} {item.skipped && <span className='text-red-500'>(Skipped)</span>}
            </li>
          ))}
        </ul>
      )}
          </div>
        </div>
  )
}

export default PreviousHistory