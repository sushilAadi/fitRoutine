import React from 'react'
import ProgressBar from "@/components/ProgressBar";

const ProgressRealTime = ({progressStats}) => {
  return (
    <div className="p-4 mb-6 bg-white rounded-lg shadow-sm">
          <h4 className="mb-3 font-semibold text-md">Workout Progress</h4>
          <div className="space-y-3">
            <ProgressBar 
              percentage={progressStats.progressPlannedOnlyPercent} 
              label="Planned Sets Completed" 
            />
            <ProgressBar 
              percentage={progressStats.progressIncludingExtraPercent} 
              label="Overall Progress (incl. Extra Sets)" 
              className="mt-2"
            />
            <div className="grid grid-cols-3 gap-4 mt-3 text-xs text-gray-600">
              <div>
                <span className="font-medium">Completed: </span>
                {progressStats.totalCompletedPlannedSets}/{progressStats.totalPlannedSets} sets
              </div>
              <div>
                <span className="font-medium">Extra Sets: </span>
                {progressStats.totalCompletedExtraSets}
              </div>
              <div>
                <span className="font-medium">Skipped: </span>
                {progressStats.totalSkippedPlannedSets} sets
              </div>
              <div>
                <span className="font-medium">Remaining: </span>
                {progressStats.totalUnloggedPlannedSets} sets
              </div>
              <div>
                <span className="font-medium">Deleted: </span>
                {progressStats.totalDeletedSets} sets
              </div>
              
            </div>
          </div>
        </div>
  )
}

export default ProgressRealTime