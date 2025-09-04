"use client";
import React, { useContext } from "react";
import { GlobalContext } from "@/context/GloablContext";
import SecureComponent from "@/components/SecureComponent/[[...SecureComponent]]/SecureComponent";

const FinancialReports = () => {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Financial Reports</h1>
          <p className="text-gray-600">Comprehensive business intelligence and revenue analytics</p>
        </div>

        {/* Coming Soon Card */}
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <div className="mb-6">
            <i className="fas fa-chart-pie text-6xl text-green-500 mb-4"></i>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Financial Dashboard</h2>
            <p className="text-gray-600 mb-6">
              Complete business intelligence with revenue analytics, payment tracking, and financial operations.
            </p>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-green-800 mb-2">🔥 High Priority Features Coming Soon:</h3>
            <ul className="text-left text-green-700 space-y-2">
              <li>• Daily/Monthly/Yearly Revenue with interactive charts</li>
              <li>• Payment Method Analysis (card, UPI, cash)</li>
              <li>• Revenue per Instructor breakdown</li>
              <li>• Subscription vs One-time payments</li>
              <li>• Outstanding Payments and overdue tracking</li>
              <li>• Transaction History with advanced search</li>
              <li>• Refund Processing interface</li>
              <li>• Commission Calculations for instructors</li>
              <li>• Invoice Generation and tracking</li>
            </ul>
          </div>
          
          <div className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 rounded-full">
            <i className="fas fa-clock mr-2"></i>
            <span className="font-medium">Phase 1 - High Priority Implementation</span>
          </div>
        </div>
      </div>
    </SecureComponent>
  );
};

export default FinancialReports;