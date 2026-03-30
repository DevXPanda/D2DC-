"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenNoticesPage() {
  const session = useStoredSession();
  const notices = useQuery(api.d2dc.citizenNotices, session?.token ? { token: session.token } : "skip") || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      <div className="ds-page-header">
        <div className="flex flex-col gap-2">
          <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900 border-l-4 border-amber-500 pl-4">
            Compliance Center
          </h1>
          <p className="ds-page-subtitle text-slate-500 max-w-2xl leading-relaxed">
            Official municipal notices, penalty assessments, and resolution timelines for your property assets.
          </p>
        </div>
      </div>

      {notices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
           <div className="bg-amber-50 p-6 rounded-full text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
           </div>
           <p className="text-slate-400 font-medium">Your property is currently in full compliance. No active notices found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
          <div className="table-wrap border-0 rounded-none overflow-x-auto">
            <table className="table min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="pl-8 py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Notice Ref</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Property</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Penalty Value</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Issue Date</th>
                  <th className="py-5 uppercase tracking-widest text-[10px] font-medium text-slate-400">Compliance Status</th>
                  <th className="pr-8 py-5 text-right uppercase tracking-widest text-[10px] font-medium text-slate-400">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {notices.map((notice) => (
                  <tr key={notice.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="pl-8 py-6">
                      <span className="text-xs font-medium text-slate-600 uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded leading-none">
                        {notice.noticeNumber || "N/A"}
                      </span>
                    </td>
                    <td className="py-6">
                      <p className="text-sm font-medium text-slate-900">{notice.property?.propertyId}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">{notice.noticeType || "Standard"}</p>
                    </td>
                    <td className="py-6">
                      <span className="text-sm font-medium text-rose-600">₹{notice.penaltyAmount.toLocaleString("en-IN")}</span>
                    </td>
                    <td className="py-6">
                      <span className="text-xs font-medium text-slate-500 tabular-nums">
                        {new Date(notice.noticeDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-widest border ${
                        notice.status === "resolved" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-amber-50 text-amber-700 border-amber-100"
                      }`}>
                        {String(notice.status || "PENDING").toUpperCase()}
                      </span>
                    </td>
                    <td className="pr-8 py-6 text-right">
                       <span className={`px-4 py-1.5 rounded-full text-[9px] font-medium uppercase tracking-widest border ${
                        notice.revisitStatus === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}>
                        {String(notice.revisitStatus || "PENDING").toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
