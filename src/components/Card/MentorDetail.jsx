import React from 'react'

const MentorDetail = ({mentor}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6 md:grid-cols-4">
          <div className="p-3 bg-gray-800 rounded-lg">
            <h3 className="mb-1 text-sm text-gray-400">Languages</h3>
            <p className="text-sm text-white">{mentor.languages.map(lang => lang.label).join(', ')}</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <h3 className="mb-1 text-sm text-gray-400">Qualifications</h3>
            <p className="text-sm text-white">{mentor.qualifications.map(qual => qual.label).join(', ')}</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <h3 className="mb-1 text-sm text-gray-400">Training Locations</h3>
            <p className="text-sm text-white">{mentor.trainingLocations.map(loc => loc.label).join(', ')}</p>
          </div>
          <div className="p-3 bg-gray-800 rounded-lg">
            <h3 className="mb-1 text-sm text-gray-400">Certifications</h3>
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-900">
              {mentor.certificationImages?.map((cert, index) => (
                <img 
                  key={index}
                  src={cert} 
                  alt={`Certification ${index + 1}`}
                  className="flex-none object-cover w-16 h-16 rounded"
                />
              ))}
            </div>
          </div>
        </div>
  )
}

export default MentorDetail