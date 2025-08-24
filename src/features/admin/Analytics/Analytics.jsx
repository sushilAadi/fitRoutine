"use client";
import React from "react";

const Analytics = () => {
  return (
    <div className="analytics">
      <div className="p-4 mb-4 bg-white shadow-sm border-bottom">
        <div>
          <h1 className="mb-2 h2 text-dark fw-bold">Analytics</h1>
          <p className="mb-0 text-muted">View system analytics and reports</p>
        </div>
      </div>

      <div className="px-4 container-fluid">
        <div className="p-5 text-center rounded bg-light">
          <h3 className="text-dark">Analytics Dashboard</h3>
          <p className="mt-2 text-muted">
            Analytics charts and reports will be displayed here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;