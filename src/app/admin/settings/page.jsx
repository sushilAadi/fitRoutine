"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";

const SystemSettings = () => {
  const { user } = useContext(GlobalContext);
  const userRole = user?.publicMetadata?.role;

  // Check if user has admin access
  if (userRole !== "admin") {
    return (
      <SecureComponent>
        <div className="flex flex-col items-center justify-center h-screen text-white bg-tprimary">
          <h2 className="text-xl font-semibold text-red-500">Access Denied</h2>
          <p className="mt-4 text-center">
            Only admins can access system settings.
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure application settings, user roles, and system preferences</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-gear text-6xl text-gray-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">System Settings</h2>
            <p className="text-gray-600 mb-6">
              Comprehensive system configuration with app settings, user management, and security controls.
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">🟢 Low Priority Features Coming Soon:</h3>
            <ul className="text-left text-gray-700 space-y-2">
              <li>• App Configuration (logos, colors, text)</li>
              <li>• User Role Management (permissions, access levels)</li>
              <li>• Feature Toggles (enable/disable features)</li>
              <li>• Backup & Security settings</li>
              <li>• API configuration</li>
              <li>• Notification preferences</li>
              <li>• System maintenance tools</li>
            </ul>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-red-700 text-sm">
              <i className="fas fa-exclamation-triangle mr-2"></i>
              <strong>Admin Only:</strong> System settings can only be modified by administrators.
            </p>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 rounded-full">
            <i className="fas fa-clock mr-2"></i>
            <span className="font-medium">Phase 3 - Low Priority Implementation</span>
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default SystemSettings;