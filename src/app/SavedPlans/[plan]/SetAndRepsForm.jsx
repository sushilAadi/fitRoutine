import React from 'react';

const SetAndRepsForm = ({sets}) => {
    const range = _.range(0,sets)
    console.log("sets",sets,range)
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr className="">
          <th className="p-2 font-normal">Weight</th>
          <th className="p-2 font-normal">Reps</th>
          <th className="p-2 font-normal"></th>
        </tr>
      </thead>
      <tbody>
      {range?.map(set=>{
        return (
            <tr key={set}>
          <td >
            <input type="number" className="w-full border h-[40px] px-2 " placeholder="Weight" />
          </td>
          <td>
            <input type="number" className="w-full border h-[40px] px-2 " placeholder="Reps" />
          </td>
          {/* Centering the icons correctly */}
          <td className="p-2 text-center">
            <div className="flex items-center justify-center gap-2">
              <i className="p-2 text-red-500 fa-duotone fa-thin fa-play"></i>
              <i className="p-2 text-orange-500 fa-duotone fa-light fa-pen-to-square"></i>
              <i className="p-2 text-red-500 fa-duotone fa-solid fa-trash"></i>
            </div>
          </td>
        </tr>
        )
      })}
        
      </tbody>
    </table>
  );
};

export default SetAndRepsForm;
