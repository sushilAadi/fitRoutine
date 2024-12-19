import React from 'react'
import { Info } from 'lucide-react';

const HealthMetricsRange = ({ value, segments, maxValue, label, unit = '', decimals = 1, description, recommendations, ranges }) => {

    const getCurrentRangeIndex = () => {
        return segments.findIndex((segment, index) => 
          value >= segment.start && (index === segments.length - 1 || value < segments[index + 1].start)
        );
      };
    
      const currentRangeIndex = getCurrentRangeIndex();

  return (
    <div className="pb-6 mt-8 border-b">
      <div className="flex justify-between mb-2">
        <span className="text-lg font-medium">{label}</span>
        <span className="text-lg font-bold">
          {value.toFixed(decimals)} {unit}
        </span>
      </div>
      <div className="relative h-4 my-5 barGraph">
        {segments.map(({ start, end, color }, i) => (
          <div
            key={i}
            className={`absolute top-0 h-full ${color} ${i === 0 ? 'rounded-l-lg' : ''} ${
              end === maxValue ? 'rounded-r-lg' : ''
            }`}
            style={{
              left: `${(start / maxValue) * 100}%`,
              width: `${((end - start) / maxValue) * 100}%`
            }}
          />
        ))}
        {segments.map(({ end }) => (
          <div
            key={end}
            className="absolute top-full mt-2 w-0.5 h-2 bg-gray-300"
            style={{ left: `${(end / maxValue) * 100}%` }}
          >
            <div className="absolute mt-1 text-xs text-gray-500 transform -translate-x-1/2 top-full">
              {end}
            </div>
          </div>
        ))}
        <div
          className="absolute flex items-center justify-center w-8 h-8 -mt-4 -ml-4 transition-all duration-300 bg-white rounded-full shadow-md top-1/2"
          style={{ left: `${(value / maxValue) * 100}%` }}
        >
          <span className="text-xs font-bold">{value.toFixed(decimals)}</span>
        </div>
      </div>
      <div className="mt-4">
        <div className="flex items-start gap-2">
          <Info className="flex-shrink-0 w-5 h-5 mt-1 text-blue-500" />
          <div>
            <p className="text-sm text-gray-600">{description}</p>
            <div className="mt-2">
              <p className="text-sm font-medium text-gray-700">Ranges:</p>
              <ul className="pl-0 mt-1 space-y-1">
                {ranges.map((range, index) => (
                  <li key={index} className={`flex items-center text-sm ${index === currentRangeIndex ? 'font-bold' : ''}`}>
                    <span className={`w-3 h-3 rounded-full mr-2 ${segments[index].color}`}></span>
                    {range}
                    {index === currentRangeIndex && (
                      <span className="px-2 py-1 ml-2 text-xs font-semibold text-white bg-black rounded-full">
                        Current
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-sm font-medium text-gray-700">Recommendations:</p>
              <p className="text-sm text-gray-600">{recommendations}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HealthMetricsRange