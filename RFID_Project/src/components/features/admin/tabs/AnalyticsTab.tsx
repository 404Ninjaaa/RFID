import React from 'react';
import { LogMessage, Character, Door } from '@/types';
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AnalyticsTabProps {
    logs: LogMessage[];
    characters: Character[];
    doors: Door[];
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ logs, characters, doors }) => {
    // Generic Drilldown State
    const [drillDown, setDrillDown] = React.useState<{ type: 'zone' | 'time' | 'category', value: string, title: string } | null>(null);

    const filteredLogs = React.useMemo(() => {
        if (!drillDown) return [];

        return logs.filter(l => {
            if (drillDown.type === 'zone') {
                return l.text.includes(drillDown.value);
            } else if (drillDown.type === 'time') {
                const hour = parseInt(drillDown.value.split(':')[0]);
                const d = new Date(l.timestamp);
                return !isNaN(d.getTime()) && d.getHours() === hour;
            } else if (drillDown.type === 'category') {
                const typeMap: Record<string, string> = {
                    'Authorized': 'success',
                    'Denied': 'error',
                    'System': 'info'
                };
                return l.type === typeMap[drillDown.value];
            }
            return false;
        });
    }, [drillDown, logs]);

    return (
        <div className="space-y-6 animate-in fade-in h-full overflow-y-auto pr-2 pb-20 custom-scrollbar relative">

            {/* ... Existing KPI Row ... */}
            {/* 1. KEY INSIGHTS ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[{
                    title: 'Peak Hour', val: (() => {
                        const hours = logs.map(l => {
                            const d = new Date(l.timestamp);
                            return isNaN(d.getTime()) ? 0 : d.getHours();
                        });
                        const counts = hours.reduce((acc, h) => { acc[h] = (acc[h] || 0) + 1; return acc; }, {} as any);
                        const peak = Object.keys(counts).reduce((a, b) => counts[a as any] > counts[b as any] ? a : b, '0');
                        return `${peak.toString().padStart(2, '0')}:00`;
                    })(), sub: 'Highest Volume', color: 'indigo'
                },
                {
                    title: 'Auth Rate', val: (() => {
                        const total = logs.filter(l => l.type !== 'info').length;
                        const success = logs.filter(l => l.type === 'success').length;
                        return total ? `${Math.round((success / total) * 100)}%` : 'N/A';
                    })(), sub: 'Access Granted', color: 'emerald'
                },
                {
                    title: 'Top User', val: (() => {
                        const names = logs.flatMap(l => characters.map(c => l.text.includes(c.name) ? c.name : null).filter(Boolean));
                        const counts = names.reduce((acc, n) => { acc[n!] = (acc[n!] || 0) + 1; return acc; }, {} as any);
                        return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b, 'None');
                    })(), sub: 'Most Active', color: 'cyan'
                },
                { title: 'Threats', val: logs.filter(l => l.type === 'error').length, sub: 'Blocked Attempts', color: 'rose' },
                ].map((kpi, i) => (
                    <div key={i} className="bg-slate-900/40 backdrop-blur-md border border-white/5 p-4 rounded-3xl flex items-center justify-between group hover:bg-slate-800/60 transition-colors">
                        <div>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{kpi.title}</p>
                            <h3 className="text-2xl font-black text-white">{kpi.val}</h3>
                            <p className={`text-xs font-bold text-${kpi.color}-400 mt-1`}>{kpi.sub}</p>
                        </div>
                        <div className={`w-12 h-12 rounded-2xl bg-${kpi.color}-500/10 flex items-center justify-center text-${kpi.color}-400 group-hover:bg-${kpi.color}-500/20 transition-all`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        </div>
                    </div>
                ))}
            </div>

            {/* 2. MAIN CHARTS ROW */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[400px]">
                {/* Traffic Volume (Area) */}
                <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Real-Time Traffic Volume (24h)</h4>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                            <span className="text-[10px] font-bold text-indigo-400">LIVE DATA</span>
                        </div>
                    </div>
                    <div className="flex-1 w-full min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={(() => {
                                // Process logs into 24h buckets
                                const buckets = new Array(24).fill(0).map((_, i) => ({ time: i, count: 0 }));
                                logs.forEach(l => {
                                    const d = new Date(l.timestamp);
                                    // Fallback for numeric strings if backend sent us legacy data or mixed types
                                    const validDate = isNaN(d.getTime()) ? new Date(Number(l.timestamp)) : d;
                                    const h = isNaN(validDate.getTime()) ? -1 : validDate.getHours();
                                    if (h >= 0 && h < 24) buckets[h].count++;
                                });
                                return buckets;
                            })()}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.5} />
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="time" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                                    itemStyle={{ color: '#818cf8' }}
                                    cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#818cf8" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution (Pie) */}
                <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Event Distribution</h4>
                        <span className="text-xs text-slate-400 italic">Click chart to view by type</span>
                    </div>
                    <div className="flex-1 min-h-0 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Authorized', value: logs.filter(l => l.type === 'success').length, color: '#10b981' }, // Emerald
                                        { name: 'Denied', value: logs.filter(l => l.type === 'error').length, color: '#f43f5e' }, // Rose
                                        { name: 'System', value: logs.filter(l => l.type === 'info').length, color: '#3b82f6' }, // Blue
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    animationDuration={500}
                                    animationBegin={0}
                                    style={{ cursor: 'pointer' }}
                                    onClick={(data) => {
                                        if (data && data.name) {
                                            setDrillDown({ type: 'category', value: data.name, title: `Category Report: ${data.name}` });
                                        }
                                    }}
                                >
                                    {[
                                        { name: 'Authorized', value: logs.filter(l => l.type === 'success').length, color: '#10b981' },
                                        { name: 'Denied', value: logs.filter(l => l.type === 'error').length, color: '#f43f5e' },
                                        { name: 'System', value: logs.filter(l => l.type === 'info').length, color: '#3b82f6' },
                                    ].map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            style={{ cursor: 'pointer', outline: 'none' }}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ fontSize: '10px', color: '#94a3b8', cursor: 'pointer' }}
                                    onClick={(data) => {
                                        if (data && data.value) {
                                            setDrillDown({ type: 'category', value: data.value, title: `Category Report: ${data.value}` });
                                        }
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Stat */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <div className="text-2xl font-black text-white">{logs.length}</div>
                                <div className="text-[10px] font-bold text-slate-500 uppercase">Total</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. SECURITY & BAR VISUALIZATION */}
            <div className="h-[300px] bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Access Attempts vs Rejections</h4>
                    <span className="text-xs text-slate-400 italic">Click bars to view hourly logs</span>
                </div>
                <div className="flex-1 w-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={(() => {
                                // Bucket by hour, split specific types
                                const buckets = new Array(24).fill(0).map((_, i) => ({ name: `${i}:00`, granted: 0, denied: 0 }));
                                logs.forEach(l => {
                                    const d = new Date(l.timestamp);
                                    const h = isNaN(d.getTime()) ? -1 : d.getHours();
                                    if (h >= 0 && h < 24) {
                                        if (l.type === 'success') buckets[h].granted++;
                                        if (l.type === 'error') buckets[h].denied++;
                                    }
                                });
                                return buckets;
                            })()}>
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                            <Bar
                                dataKey="granted"
                                name="Access Granted"
                                fill="#10b981"
                                radius={[4, 4, 4, 4]}
                                stackId="a"
                                barSize={12}
                                animationDuration={500}
                                animationBegin={0}
                                style={{ cursor: 'pointer' }}
                                onClick={(data) => setDrillDown({ type: 'time', value: data.name, title: `Hourly Report: ${data.name}` })}
                            />
                            <Bar
                                dataKey="denied"
                                name="Access Denied"
                                fill="#f43f5e"
                                radius={[4, 4, 4, 4]}
                                stackId="a"
                                barSize={12}
                                animationDuration={500}
                                animationBegin={0}
                                style={{ cursor: 'pointer' }}
                                onClick={(data) => setDrillDown({ type: 'time', value: data.name, title: `Hourly Report: ${data.name}` })}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* 3. VISUAL INTELLIGENCE (Module 2) - ZONE HEATMAP */}
            <div className="bg-slate-900/40 backdrop-blur-md p-6 rounded-3xl border border-white/5 shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                        <svg className="w-4 h-4 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 01-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>
                        Zone Traffic Heatmap (Interactable)
                    </h4>
                    <span className="text-xs text-slate-400 italic">Click bars for details</span>
                </div>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            margin={{ left: 20 }}
                            data={(() => {
                                // Calculate traffic per "Zone" (Door names)
                                const counts = logs.reduce((acc, log) => {
                                    // Simple heuristic: extract Door/Room names from log text
                                    doors.forEach(d => {
                                        if (log.text.includes(d.name)) acc[d.name] = (acc[d.name] || 0) + 1;
                                    });
                                    return acc;
                                }, {} as Record<string, number>);
                                return Object.entries(counts)
                                    .map(([name, value]) => ({ name, value }))
                                    .sort((a, b) => (b.value as number) - (a.value as number))
                                    .slice(0, 5); // Top 5 Zones
                            })()}
                        >
                            <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={true} vertical={false} />
                            <XAxis type="number" stroke="#475569" fontSize={10} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={100} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(15, 23, 42, 0.9)', color: '#fff' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Bar
                                dataKey="value"
                                name="Activity Level"
                                radius={[0, 4, 4, 0]}
                                barSize={20}
                                animationDuration={500}
                                animationBegin={0}
                                style={{ cursor: 'pointer' }}
                                onClick={(data) => {
                                    if (data && data.name) {
                                        setDrillDown({ type: 'zone', value: data.name, title: `Zone Report: ${data.name}` });
                                    }
                                }}
                            >
                                {/* Gradient Colors based on heat */}
                                {doors.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#3b82f6'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* DETAIL MODAL */}
            {drillDown && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={() => setDrillDown(null)} />
                    <div className="bg-[#0f172a] w-full max-w-2xl rounded-3xl border border-white/10 shadow-2xl relative z-10 animate-in zoom-in-95 overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <div>
                                <h3 className="text-xl font-black text-white">{drillDown.title}</h3>
                                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Detailed Activity Log</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const headers = ['Timestamp', 'User', 'Action', 'Status'];
                                        const rows = filteredLogs.map(log => {
                                            const user = characters.find(c => log.text.includes(c.name))?.name || 'Unknown';
                                            return [
                                                new Date(log.timestamp).toLocaleString().replace(/,/g, ' '), // Remove commas from date to avoid csv break
                                                user,
                                                `"${log.text}"`,
                                                log.type === 'success' ? 'GRANTED' : log.type === 'error' ? 'DENIED' : 'INFO'
                                            ].join(',');
                                        });
                                        const csvContent = [headers.join(','), ...rows].join('\n');
                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const link = document.createElement('a');
                                        if (link.download !== undefined) {
                                            const url = URL.createObjectURL(blob);
                                            link.setAttribute('href', url);
                                            link.setAttribute('download', `${drillDown.title.replace(/[:\s]+/g, '_')}.csv`);
                                            link.style.visibility = 'hidden';
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                        }
                                    }}
                                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center shadow-lg shadow-indigo-500/20 transition-all"
                                >
                                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    EXPORT CSV
                                </button>
                                <button onClick={() => setDrillDown(null)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {filteredLogs.length > 0 ? (
                                <table className="w-full text-left text-sm text-slate-400">
                                    <thead className="bg-black/20 text-xs uppercase font-bold text-slate-500 sticky top-0 backdrop-blur-md">
                                        <tr>
                                            <th className="px-6 py-3">Time</th>
                                            <th className="px-6 py-3">User</th>
                                            <th className="px-6 py-3">Event</th>
                                            <th className="px-6 py-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-white/5 transition-colors">
                                                <td className="px-6 py-4 font-mono text-xs">{new Date(log.timestamp).toLocaleTimeString()}</td>
                                                <td className="px-6 py-4 text-white font-medium">
                                                    {characters.find(c => log.text.includes(c.name))?.name || 'Unknown'}
                                                </td>
                                                <td className="px-6 py-4">{log.text}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${log.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                                                        log.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                                                            'bg-blue-500/10 text-blue-400'
                                                        }`}>
                                                        {log.type === 'success' ? 'GRANTED' : log.type === 'error' ? 'DENIED' : 'INFO'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-12 text-center text-slate-500">
                                    <p>No activity recorded for this selection.</p>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-black/20 border-t border-white/5 text-center text-xs text-slate-500">
                            Showing {filteredLogs.length} events
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
