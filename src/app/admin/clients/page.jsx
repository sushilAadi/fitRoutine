"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";

const ClientManagement = () => {
  const { user } = useContext(GlobalContext);
  const userRole = user?.publicMetadata?.role;

  // Check if user is admin or coach
  if (userRole !== "admin" && userRole !== "coach") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            You don't have permission to access this page.
          </p>
        </div>
      </SecureComponent>
    );
  }

  return (
    <SecureComponent>
      <div className="min-h-screen bg-gray-50 p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Client Management</h1>
          <p className="text-gray-600">Manage all client profiles, health metrics, and activity history</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-users text-6xl text-blue-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Client Management System</h2>
            <p className="text-gray-600 mb-6">
              Complete client directory with profiles, health metrics tracking, activity history, and communication logs.
            </p>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">🔥 High Priority Features Coming Soon:</h3>
            <ul className="text-left text-blue-700 space-y-2">
              <li>• All Clients List with search and filters</li>
              <li>• Client Profiles with fitness data (BMI, goals, progress)</li>
              <li>• Health Metrics Tracking (weight, measurements, progress photos)</li>
              <li>• Activity History (workouts completed, attendance)</li>
              <li>• Communication Log (messages with instructors)</li>
              <li>• Account Status Management (active, suspended, cancelled)</li>
              <li>• Bulk Operations (notifications, exports, status updates)</li>
            </ul>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full">
            <i className="fas fa-clock mr-2"></i>
            <span className="font-medium">Phase 1 - High Priority Implementation</span>
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default ClientManagement;