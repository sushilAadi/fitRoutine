import React from "react";
import { Clock } from "lucide-react";
import { Avatar } from "@material-tailwind/react";
import CountdownTimer from "../CountdownTimer";

const MyEnrollmentCard = ({ enrollment, calculateEndDate, formatDateTime }) => {
  
  const getStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600",
      active: "text-green-600",
      completed: "text-blue-600",
      rejected: "text-red-600",
    };
    return colors[status] || "bg-gray-800";
  };

  return (
    <div className="p-4 mb-2 bg-white shadow-lg flex-grow-1 rounded-xl">
      {/* Header with instructor */}
      <div className="flex items-center mb-2">
        <div className="mr-2 text-sm text-gray-600">Instructor</div>
        <Avatar
          src={enrollment?.mentorProfileImage}
          alt="avatar"
          size="xs"
        />
      </div>

      {/* Title and price section */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="mb-1 text-xl font-bold">{enrollment.mentorName}</h2>
          <p className="text-sm text-gray-500">{enrollment.mentorEmail}</p>
        </div>
        {enrollment.status === "rejected" && 
        <div className="text-right">
          <span
            className={`py-2 text-sm font-bold rounded-full ${getStatusColor(
              enrollment.status
            )}`}
          >
            {enrollment.status?.charAt(0).toUpperCase() +
              enrollment.status?.slice(1)}
          </span>
        </div>}
      </div>

      {/* Date and lessons info */}
      {enrollment.status !== "rejected" &&
      <div className="space-y-2">
        <div className="flex items-center text-gray-600">
          <Clock className="w-4 h-4 mr-2" />
          <div className="flex flex-wrap">
            <span className="mr-2 text-sm">
              Start Time:{" "}
              {formatDateTime(
                enrollment.acceptedAt,
                enrollment.package?.type === "hourly"
              )}
            </span>
            <span className="text-sm">
              End Time :{" "}
              {formatDateTime(
                calculateEndDate(enrollment),
                enrollment.package?.type === "hourly"
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center mb-3 text-gray-600">
          <div className="w-4 h-4 mr-2">📚</div>
          <span className="text-sm">
            {enrollment.package?.type === "hourly" ? (
              <p>
                Duration: {enrollment.package?.rate} minutes &nbsp; (
                {enrollment?.package?.type})
              </p>
            ) : (
              <p>Duration: {enrollment.package?.type} </p>
            )}
          </span>
        </div>

        {/* Availability Information */}
        {enrollment.package?.availability && (
          <div className="mb-3 space-y-1">
            {enrollment.package.availability.days && enrollment.package.availability.days.length > 0 && (
              <div className="flex items-center text-gray-600">
                <div className="w-4 h-4 mr-2">📅</div>
                <span className="text-sm">
                  Days: {enrollment.package.availability.days.join(", ")}
                </span>
              </div>
            )}
            
            {enrollment.package.availability.timeSlot && (
              <div className="flex items-center text-gray-600">
                <div className="w-4 h-4 mr-2">🕐</div>
                <span className="text-sm">
                  Time: {enrollment.package.availability.timeSlot}
                </span>
              </div>
            )}

            {enrollment.package.availability.specificTimes && enrollment.package.availability.specificTimes.length > 0 && (
              <div className="flex items-start text-gray-600">
                <div className="w-4 h-4 mr-2 mt-0.5">⏰</div>
                <div className="text-sm">
                  <span className="block mb-1">Preferred Times:</span>
                  <div className="flex flex-wrap gap-1">
                    {enrollment.package.availability.specificTimes.map((timeSlot, index) => (
                      <span 
                        key={index} 
                        className="px-2 py-1 text-xs text-gray-700 bg-gray-200 rounded-full"
                      >
                        {timeSlot}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <CountdownTimer endDate={calculateEndDate(enrollment)} />
      </div>}

      {enrollment.status !== "rejected" &&
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
        <a
          href={`https://wa.me/${enrollment.mentorwhatsapp}`}
          target="_blank"
          className="no-underline cursor-pointer"
          rel="noopener noreferrer"
        >
          <span className="text-sm text-black">
            <i className="text-green-600 fa-brands fa-whatsapp"></i>{" "}
            {enrollment.mentorwhatsapp}
          </span>
        </a>
        <span
            className={`py-2 text-sm font-bold rounded-full ${getStatusColor(
              enrollment.status
            )}`}
          >
            {enrollment.status?.charAt(0).toUpperCase() +
              enrollment.status?.slice(1)}
          </span>
        {/* <div className="flex items-center ml-auto">
          <span className="text-yellow-400">★</span>
          <span className="ml-1 text-sm font-medium">4.9</span>
        </div> */}
      </div>}
    </div>
  );
};

export default MyEnrollmentCard;
