import React, { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HighlightText from "./HeadingHighlight/HighlightText";

const CCardRow = ({
  img,
  parentStyle,
  title,
  caption,
  name,
  bgColor = "bg-[#DBFE02]",
  onClick,
  deleteClick,
  sets,
  onSetChange,
  weekIndex
}) => {

  
  const router = useRouter();

  const currentWeekSets = sets.weeklySetConfig 
    ? sets.weeklySetConfig[weekIndex].sets 
    : 0;

  const firstLetter = _.upperFirst(title?.charAt(0));
  const [currentSets, setCurrentSets] = useState(currentWeekSets);

  const handleIncrement = () => {
    const newSets = currentSets + 1;
    setCurrentSets(newSets);
    onSetChange(newSets);
  };

  const handleDecrement = () => {
    if (currentSets > 0) {
      const newSets = currentSets - 1;
      setCurrentSets(newSets);
      onSetChange(newSets);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={img}
            alt={title}
            className="h-[30px] object-contain image-fluid rounded-full mr-3"
          />
          <div className="">
            <p
              className="text-[14px] fw-semibold overflow-hidden truncate max-w-[200px] whitespace-nowrap text-ellipsis mb-3 leading-tight"
              title={_.upperFirst(name)}
            >
              {_.upperFirst(name)}
            </p>

            <div className="flex items-center">
              <span className="text-[10px] leading-tight  text-green-900  rounded-pill inline-flex mr-2 ">
                {_.upperFirst(caption)}
              </span>
              <span className="text-[10px]  leading-tight  text-orange-900  rounded-pill inline-flex mr-2">
                ({_.upperFirst(title)})
              </span>
              <span className="text-[10px]  leading-tight  text-gray-900  rounded-pill inline-flex">
                | &nbsp; {currentSets} Sets
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <i
            className="fa-duotone fa-solid fa-bin-recycle text-red-500 cursor-pointer text-[14px]"
            onClick={deleteClick}
          ></i>
          <div className="flex mt-1">
            {currentSets > 0 && (
              <i 
                className="text-white text-[20px] bg-black rounded-full cursor-pointer fa-light fa-circle-minus mr-3"
                onClick={handleDecrement}
              ></i>
            )}
            <i 
              className="text-white text-[20px] bg-green-500 rounded-full cursor-pointer fa-light fa-circle-plus"
              onClick={handleIncrement}
            ></i>
          </div>
        </div>
      </div>
    </>
  );
};

export default CCardRow;

