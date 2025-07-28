import React from 'react';

const WarningMessage = ({ missingDays, onDayClick }) => {
  return (
    <div className="p-3 mb-2 text-white bg-red-500">
      <p>Warning: The following days are missing exercises:</p>
      <ul>
        {missingDays.map((day, index) => (
          <li 
            key={index} 
            className="cursor-pointer hover:underline"
            onClick={() => onDayClick(day.weekIndex, day.dayIndex)}
          >
            {day.week} - {day.day}
          </li>
        ))}
      </ul>
      <p>Please add exercises to these days before saving the plan.</p>
    </div>
  );
};

export default WarningMessage;

