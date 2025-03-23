'use client'
import CCollapse from '@/components/Tabs/CCollapse'
import { getExercisesGif } from '@/service/exercise'
import React, { useEffect, useState, useCallback } from 'react'
import _ from 'lodash'

// Create a cache outside the component to persist between renders
const imageCache = new Map();
const CACHE_EXPIRY = 30 * 60 * 1000; // 30 minutes in milliseconds

const ExerciseDetailHeader = ({data, toggleOpen, open}) => {
    const [showImage, setShowImage] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const getImage = useCallback(async (id) => {
        // Check if we have a cached image that hasn't expired
        if (imageCache.has(id)) {
            const cachedData = imageCache.get(id);
            const now = new Date().getTime();
            
            // If the cache hasn't expired, use the cached image
            if (now - cachedData.timestamp < CACHE_EXPIRY) {
                return cachedData.url;
            }
        }
        
        // If no cache or expired, fetch new image
        try {
            const response = await getExercisesGif(id);
            
            // Store in cache with timestamp
            imageCache.set(id, {
                url: response,
                timestamp: new Date().getTime()
            });
            
            return response;
        } catch (error) {
            console.error("Error fetching image:", error);
            return "";
        }
    }, []);

    useEffect(() => {
        const fetchImage = async () => {
            if (data?.id) {
                const image = await getImage(data.id);
                setImageUrl(image);
            }
        };
        
        fetchImage();
    }, [data?.id, getImage]);

    return (
        <div className="p-3 pt-4 mx-auto overflow-hidden bg-white">
            <div className="">
                {showImage && <img src={imageUrl || ""} alt={data?.name} className="mx-auto" />}
            
                <div className="flex items-center">
                    <div className="flex items-center justify-center w-12 h-12 mr-4 rounded-full">
                        <img 
                            onClick={() => setShowImage(!showImage)} 
                            src={imageUrl || ""} 
                            alt={data?.name || ""} 
                            className="w-[60px] cursor-pointer" 
                        />
                    </div>
                    <div>
                        <div className="flex items-center">
                            <h2 
                                onClick={() => setShowImage(!showImage)} 
                                className="text-xl font-bold text-gray-900 cursor-pointer"
                            >
                                {_.capitalize(data?.name)}
                            </h2>
                            <i 
                                className="mt-1 ml-4 cursor-pointer fa-duotone fa-solid fa-memo-circle-info" 
                                onClick={toggleOpen}
                            ></i>
                        </div>
                        <p className="text-sm text-gray-600">{data?.bodyPart} ({data?.target})</p>
                    </div>
                </div>

                <div className="mt-2">
                    <p className="text-sm font-medium text-black">Secondary Muscles</p>
                    {data?.secondaryMuscles?.map((muscle, index) => (
                        <span 
                            key={index} 
                            className="px-3 py-1 mr-2 text-xs text-gray-800 bg-gray-100 rounded-full"
                        >
                            #{muscle}
                        </span>
                    ))}
                </div>
                
                {open && (
                    <div className="mt-2">
                        <p 
                            className="text-sm font-medium text-black cursor-pointer" 
                            onClick={toggleOpen}
                        >
                            Instructions
                        </p>
                        <CCollapse open={open} data={data?.instructions} onClick={toggleOpen} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default React.memo(ExerciseDetailHeader);