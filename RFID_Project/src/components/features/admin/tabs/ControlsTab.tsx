import React from 'react';
import { Door } from '@/types';

interface ControlsTabProps {
    doors: Door[];
    doorStatuses: Record<number, { isOpen: boolean }>;
    onToggleDoor: (id: number) => void;
    onSystemEvent: (event: 'lockdown' | 'firedrill' | 'reset') => void;
}

export const ControlsTab: React.FC<ControlsTabProps> = ({ doors, doorStatuses, onToggleDoor, onSystemEvent }) => {
    return (
        <div className="space-y-6 animate-in fade-in h-full overflow-y-auto pr-2 pb-20 custom-scrollbar">

            {/* CHAOS ENGINE (Module 4) */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5 relative overflow-hidden">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Chaos Engine (Simulation Control)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button onClick={() => onSystemEvent('lockdown')} className="group relative overflow-hidden p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-left">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">
                            <svg className="w-12 h-12 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <h4 className="text-lg font-bold text-rose-400 mb-1 group-hover:text-rose-300">Global Lockdown</h4>
                        <p className="text-xs text-rose-300/60">Force seal all doors instantly. Deny all keys.</p>
                    </button>

                    <button onClick={() => onSystemEvent('firedrill')} className="group relative overflow-hidden p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all text-left">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">
                            <svg className="w-12 h-12 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        </div>
                        <h4 className="text-lg font-bold text-amber-400 mb-1 group-hover:text-amber-300">Fire Drill Protocol</h4>
                        <p className="text-xs text-amber-300/60">Emergency override. Open all exits.</p>
                    </button>

                    <button onClick={() => onSystemEvent('reset')} className="group relative overflow-hidden p-6 rounded-2xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all text-left">
                        <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 group-hover:scale-110 transition-all">
                            <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        </div>
                        <h4 className="text-lg font-bold text-blue-400 mb-1 group-hover:text-blue-300">System Reset</h4>
                        <p className="text-xs text-blue-300/60">Restore default protocols. Clear alarms.</p>
                    </button>
                </div>
            </div>

            {/* GOD MODE (Module 1) */}
            <div className="p-6 bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/5">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    Infrastructure Control (God Mode)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {doors.map(door => {
                        // Safe check for door status, default to closed if undefined
                        const status = doorStatuses[door.id] || { isOpen: false };
                        return (
                            <div key={door.id} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all group">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white">{door.name}</h4>
                                    <div className="flex items-center mt-1 space-x-2">
                                        <span className={`w-2 h-2 rounded-full ${status.isOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-rose-500'}`}></span>
                                        <span className="text-[10px] uppercase font-bold text-slate-500">{status.isOpen ? 'UNLOCKED' : 'SECURE'}</span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => onToggleDoor(door.id)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${status.isOpen ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20'}`}
                                >
                                    {status.isOpen ? 'LOCK' : 'OPEN'}
                                </button>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};
