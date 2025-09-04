"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";

const CommunicationCenter = () => {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Communication Center</h1>
          <p className="text-gray-600">Manage all client communications, notifications, and campaigns</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-bullhorn text-6xl text-purple-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Communication Center</h2>
            <p className="text-gray-600 mb-6">
              Comprehensive communication platform with WhatsApp, email campaigns, and notifications.
            </p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">🟡 Medium Priority Features Coming Soon:</h3>
            <ul className="text-left text-purple-700 space-y-2">
              <li>• WhatsApp Integration management</li>
              <li>• Email Campaigns to clients</li>
              <li>• Push Notifications scheduling</li>
              <li>• Announcements broadcast system</li>
              <li>• Message templates library</li>
              <li>• Communication analytics</li>
              <li>• Automated follow-ups</li>
            </ul>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-800 rounded-full">
            <i className="fas fa-clock mr-2"></i>
            <span className="font-medium">Phase 2 - Medium Priority Implementation</span>
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default CommunicationCenter;