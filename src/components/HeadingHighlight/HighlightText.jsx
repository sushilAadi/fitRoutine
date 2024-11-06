import React from 'react'

const HighlightText = ({title,bgColor="bg-[#DBFE02]",className,bgStyle}) => {
  return (
    <div className='relative inline-block mr-[8px] z-[999]'>
    <h1 className={`${className} z-[999] text-xl semibold mt-[-3px]`}>{title}</h1>
    <div className={`w-[20px] h-[20px] -right-1 bottom-[12px] absolute ${bgColor} ${bgStyle} `} style={{zIndex:-2}}/>
    </div>
  )
}

export default HighlightText