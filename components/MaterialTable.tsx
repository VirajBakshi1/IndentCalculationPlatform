"use client";

import { useState } from "react";
import { SectionGroup, PlateGroup } from "@/lib/types";

interface Props {
  sections: SectionGroup[];
  plates: PlateGroup[];
}

type Tab = "sections" | "plates";

function fmt(n: number, decimals = 2) {
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

function SectionsTable({ sections }: { sections: SectionGroup[] }) {
  if (sections.length === 0)
    return <EmptyState msg="No HR sections found in MTO." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <Th>Profile</Th>
            <Th>Grade</Th>
            <Th right>Std Length (mm)</Th>
            <Th right>Total Req (mm)</Th>
            <Th right>Qty (Nos)</Th>
            <Th right>Weight (MT)</Th>
          </tr>
        </thead>
        <tbody>
          {sections.map((s) => (
            <tr key={s.normalizedProfile} className="data-row border-b border-slate-100">
              <Td bold mono>{s.normalizedProfile}</Td>
              <Td>{s.grade || "E250"}</Td>
              <Td right mono>{fmt(s.standardLength, 0)}</Td>
              <Td right mono>{fmt(s.totalLength, 0)}</Td>
              <Td right mono bold>{s.requiredPieces}</Td>
              <Td right mono>{s.totalWeight.toFixed(3)}</Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t-2 border-slate-300">
            <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-slate-700">TOTAL</td>
            <td className="px-4 py-2.5 text-right text-xs font-bold font-mono text-slate-900">
              {fmt(sections.reduce((s, r) => s + r.requiredPieces, 0), 0)}
            </td>
            <td className="px-4 py-2.5 text-right text-xs font-bold font-mono text-slate-900">
              {sections.reduce((s, r) => s + r.totalWeight, 0).toFixed(3)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function PlatesTable({ plates }: { plates: PlateGroup[] }) {
  if (plates.length === 0)
    return <EmptyState msg="No HR plates found in MTO." />;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <Th>Thickness (mm)</Th>
            <Th>Grade</Th>
            <Th right>Std Size (mm)</Th>
            <Th right>Total Volume (mm³)</Th>
            <Th right>Qty (Nos)</Th>
            <Th right>Weight (MT)</Th>
          </tr>
        </thead>
        <tbody>
          {plates.map((p) => (
            <tr key={p.thickness} className="data-row border-b border-slate-100">
              <Td bold mono>{p.thickness}</Td>
              <Td>{p.grade || "E250"}</Td>
              <Td right mono>{`${fmt(p.standardLength, 0)} × ${fmt(p.standardWidth, 0)}`}</Td>
              <Td right mono>{fmt(p.totalVolume, 0)}</Td>
              <Td right mono bold>{p.requiredPlates}</Td>
              <Td right mono>{p.totalWeight.toFixed(3)}</Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-slate-50 border-t-2 border-slate-300">
            <td colSpan={4} className="px-4 py-2.5 text-xs font-semibold text-slate-700">TOTAL</td>
            <td className="px-4 py-2.5 text-right text-xs font-bold font-mono text-slate-900">
              {fmt(plates.reduce((s, r) => s + r.requiredPlates, 0), 0)}
            </td>
            <td className="px-4 py-2.5 text-right text-xs font-bold font-mono text-slate-900">
              {plates.reduce((s, r) => s + r.totalWeight, 0).toFixed(3)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th className={`px-4 py-2.5 text-xs font-semibold text-slate-600 uppercase tracking-wide whitespace-nowrap ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, right, bold, mono }: { children: React.ReactNode; right?: boolean; bold?: boolean; mono?: boolean }) {
  return (
    <td className={`px-4 py-2.5 text-xs text-slate-700 whitespace-nowrap ${right ? "text-right" : ""} ${bold ? "font-semibold" : ""} ${mono ? "font-mono" : ""}`}>
      {children}
    </td>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="py-12 text-center">
      <div className="w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-3 bg-slate-100">
        <svg className="w-5 h-5 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" />
        </svg>
      </div>
      <p className="text-sm text-slate-500">{msg}</p>
    </div>
  );
}

export default function MaterialTable({ sections, plates }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("sections");

  const tabs = [
    { id: "sections" as Tab, label: "HR Sections", count: sections.length },
    { id: "plates" as Tab, label: "HR Plates", count: plates.length },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-slate-200 bg-slate-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              px-5 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-blue-500 text-blue-700 bg-white"
                : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }
            `}
          >
            {tab.label}
            <span className={`
              px-1.5 py-0.5 text-xs rounded-full font-medium
              ${activeTab === tab.id
                ? "bg-blue-100 text-blue-700"
                : "bg-slate-200 text-slate-600"
              }
            `}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Table content */}
      <div className="min-h-[200px]">
        {activeTab === "sections" && <SectionsTable sections={sections} />}
        {activeTab === "plates" && <PlatesTable plates={plates} />}
      </div>
    </div>
  );
}
