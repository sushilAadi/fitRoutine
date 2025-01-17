import React from "react";
import { Clock } from "lucide-react";
import { Avatar } from "@material-tailwind/react";
import CountdownTimer from "../CountdownTimer";

const MyEnrollmentCard = ({ enrollment, calculateEndDate, formatDateTime }) => {
  console.log("enrollment", enrollment);
  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-600",
      active: "bg-green-600",
      completed: "bg-blue-600",
      rejected: "bg-red-600",
    };
    return colors[status] || "bg-gray-800";
  };

  return (
    <div className="max-w-sm p-4 bg-white shadow-lg rounded-xl">
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
        <div className="text-right">
          <span
            className={`px-4 py-2 text-sm font-medium text-white rounded-full ${getStatusColor(
              enrollment.status
            )}`}
          >
            {enrollment.status?.charAt(0).toUpperCase() +
              enrollment.status?.slice(1)}
          </span>
        </div>
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
        <CountdownTimer endDate={calculateEndDate(enrollment)} />
      </div>}

      {enrollment.status !== "rejected" &&
      <div className="flex items-center pt-4 mt-4 border-t border-gray-100">
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
        {/* <div className="flex items-center ml-auto">
          <span className="text-yellow-400">★</span>
          <span className="ml-1 text-sm font-medium">4.9</span>
        </div> */}
      </div>}
    </div>
  );
};

export default MyEnrollmentCard;
