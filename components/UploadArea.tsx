"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface Props {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export default function UploadArea({ file, onFileChange }: Props) {
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    (accepted: File[], rejected: { file: File }[]) => {
      setError(null);
      if (rejected.length > 0) {
        setError("Invalid file type. Please upload a .xlsx, .xls, or .csv file.");
        return;
      }
      if (accepted.length > 0) {
        onFileChange(accepted[0]);
      }
    },
    [onFileChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50 MB
  });

  function formatSize(bytes: number) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <div className="w-1 h-4 bg-amber-400 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          MTO File
        </h2>
      </div>

      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer text-center
          transition-all duration-200
          ${isDragActive
            ? "border-blue-400 bg-blue-50"
            : file
            ? "border-emerald-300 bg-emerald-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
          }
        `}
      >
        <input {...getInputProps()} />

        {file ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center w-10 h-10 mx-auto bg-emerald-100 rounded-lg">
              <svg className="w-5 h-5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800 truncate max-w-[200px] mx-auto">
                {file.name}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onFileChange(null); setError(null); }}
              className="text-xs text-red-500 hover:text-red-700 underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center w-10 h-10 mx-auto bg-slate-200 rounded-lg">
              <svg className="w-5 h-5 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              {isDragActive ? (
                <p className="text-sm font-medium text-blue-600">Drop the MTO file here</p>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-700">
                    Drag & drop MTO file here
                  </p>
                  <p className="text-xs text-slate-500 mt-1">or click to browse</p>
                </>
              )}
            </div>
            <p className="text-xs text-slate-400">.xlsx · .xls · .csv — up to 50 MB</p>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
}
