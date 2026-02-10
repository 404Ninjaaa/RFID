import React from 'react';
import { Door, Character, LogMessage } from '@/types';

interface OverviewTabProps {
    registeredCount: number;
    characters: Character[];
    logs: LogMessage[];
    analytics: { total: number; success: number; error: number };
    threatLevel: 'NORMAL' | 'ELEVATED' | 'CRITICAL';
    doorStatuses: Record<number, { isOpen: boolean }>;
    onToggleDoor: (id: number) => void;
    doors: Door[];
    onSystemEvent: (event: 'lockdown' | 'firedrill' | 'reset') => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    registeredCount,
    characters,
    logs,
    analytics,
    threatLevel,
    doorStatuses,
    onToggleDoor,
    doors,
    onSystemEvent
}) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Top Row Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Personnel', val: registeredCount, sub: `/ ${characters.length} Active`, color: 'emerald', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                    { label: 'Events 24h', val: analytics.total, sub: '+12% Activity', color: 'blue', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z' },
                    { label: 'Sys Load', val: '34%', sub: 'Optimal', color: 'violet', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
                    { label: 'Threat Lvl', val: threatLevel === 'NORMAL' ? 'LOW' : 'WARN', sub: 'Monitoring', color: threatLevel === 'NORMAL' ? 'cyan' : 'rose', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
                ].map((stat, i) => (
                    <div key={i} className={`bg-slate-900/40 hover:bg-slate-800/60 backdrop-blur-md p-6 rounded-3xl border border-white/5 hover:border-white/10 transition-all duration-300 hover:scale-[1.02] group relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 w-24 h-24 bg-${stat.color}-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-${stat.color}-500/20 transition-all`} />
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">{stat.label}</div>
                                <div className={`text-4xl font-black text-white group-hover:text-${stat.color}-400 transition-colors tracking-tight`}>{stat.val}</div>
                            </div>
                            <div className={`p-3 rounded-2xl bg-white/5 text-${stat.color}-400 group-hover:bg-${stat.color}-500/20 group-hover:text-${stat.color}-300 transition-colors border border-white/5`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} /></svg>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-xs font-bold text-slate-400">
                            {stat.sub}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Feed */}
                <div className="lg:col-span-2 bg-black/20 backdrop-blur-md rounded-3xl border border-white/5 flex flex-col relative overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                        <h3 className="font-bold text-white text-lg tracking-tight">Recent Activity Feed</h3>
                    </div>
                    <div className="flex-1 p-4 space-y-2 max-h-[400px] overflow-auto custom-scrollbar">
                        {logs
                            .filter((log, index, self) => index === 0 || log.text !== self[index - 1].text)
                            .slice(0, 10)
                            .map(log => (
                                <div key={log.id} className="group p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-transparent hover:border-white/5 transition-all duration-200 flex items-center">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mr-4 shadow-sm ${log.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : log.type === 'error' ? 'bg-rose-500/20 text-rose-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                        {log.type === 'success' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                                        {log.type === 'error' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                        {log.type === 'info' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-slate-200 group-hover:text-white transition-colors">{log.text}</p>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 font-mono group-hover:text-slate-400">{log.timestamp.split(' ')[1]}</span>
                                </div>
                            ))}
                    </div>
                </div>

                {/* Controls */}
                <div className="space-y-6">
                    <div className="bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 p-6 shadow-xl">
                        <h3 className="font-bold text-white mb-6 tracking-tight">Manual Override</h3>
                        <div className="space-y-4">
                            <button
                                onClick={() => onSystemEvent('lockdown')}
                                className="w-full py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl shadow-lg border border-slate-700 hover:border-slate-600 transition-all flex items-center justify-center text-sm tracking-wide"
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                INITIATE LOCKDOWN
                            </button>
                            <button
                                onClick={() => onSystemEvent('firedrill')}
                                className={`w-full py-4 bg-transparent border-2 border-rose-500/30 text-rose-500 hover:bg-rose-500/10 hover:border-rose-500 hover:text-rose-400 font-extrabold rounded-2xl transition-all flex items-center justify-center text-sm tracking-wide group`}
                            >
                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                                EMERGENCY PURGE
                            </button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 rounded-3xl p-8 border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-transform">
                        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-indigo-500/20 blur-2xl group-hover:bg-indigo-400/30 transition-colors"></div>
                        <div className="relative z-10">
                            <div className="text-indigo-300 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">System Integrity</div>
                            <div className="text-4xl font-black text-white tracking-tighter">100%</div>
                            <p className="mt-2 text-indigo-200/60 text-xs">Neural Network Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
