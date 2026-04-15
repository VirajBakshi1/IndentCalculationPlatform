"use client";

interface Props {
  values: {
    projectNumber: string;
    date: string;
    phaseNumber: string;
    sapNumber: string;
  };
  onChange: (values: {
    projectNumber: string;
    date: string;
    phaseNumber: string;
    sapNumber: string;
  }) => void;
}

export default function ProjectDetails({ values, onChange }: Props) {
  const fields = [
    { key: "projectNumber", label: "Project Number", placeholder: "e.g. C252", type: "text" },
    { key: "date", label: "Date", placeholder: "", type: "date" },
    { key: "phaseNumber", label: "Phase Number", placeholder: "e.g. PHASE 02", type: "text" },
    { key: "sapNumber", label: "SAP Number", placeholder: "e.g. SAP-001234", type: "text" },
  ] as const;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <div className="w-1 h-4 bg-steel-600 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
          Project Details
        </h2>
      </div>

      <div className="space-y-3">
        {fields.map((field) => (
          <div key={field.key}>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              {field.label}
            </label>
            <input
              type={field.type}
              value={values[field.key]}
              placeholder={field.placeholder}
              onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
              className="
                w-full px-3 py-2 text-sm rounded-lg border border-slate-200
                bg-slate-50 text-slate-800 placeholder-slate-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                transition-colors
              "
            />
          </div>
        ))}
      </div>
    </div>
  );
}
