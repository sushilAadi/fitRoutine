'use client'
import React, { useRef, useState } from "react";
import { Upload, X, FileText } from 'lucide-react';

const FileUpload = ({
  handleFileUpload,
  fileData,
  handleFileDelete,
  allowedTypes = ["image/*"],
  maxSizeInMB = 5,
  totalSizeInMB = 0,
}) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    simulateUpload(files);
  };

  const simulateUpload = (files) => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          handleFileUpload(files);
          return 100;
        }
        return prev + 10;
      });
    }, 50);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    simulateUpload(files);
  };

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-300 
          ${isDragging ? "border-blue-500 bg-blue-50/5" : "border-gray-600 hover:border-gray-500"}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={allowedTypes.join(",")}
          onChange={handleFileSelect}
          multiple
        />

        <div
          className="flex flex-col items-center justify-center cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="w-12 h-12 mb-4 text-gray-400" />
          <p className="mb-2 text-lg font-semibold text-center text-gray-300">
            Drag & Drop or Click to Upload
          </p>
          <p className="text-sm text-center text-gray-400">
            Maximum file size: {maxSizeInMB}MB | Total Uploaded: {totalSizeInMB.toFixed(2)}MB
          </p>
        </div>

        {fileData && (
          <div className="flex flex-wrap gap-2 mt-4 space-y-3">
            {Array.isArray(fileData) ? fileData.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-2 border rounded-lg flex-grow-1 min-h-[60px] max-h-[60px] m-0"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      {file.fileName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {file.fileType || "Unknown Type"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileDelete(file.id)}
                  className="p-1 rounded-full hover:bg-gray-700/50"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )) : fileData && (
              <div
                key={fileData.id}
                className="flex items-center justify-between p-2 border rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <FileText className="w-6 h-6 text-blue-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-300">
                      {fileData.fileName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fileData.fileType || "Unknown Type"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleFileDelete(fileData.id)}
                  className="p-1 rounded-full hover:bg-gray-700/50"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            )}
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="absolute bottom-0 left-0 w-full p-2 bg-gray-800/90">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm text-gray-300">Uploading...</span>
              <span className="text-sm text-gray-300">{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full">
              <div
                className="h-2 transition-all duration-300 bg-black rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
