import React from 'react';
import { useRfid } from '@/contexts/RfidContext';

export const RfidStatus: React.FC = () => {
    const { isConnected } = useRfid();

    return (
        <div className={`fixed bottom-4 right-4 z-50 px-3 py-1.5 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-2 transition-all ${isConnected
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">
                RFID {isConnected ? 'ONLINE' : 'DISCONNECTED'}
            </span>
        </div>
    );
};
