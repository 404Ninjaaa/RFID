import React, { useState, useMemo, useEffect } from 'react';
import { Door, Character, LogMessage } from '@/types';
import { ROOMS } from '@/constants';
import { OverviewTab } from './tabs/OverviewTab';
import { LogsTab } from './tabs/LogsTab';
import { UsersTab } from './tabs/UsersTab';
import { AnalyticsTab } from './tabs/AnalyticsTab';
import { AlertsTab } from './tabs/AlertsTab';
import { ControlsTab } from './tabs/ControlsTab';

interface AdminDashboardProps {
    isOpen: boolean;
    onClose: () => void;
    doorStatuses: Record<number, { isOpen: boolean }>;
    onToggleDoor: (id: number) => void;
    logs: LogMessage[];
    characters: Character[];
    characterStates: Record<number, { isRegistered: boolean; position: { x: number; y: number } }>;
    onSystemEvent: (event: 'lockdown' | 'firedrill' | 'reset') => void;
    onAddCharacter: (char: Character) => void;
    onUpdateCharacter: (char: Character) => void;
    onDeleteCharacter: (id: number) => Promise<boolean>;
    doors: Door[];
}

type TabType = 'overview' | 'logs' | 'users' | 'analytics' | 'controls' | 'alerts';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
    isOpen,
    onClose,
    doorStatuses,
    onToggleDoor,
    logs,
    characters,
    characterStates,
    onSystemEvent,
    onAddCharacter,
    onUpdateCharacter,
    onDeleteCharacter,
    doors
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [currentTime, setCurrentTime] = useState(new Date());

    // -- Global Ticks --
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const [isFullScreen, setIsFullScreen] = useState(false);
    useEffect(() => {
        const handleChange = () => {
            setIsFullScreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleChange);
        return () => document.removeEventListener('fullscreenchange', handleChange);
    }, []);

    const toggleFullScreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    // -- Derived Data --
    const registeredCount = Object.values(characterStates).filter((s: any) => s.isRegistered).length;
    const activeAlerts = logs.filter(l => l.type === 'error').length;
    const threatLevel = activeAlerts === 0 ? 'NORMAL' : activeAlerts < 3 ? 'ELEVATED' : 'CRITICAL';

    // Dark Neon Palette Logic
    const getThemeColors = () => {
        switch (threatLevel) {
            case 'NORMAL': return {
                bg: 'from-slate-950 via-[#020617] to-slate-900',
                accent: 'cyan',
                glass: 'bg-slate-900/40',
                text: 'text-cyan-400',
                border: 'border-cyan-500/20',
                glow: 'shadow-[0_0_30px_-5px_rgba(34,211,238,0.3)]'
            };
            case 'ELEVATED': return {
                bg: 'from-slate-950 via-[#1a0f00] to-orange-950/30',
                accent: 'amber',
                glass: 'bg-slate-900/40',
                text: 'text-amber-400',
                border: 'border-amber-500/20',
                glow: 'shadow-[0_0_30px_-5px_rgba(251,191,36,0.3)]'
            };
            case 'CRITICAL': return {
                bg: 'from-slate-950 via-[#1a0000] to-red-950/30',
                accent: 'rose',
                glass: 'bg-slate-900/40',
                text: 'text-rose-400',
                border: 'border-rose-500/20',
                glow: 'shadow-[0_0_30px_-5px_rgba(244,63,94,0.3)]'
            };
        }
    };
    const theme = getThemeColors();

    const analytics = useMemo(() => {
        const total = logs.length;
        const success = logs.filter(l => l.type === 'success').length;
        const error = logs.filter(l => l.type === 'error').length;
        return { total, success, error };
    }, [logs]);


    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-50 font-sans text-slate-200 flex overflow-hidden animate-in fade-in duration-700 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${theme.bg}`}>

            {/* DARK GLASS SIDEBAR */}
            <div className="hidden lg:flex w-24 xl:w-72 flex-col justify-between p-4 z-20">
                <div className="flex-1 flex flex-col space-y-4">
                    {/* Logo Section */}
                    <div className="h-16 flex items-center justify-center -ml-2 mb-2">
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-none text-white">HEXA</h1>
                        </div>
                    </div>

                    {/* Nav Pills */}
                    <nav className="flex-1 bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl p-4 space-y-2">
                        {[
                            { id: 'overview', label: 'Command Deck', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
                            { id: 'logs', label: 'Event Logs', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
                            { id: 'users', label: 'Personnel', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /> },
                            { id: 'analytics', label: 'Analytics', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /> },
                            { id: 'alerts', label: 'Alert Rules', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /> },
                            { id: 'controls', label: 'Control Center', icon: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id as TabType)}
                                className={`w-full flex items-center p-3 rounded-xl transition-all duration-300 group relative overflow-hidden ${activeTab === item.id
                                    ? `bg-white/10 text-white font-bold border border-white/10 shadow-[inner_0_0_20px_rgba(255,255,255,0.05)]`
                                    : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                                    }`}
                            >
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-colors ${activeTab === item.id ? `bg-${theme.accent}-500/20 text-${theme.accent}-400` : 'bg-transparent'
                                    }`}>
                                    <svg className={`w-5 h-5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        {item.icon}
                                    </svg>
                                </div>
                                <span className="hidden xl:block text-sm tracking-wide">{item.label}</span>
                                {activeTab === item.id && (
                                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-${theme.accent}-400 rounded-r-full shadow-[0_0_10px_currentColor]`} />
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Bottom Action */}
                <div className="bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl p-2">
                    <button onClick={onClose} className="w-full h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-white/5">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0 p-4 pl-0">
                {/* Floating Header */}
                <header className={`h-24 mb-4 bg-black/20 backdrop-blur-xl border border-white/5 rounded-3xl flex items-center justify-between px-8 z-10 transition-all duration-700 ${theme.glow}`}>
                    <div className="flex items-center space-x-6">
                        <div>
                            <h2 className="text-3xl font-black text-white capitalize tracking-tighter">{activeTab === 'overview' ? 'Command Deck' : activeTab}</h2>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.3em]">Sector 7 Admin</p>
                        </div>
                        <div className={`flex items-center px-4 py-1.5 rounded-full border bg-black/40 backdrop-blur-md transition-all duration-500 ${theme.border}`}>
                            <span className={`w-2 h-2 rounded-full mr-2 bg-${theme.accent}-500 shadow-[0_0_10px_currentColor] ${threatLevel === 'NORMAL' ? '' : 'animate-pulse'}`}></span>
                            <span className={`text-xs font-bold tracking-widest ${theme.text}`}>THREAT: {threatLevel}</span>
                        </div>
                    </div>
                    <div className="flex items-center space-x-6">
                        <button
                            onClick={toggleFullScreen}
                            className="p-2 rounded-xl bg-slate-800/50 border border-slate-700 hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white"
                            title={isFullScreen ? "Exit Full Screen" : "Enter Full Screen"}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                        </button>
                        <div className="text-right hidden md:block">
                            <div className="text-2xl font-mono text-white tracking-widest">{currentTime.toLocaleTimeString([], { hour12: false })}</div>
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.4em] text-right">{currentTime.toLocaleDateString()}</div>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700 shadow-md flex items-center justify-center text-slate-400 font-bold hover:border-white/50 transition-colors cursor-pointer">
                            AD
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-auto rounded-3xl bg-black/20 backdrop-blur-xl border border-white/5 relative p-8">
                    {activeTab === 'overview' && (
                        <OverviewTab
                            registeredCount={registeredCount}
                            characters={characters}
                            logs={logs}
                            analytics={analytics}
                            threatLevel={threatLevel}
                            doorStatuses={doorStatuses}
                            onToggleDoor={onToggleDoor}
                            doors={doors}
                            onSystemEvent={onSystemEvent}
                        />
                    )}

                    {activeTab === 'logs' && <LogsTab logs={logs} />}

                    {activeTab === 'users' && (
                        <UsersTab
                            characters={characters}
                            logs={logs}
                            onAddCharacter={onAddCharacter}
                            onUpdateCharacter={onUpdateCharacter}
                            onDeleteCharacter={onDeleteCharacter}
                            doors={doors}
                            characterStates={characterStates}
                        />
                    )}

                    {activeTab === 'analytics' && (
                        <AnalyticsTab
                            logs={logs}
                            characters={characters}
                            doors={doors}
                        />
                    )}

                    {activeTab === 'alerts' && <AlertsTab />}

                    {activeTab === 'controls' && (
                        <ControlsTab
                            doors={doors}
                            doorStatuses={doorStatuses}
                            onToggleDoor={onToggleDoor}
                            onSystemEvent={onSystemEvent}
                        />
                    )}
                </main>
            </div>
        </div>
    );
};
