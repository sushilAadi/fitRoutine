'use client'
import React, { useState, useEffect, useCallback } from 'react'
import _ from 'lodash'
import { getExercisesGif } from '@/service/exercise'

// Cache for storing fetched images and failed attempts
const imageCache = new Map()
const failedAttempts = new Set()
const CACHE_EXPIRY = 30 * 60 * 1000 // 30 minutes

// Exercise Item Component with API image loading
const ExerciseItem = ({ exercise, index }) => {
  const [imageUrl, setImageUrl] = useState('')
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Initialize with gifUrl if available
  useEffect(() => {
    if (exercise.gifUrl && !imageUrl) {
      setImageUrl(exercise.gifUrl)
    }
  }, [exercise.gifUrl, imageUrl])

  // Debounced function to prevent rapid API calls
  const debouncedGetImage = useCallback(_.debounce(async (id, callback) => {
    try {
      const response = await getExercisesGif(id)

      // Store in cache with timestamp
      imageCache.set(id, {
        url: response,
        timestamp: new Date().getTime()
      })

      callback(response)
    } catch (error) {
      console.error("Error fetching image:", error)
      failedAttempts.add(id) // Mark this exercise as failed
      callback(exercise?.gifUrl || "")
    }
  }, 1000), [exercise?.gifUrl])

  const getImage = useCallback(async (id) => {
    // Don't attempt if we've already failed for this exercise
    if (failedAttempts.has(id)) {
      return exercise?.gifUrl || ""
    }

    // Check if we have a cached image that hasn't expired
    if (imageCache.has(id)) {
      const cachedData = imageCache.get(id)
      const now = new Date().getTime()

      // If the cache hasn't expired, use the cached image
      if (now - cachedData.timestamp < CACHE_EXPIRY) {
        return cachedData.url
      }
    }

    // If no cache or expired, fetch new image using debounced function
    return new Promise((resolve) => {
      debouncedGetImage(id, resolve)
    })
  }, [debouncedGetImage, exercise?.gifUrl])

  useEffect(() => {
    const fetchImage = async () => {
      if (exercise?.id && !failedAttempts.has(exercise.id)) {
        console.log('Fetching image for exercise:', exercise.id, exercise.name)
        setIsLoading(true)
        try {
          const image = await getImage(exercise.id)
          console.log('Got image URL:', image)
          if (image) {
            setImageUrl(image)
            setImageError(false)
          }
        } catch (error) {
          console.error('Error fetching image:', error)
          setImageError(true)
        }
        setIsLoading(false)
      }
    }

    // Always try to fetch better quality image from API if we have an exercise ID
    if (exercise?.id && !failedAttempts.has(exercise.id) && (!imageUrl || imageUrl === exercise.gifUrl)) {
      fetchImage()
    }
  }, [exercise?.id, getImage])

  const handleImageError = () => {
    setImageError(true)
    // Don't attempt API call if the original gifUrl also failed
    if (imageUrl === exercise.gifUrl) {
      failedAttempts.add(exercise.id)
    }
  }

  return (
    <div className="p-2 transition-shadow border border-gray-200 rounded-lg hover:shadow-sm">
      {/* Exercise Header */}
      <div className="flex items-start space-x-2">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 overflow-hidden bg-gray-200 rounded relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            {imageUrl && !imageError && (
              <img
                src={imageUrl}
                alt={exercise.name || ''}
                className="object-cover w-full h-full"
                onError={handleImageError}
                onLoad={() => console.log('Image loaded successfully:', imageUrl)}
              />
            )}
            {!imageUrl && !isLoading && (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">
                <i className="fas fa-dumbbell"></i>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-gray-900 capitalize leading-tight">
            {_.capitalize(exercise.name)}
          </h4>
          <p className="text-xs text-gray-600">
            {exercise.bodyPart} • {exercise.target}
          </p>

          {/* Set Info */}
          {exercise.weeklySetConfig && (
            <div className="mt-1 flex flex-wrap gap-1">
              <span className="inline-flex items-center px-1.5 py-0.5 text-xs text-blue-800 bg-blue-100 rounded">
                {exercise.weeklySetConfig.sets} sets
              </span>
              {exercise.weeklySetConfig.reps && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs text-green-800 bg-green-100 rounded">
                  {exercise.weeklySetConfig.reps} reps
                </span>
              )}
              {exercise.weeklySetConfig.weight && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-xs text-orange-800 bg-orange-100 rounded">
                  {exercise.weeklySetConfig.weight}kg
                </span>
              )}
            </div>
          )}

          {/* Secondary Muscles */}
          {exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0 && (
            <div className="mt-1">
              <div className="flex flex-wrap gap-1">
                {exercise.secondaryMuscles.slice(0, 2).map((muscle, muscleIndex) => (
                  <span
                    key={muscleIndex}
                    className="px-1 py-0.5 text-xs text-gray-700 bg-gray-100 rounded"
                  >
                    {muscle}
                  </span>
                ))}
                {exercise.secondaryMuscles.length > 2 && (
                  <span className="px-1 py-0.5 text-xs text-gray-700 bg-gray-100 rounded">
                    +{exercise.secondaryMuscles.length - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const ExerciseListCanvas = ({
  isOpen,
  onClose,
  exercises = [],
  dayName,
  weekName
}) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
          onClick={onClose}
        />
      )}

      {/* Canvas */}
      <div className={`fixed top-0 right-0 z-[9999] h-full w-80 bg-white shadow-xl transition-transform duration-300 ease-in-out transform flex flex-col ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b bg-gray-50 flex-shrink-0">
          <div>
            <h3 className="text-base font-semibold text-gray-900">
              {dayName || 'Today\'s Workout'}
            </h3>
            <p className="text-xs text-gray-600">{weekName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-500 transition-colors rounded-full hover:text-gray-700 hover:bg-gray-200"
            aria-label="Close"
          >
            <i className="text-sm fas fa-times"></i>
          </button>
        </div>

        {/* Exercise List */}
        <div className="flex-1 overflow-y-auto p-3">
          {exercises.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-gray-500 text-sm">No exercises scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-2">
              {exercises.map((exercise, index) => (
                <ExerciseItem
                  key={exercise.id || `${index}-${exercise.name}`}
                  exercise={exercise}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t bg-gray-50 flex-shrink-0">
          <div className="text-xs text-center text-gray-600">
            <span className="font-medium">{exercises.length}</span> exercises total
          </div>
        </div>
      </div>
    </>
  )
}

export default ExerciseListCanvas