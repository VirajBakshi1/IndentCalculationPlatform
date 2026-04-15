"use client";

import { useState, useRef } from "react";
import Header from "@/components/Header";
import UploadArea from "@/components/UploadArea";
import ProjectDetails from "@/components/ProjectDetails";
import ProcessingIndicator from "@/components/ProcessingIndicator";
import ResultsDashboard from "@/components/ResultsDashboard";
import MaterialTable from "@/components/MaterialTable";
import { ProcessingResult } from "@/lib/types";

const defaultProject = {
  projectNumber: "",
  date: new Date().toISOString().slice(0, 10),
  phaseNumber: "",
  sapNumber: "",
};

type AppState = "idle" | "processing" | "done" | "error";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [projectDetails, setProjectDetails] = useState(defaultProject);
  const [appState, setAppState] = useState<AppState>("idle");
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  async function handleGenerate() {
    if (!file) {
      setError("Please upload an MTO file first.");
      return;
    }

    setAppState("processing");
    setError(null);
    setProcessingStep(0);

    // Simulate step-by-step progress while the API processes
    const stepTimings = [0, 400, 900, 1500]; // ms delays
    stepTimings.forEach((delay, idx) => {
      setTimeout(() => setProcessingStep(idx), delay);
    });

    try {
      const formData = new FormData();
      formData.append("mto", file);
      formData.append("projectDetails", JSON.stringify(projectDetails));

      const response = await fetch("/api/process-mto", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Server returned an error.");
      }

      setProcessingStep(4); // All done
      setResult(data as ProcessingResult);
      setAppState("done");

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(msg);
      setAppState("error");
    }
  }

  function handleDownload() {
    if (!result) return;
    const link = document.createElement("a");
    link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.excelBase64}`;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function handleReset() {
    setFile(null);
    setProjectDetails(defaultProject);
    setAppState("idle");
    setProcessingStep(0);
    setError(null);
    setResult(null);
  }

  const isProcessing = appState === "processing";

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      {/* Hero banner */}
      <div className="bg-gradient-to-r from-steel-900 via-steel-800 to-steel-700 text-white">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-xs font-medium text-steel-300 uppercase tracking-widest">
                Fabrication Workflow
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Drawing → MTO → Indent
            </h2>
            <p className="text-sm text-steel-300 leading-relaxed max-w-xl">
              Upload your Material Take-Off file and receive a fully populated
              Steel Indent Excel — with quantities calculated and the template
              preserved exactly.
            </p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left panel ── */}
          <div className="lg:col-span-1 space-y-4">
            <UploadArea file={file} onFileChange={setFile} />
            <ProjectDetails values={projectDetails} onChange={setProjectDetails} />

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!file || isProcessing}
              className={`
                w-full py-3.5 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
                transition-all duration-200 shadow-sm
                ${!file || isProcessing
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-steel-800 hover:bg-steel-900 text-white cursor-pointer shadow-md hover:shadow-lg active:scale-[0.98]"
                }
              `}
            >
              {isProcessing ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                  </svg>
                  Generate Indent
                </>
              )}
            </button>

            {/* Reset */}
            {appState === "done" && (
              <button
                onClick={handleReset}
                className="w-full py-2.5 px-6 rounded-xl text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors"
              >
                Start Over
              </button>
            )}

            {/* Workflow info */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3">
                How It Works
              </p>
              <div className="space-y-2">
                {[
                  ["1", "Upload MTO Excel or CSV file"],
                  ["2", "System detects columns automatically"],
                  ["3", "Sections & plates are grouped and quantified"],
                  ["4", "Indent template is filled with required quantities"],
                  ["5", "Download the completed indent file"],
                ].map(([n, text]) => (
                  <div key={n} className="flex items-start gap-2.5">
                    <span className="w-4 h-4 rounded-full bg-steel-100 text-steel-700 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {n}
                    </span>
                    <span className="text-xs text-slate-600">{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right panel ── */}
          <div className="lg:col-span-2 space-y-5" ref={resultsRef}>
            {/* Idle state */}
            {appState === "idle" && (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
                <div className="w-14 h-14 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-slate-700 mb-1">
                  Ready to process
                </h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Upload an MTO file and fill in project details, then click
                  "Generate Indent" to begin.
                </p>
              </div>
            )}

            {/* Processing */}
            {(appState === "processing" || appState === "error") && (
              <ProcessingIndicator
                currentStep={processingStep}
                error={error}
              />
            )}

            {/* Results */}
            {appState === "done" && result && (
              <>
                <ResultsDashboard stats={result.stats} />
                <MaterialTable
                  sections={result.sections}
                  plates={result.plates}
                />

                {/* Download section */}
                <div className="bg-gradient-to-br from-steel-800 to-steel-900 rounded-xl p-5 text-white shadow-lg">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-white mb-0.5">
                        Steel Indent Ready
                      </h3>
                      <p className="text-xs text-steel-300">
                        {result.filename} · Formatted with original template
                      </p>
                    </div>
                    <button
                      onClick={handleDownload}
                      className="flex-shrink-0 bg-amber-400 hover:bg-amber-300 text-steel-900 font-semibold text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 transition-colors shadow-md"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      Download Excel
                    </button>
                  </div>

                  {/* Quick summary */}
                  <div className="mt-4 pt-4 border-t border-steel-700 grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xl font-bold text-white font-mono">
                        {result.sections.length}
                      </p>
                      <p className="text-xs text-steel-400">Section types</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white font-mono">
                        {result.plates.length}
                      </p>
                      <p className="text-xs text-steel-400">Plate types</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold text-white font-mono">
                        {(result.stats.totalWeight / 1000).toFixed(1)}
                      </p>
                      <p className="text-xs text-steel-400">Total MT</p>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white mt-16">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-slate-400">
          <span>Steel Indent Automation — Fabrication Planning System</span>
          <span className="font-mono">Built for precision. Built for speed.</span>
        </div>
      </footer>
    </div>
  );
}
