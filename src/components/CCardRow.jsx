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
            alt={title}
            className="h-[30px] object-contain image-fluid rounded-full mr-3"
          />
          <div className="">
            <p
              className="text-[12px] fw-semibold overflow-hidden truncate max-w-[200px] whitespace-nowrap text-ellipsis mb-2 leading-tight"
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
                | &nbsp; 4 Sets
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <i
            className="fa-duotone fa-solid fa-bin-bottles-recycle text-red-500 cursor-pointer text-[14px]"
            onClick={deleteClick}
          ></i>
          <div className="flex gap-2">
            <i class="fa-light fa-circle-minus bg-black rounded-full text-white cursor-pointer"></i>
            <i class="fa-light fa-circle-plus bg-green-500 rounded-full text-white cursor-pointer"></i>
          </div>
        </div>
      </div>
    </>
  );
};

export default CCardRow;


