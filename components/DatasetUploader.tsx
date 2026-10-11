'use client';

import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Trash2,
  Columns,
  Layers,
  Sparkles,
  ArrowRight,
  Database,
  FileCheck,
  Calendar,
  Hash,
  Type
} from 'lucide-react';
import { uploadDataset, IngestionResponse, CleaningLogEntry } from '@/lib/api';

interface DatasetUploaderProps {
  onSuccess?: (result: IngestionResponse) => void;
  notify?: (message: string) => void;
}

export default function DatasetUploader({ onSuccess, notify }: DatasetUploaderProps) {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IngestionResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setError('Invalid file format. Please upload a .csv, .xlsx, or .xls file.');
      return;
    }

    setSelectedFile(file);
    setResult(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await uploadDataset(selectedFile);
      setResult(response);
      if (notify) {
        notify(`Successfully cleaned and ingested ${response.filename} (${response.rows_processed} rows)`);
      }
      if (onSuccess) {
        onSuccess(response);
      }
    } catch (err: any) {
      const errMsg = err?.message || 'An unexpected error occurred during dataset ingestion.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'remove_duplicates':
        return <Layers className="size-4 text-amber-500" />;
      case 'detect_and_format_datetime':
        return <Calendar className="size-4 text-blue-500" />;
      case 'fill_missing_numeric':
        return <Hash className="size-4 text-emerald-500" />;
      case 'fill_missing_text':
        return <Type className="size-4 text-purple-500" />;
      default:
        return <Sparkles className="size-4 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone Card */}
      <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31] transition-all">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#15213a] dark:text-white">
              Data Ingestion Pipeline
            </h2>
            <p className="mt-0.5 text-xs text-[#778198] dark:text-[#8e9bb5]">
              Upload CSV or Excel files for automatic schema profiling, deduplication, and cleaning.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#edf2ff] px-2.5 py-1 text-[11px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
            <Database className="size-3" />
            FastAPI Engine Connected
          </span>
        </div>

        {/* Drag and Drop Container */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => !selectedFile && fileInputRef.current?.click()}
          className={`relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            dragActive
              ? 'border-[#315efb] bg-[#315efb]/5'
              : selectedFile
              ? 'border-[#b8c5e5] bg-[#fafbff] dark:border-[#26375a] dark:bg-[#0d162a]'
              : 'border-[#d0d7e6] hover:border-[#315efb] hover:bg-[#fafbff] dark:border-[#202f4d] dark:hover:border-[#315efb]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv, .xlsx, .xls"
            onChange={handleFileChange}
            className="hidden"
            id="bizlens-file-input"
          />

          {!selectedFile ? (
            <>
              <div className="mb-3 grid size-12 place-items-center rounded-xl bg-[#edf2ff] text-[#315efb] shadow-sm dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                <Upload className="size-6" />
              </div>
              <p className="text-sm font-semibold text-[#15213a] dark:text-white">
                Drag and drop your dataset here, or{' '}
                <span className="text-[#315efb] underline underline-offset-2 hover:text-[#2548c7]">
                  browse
                </span>
              </p>
              <p className="mt-1.5 text-xs text-[#8491ac]">
                Supports CSV (.csv) and Excel (.xlsx, .xls) up to 50 MB
              </p>
            </>
          ) : (
            <div className="flex w-full max-w-md flex-col items-center">
              <div className="flex w-full items-center justify-between rounded-lg border border-[#e2e8f0] bg-white p-3 shadow-sm dark:border-[#1e293b] dark:bg-[#13203c]">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-[#e7f8f0] text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
                    <FileSpreadsheet className="size-5" />
                  </div>
                  <div className="text-left">
                    <p className="truncate max-w-[220px] text-xs font-semibold text-[#15213a] dark:text-white">
                      {selectedFile.name}
                    </p>
                    <p className="text-[11px] text-[#8491ac]">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>

                {!isLoading && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset();
                    }}
                    className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#ef4444] dark:hover:bg-[#1e293b] transition"
                    title="Remove file"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              {/* Upload Trigger Button */}
              <div className="mt-4 flex w-full gap-2">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpload();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#315efb] py-2.5 text-xs font-semibold text-white shadow-md shadow-[#315efb]/20 hover:bg-[#2548c7] disabled:opacity-60 transition"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Cleaning & Ingesting Dataset...
                    </>
                  ) : (
                    <>
                      <Sparkles className="size-4" />
                      Run Automated Cleaning
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReset();
                  }}
                  className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-2.5 text-xs font-medium text-[#64748b] hover:bg-[#f8fafc] dark:border-[#1e293b] dark:bg-[#13203c] dark:text-[#94a3b8]"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mt-4 flex items-start gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-xs text-[#b91c1c] dark:border-[#7f1d1d] dark:bg-[#450a0a]/40 dark:text-[#f87171]">
            <AlertCircle className="size-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Ingestion Failed</p>
              <p className="mt-0.5 leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-[#ef4444] hover:underline"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Results Dashboard Card */}
      {result && (
        <div className="space-y-6 animate-in fade-in-50 duration-300">
          {/* Metrics Overview Ribbon */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e3e7ef] bg-white p-4 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
              <div className="flex items-center justify-between text-[#778198] dark:text-[#8e9bb5]">
                <span className="text-xs font-medium">Rows Cleaned & Processed</span>
                <div className="grid size-8 place-items-center rounded-lg bg-[#e7f8f0] text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
                  <FileCheck className="size-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
                {result.rows_processed.toLocaleString()}
              </p>
              <p className="mt-1 text-[11px] text-[#10b981]">
                ✓ Ready for analytics & BI
              </p>
            </div>

            <div className="rounded-xl border border-[#e3e7ef] bg-white p-4 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
              <div className="flex items-center justify-between text-[#778198] dark:text-[#8e9bb5]">
                <span className="text-xs font-medium">Detected Columns</span>
                <div className="grid size-8 place-items-center rounded-lg bg-[#edf2ff] text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                  <Columns className="size-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
                {result.columns.length}
              </p>
              <p className="mt-1 text-[11px] text-[#64748b] dark:text-[#94a3b8] truncate">
                {result.columns.slice(0, 3).join(', ')}
                {result.columns.length > 3 ? ` +${result.columns.length - 3} more` : ''}
              </p>
            </div>

            <div className="rounded-xl border border-[#e3e7ef] bg-white p-4 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
              <div className="flex items-center justify-between text-[#778198] dark:text-[#8e9bb5]">
                <span className="text-xs font-medium">Pipeline Transformations</span>
                <div className="grid size-8 place-items-center rounded-lg bg-[#fbf0ff] text-[#a855f7] dark:bg-[#a855f7]/20 dark:text-[#c084fc]">
                  <Sparkles className="size-4" />
                </div>
              </div>
              <p className="mt-2 text-2xl font-bold tracking-tight text-[#15213a] dark:text-white">
                {result.cleaning_log.length}
              </p>
              <p className="mt-1 text-[11px] text-[#a855f7]">
                Actions applied automatically
              </p>
            </div>
          </div>

          {/* Cleaning Log Card */}
          <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-[#15213a] dark:text-white">
                  Automated Cleaning Log
                </h3>
                <p className="text-xs text-[#778198] dark:text-[#8e9bb5]">
                  Detailed audit trail of all data normalization steps taken on {result.filename}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-[#e7f8f0] px-2.5 py-1 text-[11px] font-semibold text-[#14885c] dark:bg-[#10b981]/20 dark:text-[#34d399]">
                <CheckCircle2 className="size-3" />
                Pipeline Success
              </span>
            </div>

            <div className="divide-y divide-[#f1f5f9] dark:divide-[#1e293b]">
              {result.cleaning_log.map((entry, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="mt-0.5 grid size-7 place-items-center rounded-lg bg-[#f8fafc] dark:bg-[#152342]">
                    {getActionIcon(entry.action)}
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#1e293b] dark:text-slate-200 capitalize">
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                      {entry.column && (
                        <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[10px] font-mono text-[#475569] dark:bg-[#1e293b] dark:text-slate-400">
                          column: {entry.column}
                        </span>
                      )}
                      {entry.count !== undefined && entry.count !== null && (
                        <span className="rounded bg-[#edf2ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#315efb] dark:bg-[#315efb]/20 dark:text-[#82a3ff]">
                          count: {entry.count}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[#64748b] dark:text-[#94a3b8] leading-relaxed">
                      {entry.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cleaned Dataset Columns & Preview */}
          {result.preview && result.preview.length > 0 && (
            <div className="rounded-xl border border-[#e3e7ef] bg-white p-6 shadow-sm dark:border-[#1e293b] dark:bg-[#101a31]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#15213a] dark:text-white">
                    Cleaned Data Preview
                  </h3>
                  <p className="text-xs text-[#778198] dark:text-[#8e9bb5]">
                    Showing sample rows after missing-value imputation and datetime normalization
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[#64748b] dark:text-[#94a3b8]">
                  First {result.preview.length} rows
                </span>
              </div>

              <div className="overflow-x-auto rounded-lg border border-[#edf2f7] dark:border-[#1e293b]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#f8fafc] text-[10px] uppercase tracking-wider text-[#64748b] dark:bg-[#152342] dark:text-slate-400">
                    <tr>
                      {result.columns.map((col) => (
                        <th key={col} className="px-4 py-3 font-semibold whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f7] dark:divide-[#1e293b]">
                    {result.preview.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#f8fafc] dark:hover:bg-[#13203c]/60">
                        {result.columns.map((col) => (
                          <td
                            key={col}
                            className="px-4 py-2.5 text-[#334155] dark:text-slate-300 whitespace-nowrap"
                          >
                            {row[col] !== null && row[col] !== undefined
                              ? String(row[col])
                              : '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
