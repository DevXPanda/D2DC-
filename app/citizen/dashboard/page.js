"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { AlertTriangle, Building2, CheckCircle2, ClipboardList, FileWarning, MapPinned, TrendingUp } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useStoredSession } from "@/lib/session-store";

export default function CitizenDashboardPage() {
  const session = useStoredSession();
  const dashboard = useQuery(api.d2dc.citizenDashboard, session?.token ? { token: session.token } : "skip");

  const summaryCards = [
    { title: "My Registered Properties", value: dashboard?.properties?.length ?? 0, icon: Building2, color: "bg-blue-500", textColor: "text-blue-600", link: "/citizen/property" },
    { title: "Monthly Collection Duty", value: `₹${(dashboard?.stats.monthlyCharge ?? 0).toLocaleString("en-IN")}`, icon: TrendingUp, color: "bg-indigo-500", textColor: "text-indigo-600", link: "/citizen/property" },
    { title: "D2DC Base Dues", value: `₹${(dashboard?.stats.baseAmount ?? 0).toLocaleString("en-IN")}`, icon: ClipboardList, color: "bg-emerald-500", textColor: "text-emerald-600", link: "/citizen/property" },
    { title: "Accrued Penalties", value: `₹${(dashboard?.stats.penaltyAmount ?? 0).toLocaleString("en-IN")}`, icon: AlertTriangle, color: "bg-rose-500", textColor: "text-rose-600", link: "/citizen/notices" },
    { title: "Active Notices", value: dashboard?.pendingNotices?.length ?? 0, icon: FileWarning, color: "bg-amber-500", textColor: "text-amber-600", link: "/citizen/notices" },
    { title: "Total Payable Balance", value: `₹${(dashboard?.stats.totalDue ?? 0).toLocaleString("en-IN")}`, icon: CheckCircle2, color: "bg-slate-900", textColor: "text-slate-900", link: "/citizen/property" }
  ];

  const quickActions = [
    { name: "View Property", icon: Building2, link: "/citizen/property", color: "bg-indigo-600" },
    { name: "View Visit History", icon: MapPinned, link: "/citizen/visits", color: "bg-sky-600" },
    { name: "View Notices", icon: FileWarning, link: "/citizen/notices", color: "bg-amber-600" }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="ds-page-header">
        <div className="flex flex-col gap-2">
          <h1 className="ds-page-title inline-flex items-center text-3xl font-medium tracking-tight text-slate-900">
            Citizen Dashboard
          </h1>
          <p className="ds-page-subtitle text-slate-500 max-w-2xl leading-relaxed">
            Manage your property profile, track D2DC visit history, and monitor outstanding dues or official notices electronically.
          </p>
        </div>
      </div>

      <section>
        <h2 className="ds-section-title mb-6 flex items-center font-medium text-slate-800 tracking-wide uppercase text-xs">
          <TrendingUp className="mr-3 h-5 w-5 text-primary-600" />
          Asset & Financial Overview
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {summaryCards.map((card, idx) => (
            <Link 
              key={idx} 
              href={card.link || "#"} 
              className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:border-primary-100 transition-all duration-500 group relative overflow-hidden flex flex-col justify-between h-44"
            >
              <div className="flex items-start justify-between relative z-10">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 group-hover:text-primary-500 transition-colors">{card.title}</span>
                <div className={`${card.color} p-4 rounded-2xl text-white shadow-xl shadow-slate-200 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                  <card.icon className="h-5 w-5" />
                </div>
              </div>
              
              <div className="relative z-10">
                <p className={`text-3xl font-medium tracking-tighter ${card.textColor} group-hover:scale-105 transition-transform origin-left`}>
                  {card.value}
                </p>
                <div className="mt-3 flex items-center text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                  View Detailed Report <TrendingUp className="ml-1.5 h-3 w-3" />
                </div>
              </div>

              <div className={`absolute -right-4 -bottom-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity duration-700 pointer-events-none`}>
                <card.icon className="h-32 w-32" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="ds-section-title mb-6 flex items-center font-medium text-slate-800 tracking-wide uppercase text-xs">
          <TrendingUp className="mr-3 h-5 w-5 text-primary-600" />
          Quick Portal Actions
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
          {quickActions.map((action) => (
            <Link 
              key={action.name} 
              href={action.link} 
              className="group flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-white border border-slate-100 shadow-sm hover:shadow-2xl hover:border-primary-100 transition-all duration-700 relative overflow-hidden"
            >
              <div className={`${action.color} mb-6 rounded-3xl p-6 text-white shadow-2xl shadow-indigo-100 transition-all duration-500 group-hover:rounded-full group-hover:scale-110 group-hover:-translate-y-2`}>
                <action.icon className="h-8 w-8" />
              </div>
              <span className="text-xs font-medium text-slate-800 group-hover:text-primary-600 transition-colors uppercase tracking-[0.2em]">{action.name}</span>
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-primary-50/0 via-primary-50/0 to-primary-50/30 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2 pb-12">
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
          <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 px-8 py-6">
            <h3 className="flex items-center text-[10px] font-medium uppercase tracking-[0.2em] text-slate-700">
              <MapPinned className="mr-3 h-4 w-4 text-primary-600" />
              Latest Field Activity
            </h3>
            <Link href="/citizen/visits" className="text-[10px] font-medium text-primary-600 hover:text-primary-700 uppercase tracking-widest border-b border-primary-200">View Logs</Link>
          </div>
          <div className="flex-1 p-8">
            {!dashboard || dashboard.recentVisits.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                 <div className="bg-slate-50 p-6 rounded-full text-slate-200 border border-slate-100 shadow-inner">
                    <ClipboardList className="h-10 w-10" />
                 </div>
                 <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">No site visits recorded yet</p>
              </div>
            ) : (
              <div className="space-y-5">
                {dashboard.recentVisits.map((visit) => (
                  <div key={visit.id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/40 border border-transparent hover:border-primary-100 hover:bg-white transition-all duration-300 group/item">
                    <div className="flex items-center gap-5">
                      <div className={`p-3 rounded-xl transition-all duration-500 ${visit.visitType === "paid" ? "bg-emerald-100 text-emerald-600 group-hover/item:bg-emerald-600 group-hover/item:text-white" : "bg-amber-100 text-amber-600 group-hover/item:bg-amber-600 group-hover/item:text-white"}`}>
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900 uppercase tracking-tight">{visit.visitType?.replace("_", " ")}</p>
                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-[0.1em] mt-0.5">Agent: {visit.collector?.name || "Municipal Officer"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium text-slate-800 tabular-nums">
                        {new Date(visit.timestamp).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </p>
                      <p className="text-[9px] font-medium text-slate-400 uppercase tracking-tighter">Verified Entry</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-500">
          <div className="flex items-center justify-between border-b border-slate-50 bg-slate-50/30 px-8 py-6">
            <h3 className="flex items-center text-[10px] font-medium uppercase tracking-[0.2em] text-slate-700">
              <FileWarning className="mr-3 h-4 w-4 text-amber-500" />
              Outstanding Notices
            </h3>
            <Link href="/citizen/notices" className="text-[10px] font-medium text-amber-600 hover:text-amber-700 uppercase tracking-widest border-b border-amber-200">Compliance Hub</Link>
          </div>
          <div className="flex-1 p-8">
            {!dashboard || dashboard.pendingNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="bg-emerald-50 p-6 rounded-full text-emerald-300 border border-emerald-100 shadow-inner">
                   <AlertTriangle className="h-10 w-10 rotate-180" />
                </div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Property in full compliance</p>
              </div>
            ) : (
              <div className="space-y-5">
                {dashboard.pendingNotices.map((notice) => (
                  <div key={notice.id} className="p-6 rounded-2xl border border-amber-100 bg-amber-50/20 hover:bg-white hover:border-amber-400 transition-all duration-300 border-l-[6px] border-l-amber-500 group/notice overflow-hidden relative">
                    <div className="flex justify-between items-start mb-3 relative z-10">
                       <span className="text-[9px] font-medium uppercase tracking-[0.2em] text-amber-600 bg-white px-2 py-0.5 rounded shadow-sm">{notice.noticeNumber}</span>
                       <span className="text-[10px] font-medium text-slate-400 tabular-nums">{new Date(notice.noticeDate).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm font-medium text-slate-800 mb-2 tracking-tight relative z-10">{notice.noticeType?.toUpperCase()} ASSESSMENT</p>
                    <div className="flex items-center justify-between relative z-10">
                       <p className="text-xs font-medium text-slate-500">Value: <span className="text-slate-900">₹{notice.amountDue.toLocaleString("en-IN")}</span></p>
                       <span className="text-[9px] font-medium text-amber-700 uppercase tracking-widest px-2 py-0.5 bg-amber-100 rounded">Action Req</span>
                    </div>
                    <div className="absolute -right-2 top-0 h-full w-24 bg-gradient-to-l from-amber-500/5 to-transparent skew-x-[-20deg]"></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
