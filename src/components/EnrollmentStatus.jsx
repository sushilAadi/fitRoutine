// components/EnrollmentStatus.js
import React from 'react';
import CountdownTimer from './CountdownTimer';

const EnrollmentStatus = ({ enrollment, calculateEndDate, formatDateTime }) => {
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-600',
      active: 'bg-green-600',
      completed: 'bg-blue-600',
      rejected: 'bg-red-600'
    };
    return colors[status] || 'bg-gray-800';
  };

  return (
    <div className="max-w-3xl p-6 mx-auto bg-gray-800 rounded-lg shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-white">Enrollment Status</h2>
        <span className={`px-4 py-2 text-sm font-medium text-white rounded-full ${getStatusColor(enrollment.status)}`}>
          {enrollment.status?.charAt(0).toUpperCase() + enrollment.status?.slice(1)}
        </span>
      </div>

      <div className="p-4 mb-6 bg-gray-700 rounded-lg">
        <h3 className="mb-3 text-lg font-semibold text-white">Program Timeline</h3>
        <div className="grid gap-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-gray-300">
              <p className="font-medium">Start Date & Time:</p>
              <p>{formatDateTime(enrollment.acceptedAt, enrollment.package?.type === 'hourly')}</p>
            </div>
            <div className="space-y-2 text-gray-300">
              <p className="font-medium">End Date & Time:</p>
              <p>{formatDateTime(calculateEndDate(enrollment), enrollment.package?.type === 'hourly')}</p>
            </div>
          </div>
          
          {enrollment.status === 'active' && (
            <div className="">
              <p className="mb-4 font-medium text-gray-300">Time Remaining:</p>
              <CountdownTimer endDate={calculateEndDate(enrollment)} />
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-6 mb-6 md:grid-cols-2">
        <ProgramDetails enrollment={enrollment} />
        <MentorDetails enrollment={enrollment} />
      </div>
    </div>
  );
};

const ProgramDetails = ({ enrollment }) => (
  <div className="p-4 bg-gray-700 rounded-lg">
    <h3 className="mb-3 text-lg font-semibold text-white">Package Details</h3>
    <div className="space-y-2 text-gray-300">
      <p>Type: {enrollment.package?.type}</p>
      {enrollment.package?.type === 'hourly' ? (
        <p>Duration: {enrollment.package?.rate} minutes</p>
      ) : (
        <p>Duration: {enrollment.package?.type}</p>
      )}
    </div>
  </div>
);

const MentorDetails = ({ enrollment }) => (
  <div className="p-4 bg-gray-700 rounded-lg">
    <h3 className="mb-3 text-lg font-semibold text-white">Instructor Information</h3>
    <div className="space-y-2 text-gray-300">
      <p>Name: {enrollment.mentorName}</p>
      <p>Email: {enrollment.mentorEmail}</p>
      {enrollment.mentorSpecialization && (
        <p>Specialization: {enrollment.mentorSpecialization}</p>
      )}
    </div>
  </div>
);

export default EnrollmentStatus;