import React, { useState, useEffect } from 'react';
import { AlertRule } from '@/types';
import { api } from '@/services/api';

interface AlertsTabProps { }

export const AlertsTab: React.FC<AlertsTabProps> = () => {
    const [alerts, setAlerts] = useState<AlertRule[]>([]);
    const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
    const [newRule, setNewRule] = useState<Partial<AlertRule>>({ type: 'error_rate', action: 'notify', active: true, threshold: 5, interval: 60 });

    // Polling logic from AdminDashboard
    useEffect(() => {
        const fetchAlerts = () => api.getAlerts().then(setAlerts).catch(console.error);
        fetchAlerts();
        const interval = setInterval(fetchAlerts, 2000);
        return () => clearInterval(interval);
    }, []);

    const isAlertTriggered = (lastTriggered?: number) => {
        if (!lastTriggered) return false;
        return (Date.now() - lastTriggered) < 5000;
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full overflow-y-auto pr-2 pb-20 custom-scrollbar">
            <div className="flex justify-between items-center bg-black/20 p-4 rounded-3xl border border-white/5 backdrop-blur-md">
                <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Security Protocols</h3>
                    <p className="text-sm text-slate-500">Automated threat detection and response rules.</p>
                </div>
                <button
                    onClick={() => setIsRuleModalOpen(true)}
                    className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-indigo-500/25 active:scale-95"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    <span>New Rule</span>
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {alerts.map(alert => {
                    const isTriggered = isAlertTriggered(alert.lastTriggered);
                    return (
                        <div key={alert.id} className={`p-6 rounded-2xl border flex items-center justify-between group transition-all duration-300 ${isTriggered
                            ? 'bg-rose-500/10 border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)]'
                            : 'bg-slate-900/60 backdrop-blur-md border-white/5 hover:border-indigo-500/30'
                            }`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isTriggered ? 'bg-rose-500 text-white animate-pulse' :
                                    alert.active ? 'bg-indigo-500/10 text-indigo-400' : 'bg-slate-800 text-slate-600'
                                    }`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <div>
                                    <h4 className={`text-lg font-bold flex items-center gap-2 ${alert.active ? 'text-white' : 'text-slate-500'}`}>
                                        {alert.name}
                                        {isTriggered && <span className="text-[10px] bg-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">Triggered</span>}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className="text-xs font-mono text-slate-400 bg-black/30 px-2 py-0.5 rounded border border-white/5">
                                            {alert.type === 'error_rate' ? `Errors > ${alert.threshold} in ${alert.interval}s` :
                                                alert.type === 'keyword_match' ? `Contains "${alert.keyword}"` :
                                                    'Access Denied Events'}
                                        </span>
                                        <span className="text-slate-600 text-xs">&rarr;</span>
                                        <span className="text-xs font-bold text-emerald-400 uppercase">{alert.action}</span>
                                        {alert.lastTriggered && (
                                            <span className="text-[10px] text-slate-500 ml-2">
                                                Last: {Math.round((Date.now() - alert.lastTriggered) / 1000)}s ago
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setAlerts(prev => prev.map(a => a.id === alert.id ? { ...a, active: !a.active } : a))}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${alert.active ? 'bg-indigo-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${alert.active ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                                <button
                                    onClick={() => setAlerts(prev => prev.filter(a => a.id !== alert.id))}
                                    className="p-2 text-slate-500 hover:text-rose-400 transition-colors"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {isRuleModalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-bold text-white mb-4">Create Security Rule</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Rule Name</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Detect Intrusion"
                                    value={newRule.name || ''}
                                    onChange={e => setNewRule({ ...newRule, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Condition Type</label>
                                <select
                                    className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                                    value={newRule.type}
                                    onChange={e => setNewRule({ ...newRule, type: e.target.value as AlertRule['type'] })}
                                >
                                    <option value="error_rate">High Error Rate</option>
                                    <option value="unauthorized_access">Unauthorized Access</option>
                                    <option value="keyword_match">Log Keyword Match</option>
                                </select>
                            </div>
                            {newRule.type === 'error_rate' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Threshold (Count)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                                            value={newRule.threshold} onChange={e => setNewRule({ ...newRule, threshold: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Interval (Sec)</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                                            value={newRule.interval} onChange={e => setNewRule({ ...newRule, interval: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            )}
                            {newRule.type === 'keyword_match' && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Keyword</label>
                                    <input type="text" className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-white outline-none"
                                        placeholder="e.g. Fire, Breach, Override"
                                        value={newRule.keyword || ''} onChange={e => setNewRule({ ...newRule, keyword: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className="pt-4 flex gap-3">
                                <button className="flex-1 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold" onClick={() => setIsRuleModalOpen(false)}>Cancel</button>
                                <button
                                    className="flex-1 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-500/20"
                                    onClick={async () => {
                                        if (!newRule.name) return;
                                        const ruleToCreate = {
                                            ...newRule,
                                            id: Date.now(),
                                            action: 'notify',
                                            active: true,
                                            threshold: newRule.threshold || 5,
                                            interval: newRule.interval || 60
                                        } as AlertRule;
                                        try {
                                            await api.createAlert(ruleToCreate);
                                            setAlerts(prev => [...prev, ruleToCreate]);
                                            setIsRuleModalOpen(false);
                                            setNewRule({ type: 'error_rate', action: 'notify', active: true, threshold: 5, interval: 60 });
                                        } catch (err) { console.error("Failed to create alert", err); }
                                    }}
                                >
                                    Create Rule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
