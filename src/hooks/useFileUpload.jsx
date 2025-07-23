'use client'
import { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export const useFileUpload = (
  allowedTypes = ["image/*"],
  maxSizeInMB = 5,
  options = { single: true, multiple: false, append: true, maxFiles: null }
) => {
  const [fileData, setFileData] = useState(options.multiple ? [] : null);

  const calculateTotalSize = (files) => {
    return files.reduce((total, file) => {
      const base64Length = file.base64Data?.length || 0;
      const sizeInBytes = 4 * Math.ceil(base64Length / 3) * 0.75;
      return total + sizeInBytes;
    }, 0) / (1024 * 1024);
  };

  const isFileDuplicate = (newFile, existingFiles) => {
    return existingFiles.some(file => 
      file.base64Data === newFile.base64Data
    );
  };

  const handleFileUpload = (files) => {
    if (!files || files.length === 0) return;

    if (options.multiple && options.maxFiles) {
      const totalFiles = (fileData?.length || 0) + files.length;
      if (totalFiles > options.maxFiles) {
        console.error(`Maximum ${options.maxFiles} files allowed`);
        return;
      }
    }

    const newFiles = Array.from(files).map(file => {
      if (!allowedTypes.includes(file.type)) {
        return {
          base64Data: null,
          fileType: null,
          errorMessage: "Invalid file type. Please upload allowed types.",
          id: uuidv4(),
        };
      }

      const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        return {
          base64Data: null,
          fileType: null,
          errorMessage: `File exceeds the limit of ${maxSizeInMB}MB.`,
          id: uuidv4(),
        };
      }

      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            base64Data: reader.result,
            fileType: file.type,
            fileName: file.name,
            errorMessage: null,
            id: uuidv4(),
          });
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(newFiles).then((resolvedFiles) => {
      setFileData((prevData) => {
        if (options.multiple) {
          const existingFiles = prevData || [];
          const uniqueNewFiles = resolvedFiles.filter(newFile => !isFileDuplicate(newFile, existingFiles));
          const updatedFiles = options.append ? [...existingFiles, ...uniqueNewFiles] : uniqueNewFiles;
          return options.maxFiles ? updatedFiles.slice(0, options.maxFiles) : updatedFiles;
        }
        return options.single ? resolvedFiles[0] : resolvedFiles;
      });
    });
  };

  const handleFileDelete = (id) => {
    setFileData((prevData) =>
      options.multiple
        ? prevData.filter((file) => file.id !== id)
        : null
    );
  };

  const totalSizeInMB = calculateTotalSize(Array.isArray(fileData) ? fileData : fileData ? [fileData] : []);
  return { handleFileUpload, handleFileDelete, fileData, totalSizeInMB };
};