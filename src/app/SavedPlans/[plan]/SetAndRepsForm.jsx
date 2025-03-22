import React from "react";
import _ from "lodash";

const SetAndRepsForm = ({ sets,timerdata }) => {
  const range = _.range(0, sets);
const {start, pause, reset} = timerdata
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          <th className="p-2 font-normal">Weight</th>
          <th className="p-2 font-normal">Reps</th>
          <th className="p-2 font-normal text-center"><span className="px-2 py-1 text-white cursor-pointer rounded-pill bg-tprimary">Add Set</span></th>
        </tr>
      </thead>
      <tbody>
        {range.map((set) => (
          <tr key={set}>
            <td className="p-2">
              <div className="flex flex-col">
                <input
                  type="number"
                  className="w-full border h-[40px] px-2"
                  placeholder="Weight"
                />
                <span className="text-[12px] text-gray-500">Duration: 1:30 sec</span>
              </div>
            </td>
            <td className="p-2">
              <div className="flex flex-col">
                <input
                  type="number"
                  className="w-full border h-[40px] px-2"
                  placeholder="Reps"
                />
                <span className="text-[12px] text-gray-500">Rest: 3:2 sec</span>
              </div>
            </td>
            <td className="p-2 text-center">
              <div className="flex items-center justify-center gap-2">
                <i className="p-2 text-red-500 fa-duotone fa-thin fa-play" onClick={start}></i>
                <i className="text-black fa-solid fa-check" onClick={reset}></i>
                <i className="p-2 text-orange-500 fa-duotone fa-light fa-pen-to-square"></i>
                <i className="p-2 text-red-500 fa-duotone fa-solid fa-trash"></i>
              </div>
              <span className="text-[12px] text-gray-500 block mt-1">Weight: 200 kg</span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default SetAndRepsForm;
