"use client";

const STEPS = [
  { id: 0, label: "Reading", desc: "Parsing MTO file structure" },
  { id: 1, label: "Analyzing", desc: "Classifying materials & profiles" },
  { id: 2, label: "Grouping", desc: "Aggregating requirements" },
  { id: 3, label: "Generating", desc: "Writing indent Excel file" },
];

interface Props {
  currentStep: number; // 0-3, 4 = done
  error?: string | null;
}

export default function ProcessingIndicator({ currentStep, error }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="w-1 h-4 bg-blue-500 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Processing
        </h2>
        {!error && currentStep < 4 && (
          <div className="ml-auto flex gap-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="processing-dot w-2 h-2 rounded-full bg-blue-400 inline-block"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        )}
      </div>

      {error ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-red-700">Processing Failed</p>
              <p className="text-xs text-red-600 mt-1">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {STEPS.map((step) => {
            const done = currentStep > step.id;
            const active = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center gap-3">
                {/* Status icon */}
                <div className={`
                  w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                  ${done ? "bg-emerald-100" : active ? "bg-blue-100 ring-2 ring-blue-300" : "bg-slate-100"}
                `}>
                  {done ? (
                    <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : active ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  )}
                </div>

                {/* Step info */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${done ? "text-emerald-700" : active ? "text-blue-700" : "text-slate-400"}`}>
                    {step.label}
                  </p>
                  <p className={`text-xs ${done ? "text-emerald-500" : active ? "text-blue-500" : "text-slate-400"}`}>
                    {step.desc}
                  </p>
                </div>

                {/* Done badge */}
                {done && (
                  <span className="text-xs text-emerald-600 font-medium">Done</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
