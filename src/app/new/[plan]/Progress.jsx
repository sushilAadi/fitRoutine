import { calculateDetailedWorkoutProgress, countAllSkippedInStorage } from '@/utils/progress'; // Assuming path
import React from 'react';

const Progress = ({ transFormedData, firebaseStoredData }) => {
  // Check if required data is available at the start
  if (!transFormedData || !firebaseStoredData) {
    return (
      <div className="max-w-xl p-6 mx-auto text-sm text-center text-blue-600 rounded-lg bg-blue-50">
        Loading workout data... Please wait.
      </div>
    );
  }

  // Calculate progress details
  const progressDetails = calculateDetailedWorkoutProgress(transFormedData, firebaseStoredData);

  // Handle calculation errors or invalid data
  if (!progressDetails) {
    return (
      <div className="max-w-xl p-6 mx-auto text-sm font-medium text-center text-red-600 rounded-lg bg-red-50">
        Could not calculate workout progress. Please check the data or console for errors.
      </div>
    );
  }

  // Optionally get the raw count of all skipped sets in storage
  const totalSkippedInStorageRaw = countAllSkippedInStorage(firebaseStoredData);

  // Destructure for easier access
  const {
    totalPlannedSets,
    totalCompletedPlannedSets,
    totalSkippedPlannedSets,
    totalUnloggedPlannedSets,
    totalCompletedExtraSets,
    totalSkippedExtraSets,
    progressPlannedOnlyPercent,
    completionRateOfAttemptedPercent,
    overallAttemptRatePercent,
    progressIncludingExtraPercent,
  } = progressDetails;

  // Helper component for consistent metric display
  const MetricCard = ({ title, value, description, note, children }) => (
    <div className="p-4 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-gray-800">{title}: <span className="font-bold text-blue-600">{value}</span></h2>
      {description && <p className="mb-1 text-xs text-gray-600">{description}</p>}
      {note && <p className="mt-1 text-xs italic text-gray-500">{note}</p>}
      {children}
    </div>
  );

  // Helper for list items
  const DetailListItem = ({ label, value }) => (
     <li className="flex items-center justify-between py-1 text-xs border-b border-gray-100 last:border-b-0">
        <span className="text-gray-600">{label}:</span>
        <span className="font-medium text-gray-800">{value}</span>
     </li>
  );


  return (
    // Overall container: padding, background, max-width, centering, base text size/color
    <div className="p-4 mx-auto overflow-auto text-sm text-gray-700 rounded-lg shadow-md workout-progress-container sm:p-6 bg-gray-50">
      <h1 className="mb-5 text-lg font-bold text-center text-gray-900 sm:text-xl">
        Workout Progress Overview
      </h1>

      {/* Basic Progress (Original) */}
      <MetricCard
        title="Progress (Planned Sets)"
        value={`${progressPlannedOnlyPercent}%`}
        description={`(${totalCompletedPlannedSets} / ${totalPlannedSets} planned sets completed)`}
      >
        {/* Optional: Visual progress bar */}
        <div className="w-full h-2 mt-2 bg-gray-200 rounded-full dark:bg-gray-700">
          <div
            className="h-2 transition-all duration-500 ease-out bg-blue-600 rounded-full"
            style={{ width: `${progressPlannedOnlyPercent}%` }}
            aria-valuenow={progressPlannedOnlyPercent}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
      </MetricCard>

      {/* Progress Including Extras */}
       <MetricCard
         title="Overall Completion (Incl. Extras)"
         value={`${progressIncludingExtraPercent}%`}
         description={`(${totalCompletedPlannedSets + totalCompletedExtraSets} completed / ${totalPlannedSets} planned sets)`}
         note={totalCompletedExtraSets > 0 ? `Includes ${totalCompletedExtraSets} extra completed set(s).` : null}
       />

      {/* Attempt Rate */}
      <MetricCard
        title="Attempt Rate (Planned Sets)"
        value={`${overallAttemptRatePercent}%`}
        description={`(${totalCompletedPlannedSets + totalSkippedPlannedSets} / ${totalPlannedSets} planned sets attempted [completed or skipped])`}
        note={totalUnloggedPlannedSets > 0 ? `${totalUnloggedPlannedSets} planned set(s) have no completion/skipped record.` : null}
      />

       {/* Completion Rate of Attempted */}
       <MetricCard
         title="Completion Efficiency (Of Attempted)"
         value={`${completionRateOfAttemptedPercent}%`}
         description={`(${totalCompletedPlannedSets} completed / ${totalCompletedPlannedSets + totalSkippedPlannedSets} attempted planned sets)`}
         note="Shows success rate only for sets you marked as completed or skipped."
       />

      {/* Detailed Counts */}
      <div className="p-4 mt-6 bg-white border border-gray-200 rounded-lg shadow-sm progress-details">
        <h3 className="mb-3 text-base font-semibold text-gray-800">Detailed Counts:</h3>
        <ul className="p-0 m-0 list-none">
          <DetailListItem label="Total Planned Sets" value={totalPlannedSets} />
          <DetailListItem label="Completed (Planned)" value={totalCompletedPlannedSets} />
          <DetailListItem label="Skipped (Planned)" value={totalSkippedPlannedSets} />
          <DetailListItem label="Unlogged (Planned)" value={totalUnloggedPlannedSets} />
          <DetailListItem label="Completed (Extra)" value={totalCompletedExtraSets} />
          <DetailListItem label="Skipped (Extra)" value={totalSkippedExtraSets} />
          <li className="flex items-center justify-between py-1 pt-2 mt-2 text-xs border-t border-gray-300 border-dashed">
            <em className="text-gray-500">Total Skipped Logged (Raw):</em>
            <em className="font-medium text-gray-600">{totalSkippedInStorageRaw}</em>
          </li>
        </ul>
      </div>

      {/* Basic Debug Info (Optional - Remove for production) */}
      {/* <pre className="p-3 mt-6 overflow-x-auto text-xs bg-gray-100 rounded">
        Debug Data:
        {JSON.stringify(progressDetails, null, 2)}
      </pre> */}
    </div>
  );
};

export default Progress;