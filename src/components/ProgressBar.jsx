import React from 'react'

const ProgressBar = ({ percentage, label, className = "" }) => {

    const clampedPercentage = Math.min(100, Math.max(0, percentage || 0))

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between mb-1">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-medium">{clampedPercentage}%</span>
      </div>
      <div className="w-full h-2.5 bg-gray-200 rounded-full">
        <div
          className="h-2.5 rounded-full bg-green-600 transition-all duration-500 ease-out"
          style={{ width: `${clampedPercentage}%` }}
        ></div>
      </div>
    </div>
  )
}

export default ProgressBar