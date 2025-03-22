import React from "react";
import _ from "lodash";
import { useStopwatch } from "react-timer-hook";
import RegularButton from "@/components/Button/RegularButton";

const SetAndRepsForm = ({ sets, day, goPrev, goNext }) => {
  console.log("sets", sets); // will return 3
  const range = _.range(0, sets);
  const {milliseconds,seconds,minutes,isRunning,start,pause,reset} = useStopwatch({ autoStart: false, interval: 20 });
  return (
    <>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="p-2 font-normal">Weight</th>
            <th className="p-2 font-normal">Reps</th>
            <th className="p-2 font-normal text-center">
              <span className="px-2 py-1 text-white cursor-pointer rounded-pill bg-tprimary">
                Add Set
              </span>
            </th>
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
                  <span className="text-[12px] text-gray-500">
                    Duration: <span>{minutes}</span>:<span>{seconds}</span>:
                    <span>{milliseconds}</span> sec
                  </span>
                </div>
              </td>
              <td className="p-2">
                <div className="flex flex-col">
                  <input
                    type="number"
                    className="w-full border h-[40px] px-2"
                    placeholder="Reps"
                  />
                  <span className="text-[12px] text-gray-500">
                    Rest: 3:2 sec
                  </span>
                </div>
              </td>
              <td className="p-2 text-center">
                <div className="flex items-center justify-center gap-2">
                  <i
                    className="p-2 text-red-500 fa-duotone fa-thin fa-play"
                    onClick={isRunning ? pause : start}
                  ></i>
                  <i
                    className="text-black fa-solid fa-check"
                    onClick={() => reset(new Date())}
                  ></i>
                  <i className="p-2 text-orange-500 fa-duotone fa-light fa-pen-to-square"></i>
                  <i className="p-2 text-red-500 fa-duotone fa-solid fa-trash"></i>
                </div>
                <span className="text-[12px] text-gray-500 block mt-1">
                  Weight: 200 kg
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <RegularButton
        title="Stop Rest (1 m 20 sec)"
        className="w-full font-medium bg-red-600 hover:bg-red-400"
      />

      <div className="flex justify-between">
        <i
          className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-left"
          onClick={goPrev}
        ></i>
        <i
          className="p-2 border cursor-pointer fa-duotone fa-solid fa-arrow-right"
          onClick={goNext}
        ></i>
      </div>
    </>
  );
};

export default SetAndRepsForm;
