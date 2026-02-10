import React from 'react';

interface FireAlarmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const FireAlarmModal: React.FC<FireAlarmModalProps> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
            <div className="bg-slate-900 border-2 border-red-600 w-full max-w-sm rounded-2xl shadow-[0_0_50px_rgba(220,38,38,0.5)] relative z-10 animate-in zoom-in-95 overflow-hidden flex flex-col">

                {/* Header */}
                <div className="bg-red-600/20 p-6 text-center border-b border-red-600/30">
                    <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse">
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-black text-white tracking-widest uppercase">Emergency</h3>
                    <p className="text-red-400 text-xs font-bold uppercase tracking-wider mt-1">Manual Fire Alarm Trigger</p>
                </div>

                {/* Body */}
                <div className="p-6 text-center space-y-4">
                    <p className="text-slate-300 text-sm leading-relaxed">
                        Are you sure you want to activate the facility-wide fire alarm?
                        <br />
                        <span className="text-red-400 font-bold block mt-2">THIS WILL TRIGGER A LEVEL 5 SECURITY ALERT.</span>
                    </p>
                </div>

                {/* Footer */}
                <div className="p-4 bg-black/40 border-t border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-all border border-slate-700"
                    >
                        CANCEL
                    </button>
                    <button
                        onClick={onConfirm}
                        className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-bold text-sm shadow-lg shadow-red-900/50 transition-all border border-red-500/50 flex items-center justify-center gap-2"
                    >
                        <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                        ACTIVATE ALARM
                    </button>
                </div>
            </div>
        </div>
    );
};
