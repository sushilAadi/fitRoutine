import { getExercisesGif } from '@/service/exercise';
import _ from 'lodash'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

const ExerciseDeatil = ({handleClose,data}) => {
  const [imageUrl, setImageUrl] = useState("");

  // const getImage = async (id) => {
  //   const response = await getExercisesGif(id);
  //   return response;
  // };

  // useEffect(() => {
  //   const fetchImage = async () => {
  //     if (data?.id) {
  //       try {
  //         const image = await getImage(data.id);
  //         setImageUrl(image);
  //       } catch (error) {
  //         console.error("Error fetching image:", error);
  //       }
  //     }
  //   };
  //   fetchImage();
  // }, [data?.id]);
  return (
    <div>
        <span className='sticky top-0 z-10 block bg-white cursor-pointer' onClick={handleClose}><i className="pr-2 fa-solid fa-angle-left" />{_.upperFirst("Go back")}</span>
        <div className='p-3 bgImage ' >
    <img src={data?.gifUrl || ""} alt={""} width={"100%"} />
</div>

<div className="glasss">
    <p className='text-[12px]'>{_.upperFirst(data?.target)} <span className='pl-2 text-gray-500'>(secondaryMuscles: {data.secondaryMuscles?.join(', ')})</span></p>
    <h3 className=''>{_.upperFirst(data?.name)}</h3>
    <ul className='pl-5 mt-4 list-disc'>
      {data?.instructions?.map((instruction, index) => (
        <li key={index} className='mb-2 text-gray-700 text-[12px]'>
          {instruction}
        </li>
      ))}
    </ul>
</div>
    </div>
  )
}

export default ExerciseDeatil