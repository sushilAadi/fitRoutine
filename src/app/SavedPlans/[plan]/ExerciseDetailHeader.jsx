'use client'
import CCollapse from '@/components/Tabs/CCollapse'
import React, { useState } from 'react'

const ExerciseDetailHeader = ({data,toggleOpen,open}) => {
    const [showImage,setShowImage] = useState(false)
    const iamge = "https://v2.exercisedb.io/image/HkPwdDiUZnqZh5"
  return (
    <div className="pb-2 mx-auto overflow-hidden border-b">
      <div className="">
      {showImage && <img src={data?.gifUrl || iamge} alt={data?.name} className="mx-auto" />}
    
        <div className="flex items-center">
          <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-full">
            <img onClick={()=>setShowImage(!showImage)} src={data?.gifUrl || iamge} alt={""} className="w-[60px] cursor-pointer" />
          </div>
          <div>
            <div className="flex items-center">
              <h2 onClick={()=>setShowImage(!showImage)} className="text-xl font-bold text-gray-900 cursor-pointer">{_.capitalize(data?.name)}</h2>
              <i className="mt-1 ml-4 cursor-pointer fa-duotone fa-solid fa-memo-circle-info" onClick={toggleOpen}></i>
            </div>
            <p className="text-sm text-gray-600">{data?.bodyPart} ({data?.target})</p>
            
          </div>
        </div>

        <div className="mt-2">
          <p className="text-sm font-medium text-black">Secondary Muscles</p>
          {data?.secondaryMuscles?.map(j=><span className="px-3 py-1 mr-2 text-xs text-gray-800 bg-gray-100 rounded-full">#{j}</span>)}
        </div>
{open && 
        <div className="mt-2">
        <p className="text-sm font-medium text-black cursor-pointer" onClick={toggleOpen}>Instructions</p>
          <CCollapse open={open}  data={data?.instructions} onClick={toggleOpen}/>
        </div>}
       
      </div>
    </div>
  )
}

export default ExerciseDetailHeader