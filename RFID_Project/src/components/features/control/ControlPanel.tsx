import React from 'react';
import type { Character, LogMessage } from '@/types';
import { Role } from '@/types';
import { UserCircleIcon } from '@/components/icons/UserCircleIcon';
import { KeyIcon } from '@/components/icons/KeyIcon';
import { ComputerDesktopIcon } from '@/components/icons/ComputerDesktopIcon';

interface ControlPanelProps {
  character: Character;
  logs: LogMessage[];
  isRegistered: boolean;
  onOpenDashboard: () => void;
}

const logTypeStyles = {
  success: 'text-emerald-400 border-emerald-500/30',
  error: 'text-rose-400 border-rose-500/30',
  info: 'text-slate-400 border-slate-700/30',
};


export const ControlPanel: React.FC<ControlPanelProps> = ({ character, logs, isRegistered, onOpenDashboard }) => {
  const filteredLogs = React.useMemo(() => {
    return logs.filter((log, index, self) =>
      index === 0 || log.text !== self[index - 1].text || log.type !== self[index - 1].type
    );
  }, [logs]);

  return (
    <div className="relative z-10 bg-slate-800/50 rounded-lg p-4 h-full flex flex-col shadow-lg border border-slate-700">

      <section className="mb-4 shrink-0">
        <h2 className="text-xl font-semibold text-slate-300 border-b-2 border-slate-700 pb-2 mb-4">Active Operative</h2>
        <div className="p-2 bg-slate-900/50 rounded-md">
          <div className="flex items-center space-x-4">
            <img src={character.avatar} alt={character.name} className="w-16 h-16 rounded-full border-2 border-sky-500" />
            <div>
              <p className="text-lg font-bold text-sky-300">{character.name}</p>
              <div className="flex items-center text-slate-400 text-sm mt-1">
                <UserCircleIcon className="w-4 h-4 mr-2" />
                <span>{character.role}</span>
              </div>
              <div className="flex items-center text-slate-400 text-sm mt-1">
                <KeyIcon className="w-4 h-4 mr-2" />
                <span className="font-mono">{character.rfidCode}</span>
              </div>
            </div>
          </div>
          <div className={`mt-3 text-center text-sm font-semibold p-2 rounded-md ${isRegistered ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
            {isRegistered ? 'STATUS: REGISTERED' : 'STATUS: NOT REGISTERED'}
          </div>
        </div>
      </section>

      {character.role === Role.ADMIN && (
        <div className="mb-4 shrink-0">
          <button
            onClick={onOpenDashboard}
            className="w-full flex items-center justify-center bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-3 px-4 rounded-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <ComputerDesktopIcon className="w-5 h-5 mr-2" />
            <span className="font-semibold">Open Admin Dashboard</span>
          </button>
        </div>
      )}

      <section className="flex-1 flex flex-col min-h-0">
        <h2 className="text-xl font-semibold text-slate-300 border-b-2 border-slate-700 pb-2 mb-4">Event Log</h2>
        <div className="h-80 overflow-y-auto pr-2 space-y-2 custom-scrollbar bg-slate-900/30 p-2 rounded-lg border border-slate-700/50">
          {filteredLogs.length > 0 ? (
            // Filter duplicates for cleaner view (client-side simple debounce for display)
            filteredLogs.map(log => (
              <div key={log.id} className={`p-2.5 rounded-lg border text-sm transition-all hover:bg-slate-800/80 ${logTypeStyles[log.type]} bg-slate-900/80 shadow-sm sm:flex sm:justify-between items-start gap-2`}>
                <div className="flex-1 break-words leading-snug">
                  {log.type === 'error' && <span className="inline-block w-2 h-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>}
                  {log.type === 'success' && <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-2"></span>}
                  {log.text}
                </div>
                <span className="font-mono text-[10px] text-slate-500 whitespace-nowrap mt-1 sm:mt-0 opacity-70 bg-black/20 px-1.5 py-0.5 rounded border border-white/5">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-50">
              <KeyIcon className="w-8 h-8 mb-2" />
              <p className="text-xs uppercase tracking-widest">System Idle</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};