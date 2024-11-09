/* eslint-disable @next/next/no-img-element */
import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import HighlightText from "./HeadingHighlight/HighlightText";


const CCard = ({img,parentStyle,title,caption,name,bgColor="bg-[#DBFE02]",onClick}) => {
  const router = useRouter();
  const firstLetter = _.upperFirst(title?.charAt(0));
  return (
    <div className={` border-2 border-black bg-white   p-2 overflow-hidden min-h-[252px] flex flex-col justify-between  cursor-pointer ${parentStyle}`} onClick={onClick}>
      {/* <span className="text-xl font-bold">A.</span> */}
      <div>
      <div className="flex justify-between">
        <div className="flex">
          <HighlightText title={firstLetter} bgColor={bgColor} />
          <p className=""> {_.upperFirst(title)}</p>
        </div>
        <p className="text-[#9e9e9e] text-[10px]"> {_.upperFirst(caption)}</p>
      </div>
      <div className="mb-[10px] flex justify-center items-center">
        <img src={img} alt="autocad" className="h-[124px] object-contain image-fluid" />
      </div>
      </div>
      
      {/* <p className="text-[12px] semibold mb-0">20:30:56</p> */}
      <p className="text-[12px] line-clamp-2 overflow-hidden text-ellipsis" >{_.upperFirst(name)}</p>
      
    </div>
  );
};

export default CCard;
