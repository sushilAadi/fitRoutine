"use client";
import React from "react";

const SystemSettings = () => {
  return (
    <div className="system-settings">
      <div className="p-4 mb-4 bg-white shadow-sm border-bottom">
        <div>
          <h1 className="mb-2 h2 text-dark fw-bold">System Settings</h1>
          <p className="mb-0 text-muted">Configure system-wide settings and preferences</p>
        </div>
      </div>

      <div className="px-4 container-fluid">
        <div className="p-5 text-center rounded bg-light">
          <h3 className="text-dark">System Settings</h3>
          <p className="mt-2 text-muted">
            System configuration options will be available here.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;