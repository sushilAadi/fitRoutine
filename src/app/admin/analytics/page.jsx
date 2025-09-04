"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";

const AnalyticsReports = () => {
  const { user } = useContext(GlobalContext);
  const userRole = user?.publicMetadata?.role;

  // Check if user has admin access
  if (userRole !== "admin") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            Only admins can access analytics and reports.
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics & Reports</h1>
          <p className="text-gray-600">Advanced business intelligence and performance metrics</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-chart-bar text-6xl text-indigo-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Analytics & Reports</h2>
            <p className="text-gray-600 mb-6">
              Advanced analytics with user engagement metrics, instructor performance, and business KPIs.
            </p>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-indigo-800 mb-2">🟡 Medium Priority Features Coming Soon:</h3>
            <ul className="text-left text-indigo-700 space-y-2">
              <li>• User Engagement metrics (app usage, session duration)</li>
              <li>• Instructor Performance (client satisfaction, retention)</li>
              <li>• Business KPIs (churn rate, lifetime value)</li>
              <li>• Custom Report Builder</li>
              <li>• Comparative analysis tools</li>
              <li>• Export capabilities (PDF, Excel)</li>
              <li>• Automated reporting schedules</li>
            </ul>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">
              <i className="fas fa-lock mr-2"></i>
              <strong>Admin Only:</strong> This section requires administrator privileges.
            </p>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-indigo-100 text-indigo-800 rounded-full">
            <i className="fas fa-clock mr-2"></i>
            <span className="font-medium">Phase 2 - Medium Priority Implementation</span>
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default AnalyticsReports;