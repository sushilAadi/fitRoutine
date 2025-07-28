import { ChevronLeft, Star } from 'lucide-react'
import React from 'react'

const MentorProfile = ({mentor}) => {
  return (
    <div className="relative h-80">
        <img 
          src={mentor.profileImage} 
          alt={mentor.name}
          className="object-cover w-full h-full"
        />
        <button className="absolute p-2 transition rounded-full top-4 left-4 bg-gray-800/50 hover:bg-gray-800/70">
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-900">
          <h1 className="mb-2 text-2xl font-bold text-white">{mentor.name}</h1>
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star}
                  className={`w-4 h-4 ${star <= (mentor.experience_years/2) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'}`}
                />
              ))}
            </div>
            <span>{mentor.experience_years} years exp.</span>
          </div>
        </div>
      </div>
  )
}

export default MentorProfile