/* eslint-disable @next/next/no-img-element */
import React from "react";
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
}) => {
  const router = useRouter();
  const firstLetter = _.upperFirst(title?.charAt(0));
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <img
            src={img}
            alt="autocad"
            className="h-[30px] object-contain image-fluid rounded-full mr-2"
          />
          <div className="">
  <p
    className="text-[12px] fw-semibold overflow-hidden truncate max-w-[160px] whitespace-nowrap text-ellipsis m-0 leading-tight"
    title={_.upperFirst(name)}
  >
    {_.upperFirst(name)}
  </p>
  <p className="text-[10px] m-0 leading-tight bg-green-100 text-green-900 px-2 rounded-pill inline-flex">
    {caption} ( {_.upperFirst(title)} )
  </p>
</div>
        </div>
        <i
          className="fa-duotone fa-solid fa-bin-bottles-recycle text-red-500 cursor-pointer text-[14px]"
          onClick={deleteClick}
        ></i>
      </div>

      {/* <div className={` ${parentStyle}`} onClick={onClick}>
      <span className="text-xl font-bold">A.</span>
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
     
      <p className="text-[12px] line-clamp-2 overflow-hidden text-ellipsis" >{_.upperFirst(name)}</p>
      
    </div> */}
    </>
  );
};

export default CCardRow;
