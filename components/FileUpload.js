'use client';

import { useState, useRef } from 'react';
import { UploadCloud, FileText, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { validatePdfFile, extractTextFromPdf } from '@/lib/pdf';
import { formatBytes } from '@/lib/utils';

export default function FileUpload({ onUploadSuccess, onUploadStart }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(null); // { current, total, percentage }
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const processFile = async (file) => {
    setError(null);

    // Initial validation
    const validation = validatePdfFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsProcessing(true);
    setProgress({ current: 0, total: 1, percentage: 0 });
    if (onUploadStart) onUploadStart(file.name);

    try {
      const extractedData = await extractTextFromPdf(file, (prog) => {
        setProgress(prog);
      });

      setIsProcessing(false);
      setProgress(null);
      if (onUploadSuccess) {
        onUploadSuccess(extractedData);
      }
    } catch (err) {
      console.error('PDF extraction failed:', err);
      setIsProcessing(false);
      setProgress(null);
      setError(err.message || 'Failed to extract text from this PDF. Please check the file and try again.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  // Helper to load sample test document
  const handleLoadSample = async () => {
    setError(null);
    setIsProcessing(true);
    setProgress({ current: 1, total: 2, percentage: 50 });

    try {
      // Fetch sample PDF from public or mock extract
      const response = await fetch('/sample-document.pdf');
      if (!response.ok) {
        throw new Error('Sample document not found.');
      }
      const blob = await response.blob();
      const sampleFile = new File([blob], 'Quantum_Computing_Overview.pdf', { type: 'application/pdf' });
      await processFile(sampleFile);
    } catch (err) {
      console.warn('Sample fetch fallback:', err);
      // Fallback: Provide rich simulated academic paper if public file not found
      const fallbackDoc = {
        fileName: 'AI_Ethics_and_Governance.pdf',
        fileSize: 45200,
        totalPages: 3,
        totalWords: 750,
        totalCharacters: 4800,
        pages: [
          {
            pageNumber: 1,
            text: 'Artificial Intelligence Ethics and Governance Framework (Page 1). Executive Summary: As artificial intelligence technologies rapidly scale across healthcare, finance, and autonomous systems, transparent governance and ethical safeguards have become paramount. This document establishes core principles: accountability, explainability, fairness, and human oversight. Organizations deploying AI models must maintain audit trails and perform algorithmic bias testing prior to public deployment.',
            wordCount: 65,
          },
          {
            pageNumber: 2,
            text: 'Key Principles and Risk Classification (Page 2). High-Risk AI applications include critical infrastructure management, judicial decision support, and medical diagnosis. For these categories, human-in-the-loop (HITL) architecture is legally mandated. The framework prohibits unauthorized behavioral manipulation and real-time biometric identification in public spaces without judicial warrant. Regular third-party penetration testing and safety evaluations must be conducted every six months.',
            wordCount: 68,
          },
          {
            pageNumber: 3,
            text: 'Conclusion and Compliance Guidelines (Page 3). Compliance requires the designation of a Chief AI Ethics Officer (CAIEO). Penalties for non-compliance include administrative fines up to 4% of annual global turnover or 20 million EUR, whichever is higher. Future updates to this guideline will address agentic AI autonomy, synthetic data watermarking, and cross-border regulatory harmonization.',
            wordCount: 62,
          },
        ],
      };
      setIsProcessing(false);
      setProgress(null);
      if (onUploadSuccess) onUploadSuccess(fallbackDoc);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Drag & Drop Card */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 shadow-sm'
        } ${isProcessing ? 'pointer-events-none opacity-90' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isProcessing}
        />

        {/* Processing State */}
        {isProcessing ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center animate-pulse">
              <FileText className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Extracting PDF Contents...
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {progress && progress.total > 0
                  ? `Reading page ${progress.current} of ${progress.total} (${progress.percentage}%)`
                  : 'Analyzing document structure...'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-200 ease-out"
                style={{ width: `${progress?.percentage || 15}%` }}
              />
            </div>
          </div>
        ) : (
          /* Normal Upload State */
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50 shadow-2xs group-hover:scale-105 transition-transform">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-lg">
                Upload your PDF document
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Drag and drop your file here, or click to browse. Supported format: PDF up to 25 MB.
              </p>
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-medium text-xs sm:text-sm hover:bg-indigo-700 transition-colors shadow-xs">
              <FileText className="w-4 h-4" />
              <span>Select PDF File</span>
            </div>
          </div>
        )}
      </div>

      {/* Error State Banner */}
      {error && (
        <div className="mt-4 p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-3 shadow-xs animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <span className="font-semibold block mb-0.5">Extraction Error</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Quick Sample Document Option */}
      {!isProcessing && (
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 text-center">
          <span className="text-xs text-slate-500 dark:text-slate-400 block mb-2">
            Want to test immediately without uploading a file?
          </span>
          <button
            type="button"
            onClick={handleLoadSample}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline"
          >
            <span>Load Sample Document (AI Ethics & Governance PDF)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
