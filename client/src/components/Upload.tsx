"use client";

import React, { useState } from "react";
import { FileUpload } from "@/components/ui/file-upload";
import axios from "axios";
import { BACKEND_URL } from "@/lib/config";

export function UploadFile() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFileUpload = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
  };

  const handleUploadFile = async () => {
    if (!files.length) return;

    const formData = new FormData();
    files.forEach((file) => formData.append("pdf", file));

    try {
      const response = await axios.post(`${BACKEND_URL}/api/upload/pdf`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log("Upload success:", response.data);
    } catch (error) {
      console.error("Upload error:", error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto min-h-96 border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg p-4 space-y-4">
      <FileUpload onChange={handleFileUpload} />
      <button
        onClick={handleUploadFile}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Upload PDF
      </button>
    </div>
  );
}
