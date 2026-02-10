import React, { useState } from 'react';
import { LogMessage } from '@/types';

interface LogsTabProps {
    logs: LogMessage[];
}

export const LogsTab: React.FC<LogsTabProps> = ({ logs }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'success' | 'error' | 'warning' | 'info'>('all');

    const filteredLogs = logs.filter(log => {
        const matchesSearch = log.text.toLowerCase().includes(searchTerm.toLowerCase()) || log.id.toString().includes(searchTerm);
        const matchesType = filterType === 'all' || log.type === 'access_denied' && filterType === 'error' // Mapping old types if needed, but assuming strict match or simple logic
            || log.type === filterType
            || (filterType === 'error' && (log.type === 'access_denied' || log.type === 'system_alert')) // broadening error filter
            || (filterType === 'success' && log.type === 'access_granted');

        return matchesSearch && matchesType;
    });

    const handleExport = () => {
        const headers = ['Timestamp', 'Level', 'Event Detail', 'ID'];
        const csvContent = [
            headers.join(','),
            ...filteredLogs.map(log => {
                const row = [
                    log.timestamp,
                    log.type,
                    `"${log.text.replace(/"/g, '""')}"`, // Escape quotes
                    log.id
                ];
                return row.join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `event_logs_${filterType}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-in fade-in h-full flex flex-col">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 backdrop-blur-md p-4 rounded-3xl border border-white/5">
                <div className="relative w-full sm:w-96 group">
                    <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    <input
                        type="text"
                        placeholder="Search logs..."
                        className="w-full bg-black/20 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder-slate-600 font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-black/20 p-1 rounded-2xl border border-white/5">
                    {(['all', 'success', 'error', 'info'] as const).map(ft => (
                        <button
                            key={ft}
                            onClick={() => setFilterType(ft)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold capitalize transition-all ${filterType === ft ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-indigo-400 hover:bg-white/5'}`}
                        >
                            {ft}
                        </button>
                    ))}
                    <div className="w-px bg-white/10 mx-1 my-2"></div>
                    <button
                        onClick={handleExport}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all flex items-center"
                        title="Export to CSV"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export
                    </button>
                </div>
            </div>

            {/* Log Table */}
            <div className="flex-1 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-xl">
                <div className="overflow-x-auto custom-scrollbar flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/5">
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-6">Timestamp</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Level</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Detail</th>
                                <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">ID</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredLogs.map(log => (
                                <tr key={log.id} className="group hover:bg-white/5 transition-colors">
                                    <td className="p-4 pl-6 font-mono text-xs text-slate-400">{log.timestamp}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider border ${log.type === 'success' || log.type === 'access_granted' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                            log.type === 'error' || log.type === 'access_denied' || log.type === 'system_alert' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                            }`}>
                                            {log.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-medium text-slate-200 group-hover:text-white">{log.text}</td>
                                    <td className="p-4 font-mono text-xs text-slate-600">#{log.id}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-white/5 bg-black/20 flex justify-between items-center text-xs text-slate-500 font-medium">
                    <span>Showing {filteredLogs.length} events</span>
                    {filteredLogs.length === 0 && <span className="text-rose-400 italic">No matching logs found</span>}
                </div>
            </div>
        </div>
    );
};
